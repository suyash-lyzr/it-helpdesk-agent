import { NextResponse } from "next/server"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/oauth/jira/start
// Returns an authorization URL for Jira OAuth when env vars are configured.
export async function GET() {
  const clientId = process.env.JIRA_CLIENT_ID
  const redirectUri = process.env.JIRA_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Jira OAuth is not configured. Set JIRA_CLIENT_ID and JIRA_REDIRECT_URI in your environment to enable real OAuth.",
      },
      { status: 400, headers: corsHeaders },
    )
  }

  // NOTE: This is a scaffold — in production you should confirm the
  // correct Atlassian authorization endpoint and scopes for your site.
  const authorizeUrl = new URL(
    "https://auth.atlassian.com/authorize",
  )
  authorizeUrl.searchParams.set("audience", "api.atlassian.com")
  authorizeUrl.searchParams.set("client_id", clientId)
  authorizeUrl.searchParams.set("scope", "read:jira-user read:jira-work write:jira-work offline_access")
  authorizeUrl.searchParams.set("redirect_uri", redirectUri)
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set("prompt", "consent")

  return NextResponse.json(
    {
      success: true,
      authorizeUrl: authorizeUrl.toString(),
    },
    { headers: corsHeaders },
  )
}


