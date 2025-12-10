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
const LYZR_RAG_BASE_URL = "https://rag-prod.studio.lyzr.ai";

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

// --- Knowledge Base Management ---

interface LyzrKnowledgeBaseResponse {
  rag_id: string;
  rag_name: string;
  base_url: string;
}

async function createLyzrKnowledgeBase(
  apiKey: string,
  organizationName: string
): Promise<LyzrKnowledgeBaseResponse> {
  const normalizedName = organizationName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const collectionName = `it_helpdesk_${normalizedName}`;

  const requestData = {
    user_id: apiKey,
    llm_credential_id: "lyzr_openai",
    embedding_credential_id: "lyzr_openai",
    vector_db_credential_id: "lyzr_qdrant",
    description: `IT Helpdesk Knowledge Base for ${organizationName}`,
    collection_name: collectionName,
    llm_model: "gpt-4o-mini",
    embedding_model: "text-embedding-ada-002",
    vector_store_provider: "Qdrant [Lyzr]",
    semantic_data_model: false,
    meta_data: {},
  };

  console.log("Creating Knowledge Base with request:", requestData);

  const response = await fetch(`${LYZR_RAG_BASE_URL}/v3/rag/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("RAG creation failed:", response.status, errorText);
    throw new Error(
      `Failed to create knowledge base: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
  console.log("RAG creation response:", data);

  return {
    rag_id: data.id,
    rag_name: data.collection_name,
    base_url: LYZR_RAG_BASE_URL,
  };
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

function buildKbAgentConfig(kb: {
  ragId: string;
  ragName: string;
  baseUrl: string;
}) {
  // Deep clone KB_AGENT_CONFIG and inject per-user RAG details
  const baseConfig: any = KB_AGENT_CONFIG;

  const updatedFeatures =
    baseConfig.features?.map((feature: any) => {
      if (feature.type !== "KNOWLEDGE_BASE") return feature;
      return {
        ...feature,
        config: {
          ...feature.config,
          lyzr_rag: {
            ...feature.config.lyzr_rag,
            base_url: kb.baseUrl,
            rag_id: kb.ragId,
            rag_name: kb.ragName,
          },
        },
      };
    }) ?? [];

  return {
    ...baseConfig,
    features: updatedFeatures,
  };
}

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

  const organizationName = lyzrUser.name || lyzrUser.email;

  if (existingUser) {
    console.log(`Updating existing helpdesk user: ${existingUser.email}`);
    existingUser.lyzrApiKey = encryptedApiKey;

    // Ensure tools exist
    await ensureTicketTools(lyzrApiKey, existingUser);

    // Ensure knowledge base exists for this user
    if (!existingUser.knowledgeBase?.ragId) {
      const kb = await createLyzrKnowledgeBase(lyzrApiKey, organizationName);
      existingUser.knowledgeBase = {
        ragId: kb.rag_id,
        ragName: kb.rag_name,
        baseUrl: kb.base_url,
      };
    }

    const kbConfigForUser =
      existingUser.knowledgeBase &&
      buildKbAgentConfig({
        ragId: existingUser.knowledgeBase.ragId,
        ragName: existingUser.knowledgeBase.ragName,
        baseUrl: existingUser.knowledgeBase.baseUrl,
      });

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
        : await createLyzrAgent(lyzrApiKey, kbConfigForUser ?? KB_AGENT_CONFIG);

      if (existingUser.kbAgent?.agentId) {
        await updateLyzrAgent(
          lyzrApiKey,
          agentId,
          kbConfigForUser ?? KB_AGENT_CONFIG
        );
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

  // Create tools and knowledge base, then agents before saving user
  // Wrap each creation in try-catch to allow partial success
  let toolIds: string[] = [];
  try {
    toolIds = await createTicketManagerToolsForUser(lyzrApiKey, lyzrUser.id);
    console.log(`✓ Created ticket tools for ${lyzrUser.email}`);
  } catch (error) {
    console.error(
      `⚠ Failed to create ticket tools for ${lyzrUser.email}:`,
      error instanceof Error ? error.message : error
    );
  }

  let kb: LyzrKnowledgeBaseResponse | null = null;
  let kbConfigForUser = null;
  try {
    kb = await createLyzrKnowledgeBase(lyzrApiKey, organizationName);
    kbConfigForUser = buildKbAgentConfig({
      ragId: kb.rag_id,
      ragName: kb.rag_name,
      baseUrl: kb.base_url,
    });
    console.log(`✓ Created knowledge base for ${lyzrUser.email}`);
  } catch (error) {
    console.error(
      `⚠ Failed to create knowledge base for ${lyzrUser.email}:`,
      error instanceof Error ? error.message : error
    );
  }

  let orchestratorAgentId = "";
  try {
    orchestratorAgentId = await createLyzrAgent(
      lyzrApiKey,
      ORCHESTRATOR_AGENT_CONFIG
    );
    console.log(`✓ Created orchestrator agent for ${lyzrUser.email}`);
  } catch (error) {
    console.error(
      `⚠ Failed to create orchestrator agent for ${lyzrUser.email}:`,
      error instanceof Error ? error.message : error
    );
  }

  let troubleshootingAgentId = "";
  try {
    troubleshootingAgentId = await createLyzrAgent(
      lyzrApiKey,
      TROUBLESHOOTING_AGENT_CONFIG
    );
    console.log(`✓ Created troubleshooting agent for ${lyzrUser.email}`);
  } catch (error) {
    console.error(
      `⚠ Failed to create troubleshooting agent for ${lyzrUser.email}:`,
      error instanceof Error ? error.message : error
    );
  }

  let ticketGeneratorAgentId = "";
  try {
    ticketGeneratorAgentId = await createLyzrAgent(
      lyzrApiKey,
      TICKET_GENERATOR_AGENT_CONFIG
    );
    console.log(`✓ Created ticket generator agent for ${lyzrUser.email}`);
  } catch (error) {
    console.error(
      `⚠ Failed to create ticket generator agent for ${lyzrUser.email}:`,
      error instanceof Error ? error.message : error
    );
  }

  let accessRequestAgentId = "";
  try {
    accessRequestAgentId = await createLyzrAgent(
      lyzrApiKey,
      ACCESS_REQUEST_AGENT_CONFIG
    );
    console.log(`✓ Created access request agent for ${lyzrUser.email}`);
  } catch (error) {
    console.error(
      `⚠ Failed to create access request agent for ${lyzrUser.email}:`,
      error instanceof Error ? error.message : error
    );
  }

  let kbAgentId = "";
  try {
    kbAgentId = await createLyzrAgent(
      lyzrApiKey,
      kbConfigForUser ?? KB_AGENT_CONFIG
    );
    console.log(`✓ Created KB agent for ${lyzrUser.email}`);
  } catch (error) {
    console.error(
      `⚠ Failed to create KB agent for ${lyzrUser.email}:`,
      error instanceof Error ? error.message : error
    );
  }

  // Create user with whatever resources were successfully created
  const newUserData: any = {
    ...userIdentifier,
    email: lyzrUser.email,
    displayName: lyzrUser.name || lyzrUser.email.split("@")[0],
    lyzrApiKey: encryptedApiKey,
  };

  if (toolIds.length > 0) {
    newUserData.tools = { version: "1.0.0", toolIds };
  }

  if (orchestratorAgentId) {
    newUserData.orchestratorAgent = {
      agentId: orchestratorAgentId,
      version: LATEST_ORCHESTRATOR_AGENT_VERSION,
    };
  }

  if (troubleshootingAgentId) {
    newUserData.troubleshootingAgent = {
      agentId: troubleshootingAgentId,
      version: LATEST_TROUBLESHOOTING_AGENT_VERSION,
    };
  }

  if (ticketGeneratorAgentId) {
    newUserData.ticketGeneratorAgent = {
      agentId: ticketGeneratorAgentId,
      version: LATEST_TICKET_GENERATOR_AGENT_VERSION,
    };
  }

  if (accessRequestAgentId) {
    newUserData.accessRequestAgent = {
      agentId: accessRequestAgentId,
      version: LATEST_ACCESS_REQUEST_AGENT_VERSION,
    };
  }

  if (kbAgentId) {
    newUserData.kbAgent = {
      agentId: kbAgentId,
      version: LATEST_KB_AGENT_VERSION,
    };
  }

  if (kb) {
    newUserData.knowledgeBase = {
      ragId: kb.rag_id,
      ragName: kb.rag_name,
      baseUrl: kb.base_url,
    };
  }

  const newUser = new User(newUserData);
  await newUser.save();

  console.log(
    `✓ Successfully created user ${lyzrUser.email} (with partial Lyzr resources)`
  );
  return newUser;
}
