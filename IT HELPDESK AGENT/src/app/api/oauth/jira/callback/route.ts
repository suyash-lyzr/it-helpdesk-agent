import { NextRequest, NextResponse } from "next/server"
import { connectIntegration } from "@/lib/integrations-store"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

async function exchangeJiraCodeForToken(code: string): Promise<string> {
  // DEMO-ONLY SCAFFOLD:
  // In production, call Atlassian's token endpoint with client_id, client_secret,
  // redirect_uri and the given code to obtain access/refresh tokens.
  //
  // Example (pseudo-code):
  // const res = await fetch("https://auth.atlassian.com/oauth/token", { ... })
  // const json = await res.json()
  // return json.access_token
  //
  // For now we just return a fake token.
  return `demo-jira-token-for-${code}`
}

// GET /api/oauth/jira/callback
export async function GET(request: NextRequest) {
  const clientId = process.env.JIRA_CLIENT_ID
  const clientSecret = process.env.JIRA_CLIENT_SECRET
  const redirectUri = process.env.JIRA_REDIRECT_URI

  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Jira OAuth callback hit, but env vars are missing. Please set JIRA_CLIENT_ID, JIRA_CLIENT_SECRET, and JIRA_REDIRECT_URI, then restart the app.",
        instructions: {
          env: [
            "JIRA_CLIENT_ID=<your-client-id>",
            "JIRA_CLIENT_SECRET=<your-client-secret>",
            "JIRA_REDIRECT_URI=<https://your-app.com/api/oauth/jira/callback>",
          ],
        },
      },
      { status: 500, headers: corsHeaders },
    )
  }

  if (!code) {
    return NextResponse.json(
      {
        success: false,
        message: "Missing authorization code in Jira OAuth callback.",
      },
      { status: 400, headers: corsHeaders },
    )
  }

  // Exchange the authorization code for an access token.
  const accessToken = await exchangeJiraCodeForToken(code)

  // Store a masked version of the token in our demo integrations store.
  connectIntegration({
    provider: "jira",
    mode: "real",
    maskedToken: `****${accessToken.slice(-4)}`,
  })

  // For the demo we just return JSON; in production you might redirect back
  // to a settings screen in the UI.
  return NextResponse.json(
    {
      success: true,
      message: "Jira OAuth flow completed (demo). Replace scaffold with real storage logic in production.",
    },
    { headers: corsHeaders },
  )
}


