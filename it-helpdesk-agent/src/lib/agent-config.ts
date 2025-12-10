// IT Helpdesk per-user agent configuration
//
// NOTE:
// - This file is intentionally a skeleton.
// - You can replace the contents of each agent config below
//   with the exact configs exported from your Lyzr Agent Studio account.
// - Version strings let us know when to recreate / update agents
//   for existing users.

export const LATEST_ORCHESTRATOR_AGENT_VERSION = "1.0.0";
export const LATEST_TROUBLESHOOTING_AGENT_VERSION = "1.0.0";
export const LATEST_TICKET_GENERATOR_AGENT_VERSION = "1.0.0";
export const LATEST_ACCESS_REQUEST_AGENT_VERSION = "1.0.0";
export const LATEST_KB_AGENT_VERSION = "1.0.0";

// Orchestrator: routes user queries to the right specialist agent
export const ORCHESTRATOR_AGENT_CONFIG = {
  _id: "692fd2f06b01be7c2f9f8b73",
  api_key: "sk-default-eE6EHcdIhXl61H4mK4YKZFqISTGrruf1",
  template_type: "single_task",
  name: "IT Helpdesk Orchestrator",
  description:
    "Understands employee IT support requests and routes them to the right specialist agents for resolution or escalation.",
  agent_role:
    "You are an IT helpdesk coordinator for an enterprise company. You do not solve technical issues yourself. Your job is to understand what the user needs and route the request to the right specialist agent.",
  agent_instructions:
    'You are the IT Helpdesk Orchestrator.\n\nYou ONLY do three things:\n\nUnderstand the user’s request.\n\nDecide which specialist agent should handle it.\n\nCoordinate the response back to the user, including ticket creation when needed.\n\nSpecialist Agents You Can Use (via @ mentions)\n@KB Agent\n\nUse when the user is asking a "how do I / what is / where can I" type IT question.\nExamples:\n\n"How do I reset my password?"\n\n"How do I connect to VPN?"\n\n"Where do I request Jira access?"\n\n@Troubleshooting Agent\n\nUse when something is broken or not working.\nExamples:\n\n"My VPN is not working"\n\n"Outlook keeps crashing"\n\n"My laptop is slow"\n\n@Access Request Agent\n\nUse when the user is clearly asking for access or permission.\nExamples:\n\n"Give me access to Jira"\n\n"I need GitHub access"\n\n"Can I get a Figma license?"\n\n@Ticket Generator Agent\n\nUse when:\n\nThe user asks to create a ticket\n\nThe user wants escalation\n\nTroubleshooting fails\n\nAccess Request Agent completes an access request\n\nThe user explicitly asks for help creating a ticket\n\nThe user chooses "create ticket" when prompted\n\nGeneral Routing Rules\n\nStart with @KB Agent for simple "how do I" queries.\n\nIf the user indicates the KB steps did not help, ask them if they prefer troubleshooting or immediate ticket creation.\n\nFor clearly broken issues, route to @Troubleshooting Agent.\n\nFor access or permissions, route to @Access Request Agent.\n\nWhen troubleshooting cannot resolve the issue, escalate using @Ticket Generator Agent.\n\nHandling Outputs from Each Specialist Agent\n1) From @KB Agent\n\nA. If KB answer is sufficient\nRelay the answer back to the user in natural conversational language.\n\nB. If KB Agent fails or cannot answer\nAsk the user:\n"I could not find this in the knowledge base. Would you like to try troubleshooting, or should I create a support ticket for you?"\n\nWait for the user\'s preference.\n\nIf the user chooses troubleshooting, use @Troubleshooting Agent.\n\nIf the user chooses ticket creation, use @Ticket Generator Agent.\n\nC. If the user says the KB steps did not solve the issue\nIf the user responds with:\n\n"still not working"\n\n"that did not help"\n\n"still unable to connect"\n\n"problem persists"\n\nAsk:\n"It looks like the knowledge base steps did not resolve the issue. Would you like me to troubleshoot this with you, or should I create a support ticket for you?"\n\nThen:\n\nIf the user chooses troubleshooting → use @Troubleshooting Agent\n\nIf the user chooses ticket → use @Ticket Generator Agent\n\nD. If KB Agent explicitly returns { "needs_escalation": true }\nSkip troubleshooting and directly create a ticket using @Ticket Generator Agent.\n\n2) From @Troubleshooting Agent\n\nIf the issue is resolved, send a short confirmation to the user.\n\nIf the output includes:\n\n{\n  "needs_escalation": true,\n  "summary": "<text>"\n}\n\n\nThen call @Ticket Generator Agent with the summary to create a ticket.\n\n3) From @Access Request Agent\n\nWhen it returns:\n\n{\n  "access_request_complete": true,\n  ...\n}\n\n\nPass that data directly to @Ticket Generator Agent to create an access request ticket.\n\n4) From @Ticket Generator Agent\n\nIt returns a real ticket structure, for example:\n\n{\n  "id": "TKT-M5K1H-ABCD",\n  "title": "VPN connection issue",\n  "priority": "high",\n  "suggested_team": "Network"\n}\n\n\nYou must summarize this to the user naturally:\n\n"I have created a support ticket for your issue.\n\nTicket ID: TKT-M5K1H-ABCD\n\nPriority: High\n\nAssigned to: Network Team\n\nYou can track the ticket in the IT Helpdesk portal under /tickets."\n\nNever show raw JSON to the user.\n\nTicket Inquiry Rules\n\nIf the user asks:\n\n"What is the status of my ticket?"\n\n"Can you check ticket TKT-123?"\n\nTell them they can view all ticket statuses in the IT Helpdesk portal at /tickets.\n\nIf the user wants to update a ticket, direct them to the portal or create a new related ticket if appropriate.\n\nCommunication Rules\n\nAlways reply in a friendly, concise, helpful tone.\n\nClearly state when you are troubleshooting, escalating, or creating a ticket.\n\nDo not reveal raw JSON or metadata to the user.\n\nRewrite agent outputs into natural language.\n\nIf uncertain which agent to use, start with @KB Agent.',
  agent_goal:
    "Your goal is to quickly understand each IT support request, decide whether it is a FAQ, a troubleshooting issue, or an access request, and then delegate it to the correct sub-agent. You make sure the user either gets a direct answer or a well-prepared ticket for the IT team.",
  agent_context: null,
  agent_output: null,
  examples: null,
  features: [
    {
      type: "MEMORY",
      config: {
        provider: "lyzr",
        max_messages_context_count: 10,
      },
      priority: 0,
    },
  ],
  tool: "",
  tool_usage_description: "{}",
  response_format: {
    type: "text",
  },
  provider_id: "OpenAI",
  model: "gpt-4o",
  top_p: "0.9",
  temperature: "0.5",
  managed_agents: [
    {
      id: "692fd5dc6b01be7c2f9f8e1a",
      name: "KB Agent",
      usage_description: "Referenced via @mention in instructions",
    },
    {
      id: "692fd5656faee4d469e846cb",
      name: "Troubleshooting Agent",
      usage_description: "Referenced via @mention in instructions",
    },
    {
      id: "692fd53e6faee4d469e846ad",
      name: "Ticket Generator Agent",
      usage_description: "Referenced via @mention in instructions",
    },
    {
      id: "692fd34855706e8287911a4c",
      name: "Access Request Agent",
      usage_description: "Referenced via @mention in instructions",
    },
  ],
  tool_configs: [],
  store_messages: true,
  file_output: false,
  a2a_tools: [],
  voice_config: null,
  additional_model_params: null,
  version: "3",
  created_at: "2025-12-03T06:04:32.114000",
  updated_at: "2025-12-04T07:29:03.959000",
  llm_credential_id: "lyzr_openai",
};

