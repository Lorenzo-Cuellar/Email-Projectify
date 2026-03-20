import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectGoogleAccount } from "@/lib/gmail";

const GMAIL_OAUTH_STATE_COOKIE = "gmail_oauth_state";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const cookieStore = await cookies();
  const storedState = cookieStore.get(GMAIL_OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(GMAIL_OAUTH_STATE_COOKIE);

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?gmailError=${error}`, appUrl));
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/dashboard?gmailError=state", appUrl));
  }

  try {
    await connectGoogleAccount(user.id, code);
    return NextResponse.redirect(new URL("/dashboard?gmailConnected=1", appUrl));
  } catch {
    return NextResponse.redirect(new URL("/dashboard?gmailError=callback", appUrl));
  }
}
