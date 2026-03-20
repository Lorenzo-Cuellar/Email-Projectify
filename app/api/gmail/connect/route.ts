import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getGoogleOauthUrl, isGoogleOAuthConfigured } from "@/lib/gmail";

const GMAIL_OAUTH_STATE_COOKIE = "gmail_oauth_state";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"));
  }

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/dashboard?gmailError=config", process.env.APP_URL ?? "http://localhost:3000")
    );
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(GMAIL_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });

  return NextResponse.redirect(getGoogleOauthUrl(state, user.email));
}
