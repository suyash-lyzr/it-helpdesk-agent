import type { WebhookSampleEvent } from "./integrations-types"

export function describeWebhookEvent(event: WebhookSampleEvent): string {
  if (event.provider === "jira" && event.event === "ticket.updated") {
    const status = event.changes.status ?? "updated"
    return `Jira ticket ${event.external_id} status changed to ${status}.`
  }

  if (event.provider === "servicenow" && event.event === "incident.resolved") {
    return `ServiceNow incident ${event.external_id} resolved: ${event.resolution}.`
  }

  if (event.provider === "okta" && event.event === "user.provisioned") {
    return `Okta request ${event.external_id} was provisioned (${event.result}).`
  }

  if (event.provider === "google" && event.event === "device.offline") {
    return `Google device ${event.external_id} is offline (last seen ${event.last_seen}).`
  }

  return `${event.provider} event ${event.event} received for ${event.external_id}.`
}


