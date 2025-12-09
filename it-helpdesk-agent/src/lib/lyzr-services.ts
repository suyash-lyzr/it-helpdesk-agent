/* eslint-disable @typescript-eslint/no-explicit-any */

import CryptoJS from "crypto-js";
import User, { type IUserDocument } from "@/models/user";
import {
  ORCHESTRATOR_AGENT_CONFIG,
  TROUBLESHOOTING_AGENT_CONFIG,
  TICKET_GENERATOR_AGENT_CONFIG,
  ACCESS_REQUEST_AGENT_CONFIG,
  KB_AGENT_CONFIG,
  TICKET_MANAGER_TOOL_CONFIG,
  LATEST_ORCHESTRATOR_AGENT_VERSION,
  LATEST_TROUBLESHOOTING_AGENT_VERSION,
  LATEST_TICKET_GENERATOR_AGENT_VERSION,
  LATEST_ACCESS_REQUEST_AGENT_VERSION,
  LATEST_KB_AGENT_VERSION,
} from "@/lib/agent-config";

const LYZR_AGENT_BASE_URL = "https://agent-prod.studio.lyzr.ai";

// --- Encryption ---

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-secret-key-that-is-long-enough";

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// --- Tool Management (Ticket Manager OpenAPI tools) ---

async function createTicketManagerToolsForUser(
  apiKey: string,
  userId: string
): Promise<string[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://nervily-chordamesodermic-renda.ngrok-free.dev";

  // Update the tools schema with the correct server URL
  const updatedTools = {
    ...TICKET_MANAGER_TOOL_CONFIG.openapi_schema,
    servers: [
      {
        url: baseUrl,
        description: "IT Helpdesk API Server",
      },
    ],
  };

  const requestData = {
    tool_set_name: `${TICKET_MANAGER_TOOL_CONFIG.toolName}`,
    openapi_schema: updatedTools,
    default_headers: {
      "Content-Type": "application/json",
    },
    default_query_params: {},
    default_body_params: {},
    endpoint_defaults: {},
    enhance_descriptions: false,
    openai_api_key: null,
  };

  console.log(
    "Creating Ticket Manager tools with request:",
    JSON.stringify(requestData, null, 2)
  );

  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/tools/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Ticket tools creation failed:", response.status, errorText);
    throw new Error(
      `Failed to create ticket tools: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
  console.log("Ticket tools creation response:", data);

  // Extract tool names from response
  const toolNames = data.tool_ids
    ? data.tool_ids.map((tool: any) => tool.name)
    : [];
  console.log("Extracted ticket tool names:", toolNames);

  return toolNames;
}

async function ensureTicketTools(
  apiKey: string,
  user: IUserDocument
): Promise<string[]> {
  const currentVersion = "1.0.0";

  if (
    !user.tools ||
    user.tools.version !== currentVersion ||
    !user.tools.toolIds ||
    user.tools.toolIds.length === 0
  ) {
    console.log(
      `Ticket tools missing or version mismatch for user ${user.email}. Creating tools...`
    );
    const toolIds = await createTicketManagerToolsForUser(
      apiKey,
      user.lyzrUserId
    );
    user.tools = { version: currentVersion, toolIds };
    await user.save();
    return toolIds;
  }

  console.log(
    `Reusing existing ticket tools for user ${user.email} at version v${user.tools.version}`
  );
  return user.tools.toolIds;
}

// --- Agent Management ---

async function createLyzrAgent(
  apiKey: string,
  agentConfig: any
): Promise<string> {
  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/agents/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(agentConfig),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to create Lyzr agent ${agentConfig.name}: ${error}`
    );
  }

  const data = await response.json();
  return data.agent_id;
}