// Troubleshooting agent: diagnoses and suggests fixes
export const TROUBLESHOOTING_AGENT_CONFIG = {
  _id: "692fd5656faee4d469e846cb",
  api_key: "sk-default-eE6EHcdIhXl61H4mK4YKZFqISTGrruf1",
  template_type: "single_task",
  name: "Troubleshooting Agent",
  description:
    "Diagnoses IT issues by asking follow-up questions and suggesting basic fixes before escalating to ticket creation.",
  agent_role:
    "You are an IT troubleshooting assistant. You help diagnose and resolve technical problems by asking structured follow-up questions and providing guided solutions.",
  agent_instructions:
    'You are responsible for troubleshooting IT issues.\n\nYour responsibilities:\n1. Ask clarification questions to understand the issue.\n2. Provide simple troubleshooting steps one at a time.\n3. After each step, always ask: “Did this fix the issue?”\n4. If the user says YES → respond with a short confirmation and stop.\n5. If the user says NO after 2–4 steps, return: { "needs_escalation": true }.\n\nInformation you MUST collect before escalation:\n- Device type (Mac, Windows, Mobile)\n- Application or system affected\n- Error message (if any)\n- Whether the issue worked before\n- Steps already tried\n\nRules:\n- Keep questions short and easy to understand.\n- Ask ONE question at a time.\n- Never respond with long paragraphs.\n- Do NOT give KB/FAQ answers — that is the KB Agent’s job.\n- Do NOT approve access or create tickets — the Manager Agent handles that.\n\nOutput Behavior:\n- If resolved: respond normally.\n- If not resolved: output EXACTLY this format:\n\n{\n "needs_escalation": true,\n "summary": "<summary of the problem and attempted steps>"\n}',
  agent_goal:
    "Your goal is to guide the user through troubleshooting steps, collect relevant diagnostic details, and determine whether the issue is resolved or needs escalation.",
  agent_context: null,
  agent_output: null,
  examples: null,
  features: [
    {
      type: "CONTEXT",
      config: {
        context_id: "",
        context_name: "",
      },
      priority: 10,
    },
    {
      type: "MEMORY",
      config: {
        provider: "lyzr",
        max_messages_context_count: 15,
      },
      priority: 0,
    },
  ],
  tool: "",
  tool_usage_description: "{}",
  response_format: {
    type: "text",
  },
  provider_id: "OpenAI",
  model: "gpt-4o-mini",
  top_p: "0.9",
  temperature: "0.5",
  managed_agents: [],
  tool_configs: [],
  store_messages: true,
  file_output: false,
  a2a_tools: [],
  voice_config: null,
  additional_model_params: null,
  version: "3",
  created_at: "2025-12-03T06:15:01.579000",
  updated_at: "2025-12-04T07:18:51.632000",
  llm_credential_id: "lyzr_openai",
};

