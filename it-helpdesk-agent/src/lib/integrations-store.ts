import fs from "node:fs"
import path from "node:path"
import {
  type AuditLogEntry,
  type IntegrationConfig,
  type IntegrationMapping,
  type IntegrationProvider,
  type IntegrationsStoreData,
} from "./integrations-types"

const DATA_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "integrations.json",
)

let inMemoryStore: IntegrationsStoreData | null = null

function readStoreFromDisk(): IntegrationsStoreData {
  try {
    const raw = fs.readFileSync(DATA_FILE_PATH, "utf8")
    return JSON.parse(raw) as IntegrationsStoreData
  } catch {
    // Demo-only fallback: if the file is missing or unreadable, start with an empty store.
    return {
      integrations: {} as Record<IntegrationProvider, IntegrationConfig>,
      auditLogs: [],
    }
  }
}

function writeStoreToDisk(store: IntegrationsStoreData) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(store, null, 2), "utf8")
  } catch {
    // Demo-only: ignore persistence errors. In production, replace with durable storage and logging.
  }
}

function getStore(): IntegrationsStoreData {
  if (!inMemoryStore) {
    inMemoryStore = readStoreFromDisk()
  }
  return inMemoryStore
}

function setStore(next: IntegrationsStoreData) {
  inMemoryStore = next
  writeStoreToDisk(next)
}

export function getIntegrations(): IntegrationConfig[] {
  const store = getStore()
  return Object.values(store.integrations)
}

export function getIntegration(
  provider: IntegrationProvider,
): IntegrationConfig | undefined {
  const store = getStore()
  return store.integrations[provider]
}

export function connectIntegration(params: {
  provider: IntegrationProvider
  mode: IntegrationConfig["mode"]
  maskedToken?: string
}): IntegrationConfig | undefined {
  const store = getStore()
  const existing = store.integrations[params.provider]
  if (!existing) return undefined

  const updated: IntegrationConfig = {
    ...existing,
    status: "connected",
    mode: params.mode,
    maskedToken: params.maskedToken ?? existing.maskedToken,
    connectedAt: new Date().toISOString(),
  }

  const next: IntegrationsStoreData = {
    ...store,
    integrations: {
      ...store.integrations,
      [params.provider]: updated,
    },
  }

  setStore(next)

  appendLog({
    provider: params.provider,
    action: "connect",
    actor: "admin",
    details: {
      mode: params.mode,
      demo: params.mode === "demo",
    },
  })

  return updated
}

export function disconnectIntegration(
  provider: IntegrationProvider,
): IntegrationConfig | undefined {
  const store = getStore()
  const existing = store.integrations[provider]
  if (!existing) return undefined

  const updated: IntegrationConfig = {
    ...existing,
    status: "disconnected",
    maskedToken: undefined,
    connectedAt: undefined,
  }

  const next: IntegrationsStoreData = {
    ...store,
    integrations: {
      ...store.integrations,
      [provider]: updated,
    },
  }

  setStore(next)

  appendLog({
    provider,
    action: "disconnect",
    actor: "admin",
  })

  return updated
}

export function markTested(provider: IntegrationProvider) {
  const store = getStore()
  const existing = store.integrations[provider]
  if (!existing) return

  const updated: IntegrationConfig = {
    ...existing,
    lastTestAt: new Date().toISOString(),
  }

  const next: IntegrationsStoreData = {
    ...store,
    integrations: {
      ...store.integrations,
      [provider]: updated,
    },
  }

  setStore(next)
}

export function saveMapping(
  provider: IntegrationProvider,
  mappings: IntegrationMapping["mappings"],
): IntegrationConfig | undefined {
  const store = getStore()
  const existing = store.integrations[provider]
  if (!existing) return undefined

  const updated: IntegrationConfig = {
    ...existing,
    mapping: {
      ...existing.mapping,
      ...mappings,
    },
  }

  const next: IntegrationsStoreData = {
    ...store,
    integrations: {
      ...store.integrations,
      [provider]: updated,
    },
  }

  setStore(next)

  appendLog({
    provider,
    action: "mapping.updated",
    actor: "admin",
    details: { mappings },
  })

  return updated
}

export function appendLog(entry: {
  provider: IntegrationProvider
  action: string
  actor: string
  details?: AuditLogEntry["details"]
}) {
  const store = getStore()
  const fullEntry: AuditLogEntry = {
    id: `${entry.provider}-${entry.action}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  }

  const next: IntegrationsStoreData = {
    ...store,
    auditLogs: [...store.auditLogs, fullEntry],
  }

  setStore(next)
}

export function getLogsForProvider(
  provider: IntegrationProvider,
  limit = 20,
): AuditLogEntry[] {
  const store = getStore()
  return store.auditLogs
    .filter((log) => log.provider === provider)
    .slice(-limit)
    .reverse()
}


