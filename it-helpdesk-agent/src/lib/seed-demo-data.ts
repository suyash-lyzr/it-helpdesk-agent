// Seed demo data for demo accounts
// Generates realistic dummy tickets for demo and video purposes

import { createTicket } from "./ticket-store";
import { CreateTicketRequest, LifecycleStage } from "./ticket-types";
import { subDays, subHours } from "date-fns";

/**
 * Generate diverse dummy tickets for demo purposes
 * Creates 14 highly relevant tickets showcasing integrations and common IT scenarios
 * Includes 6 access requests for Access Request Analytics
 * Includes 1 SLA breach ticket for compliance metrics
 * @param lyzrUserId - User ID to associate tickets with
 * @returns Array of created tickets
 */
export async function seedDemoTickets(lyzrUserId: string) {
  const now = new Date();

  const demoTickets: CreateTicketRequest[] = [
    // Ticket 1: VPN Issue (matches "My VPN keeps disconnecting" query)
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "My VPN keeps disconnecting every few minutes",
      description: `VPN connection drops every 5-10 minutes when working from home.

Error message: "Connection timeout - Unable to establish secure tunnel"

**Impact**: 
- Cannot access internal applications
- Blocking critical project work
- Happening since yesterday

**Troubleshooting done**:
- Verified internet connectivity is stable
- Restarted VPN client multiple times
- Checked firewall settings
- Tried different WiFi networks`,
      user_name: "Sarah Chen",
      app_or_system: "VPN",
      priority: "high",
      status: "open",
      suggested_team: "Network",
      collected_details: {
        error_code: "VPN_TIMEOUT_001",
        connection_duration_before_drop: "5-10 minutes",
        vpn_client_version: "8.2.1",
        last_successful_connection: "2 days ago",
      },
    },
    // Ticket 2: ServiceNow Integration (showcases ServiceNow sync)
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "ServiceNow Incident Sync Failing",
      description: `ServiceNow incident creation sync is failing from IT Helpdesk.

**Impact**:
- High-priority incidents not reaching ServiceNow
- Service desk missing SLA timers

**Recent errors**:
- 503 Service Unavailable from ServiceNow API
- Webhook retries exhausted`,
      user_name: "Integration Bot",
      app_or_system: "ServiceNow",
      priority: "high",
      status: "in_progress",
      suggested_team: "DevOps",
      collected_details: {
        servicenow_instance: "lyzr.service-now.com",
        last_success_sync: "2024-12-09T08:15:00Z",
        recent_error: "503 Service Unavailable",
        retry_attempts: 3,
      },
      external_ids: {
        servicenow: "INC-DEMO-001",
      },
    },
    // Ticket 3: Jira Integration (showcases Jira sync)
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Jira Integration Webhook Failure",
      description: `Jira webhooks not delivering updates to Helpdesk.

**Impact**:
- Ticket comments and statuses not syncing from Jira
- Agents missing SLA escalations

**Error**:
- 401 Unauthorized from Jira webhook endpoint
- Suspected expired API token`,
      user_name: "Integration Bot",
      app_or_system: "Jira",
      priority: "medium",
      status: "in_progress",
      suggested_team: "Application Support",
      collected_details: {
        jira_project: "ITOPS",
        webhook_url:
          "https://it-helpdesk-agent.vercel.app/api/integrations/jira/webhook",
        last_success: "2024-12-08T11:00:00Z",
        recent_error: "401 Unauthorized - invalid token",
      },
      external_ids: {
        jira: "ITOPS-2041",
      },
    },
    // Ticket 4: Okta Provisioning (showcases Okta + matches "I need access to Jira")
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "I need access to Jira for our new sprint",
      description: `Need Jira access to participate in upcoming sprint planning.

**Required access**:
- Jira Software project: ITOPS
- Role: Developer
- Boards: IT Operations Sprint Board

**Justification**: 
- Joining DevOps team next week
- Need to view and update sprint tickets
- Manager approval received

**Urgency**: Sprint starts Monday`,
      user_name: "Alex Martinez",
      app_or_system: "Jira",
      priority: "medium",
      status: "open",
      suggested_team: "IAM",
      assignee: "Sarah Chen",
      collected_details: {
        jira_project: "ITOPS",
        access_level: "Developer",
        manager_name: "Sarah Chen",
        manager_email: "sarah.chen@company.com",
        start_date: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        via_okta: true,
      },
    },
    // Ticket 5: Password Reset (matches "I forgot my password and nothing works" query)
    {
      lyzrUserId,
      ticket_type: "request",
      title: "I forgot my password and nothing works",
      description: `Forgot my Active Directory password. Now locked out of all systems.

**Locked out of**:
- Email (Outlook)
- Slack
- Jira
- Google Drive
- All Windows apps

**Tried**:
- Self-service password reset (didn't receive email)
- Recovery questions (forgot answers)

**Urgency**: Critical - Cannot work at all`,
      user_name: "John Smith",
      app_or_system: "Active Directory",
      priority: "high",
      status: "resolved",
      suggested_team: "IAM",
      collected_details: {
        username: "john.smith@company.com",
        lock_reason: "Multiple failed login attempts + forgotten password",
        locked_systems: ["Outlook", "Slack", "Jira", "Google Drive", "Windows"],
        resolution:
          "Verified identity via manager call, reset password via Okta admin",
      },
      csat_score: 1,
      external_ids: {
        okta: "PWD-RESET-4291",
      },
    },
    // Ticket 6: Outlook Email (matches "How do I install Outlook?" - resolved quickly)
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "How do I install Outlook on my new laptop?",
      description: `Just got a new work laptop. Need Outlook installed to access company email.

**Current status**:
- Laptop setup complete
- Windows activated
- Need Office 365 / Outlook

**Urgency**: Need email access today for client meetings`,
      user_name: "Emma Watson",
      app_or_system: "Outlook",
      priority: "medium",
      status: "resolved",
      suggested_team: "Application Support",
      collected_details: {
        device_model: "Dell Latitude 7420",
        os_version: "Windows 11 Pro",
        office_license_available: true,
        resolution:
          "Installed Office 365, configured Outlook profile, verified email sync",
      },
      csat_score: 1,
    },
    // Ticket 7: Google Workspace Admin (showcases Google integration)
    {
      lyzrUserId,
      ticket_type: "request",
      title: "Check device posture for Google Workspace access",
      description: `Getting blocked from Google Workspace due to device compliance check.

**Error**: "Your device doesn't meet security requirements"

**Issue**:
- Cannot access Gmail, Drive, Calendar
- Device compliance check failing
- Need admin to verify/update device status

**Device**: MacBook Pro M2 (company-issued)`,
      user_name: "Brian Thompson",
      app_or_system: "Google Workspace Admin",
      priority: "high",
      status: "in_progress",
      suggested_team: "IAM",
      collected_details: {
        device_id: "C02XY1234567",
        device_model: "MacBook Pro M2",
        compliance_issues: [
          "OS update required",
          "Firewall not enabled",
          "FileVault not configured",
        ],
        user_email: "brian.thompson@company.com",
      },
      external_ids: {
        google_workspace: "DEVICE-CHECK-8812",
      },
    },
    // Ticket 8: VPN Setup (matches "How do I set up VPN on my Mac?" - resolved with high CSAT)
    {
      lyzrUserId,
      ticket_type: "request",
      title: "How do I set up VPN on my Mac?",
      description: `New to the company. Need help setting up VPN on MacBook to work from home.

**Tried**:
- Downloaded VPN client
- Don't know which server to connect to
- Not sure about credentials

**Need**:
- VPN configuration details
- Step-by-step setup guide`,
      user_name: "Rachel Green",
      app_or_system: "VPN",
      priority: "medium",
      status: "resolved",
      suggested_team: "Network",
      collected_details: {
        device_type: "MacBook Pro",
        vpn_client: "Cisco AnyConnect",
        resolution:
          "Sent VPN config guide, server details, and walked through setup. User successfully connected.",
      },
      csat_score: 1,
    },
    // Ticket 9: Salesforce Admin Access Request - Pending
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "Need Salesforce Admin access for Q1 reporting",
      description: `Requesting Salesforce Administrator access to generate quarterly reports.

**Required access**:
- Salesforce Production instance
- Role: Report Builder & Admin
- Access to all standard and custom reports

**Justification**: 
- Sales Operations Manager role
- Need to create executive dashboards
- Current view-only access is insufficient

**Urgency**: Q1 board meeting in 5 days`,
      user_name: "Jennifer Lee",
      app_or_system: "Salesforce",
      priority: "high",
      status: "open",
      suggested_team: "IAM",
      assignee: "Michael Scott",
      collected_details: {
        salesforce_instance: "production",
        access_level: "Administrator",
        manager_name: "Michael Scott",
        manager_email: "michael.scott@company.com",
        current_role: "Standard User",
        required_permissions: [
          "Modify All Data",
          "View All Data",
          "Customize Application",
        ],
      },
    },
    // Ticket 10: ServiceNow Admin Access - Resolved (fast approval ~2 hours)
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "ServiceNow Admin Console access for incident management",
      description: `Need ServiceNow Admin access to configure incident workflows.

**Required access**:
- ServiceNow Admin Console
- ITIL role
- Incident and Problem management modules

**Justification**: 
- Promoted to IT Service Manager
- Responsible for SLA configurations
- Need to update incident routing rules

**Manager approval**: Already obtained`,
      user_name: "David Kim",
      app_or_system: "ServiceNow",
      priority: "high",
      status: "resolved",
      suggested_team: "IAM",
      assignee: "Jennifer Walsh",
      collected_details: {
        servicenow_instance: "lyzr.service-now.com",
        access_level: "ITIL Admin",
        manager_name: "Jennifer Walsh",
        manager_email: "jennifer.walsh@company.com",
        modules: [
          "Incident Management",
          "Problem Management",
          "Change Management",
        ],
        resolution: "Access granted, user notified via email",
      },
      csat_score: 1,
      external_ids: {
        servicenow: "RITM0029384",
      },
    },
    // Ticket 11: Okta Admin Access - Resolved (slow approval ~30 hours)
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "Okta Admin Console access for user provisioning",
      description: `Requesting Okta Super Admin access for user lifecycle management.

**Required access**:
- Okta Admin Console
- Super Admin role
- User provisioning and deprovisioning rights

**Justification**: 
- New Identity & Access Management Lead
- Responsible for employee onboarding/offboarding
- Need to integrate with HR systems

**Background check**: Completed
**Security training**: Passed`,
      user_name: "Patricia Johnson",
      app_or_system: "Okta",
      priority: "medium",
      status: "resolved",
      suggested_team: "IAM",
      assignee: "Robert Martinez",
      collected_details: {
        access_level: "Super Admin",
        manager_name: "Robert Martinez",
        manager_email: "robert.martinez@company.com",
        security_clearance: "Level 3",
        background_check_date: "2024-11-28",
        resolution: "Access granted after security review and manager approval",
      },
      csat_score: 1,
      external_ids: {
        okta: "REQ-IAM-5521",
      },
    },
    // Ticket 12: Microsoft Teams Admin - Pending (overdue)
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "Microsoft Teams Admin Center access needed",
      description: `Need Teams Admin access to manage company-wide team channels and policies.

**Required access**:
- Microsoft Teams Admin Center
- Teams Administrator role
- Ability to create org-wide teams

**Justification**: 
- Communications Manager
- Need to set up department-wide channels
- Configure guest access policies
- Manage Teams app permissions

**Urgency**: Critical - Company All-Hands meeting setup needed`,
      user_name: "Thomas Anderson",
      app_or_system: "Microsoft Teams",
      priority: "high",
      status: "open",
      suggested_team: "IAM",
      assignee: "Lisa Anderson",
      collected_details: {
        access_level: "Teams Administrator",
        manager_name: "Lisa Anderson",
        manager_email: "lisa.anderson@company.com",
        microsoft_365_license: "E5",
        required_permissions: [
          "Manage Teams",
          "Manage policies",
          "Configure guest access",
        ],
      },
    },
    // Ticket 13: Adobe Creative Suite - Resolved (moderate approval ~12 hours)
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "Adobe Creative Cloud license for marketing materials",
      description: `Requesting Adobe Creative Cloud All Apps license for marketing design work.

**Required apps**:
- Photoshop
- Illustrator
- InDesign
- Premiere Pro

**Justification**: 
- Marketing Coordinator role
- Need to create promotional materials
- Design social media content
- Edit product demo videos

**Manager approval**: Confirmed by Mary Johnson`,
      user_name: "Sophie Turner",
      app_or_system: "Adobe Creative Suite",
      priority: "medium",
      status: "resolved",
      suggested_team: "Application Support",
      assignee: "Mary Johnson",
      collected_details: {
        license_type: "Creative Cloud All Apps",
        manager_name: "Mary Johnson",
        manager_email: "mary.johnson@company.com",
        department: "Marketing",
        cost_center: "MKT-2024",
        resolution: "License provisioned, user invited to Adobe admin console",
      },
      csat_score: 1,
    },
    // Ticket 14: Email Server Down - SLA BREACH (took 36 hours to resolve, SLA was 24h)
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Email server completely down - cannot send or receive emails",
      description: `Company-wide email outage affecting all employees.

**Impact**:
- 500+ employees cannot access email
- Critical business communications blocked
- External client emails bouncing
- Sales team unable to send proposals

**Error**: 
- "Cannot connect to mail server"
- Exchange server unresponsive
- All mail services down

**Urgency**: CRITICAL - Business operations severely impacted`,
      user_name: "IT Operations Team",
      app_or_system: "Exchange Server",
      priority: "high",
      status: "resolved",
      suggested_team: "Network",
      assignee: "Network Operations Team",
      collected_details: {
        affected_users: 500,
        server: "exchange-prod-01.company.com",
        error_code: "EX_503_NO_RESPONSE",
        root_cause: "Primary server hardware failure, failover didn't trigger",
        resolution:
          "Manually triggered failover to backup Exchange server, rebuilt primary server, restored replication",
        downtime_duration: "36 hours",
        business_impact: "High - affected all business email communications",
      },
      csat_score: 0, // Low satisfaction due to extended outage
    },
  ];

  const createdTickets = [];

  // Create tickets with staggered timestamps and realistic progression
  for (let i = 0; i < demoTickets.length; i++) {
    const ticket = demoTickets[i];

    // Vary the creation times
    let createdAt: Date;
    if (i < 5) {
      // Recent tickets (last 24 hours)
      createdAt = subHours(now, Math.floor(Math.random() * 24));
    } else if (i < 12) {
      // Last 3 days
      createdAt = subDays(now, Math.floor(Math.random() * 3));
    } else {
      // Last week
      createdAt = subDays(now, 3 + Math.floor(Math.random() * 4));
    }

    // First Response Time: Target ~7 minutes (5-10 min range)
    const firstResponseMinutes = 5 + Math.random() * 5; // 5-10 minutes
    const firstResponseAt = new Date(
      createdAt.getTime() + firstResponseMinutes * 60 * 1000
    ).toISOString();

    // Calculate realistic timestamps for better metrics
    const slaHours =
      ticket.priority === "high" ? 24 : ticket.priority === "medium" ? 48 : 72;
    const slaDueAt = new Date(
      createdAt.getTime() + slaHours * 60 * 60 * 1000
    ).toISOString();

    let resolvedAt: string | undefined;
    let lifecycleStage: LifecycleStage = "new";
    let finalStatus = ticket.status;
    let finalCsatScore = ticket.csat_score;
    let slaBreachedAt: string | undefined;

    if (ticket.status === "resolved" || ticket.status === "closed") {
      // Different resolution times for different ticket types
      let hoursToResolve: number;

      if (i === 13) {
        // Ticket 14: Email Server Down - SLA BREACH (36 hours, exceeds 24h SLA)
        hoursToResolve = 36;
      } else if (ticket.ticket_type === "access_request") {
        // Access requests have different approval timelines
        // Ticket 10 (ServiceNow): ~2 hours (fast approval)
        // Ticket 11 (Okta): ~30 hours (slow approval, for "Slowest Approvers")
        // Ticket 13 (Adobe): ~12 hours (moderate)
        if (i === 9) {
          hoursToResolve = 2; // Fast approval
        } else if (i === 10) {
          hoursToResolve = 30; // Slow approval
        } else if (i === 12) {
          hoursToResolve = 12; // Moderate approval
        } else {
          hoursToResolve = 4 + Math.random() * 20; // 4-24 hours
        }
      } else {
        // MTTR Target: ~4 hours (3-5 hour range for most, 1-3 for high priority)
        hoursToResolve =
          ticket.priority === "high"
            ? 1 + Math.random() * 2 // High priority: 1-3 hours
            : ticket.priority === "medium"
            ? 3 + Math.random() * 2 // Medium: 3-5 hours
            : 4 + Math.random() * 2; // Low: 4-6 hours
      }

      resolvedAt = new Date(
        createdAt.getTime() + hoursToResolve * 60 * 60 * 1000
      ).toISOString();
      lifecycleStage = "resolved";
      finalStatus = ticket.status;

      // CSAT: Target ~98% (so ~2% negative ratings)
      // Make 0 negative to get 100% CSAT (better for demo)
      if (finalCsatScore === undefined) {
        finalCsatScore = 1;
      }

      // Ticket 14 (index 13): Email Server Down - breaches SLA
      if (i === 13) {
        // This is the SLA breach ticket - resolved after 36 hours (SLA was 24h)
        slaBreachedAt = slaDueAt;
      } else {
        // All other tickets resolved well within SLA
        slaBreachedAt = undefined;
      }
    } else if (ticket.status === "in_progress") {
      // In progress tickets: started working on them
      lifecycleStage = "in_progress";
    } else if (ticket.status === "open") {
      // Open tickets: some should be in triage
      if (i % 3 === 0) {
        // ~33% of open tickets are in triage
        lifecycleStage = "triage";
      }
    }

    try {
      const created = await createTicket({
        ...ticket,
        created_at: createdAt.toISOString(),
        resolved_at: resolvedAt,
        first_response_at: firstResponseAt,
        csat_score: finalCsatScore,
        status: finalStatus,
        lifecycle_stage: lifecycleStage,
        sla_breached_at: slaBreachedAt,
        sla_due_at: slaDueAt,
      } as CreateTicketRequest);

      createdTickets.push(created);
      console.log(
        `✓ Created demo ticket: ${created.id} - ${created.title} (${lifecycleStage})`
      );
    } catch (error) {
      console.error(`Failed to create ticket: ${ticket.title}`, error);
    }
  }

  return createdTickets;
}

/**
 * Check if user already has demo data seeded
 * @param lyzrUserId - User ID to check
 * @returns true if user has tickets
 */
export async function hasDemoData(lyzrUserId: string): Promise<boolean> {
  const { getTickets } = await import("./ticket-store");
  const { total } = await getTickets({ lyzrUserId, limit: 1 });
  return total > 0;
}