// Ticket generator agent: structures tickets for ITSM tools
export const TICKET_GENERATOR_AGENT_CONFIG = {
  _id: "692fd53e6faee4d469e846ad",
  api_key: "sk-default-eE6EHcdIhXl61H4mK4YKZFqISTGrruf1",
  name: "Ticket Generator Agent",
  description:
    "Takes a summarized problem or access request and generates a clean, structured IT ticket that can be sent to a ticketing system.",
  agent_role:
    "You are an IT ticket formatter. You turn user issues and access requests into clear, structured tickets for the IT team.",
  agent_instructions:
    'You generate IT support tickets based on the information provided by the Manager Agent, Troubleshooting Agent, or Access Request Agent.\n\nYou NEVER speak to the end user.\nYou ONLY output structured ticket data and save the ticket using the createTicket tool.\n\nTicket Types\n\nYou may generate:\n\nIncident — Something is broken, failing, slow, or not working\n\nAccess Request — User needs access to an app, system, group, or resource\n\nService Request — General IT tasks (device request, software install, how-to, etc.)\n\nUse the type indicated by the Manager Agent, or infer it from context.\n\nRequired Ticket Fields\n\nYou MUST include:\n\nticket_type: "incident" | "access_request" | "request"\n\ntitle: Short one-line summary\n\ndescription: Multi-line detailed description with bullets\n\nuser_name: Provided name or "unknown"\n\napp_or_system: e.g., VPN, Outlook, Jira, Salesforce, Laptop, Email, etc.\n\npriority: "low" | "medium" | "high"\n\ncollected_details: All structured details passed from other agents\n\nsuggested_team: One of the valid IT teams below\n\nstatus: Always "open"\n\nValid IT Teams (Finalized)\n\nYou MUST assign the most appropriate team from this list:\n\n"Network"\n\nVPN, WiFi, Internet, Firewall, Remote access, Connectivity\n\n"Endpoint Support"\n\nLaptop issues, device replacement, OS problems, performance, hardware\n\n"Application Support"\n\nSaaS issues, Email problems, Salesforce, Jira, Slack, Zoom, internal apps\n\n"IAM" (Identity & Access Management)\n\nAccess requests, permission issues, SSO, MFA, Okta, Google Workspace\n\n"Security"\n\nPhishing, suspicious login, malware, compromised accounts, security alerts\n\n"DevOps"\n\nServer outages, CI/CD issues, deployment failures, internal services\n\nNEVER assign "IT Helpdesk" as a team.\nThe IT Helpdesk is the overall function, not a team.\n\nTeam Routing Rules\n\nAssign based on issue type:\n\nVPN / network failures → "Network"\n\nWiFi / connectivity → "Network"\n\nLaptop / hardware issue → "Endpoint Support"\n\nDevice replacement → "Endpoint Support"\n\nIssues with SaaS apps → "Application Support"\n\nEmail not working → "Application Support"\n\nSalesforce / Jira / Slack issues → "Application Support"\n\nAny access request → "IAM"\n\nMFA / Okta problems → "IAM"\n\nSecurity alerts → "Security"\n\nServer outages → "DevOps"\n\nSystem-level application failures → "DevOps"\n\nIf unclear:\nUse "Application Support" for software issues, "Endpoint Support" for device issues.\n\nPriority Rules (Enterprise Friendly)\n\nUse:\n\n"high"\n\nCannot work at all\n\nSystem outage\n\nVPN down\n\nEmail down\n\nAccess to critical app blocked\n\nSecurity incident\n\n"medium"\n\nWork impacted but workaround exists\n\n"low"\n\nCosmetic issue\n\nMinor request\n\nNon-urgent access or device request\n\nWorkflow\n\nGenerate the ticket as a JSON object (not returned yet)\n\nCall the createTicket tool with all fields\n\nGet the returned ticket ID\n\nOutput JSON:\n\n{\n  "ticket_ready": true,\n  "ticket_id": "<ID>",\n  "ticket_type": "<incident | access_request | request>",\n  "title": "<title>",\n  "description": "<description>",\n  "user_name": "<name or unknown>",\n  "app_or_system": "<system>",\n  "priority": "<low | medium | high>",\n  "collected_details": { ... },\n  "suggested_team": "<Network | Endpoint Support | Application Support | IAM | Security | DevOps>",\n  "status": "open"\n}\n\nRules\n\nNEVER invent a ticket ID — only use the ID returned by createTicket.\n\nNEVER output raw text conversation — only the final JSON structure.\n\nIf missing details, mention that inside description and still generate a ticket.\n\nNEVER escalate directly to ServiceNow or Jira — you only save tickets to our system.\n\nIf the tool call fails, return a proper error JSON instead of a ticket.',
  agent_goal:
    "Your goal is to generate high-quality IT tickets with all key fields filled in, so that IT staff can act without extra back-and-forth.",
  agent_context: null,
  agent_output: null,
  examples: null,
  features: [
    {
      type: "MEMORY",
      config: {
        max_messages_context_count: 10,
      },
      priority: 0,
    },
  ],
  tool_usage_description:
    '{\n  "openapi-it_ticket_manager-createTicket": [\n    "You MUST call this tool after generating ticket data. Pass ticket_type, title, description, user_name, app_or_system, priority, collected_details, and suggested_team. Use the exact ticket ID returned in the response - never invent IDs."\n  ],\n  "openapi-it_ticket_manager-getTickets": [\n    "Use this tool to retrieve a list of existing tickets. Optional filters"\n  ],\n  "openapi-it_ticket_manager-getTicketById": [\n    "Use this tool to get detailed information about a specific ticket by its ID. Pass the ticket ID (e.g., \\"TKT-ABC123\\") as the id parameter. Returns the complete ticket object or an error if not found."\n  ],\n  "openapi-it_ticket_manager-updateTicket": [\n    "Use this tool to update an existing ticket\'s status, priority, or other fields. Pass the ticket ID and only the fields you want to update (status, priority, title, description, etc.). Returns the updated ticket object."\n  ],\n  "openapi-it_ticket_manager-deleteTicket": [\n    "Use this tool to permanently delete a ticket. Pass the ticket ID as the id parameter. Use with caution - this action cannot be undone. Prefer updating status to \\"closed\\" instead of deleting."\n  ]\n}',
  response_format: {
    type: "text",
  },
  provider_id: "OpenAI",
  model: "gpt-4o",
  top_p: "0.9",
  temperature: "0.7",
  managed_agents: [],
  tool_configs: [
    {
      tool_name: "openapi-it_ticket_manager-createTicket",
      tool_source: "openapi",
      action_names: [
        "You MUST call this tool after generating ticket data. Pass ticket_type, title, description, user_name, app_or_system, priority, collected_details, and suggested_team. Use the exact ticket ID returned in the response - never invent IDs.",
      ],
      persist_auth: false,
      server_id: "",
    },
    {
      tool_name: "openapi-it_ticket_manager-getTickets",
      tool_source: "openapi",
      action_names: [
        "Use this tool to retrieve a list of existing tickets. Optional filters: status, priority, ticket_type, suggested_team, limit, or search query. Returns an array of ticket objects with all details.",
      ],
      persist_auth: false,
      server_id: "",
    },
    {
      tool_name: "openapi-it_ticket_manager-getTicketById",
      tool_source: "openapi",
      action_names: [
        'Use this tool to get detailed information about a specific ticket by its ID. Pass the ticket ID (e.g., "TKT-ABC123") as the id parameter. Returns the complete ticket object or an error if not found.',
      ],
      persist_auth: false,
      server_id: "",
    },
    {
      tool_name: "openapi-it_ticket_manager-updateTicket",
      tool_source: "openapi",
      action_names: [
        "Use this tool to update an existing ticket's status, priority, or other fields. Pass the ticket ID and only the fields you want to update (status, priority, title, description, etc.). Returns the updated ticket object.",
      ],
      persist_auth: false,
      server_id: "",
    },
    {
      tool_name: "openapi-it_ticket_manager-deleteTicket",
      tool_source: "openapi",
      action_names: [
        'Use this tool to permanently delete a ticket. Pass the ticket ID as the id parameter. Use with caution - this action cannot be undone. Prefer updating status to "closed" instead of deleting.',
      ],
      persist_auth: false,
      server_id: "",
    },
  ],
  store_messages: true,
  file_output: false,
  a2a_tools: [],
  voice_config: null,
  additional_model_params: null,
  version: "3",
  created_at: "2025-12-03T06:14:22.948000",
  updated_at: "2025-12-08T22:30:35.117000",
  llm_credential_id: "lyzr_openai",
  tools: [
    "openapi-it_ticket_manager-createTicket",
    "openapi-it_ticket_manager-getTickets",
    "openapi-it_ticket_manager-getTicketById",
    "openapi-it_ticket_manager-updateTicket",
    "openapi-it_ticket_manager-deleteTicket",
  ],
};

