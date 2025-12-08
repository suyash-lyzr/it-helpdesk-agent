## Integrations Demo Setup

### Starting the demo

- Run the app from the `IT HELPDESK AGENT` directory:

```bash
npm install
npm run dev
```

- Open `http://localhost:3000` in your browser.
- In the sidebar footer, toggle **Admin Mode** ON.
- Click **Integrations** in the sidebar to open the Integrations dashboard.

### Demo vs Real mode

- The Integrations list page has a **Demo Mode** toggle (top right).
- With Demo Mode ON (default), all providers use mock tokens and canned responses:
  - Connect flows store demo tokens in an in-memory + JSON store.
  - Test connection and quick actions call `/api/integrations/*/test` and `/api/mock/*` endpoints.
- For production, replace these mocks with real API calls and secure token storage.

### Jira real OAuth scaffold

To enable the Jira OAuth scaffold:

1. Create a `.env` file (based on `.env.example`) in the `IT HELPDESK AGENT` folder with:

```bash
JIRA_CLIENT_ID=your-jira-client-id
JIRA_CLIENT_SECRET=your-jira-client-secret
JIRA_REDIRECT_URI=http://localhost:3000/api/oauth/jira/callback
```

2. Restart the dev server.
3. Go to **Integrations → Jira → Details**.
4. Click **Start real OAuth (Jira)**.
5. Complete the Atlassian consent flow; the callback route will:
   - Exchange the code using a stubbed helper (replace with real HTTP call).
   - Store a masked token in the demo integrations store.

> Note: The current implementation is a scaffold only. In production, wire `exchangeJiraCodeForToken` to Atlassian’s token endpoint and persist tokens in a secret manager.

### Switching providers to real mode

For each provider:

- **Jira**:
  - Configure Jira OAuth as above.
  - Replace mock `/api/mock/jira/create-issue` usage with a real Jira issue creation call inside a dedicated service module.
- **ServiceNow**:
  - Replace `/api/integrations/servicenow/connect` and `/api/mock/servicenow/create-incident` with calls using a Service Account (REST API) and store credentials in your secret manager.
- **Okta**:
  - Replace `/api/integrations/okta/connect` and `/api/mock/okta/provision` with real Okta API calls (e.g., SCIM or Okta Users API) using admin consent or service account.
- **Google Workspace Admin**:
  - Replace `/api/integrations/google/connect` and `/api/mock/google/check-device` with Admin SDK / Chrome Device Management calls using a service account with domain-wide delegation.

The frontend only depends on stable, typed responses; you can swap out the backend implementation without changing UI code.

### Webhook replay

- Webhook replay is powered by `/api/webhook/replay` and sample events:
  - `jira.ticket.updated`
  - `servicenow.incident.resolved`
  - `okta.user.provisioned`
  - `google.device.offline`
- In the integration detail page:
  - Choose a sample event from the **Webhook replay** dropdown.
  - Click **Replay webhook (Demo)**.
  - A toast summarizes the effect (via `integration-webhook-utils`) and audit logs are updated.

### Sales/demo scenarios

See `DEMO-INSTRUCTIONS.md` for step‑by‑step flows:

- Flow A: Connecting integrations.
- Flow B: Escalating from chat to Jira/ServiceNow.
- Flow C: Webhook update demo.
- Flow D: Access request provisioning with Okta.

### Security & next steps

- Replace demo token storage with:
  - Encrypted secret storage (e.g., cloud secret manager or KMS-backed store).
  - Proper token refresh and revocation logic.
- Restrict scopes to least privilege per provider.
- Add structured audit logging to your observability stack instead of JSON file persistence.