async function updateLyzrAgent(
  apiKey: string,
  agentId: string,
  agentConfig: any
): Promise<void> {
  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/agents/${agentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(agentConfig),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Lyzr agent ${agentId}: ${error}`);
  }
}

// --- User and Agent Orchestration ---

export async function createOrUpdateUserAndAgents(
  lyzrUser: { id: string; email: string; name?: string },
  lyzrApiKey: string
): Promise<IUserDocument> {
  const userIdentifier = { lyzrUserId: lyzrUser.id };
  const encryptedApiKey = encrypt(lyzrApiKey);

  // Find user first
  const existingUser = await User.findOne(userIdentifier);

  if (existingUser) {
    console.log(`Updating existing helpdesk user: ${existingUser.email}`);
    existingUser.lyzrApiKey = encryptedApiKey;

    // Ensure tools exist
    await ensureTicketTools(lyzrApiKey, existingUser);

    // Ensure each agent exists / is up to date
    if (
      !existingUser.orchestratorAgent ||
      existingUser.orchestratorAgent.version !==
        LATEST_ORCHESTRATOR_AGENT_VERSION
    ) {
      const agentId = existingUser.orchestratorAgent?.agentId
        ? existingUser.orchestratorAgent.agentId
        : await createLyzrAgent(lyzrApiKey, ORCHESTRATOR_AGENT_CONFIG);

      if (existingUser.orchestratorAgent?.agentId) {
        await updateLyzrAgent(lyzrApiKey, agentId, ORCHESTRATOR_AGENT_CONFIG);
      }

      existingUser.orchestratorAgent = {
        agentId,
        version: LATEST_ORCHESTRATOR_AGENT_VERSION,
      };
    }

    if (
      !existingUser.troubleshootingAgent ||
      existingUser.troubleshootingAgent.version !==
        LATEST_TROUBLESHOOTING_AGENT_VERSION
    ) {
      const agentId = existingUser.troubleshootingAgent?.agentId
        ? existingUser.troubleshootingAgent.agentId
        : await createLyzrAgent(lyzrApiKey, TROUBLESHOOTING_AGENT_CONFIG);

      if (existingUser.troubleshootingAgent?.agentId) {
        await updateLyzrAgent(
          lyzrApiKey,
          agentId,
          TROUBLESHOOTING_AGENT_CONFIG
        );
      }

      existingUser.troubleshootingAgent = {
        agentId,
        version: LATEST_TROUBLESHOOTING_AGENT_VERSION,
      };
    }

    if (
      !existingUser.ticketGeneratorAgent ||
      existingUser.ticketGeneratorAgent.version !==
        LATEST_TICKET_GENERATOR_AGENT_VERSION
    ) {
      const agentId = existingUser.ticketGeneratorAgent?.agentId
        ? existingUser.ticketGeneratorAgent.agentId
        : await createLyzrAgent(lyzrApiKey, TICKET_GENERATOR_AGENT_CONFIG);

      if (existingUser.ticketGeneratorAgent?.agentId) {
        await updateLyzrAgent(
          lyzrApiKey,
          agentId,
          TICKET_GENERATOR_AGENT_CONFIG
        );
      }

      existingUser.ticketGeneratorAgent = {
        agentId,
        version: LATEST_TICKET_GENERATOR_AGENT_VERSION,
      };
    }

    if (
      !existingUser.accessRequestAgent ||
      existingUser.accessRequestAgent.version !==
        LATEST_ACCESS_REQUEST_AGENT_VERSION
    ) {
      const agentId = existingUser.accessRequestAgent?.agentId
        ? existingUser.accessRequestAgent.agentId
        : await createLyzrAgent(lyzrApiKey, ACCESS_REQUEST_AGENT_CONFIG);

      if (existingUser.accessRequestAgent?.agentId) {
        await updateLyzrAgent(lyzrApiKey, agentId, ACCESS_REQUEST_AGENT_CONFIG);
      }

      existingUser.accessRequestAgent = {
        agentId,
        version: LATEST_ACCESS_REQUEST_AGENT_VERSION,
      };
    }

    if (
      !existingUser.kbAgent ||
      existingUser.kbAgent.version !== LATEST_KB_AGENT_VERSION
    ) {
      const agentId = existingUser.kbAgent?.agentId
        ? existingUser.kbAgent.agentId
        : await createLyzrAgent(lyzrApiKey, KB_AGENT_CONFIG);

      if (existingUser.kbAgent?.agentId) {
        await updateLyzrAgent(lyzrApiKey, agentId, KB_AGENT_CONFIG);
      }

      existingUser.kbAgent = {
        agentId,
        version: LATEST_KB_AGENT_VERSION,
      };
    }

    await existingUser.save();
    return existingUser;
  }

  // --- NEW USER LOGIC ---
  console.log(`Creating new helpdesk user and agents for ${lyzrUser.email}`);

  // Create tools and agents before saving user
  const toolIds = await createTicketManagerToolsForUser(
    lyzrApiKey,
    lyzrUser.id
  );

  const orchestratorAgentId = await createLyzrAgent(
    lyzrApiKey,
    ORCHESTRATOR_AGENT_CONFIG
  );
  const troubleshootingAgentId = await createLyzrAgent(
    lyzrApiKey,
    TROUBLESHOOTING_AGENT_CONFIG
  );
  const ticketGeneratorAgentId = await createLyzrAgent(
    lyzrApiKey,
    TICKET_GENERATOR_AGENT_CONFIG
  );
  const accessRequestAgentId = await createLyzrAgent(
    lyzrApiKey,
    ACCESS_REQUEST_AGENT_CONFIG
  );
  const kbAgentId = await createLyzrAgent(lyzrApiKey, KB_AGENT_CONFIG);

  const newUser = new User({
    ...userIdentifier,
    email: lyzrUser.email,
    displayName: lyzrUser.name || lyzrUser.email.split("@")[0],
    lyzrApiKey: encryptedApiKey,
    tools: { version: "1.0.0", toolIds },
    orchestratorAgent: {
      agentId: orchestratorAgentId,
      version: LATEST_ORCHESTRATOR_AGENT_VERSION,
    },
    troubleshootingAgent: {
      agentId: troubleshootingAgentId,
      version: LATEST_TROUBLESHOOTING_AGENT_VERSION,
    },
    ticketGeneratorAgent: {
      agentId: ticketGeneratorAgentId,
      version: LATEST_TICKET_GENERATOR_AGENT_VERSION,
    },
    accessRequestAgent: {
      agentId: accessRequestAgentId,
      version: LATEST_ACCESS_REQUEST_AGENT_VERSION,
    },
    kbAgent: {
      agentId: kbAgentId,
      version: LATEST_KB_AGENT_VERSION,
    },
  });

  await newUser.save();
  console.log(
    `✓ Successfully created helpdesk user and agents for ${lyzrUser.email}`
  );
  return newUser;
}