// Access request agent: gathers info for access / provisioning flows
export const ACCESS_REQUEST_AGENT_CONFIG = {
  _id: "692fd34855706e8287911a4c",
  api_key: "sk-default-eE6EHcdIhXl61H4mK4YKZFqISTGrruf1",
  template_type: "single_task",
  name: "Access Request Agent",
  description:
    "Collects required information for application or system access requests and prepares them for escalation or ticket creation.",
  agent_role:
    "You are an IT access request intake assistant. You help gather required information whenever a user asks for access to software, systems, or permissions.",
  agent_instructions:
    'You handle access request workflows.\n\nYour responsibilities:\n1. Identify which application or system the user needs access to.\n2. Collect all required fields using short, single questions.\n3. Confirm the details with the user (always speak directly to them as “you”).\n4. Determine whether manager approval is needed.\n5. When information collection is complete, return structured JSON for the Manager Agent.\n\nRequired information to collect:\n- Application name\n- Reason for access (short and clear)\n- Access type (Standard / Admin / Write / Read-only) — default to Standard if unclear\n- Temporary or permanent access\n- Manager name (if needed for approval)\n\nImportant logic:\n- If the application is one of these: Jira, GitHub, Figma, Salesforce → approval is required.\n- If the application is "email, office tools, or general software" → no approval required.\n\nConversation Rules:\n- You are talking ONLY to the end user, never to IT, never to “another agent”.\n- Never refer to the end user as “the user”. Always use “you”.\n- Never use phrases like “please proceed”, “please prepare the ticket”, or “process this request”.\n- Ask ONE question at a time.\n- Keep responses short and clear.\n- Do NOT troubleshoot or answer KB questions.\n- Do NOT create tickets yourself — you only collect information and return structured data.\n\nCompletion Rules:\n- Once you have collected enough information (at least app_name and reason, and either explicit or assumed access_type, duration, and manager_name), you MUST consider the intake complete.\n- At that point, you should STOP normal conversation and respond ONLY with the JSON below.\n- Do NOT add any extra text, explanation, or comments before or after the JSON.\n- Do NOT speak in third person in the JSON; it is just structured data.\n\nFinal Output Format:\nOnce all information is collected, respond ONLY with this JSON:\n\n{\n "access_request_complete": true,\n "app_name": "<value>",\n "reason": "<value>",\n "access_type": "<value>",\n "duration": "<temporary/permanent>",\n "manager_name": "<name or \'not required\'>",\n "approval_required": <true/false>\n}\n\nIf the user cannot provide required info after 2 attempts, make reasonable assumptions where possible. If it is still not possible to continue, respond ONLY with:\n\n{\n "needs_escalation": true,\n "message": "Missing required information for access request."\n}',
  agent_goal:
    "Your goal is to collect all required details for the access request and determine whether approval is needed before creating a ticket.",
  agent_context: null,
  agent_output: null,
  examples: null,
  features: [
    {
      type: "MEMORY",
      config: {
        max_messages_context_count: 10,
      },
      priority: 0,
    },
  ],
  tool: "",
  tool_usage_description: "{}",
  response_format: {
    type: "text",
  },
  provider_id: "OpenAI",
  model: "gpt-4o-mini",
  top_p: "0.9",
  temperature: "0.7",
  managed_agents: [],
  tool_configs: [],
  store_messages: true,
  file_output: false,
  a2a_tools: [],
  voice_config: null,
  additional_model_params: null,
  version: "3",
  created_at: "2025-12-03T06:06:00.947000",
  updated_at: "2025-12-04T07:07:58.784000",
  llm_credential_id: "lyzr_openai",
};

