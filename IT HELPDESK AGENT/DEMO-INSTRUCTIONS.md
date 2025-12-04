## Integrations Demo Flows

### Flow A: Show connecting integrations

1. Start the app (`npm run dev`) and open it in the browser.
2. In the sidebar footer, toggle **Admin Mode** ON.
3. Click **Integrations** in the sidebar.
4. Confirm **Demo Mode** is ON at the top right of the Integrations page.
5. On the **Jira** card, click **Connect** → the status pill should update to **Demo connected** and the badge reads “Demo connected”.
6. Click **Test connection** to see a toast confirming sample issue `JRA-2031`.
7. Click **Details** on the Jira card.
8. In the Jira detail view, under **Quick actions**, click **Create external ticket (Demo)** with title like “VPN disconnecting”.
9. Observe a toast: “Created external ticket JRA-2031 (Demo)” and see a new audit entry showing the external ID.

### Flow B: Show escalation from agent to external system

1. From the home/assistant screen, start a conversation:  
   “My VPN keeps disconnecting.”
2. Let the orchestration/chat flow reach a point where a ticket is created (or manually trigger ticket creation as you normally do).
3. Explain that behind the scenes, once internal triage is done, you can escalate to Jira via the Integrations tab.
4. Open **Integrations → Jira → Details** and click **Create external ticket (Demo)**.
5. Show the toast and audit log with `JRA-2031` and explain this represents `/api/mock/jira/create-issue` being called.
6. Navigate to the **Tickets** dashboard and point out that in a real deployment, this is where you would surface a Jira external link using the returned external ID.

### Flow C: Webhook update demo

1. From **Integrations → Jira → Details**, go to the **Webhook replay** section.
2. Select **jira.ticket.updated** as the sample event.
3. Click **Replay webhook (Demo)**.
4. A toast should read something like:  
   “Jira ticket JRA-2031 status changed to In Progress.”
5. Explain this simulates an external system updating ticket status and how, in production, it would update the ticket row and chat transcript.

### Flow D: Access request demo (Okta)

1. In chat, type:  
   “Give me GitHub access for 30 days.”
2. Explain that your Access Request Agent collects details and creates an internal ticket.
3. Go to **Integrations → Okta → Details**.
4. Click **Provision user (Demo)**.
5. A toast confirms something like `Provisioning started OKTA-REQ-1001 (Demo)` and the audit log records the provisioning request.

### Recording suggestion

For a 3-minute or 10–12 slide demo:

1. Show the **Integrations** list with Demo Mode ON.
2. Connect **Jira** (Demo).
3. Test connection and highlight `JRA-2031`.
4. Create a demo Jira ticket from the Jira detail page.
5. Show the corresponding ticket / escalation concept in the Tickets dashboard.
6. Replay the Jira webhook event and point out the notification.
7. Briefly show ServiceNow, Okta, and Google cards to underscore breadth of coverage.


