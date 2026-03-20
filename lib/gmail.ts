import "server-only";

import { ConnectedEmailAccount } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

type GmailProfileResponse = {
  emailAddress: string;
  historyId?: string;
};

type GmailListResponse = {
  messages?: Array<{
    id: string;
    threadId: string;
  }>;
};

type GmailMessageResponse = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailPayload;
};

type GmailPayload = {
  mimeType?: string;
  body?: {
    data?: string;
  };
  parts?: GmailPayload[];
  headers?: Array<{
    name?: string;
    value?: string;
  }>;
};

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    throw new Error("Google OAuth is not fully configured.");
  }

  return {
    clientId,
    clientSecret,
    appUrl: appUrl.replace(/\/$/, "")
  };
}

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_URL);
}

export function getGoogleOauthRedirectUri() {
  return `${getGoogleConfig().appUrl}/api/gmail/callback`;
}

export function getGoogleOauthUrl(state: string, loginHint?: string) {
  const { clientId } = getGoogleConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleOauthRedirectUri(),
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    scope: GMAIL_SCOPE,
    state
  });

  if (loginHint) {
    params.set("login_hint", loginHint);
  }

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret } = getGoogleConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleOauthRedirectUri(),
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    throw new Error("Google token exchange failed.");
  }

  return (await response.json()) as GoogleTokenResponse;
}

async function refreshAccessToken(account: ConnectedEmailAccount) {
  const { clientId, clientSecret } = getGoogleConfig();

  if (!account.refreshToken) {
    throw new Error("No refresh token is available for this Gmail account.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    throw new Error("Google token refresh failed.");
  }

  const tokens = (await response.json()) as GoogleTokenResponse;

  return prisma.connectedEmailAccount.update({
    where: { id: account.id },
    data: {
      accessToken: tokens.access_token,
      scope: tokens.scope ?? account.scope,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000)
    }
  });
}

async function getValidAccessToken(account: ConnectedEmailAccount) {
  const expiresAt = account.tokenExpiresAt?.getTime() ?? 0;

  if (account.accessToken && expiresAt > Date.now() + 60_000) {
    return {
      accessToken: account.accessToken,
      account
    };
  }

  const refreshedAccount = await refreshAccessToken(account);

  if (!refreshedAccount.accessToken) {
    throw new Error("Unable to obtain a valid Gmail access token.");
  }

  return {
    accessToken: refreshedAccount.accessToken,
    account: refreshedAccount
  };
}

async function gmailFetch<T>(accessToken: string, path: string) {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Gmail request failed for ${path}.`);
  }

  return (await response.json()) as T;
}

function decodeBase64Url(input?: string) {
  if (!input) {
    return "";
  }

  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findBody(payload?: GmailPayload, mimeType?: string): string {
  if (!payload) {
    return "";
  }

  if (payload.mimeType === mimeType && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  for (const part of payload.parts ?? []) {
    const body = findBody(part, mimeType);

    if (body) {
      return body;
    }
  }

  return "";
}

function getHeader(payload: GmailPayload | undefined, name: string) {
  return (
    payload?.headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

export async function connectGoogleAccount(userId: string, code: string) {
  const tokens = await exchangeCodeForTokens(code);
  const profile = await gmailFetch<GmailProfileResponse>(tokens.access_token, "/profile");

  return prisma.connectedEmailAccount.upsert({
    where: {
      userId_provider: {
        userId,
        provider: "gmail"
      }
    },
    update: {
      providerAccountEmail: profile.emailAddress,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      historyId: profile.historyId
    },
    create: {
      userId,
      provider: "gmail",
      providerAccountEmail: profile.emailAddress,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      historyId: profile.historyId
    }
  });
}

export async function revokeGoogleAccount(account: ConnectedEmailAccount) {
  const token = account.refreshToken ?? account.accessToken;

  if (token) {
    await fetch(GOOGLE_REVOKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ token })
    }).catch(() => null);
  }

  await prisma.connectedEmailAccount.delete({
    where: { id: account.id }
  });
}

export async function syncGmailAccount(account: ConnectedEmailAccount) {
  const { accessToken, account: freshAccount } = await getValidAccessToken(account);
  const list = await gmailFetch<GmailListResponse>(accessToken, "/messages?maxResults=15");
  const messages = list.messages ?? [];
  let importedCount = 0;

  for (const messageRef of messages) {
    const alreadyExists = await prisma.emailMessage.findUnique({
      where: {
        connectedAccountId_gmailMessageId: {
          connectedAccountId: freshAccount.id,
          gmailMessageId: messageRef.id
        }
      },
      select: { id: true }
    });

    if (alreadyExists) {
      continue;
    }

    const message = await gmailFetch<GmailMessageResponse>(
      accessToken,
      `/messages/${messageRef.id}?format=full`
    );

    const textBody = findBody(message.payload, "text/plain");
    const htmlBody = findBody(message.payload, "text/html");
    const bodyText = textBody || stripHtml(htmlBody);
    const receivedAt = message.internalDate
      ? new Date(Number(message.internalDate))
      : new Date();

    await prisma.emailMessage.create({
      data: {
        userId: freshAccount.userId,
        connectedAccountId: freshAccount.id,
        gmailMessageId: message.id,
        gmailThreadId: message.threadId,
        subject: getHeader(message.payload, "Subject") || "(No subject)",
        fromAddress: getHeader(message.payload, "From") || "(Unknown sender)",
        toAddresses: getHeader(message.payload, "To"),
        snippet: message.snippet ?? null,
        bodyText: bodyText || null,
        webLink: `https://mail.google.com/mail/u/0/#all/${message.id}`,
        internalDateMs: message.internalDate ?? Date.now().toString(),
        receivedAt
      }
    });

    importedCount += 1;
  }

  const profile = await gmailFetch<GmailProfileResponse>(accessToken, "/profile");

  await prisma.connectedEmailAccount.update({
    where: { id: freshAccount.id },
    data: {
      historyId: profile.historyId,
      lastSyncedAt: new Date()
    }
  });

  return {
    importedCount,
    scannedCount: messages.length
  };
}