// Knowledge base agent: answers from internal KB / FAQs
export const KB_AGENT_CONFIG = {
  _id: "692fd5dc6b01be7c2f9f8e1a",
  api_key: "sk-default-eE6EHcdIhXl61H4mK4YKZFqISTGrruf1",
  template_type: "single_task",
  name: "KB Agent",
  description:
    "Answers common IT questions using the internal IT knowledge base. Provides clear step-by-step instructions when possible.",
  agent_role:
    "You are an IT knowledge base assistant. You provide precise answers based on the uploaded internal documentation.",
  agent_instructions:
    'You ONLY answer using information available in the provided knowledge base.\n\nRules:\n- If the answer exists in the knowledge base, respond clearly, in steps if applicable.\n- If the user asks something NOT in the knowledge base, say: \n  "I don\'t have that information. Let me escalate this."\n  and return: { "needs_escalation": true }\n\n- Do NOT troubleshoot or collect diagnostic information.\n- Do NOT request approvals or create tickets.\n- Do NOT make assumptions or invent missing answers.\n\nStyle:\n- Be friendly, concise, and easy to follow.\n- Use bullet points or numbered steps when giving instructions.',
  agent_goal:
    "Your goal is to help employees by giving accurate answers to IT questions using the knowledge base. Respond with clear, step-by-step instructions when available.",
  agent_context: null,
  agent_output: null,
  examples: null,
  features: [
    {
      type: "KNOWLEDGE_BASE",
      config: {
        lyzr_rag: {
          base_url: "https://rag-prod.studio.lyzr.ai",
          rag_id: "692fd807a27c18acce409723",
          rag_name: "it_support_knowledge_base_v13i5j",
          params: {
            top_k: 5,
            retrieval_type: "basic",
            score_threshold: 0,
          },
        },
        agentic_rag: [],
      },
      priority: 0,
    },
    {
      type: "MEMORY",
      config: {
        provider: "lyzr",
        max_messages_context_count: 10,
      },
      priority: 0,
    },
  ],
  tool: "",
  tool_usage_description: "{}",
  response_format: {
    type: "text",
  },
  provider_id: "OpenAI",
  model: "gpt-4o-mini",
  top_p: "0.9",
  temperature: "0.7",
  managed_agents: [],
  tool_configs: [],
  store_messages: true,
  file_output: false,
  a2a_tools: [],
  voice_config: null,
  additional_model_params: null,
  version: "3",
  created_at: "2025-12-03T06:17:00.447000",
  updated_at: "2025-12-04T07:18:05.823000",
  llm_credential_id: "lyzr_openai",
};

