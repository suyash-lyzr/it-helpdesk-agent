import { NextRequest, NextResponse } from "next/server";

// This route now just redirects to the frontend callback page
// The frontend will call the exchange API endpoint
// GET /oauth/callback/servicenow
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Redirect to frontend callback page with query params
  const redirectUrl = new URL("/oauth/callback/servicenow", request.url);
  if (code) redirectUrl.searchParams.set("code", code);
  if (state) redirectUrl.searchParams.set("state", state);
  if (error) redirectUrl.searchParams.set("error", error);

  return NextResponse.redirect(redirectUrl);
}
