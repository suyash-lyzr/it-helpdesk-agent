import type {
  AuditLogEntry,
  IntegrationConfig,
  IntegrationProvider,
} from "./integrations-types";

type Json = Record<string, unknown>;

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    // Demo-friendly error surface; in production add more robust handling.
    const text = await res.text().catch(() => "");
    throw new Error(
      `API request failed (${res.status}): ${text || res.statusText}`
    );
  }

  return (await res.json()) as T;
}

// Integrations list
export async function fetchIntegrations(): Promise<IntegrationConfig[]> {
  const json = await apiFetch<{ data: IntegrationConfig[] }>(
    "/api/integrations"
  );
  return json.data;
}

// Connect / Disconnect / Test
export async function connectIntegrationApi(
  provider: IntegrationProvider,
  body: Json
): Promise<Json> {
  return apiFetch<Json>(`/api/integrations/${provider}/connect`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function disconnectIntegrationApi(
  provider: IntegrationProvider
): Promise<Json> {
  return apiFetch<Json>(`/api/integrations/${provider}/disconnect`, {
    method: "POST",
  });
}

export async function testIntegrationApi(
  provider: IntegrationProvider
): Promise<Json> {
  return apiFetch<Json>(`/api/integrations/${provider}/test`, {
    method: "POST",
  });
}

// Mapping
export async function fetchIntegrationMapping(
  provider: IntegrationProvider
): Promise<Record<string, string>> {
  const json = await apiFetch<{ mappings: Record<string, string> }>(
    `/api/integrations/${provider}/mapping`
  );
  return json.mappings ?? {};
}

export async function saveIntegrationMapping(
  provider: IntegrationProvider,
  mappings: Record<string, string>
): Promise<Record<string, string>> {
  const json = await apiFetch<{ mappings: Record<string, string> }>(
    `/api/integrations/${provider}/mapping`,
    {
      method: "POST",
      body: JSON.stringify({ mappings }),
    }
  );
  return json.mappings ?? {};
}

// Logs
export async function fetchIntegrationLogs(
  provider: IntegrationProvider,
  limit = 20
): Promise<AuditLogEntry[]> {
  const json = await apiFetch<{ logs: AuditLogEntry[] }>(
    `/api/integrations/${provider}/logs?limit=${limit}`
  );
  return json.logs ?? [];
}

// Demo action helpers
export async function createDemoJiraIssue(body: {
  title: string;
  description: string;
  priority?: string;
  assignee?: string;
}): Promise<{
  external_id: string;
  status: string;
  url: string;
  created_at: string;
}> {
  return apiFetch<{
    external_id: string;
    status: string;
    url: string;
    created_at: string;
  }>("/api/mock/jira/create-issue", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createDemoServiceNowIncident(body: Json): Promise<{
  external_id: string;
  status: string;
  url: string;
}> {
  return apiFetch<{
    external_id: string;
    status: string;
    url: string;
  }>("/api/mock/servicenow/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function demoOktaProvision(body: {
  username: string;
  groups?: string[];
  duration?: string;
}): Promise<{
  status: string;
  external_id: string;
  message: string;
}> {
  return apiFetch<{
    status: string;
    external_id: string;
    message: string;
  }>("/api/mock/okta/provision", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function demoGoogleCheckDevice(body: Json = {}): Promise<{
  device_status: string;
  last_sync: string;
  os: string;
}> {
  return apiFetch<{
    device_status: string;
    last_sync: string;
    os: string;
  }>("/api/mock/google/check-device", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Webhook replay
export async function replayWebhook(body: {
  provider: IntegrationProvider;
  sampleEventId: string;
}): Promise<{
  success: boolean;
  provider: IntegrationProvider;
  event: unknown;
}> {
  return apiFetch<{
    success: boolean;
    provider: IntegrationProvider;
    event: unknown;
  }>("/api/webhook/replay", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Jira OAuth start
export async function startJiraOAuth(): Promise<{
  success: boolean;
  authorizeUrl?: string;
  message?: string;
}> {
  const res = await fetch("/api/oauth/jira/start", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      message:
        data.message ||
        "Jira OAuth is not configured. Please set JIRA_CLIENT_ID and JIRA_REDIRECT_URI environment variables, or use the API Token option below.",
    };
  }

  return data as {
    success: boolean;
    authorizeUrl?: string;
    message?: string;
  };
}

// ServiceNow OAuth start
export async function startServiceNowOAuth(): Promise<{
  success: boolean;
  authorizeUrl?: string;
  state?: string;
  message?: string;
}> {
  const res = await fetch("/api/oauth/servicenow/start", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      message:
        data.message ||
        "ServiceNow OAuth is not configured. Please set SN_INSTANCE_URL, SN_CLIENT_ID, and SN_REDIRECT_URI environment variables.",
    };
  }

  return data as {
    success: boolean;
    authorizeUrl?: string;
    state?: string;
    message?: string;
  };
}

// ServiceNow test connection
export async function testServiceNowConnection(): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  return apiFetch<{
    success: boolean;
    message: string;
    data?: any;
  }>("/api/servicenow/test", {
    method: "POST",
  });
}