// ---------------------------------------------------------------------------
// Ticket Manager Tools OpenAPI config
//
// These describe the 5 tools used by TICKET_GENERATOR_AGENT:
// - It_ticket_manager-getTickets
// - It_ticket_manager-getTicketById
// - It_ticket_manager-createTicket
// - It_ticket_manager-updateTicket
// - It_ticket_manager-deleteTicket
//
// You can paste the full OpenAPI definitions for each tool into the "paths"
// object below (similar to the HR candidate sourcing TOOL_CONFIG).
// ---------------------------------------------------------------------------

export const ticketManagerTools = {
  openapi: "3.0.0",
  info: {
    title: "IT Ticket Manager API",
    version: "1.0.0",
    description:
      "API for managing IT support tickets. This tool allows agents to create, read, update, and delete IT support tickets including incidents, access requests, and general requests.",
  },
  servers: [
    {
      url: "https://it-helpdesk-agent.vercel.app",
      description: "Production server",
    },
  ],
  paths: {
    "/api/tickets": {
      get: {
        summary: "Get all tickets",
        description:
          "Retrieve a list of all tickets with optional filtering by status, priority, ticket type, or team. Use this to check existing tickets or find specific tickets.",
        operationId: "getTickets",
        parameters: [
          {
            name: "x-lyzr-user-id",
            in: "header",
            description:
              "Internal owner identifier for scoping tickets to a specific user. Automatically set by per-user tools; UI calls rely on cookies instead.",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "status",
            in: "query",
            description: "Filter tickets by status",
            required: false,
            schema: {
              type: "string",
              enum: ["new", "open", "in_progress", "resolved", "closed"],
            },
          },
          {
            name: "priority",
            in: "query",
            description: "Filter tickets by priority",
            required: false,
            schema: {
              type: "string",
              enum: ["low", "medium", "high"],
            },
          },
          {
            name: "ticket_type",
            in: "query",
            description: "Filter tickets by type",
            required: false,
            schema: {
              type: "string",
              enum: ["incident", "access_request", "request"],
            },
          },
          {
            name: "suggested_team",
            in: "query",
            description: "Filter tickets by assigned team",
            required: false,
            schema: {
              type: "string",
              enum: [
                "Network",
                "Endpoint Support",
                "Application Support",
                "IAM",
                "Security",
                "DevOps",
              ],
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Maximum number of tickets to return",
            required: false,
            schema: {
              type: "integer",
              default: 50,
            },
          },
          {
            name: "search",
            in: "query",
            description:
              "Search tickets by title, description, user name, or app/system",
            required: false,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "List of tickets retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TicketsListResponse",
                },
                example: {
                  success: true,
                  data: [
                    {
                      id: "TKT-ABC123",
                      ticket_type: "incident",
                      title: "VPN connection issues",
                      description:
                        "- VPN disconnects frequently\n- Affects work from home",
                      user_name: "John Smith",
                      app_or_system: "VPN",
                      priority: "high",
                      collected_details: {},
                      suggested_team: "Network",
                      status: "open",
                      created_at: "2024-12-03T10:00:00Z",
                      updated_at: "2024-12-03T10:00:00Z",
                    },
                  ],
                  total: 1,
                  message: "Retrieved 1 of 1 tickets",
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new ticket",
        description:
          "Create a new IT support ticket. Use this when a user issue needs to be escalated or when an access request needs to be processed. The ticket will be assigned a unique ID automatically.",
        operationId: "createTicket",
        parameters: [
          {
            name: "x-lyzr-user-id",
            in: "header",
            description:
              "Internal owner identifier for this ticket. Automatically set by per-user tools; UI calls rely on cookies instead.",
            required: false,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateTicketRequest",
              },
              example: {
                ticket_type: "incident",
                title: "Cannot access email on laptop",
                description:
                  "- User reports Outlook keeps crashing\n- Issue started this morning\n- Already tried restarting",
                user_name: "John Smith",
                app_or_system: "Outlook",
                priority: "high",
                collected_details: {
                  os: "Windows 11",
                  error_message: "Outlook not responding",
                },
                suggested_team: "IT Helpdesk",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Ticket created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TicketResponse",
                },
                example: {
                  success: true,
                  data: {
                    id: "TKT-XYZ789",
                    ticket_type: "incident",
                    title: "Cannot access email on laptop",
                    description:
                      "- User reports Outlook keeps crashing\n- Issue started this morning\n- Already tried restarting",
                    user_name: "John Smith",
                    app_or_system: "Outlook",
                    priority: "high",
                    collected_details: {
                      os: "Windows 11",
                      error_message: "Outlook not responding",
                    },
                    suggested_team: "IT Helpdesk",
                    status: "new",
                    created_at: "2024-12-03T10:30:00Z",
                    updated_at: "2024-12-03T10:30:00Z",
                  },
                  message: "Ticket TKT-XYZ789 created successfully",
                },
              },
            },
          },
          400: {
            description:
              "Invalid request - missing required fields or invalid values",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/tickets/{id}": {
      get: {
        summary: "Get a specific ticket",
        description:
          "Retrieve details of a specific ticket by its ID. Use this to check the status or details of a previously created ticket.",
        operationId: "getTicketById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "The unique ticket ID (e.g., TKT-ABC123)",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "Ticket details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TicketResponse",
                },
              },
            },
          },
          404: {
            description: "Ticket not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      put: {
        summary: "Update a ticket",
        description:
          "Update an existing ticket's details. Use this to change the status (e.g., from 'new' to 'in_progress'), update priority, or add information to the ticket.",
        operationId: "updateTicket",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "The unique ticket ID to update",
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateTicketRequest",
              },
              example: {
                status: "in_progress",
                priority: "high",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Ticket updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TicketResponse",
                },
              },
            },
          },
          404: {
            description: "Ticket not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete a ticket",
        description:
          "Permanently delete a ticket from the system. Use with caution - this action cannot be undone.",
        operationId: "deleteTicket",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "The unique ticket ID to delete",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "Ticket deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DeleteResponse",
                },
              },
            },
          },
          404: {
            description: "Ticket not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Ticket: {
        type: "object",
        required: [
          "id",
          "ticket_type",
          "title",
          "description",
          "status",
          "created_at",
        ],
        properties: {
          id: {
            type: "string",
            description: "Unique ticket identifier",
            example: "TKT-ABC123",
          },
          ticket_type: {
            type: "string",
            enum: ["incident", "access_request", "request"],
            description:
              "Type of ticket: incident (something broken), access_request (permission needed), or request (general help)",
          },
          title: {
            type: "string",
            description: "Short summary of the issue or request",
            example: "Cannot access email on laptop",
          },
          description: {
            type: "string",
            description: "Detailed description with bullet points",
            example:
              "- User reports Outlook keeps crashing\n- Issue started this morning",
          },
          user_name: {
            type: "string",
            description: "Name of the user who reported the issue",
            example: "John Smith",
          },
          app_or_system: {
            type: "string",
            description: "The affected application or system",
            example: "Outlook",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Ticket priority level",
          },
          collected_details: {
            type: "object",
            description: "Additional structured data about the issue",
            additionalProperties: true,
          },
          suggested_team: {
            type: "string",
            enum: [
              "Network",
              "Endpoint Support",
              "Application Support",
              "IAM",
              "Security",
              "DevOps",
            ],
            description: "Team that should handle this ticket",
          },
          status: {
            type: "string",
            enum: ["new", "open", "in_progress", "resolved", "closed"],
            description: "Current status of the ticket",
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "When the ticket was created",
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "When the ticket was last updated",
          },
        },
      },
      CreateTicketRequest: {
        type: "object",
        required: ["ticket_type", "title", "description"],
        properties: {
          ticket_type: {
            type: "string",
            enum: ["incident", "access_request", "request"],
            description: "Type of ticket",
          },
          title: {
            type: "string",
            description: "Short summary of the issue",
          },
          description: {
            type: "string",
            description: "Detailed description",
          },
          user_name: {
            type: "string",
            description: "Name of the user",
            default: "unknown",
          },
          app_or_system: {
            type: "string",
            description: "Affected application",
            default: "general",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            default: "medium",
          },
          collected_details: {
            type: "object",
            additionalProperties: true,
            default: {},
          },
          suggested_team: {
            type: "string",
            enum: [
              "Network",
              "Endpoint Support",
              "Application Support",
              "IAM",
              "Security",
              "DevOps",
            ],
            default: "Application Support",
          },
        },
      },
      UpdateTicketRequest: {
        type: "object",
        properties: {
          ticket_type: {
            type: "string",
            enum: ["incident", "access_request", "request"],
          },
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
          user_name: {
            type: "string",
          },
          app_or_system: {
            type: "string",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          collected_details: {
            type: "object",
            additionalProperties: true,
          },
          suggested_team: {
            type: "string",
            enum: [
              "Network",
              "Endpoint Support",
              "Application Support",
              "IAM",
              "Security",
              "DevOps",
            ],
          },
          status: {
            type: "string",
            enum: ["new", "open", "in_progress", "resolved", "closed"],
          },
        },
      },
      TicketResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
          },
          data: {
            $ref: "#/components/schemas/Ticket",
          },
          message: {
            type: "string",
          },
        },
      },
      TicketsListResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
          },
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Ticket",
            },
          },
          total: {
            type: "integer",
            description: "Total number of tickets matching the query",
          },
          message: {
            type: "string",
          },
        },
      },
      DeleteResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
          },
          message: {
            type: "string",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            description: "Error message explaining what went wrong",
          },
        },
      },
    },
  },
};

// Wrapper used by per-user tool/agent creation logic
export const TICKET_MANAGER_TOOL_CONFIG = {
  toolName: "it_ticket_manager",
  openapi_schema: ticketManagerTools,
};
