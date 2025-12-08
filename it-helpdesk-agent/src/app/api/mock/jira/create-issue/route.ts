import { NextRequest, NextResponse } from "next/server"
import { appendLog } from "@/lib/integrations-store"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, ngrok-skip-browser-warning",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// POST /api/mock/jira/create-issue
// Body: { title, description, priority, assignee }
// Response (spec):
// {
//   "external_id":"JRA-2031",
//   "status":"created",
//   "url":"https://jira.example.com/browse/JRA-2031",
//   "created_at":"2025-12-04T12:30:00Z"
// }
export async function POST(request: NextRequest) {
  const body = await request.json()

  const externalId = "JRA-2031"
  const createdAt = "2025-12-04T12:30:00Z"

  appendLog({
    provider: "jira",
    action: "demo.create_issue",
    actor: "admin",
    details: {
      title: body.title,
      priority: body.priority,
      assignee: body.assignee,
      external_id: externalId,
    },
  })

  return NextResponse.json(
    {
      external_id: externalId,
      status: "created",
      url: "https://jira.example.com/browse/JRA-2031",
      created_at: createdAt,
    },
    { headers: corsHeaders },
  )
}


