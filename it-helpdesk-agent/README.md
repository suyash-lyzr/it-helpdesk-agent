# Lyzr IT Helpdesk Agent

An AI-powered IT support platform that automates incident handling, streamlines chat-to-ticket workflows, handles IT support and access/permissions/technical queries end-to-end, and delivers deep observability with native integrations to popular ITSM and IAM tools.

## 🚀 Features

- **AI Support Agent**: Troubleshoots, answers FAQs, and escalates to human agents with full ticket context.
- **Chat ➜ Ticket Escalation**: Create, update, and summarize tickets directly from conversations.
- **Integration Hub**: ServiceNow OAuth, Jira OAuth scaffold, Okta/Google Workspace provisioning, and webhook replay flows.
- **Analytics Dashboards**: SLA funnel, live activity feed, team performance, KPIs, and report builder.
- **Knowledge Base ingestion**: Document upload, reprocessing, and configuration APIs for richer answers.
- **Access Requests**: Premium feature gating and provisioning workflows with auditability.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, React 19
- **UI**: shadcn/ui components with Tailwind CSS v4 + Radix primitives
- **Database**: MongoDB with Mongoose ODM
- **Auth**: Lyzr Studio integration (see `src/lib/AuthProvider.tsx`)
- **Styling**: Modern responsive layout with design tokens and charts via Recharts

## 📁 Project Structure

```
src/
├── app/                       # Next.js App Router
│   ├── api/                   # REST routes (auth, tickets, integrations, analytics, KB, webhook replay)
│   ├── integrations/          # Integration dashboard + provider detail pages
│   ├── knowledge-base/        # Knowledge base management UI
│   ├── tickets/               # Ticket list and detail pages
│   ├── oauth/                 # OAuth callback surfaces
│   ├── globals.css            # Global styles
│   └── page.tsx               # Landing page
├── components/                # Reusable UI + feature widgets (admin, chat, tables, integrations)
├── contexts/                  # React context providers (e.g., admin mode)
├── data/                      # Sample JSON fixtures
├── hooks/                     # Custom React hooks
├── lib/                       # Utilities, stores, analytics, integration helpers, models
├── models/                    # Domain models (feature request, knowledge base, user)
└── types/                     # Type declarations
```

## 🗄 Database Schema

- **Integration**: Provider, tokens, expiry, instance URL, status, metadata.
- **Ticket**: Assignees, priority, status, SLA, linked integrations.
- **TicketMessage**: Threaded chat and system messages per ticket.
- **KnowledgeBase**: Sources and document metadata for retrieval.
- **User**: Profiles with roles and linked org/provider identities.
- **FeatureRequest**: Captures product feedback from the app.

## 🔄 User Flows

### Authentication & Session

1. User lands on the app and authenticates via Lyzr Studio.
2. Session context stored in the app; Admin Mode toggle becomes available.

### Chat to Ticket

1. User chats with the AI agent.
2. Escalate to create/update a ticket with conversation context.
3. View ticket timeline, messages, and integration status.

### Integrations

1. Enable **Admin Mode** and open **Integrations**.
2. ServiceNow: full OAuth flow with test/disconnect.
3. Jira: OAuth scaffold (replace token exchange with real call).
4. Okta / Google Workspace: provisioning and device checks; implement provider APIs for production.
5. Webhook replay: pick sample events to update audit logs and UI.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- Lyzr Studio account (for auth)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd it-helpdesk-agent
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.local.example .env.local
   ```

   Configure values such as:

   ```env
   MONGODB_URI=mongodb://localhost:27017/it_helpdesk_agent
   MONGODB_DB=it_helpdesk_agent
   SN_INSTANCE_URL=https://your-instance.service-now.com
   SN_CLIENT_ID=your-servicenow-client-id
   SN_CLIENT_SECRET=your-servicenow-client-secret
   SN_REDIRECT_URI=http://localhost:3000/api/oauth/servicenow/callback
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Visit the application**
   Open http://localhost:3000

## 🔧 Configuration

- **MongoDB**: Configure connection string and database name via `.env.local`.
- **ServiceNow OAuth**: Client ID/secret, instance URL, and redirect URI required.
- **Analytics & admin widgets**: Driven by API routes under `src/app/api/analytics/*`.

## 🏗 Architecture

- **API Routes**: Modular handlers for auth, tickets, analytics, integrations, knowledge base, and webhook replay.
- **Integrations**: ServiceNow OAuth end-to-end; Jira OAuth scaffold; Okta/Google Workspace actions; webhook replay utilities.
- **State & Stores**: Client stores for tickets, integrations, and analytics backed by typed helpers in `src/lib`.
- **Security**: OAuth state protection, token expiry tracking, environment-based secrets, optional encryption for stored credentials.

## 🎨 Design System

- **Typography**: `text-3xl md:text-4xl font-bold` (titles); `text-xl md:text-2xl font-semibold` (sections); `text-base font-normal` (body).
- **Layout**: Mobile-first, responsive spacing with Tailwind v4; shadcn/ui patterns.
- **Components**: Cards, forms with validation, charts, tables, loading/skeleton states, and integration setup panels.

## 🚀 Deployment

- **Frontend**: Vercel or Netlify recommended.
- **Database**: MongoDB Atlas for production.
- **Runtime**: Node.js 18+; ensure all environment variables are set in hosting provider.

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 🆘 Support

- 📧 Email: support@lyzr.ai
- 🐛 Issues: Open a ticket in this repository.
- 📖 Documentation: See `INTEGRATIONS-README.md` and `SERVICENOW_OAUTH_SETUP.md` for detailed flows.

## 🏢 About Lyzr

Lyzr builds AI-powered business solutions for modern teams. Learn more at https://lyzr.ai.

---

**Built with ❤️ by the Lyzr team**
