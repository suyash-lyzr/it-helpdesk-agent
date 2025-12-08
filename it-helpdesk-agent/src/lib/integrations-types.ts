export type IntegrationProvider = "jira" | "servicenow" | "okta" | "google"

export type IntegrationMode = "demo" | "real"

export type IntegrationStatus = "disconnected" | "connected"

export interface IntegrationMapping {
  provider: IntegrationProvider
  mappings: {
    title?: string
    description?: string
    priority?: string
    assignee?: string
    project?: string
  }
}

export interface IntegrationConnectionInfo {
  provider: IntegrationProvider
  status: IntegrationStatus
  mode: IntegrationMode
  maskedToken?: string
  connectedAt?: string
  lastTestAt?: string
}

export interface IntegrationMeta {
  id: IntegrationProvider
  name: string
  description: string
}

export interface IntegrationConfig extends IntegrationConnectionInfo {
  meta: IntegrationMeta
  mapping?: IntegrationMapping["mappings"]
}

export interface AuditLogEntry {
  id: string
  provider: IntegrationProvider
  action: string
  actor: string
  timestamp: string
  details?: Record<string, unknown>
}

export interface WebhookSampleEventBase {
  provider: IntegrationProvider
  event: string
  external_id: string
}

export interface JiraTicketUpdatedEvent extends WebhookSampleEventBase {
  provider: "jira"
  event: "ticket.updated"
  changes: {
    status?: string
    assignee?: string
  }
}

export interface ServiceNowIncidentResolvedEvent extends WebhookSampleEventBase {
  provider: "servicenow"
  event: "incident.resolved"
  resolution: string
}

export interface OktaUserProvisionedEvent extends WebhookSampleEventBase {
  provider: "okta"
  event: "user.provisioned"
  result: string
}

export interface GoogleDeviceOfflineEvent extends WebhookSampleEventBase {
  provider: "google"
  event: "device.offline"
  last_seen: string
}

export type WebhookSampleEvent =
  | JiraTicketUpdatedEvent
  | ServiceNowIncidentResolvedEvent
  | OktaUserProvisionedEvent
  | GoogleDeviceOfflineEvent

export interface IntegrationsStoreData {
  integrations: Record<IntegrationProvider, IntegrationConfig>
  auditLogs: AuditLogEntry[]
}


