// Seed demo data for demo accounts
// Generates realistic dummy tickets for demo and video purposes

import { createTicket } from "./ticket-store";
import { CreateTicketRequest, LifecycleStage } from "./ticket-types";
import { subDays, subHours } from "date-fns";

/**
 * Generate diverse dummy tickets for demo purposes
 * Creates 20 tickets with varied types, priorities, statuses, and teams
 * @param lyzrUserId - User ID to associate tickets with
 * @returns Array of created tickets
 */
export async function seedDemoTickets(lyzrUserId: string) {
  const now = new Date();

  const demoTickets: CreateTicketRequest[] = [
    // Recent high-priority incidents
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "VPN Connection Failing for Remote Workers",
      description: `Multiple users reporting VPN connection failures when trying to access company resources remotely.

Error message: "Connection timeout - Unable to establish secure tunnel"

**Impact**: 
- 15+ users affected
- Unable to access internal applications
- Blocking critical project work

**Troubleshooting done**:
- Verified internet connectivity
- Restarted VPN client
- Checked firewall settings`,
      user_name: "Sarah Chen",
      app_or_system: "VPN",
      priority: "high",
      status: "open",
      suggested_team: "Network",
      collected_details: {
        error_code: "VPN_TIMEOUT_001",
        affected_users: 15,
        region: "US-West",
        vpn_client_version: "8.2.1",
      },
    },
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Email Service Down - Cannot Send or Receive",
      description: `Outlook is not sending or receiving emails. Mail stuck in outbox.

**Symptoms**:
- Emails stuck in Outbox
- "Cannot connect to mail server" error
- Last successful sync: 2 hours ago

**Business Impact**: High - Unable to communicate with clients`,
      user_name: "Michael Rodriguez",
      app_or_system: "Outlook",
      priority: "high",
      status: "in_progress",
      suggested_team: "Application Support",
      collected_details: {
        last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        mailbox_size: "4.2 GB",
        outlook_version: "16.0.14326",
      },
    },
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Laptop Running Extremely Slow After Update",
      description: `Laptop performance degraded significantly after Windows update installed last night.

**Issues**:
- Applications take 5+ minutes to launch
- System freezes frequently
- CPU usage constantly at 90-100%

**Device**: Dell Latitude 5520
**Update installed**: Windows 11 22H2`,
      user_name: "Jennifer Park",
      app_or_system: "Laptop",
      priority: "medium",
      status: "open",
      suggested_team: "Endpoint Support",
      collected_details: {
        device_model: "Dell Latitude 5520",
        os_version: "Windows 11 22H2",
        ram: "16GB",
        cpu_usage_avg: "95%",
      },
    },

    // Access Requests
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "Access Request: Salesforce Admin Access",
      description: `Requesting admin access to Salesforce for new role as Sales Operations Manager.

**Justification**:
- Need to manage user permissions
- Configure sales workflows
- Generate custom reports
- Approved by: Mary Johnson (VP Sales)

**Duration**: Permanent access`,
      user_name: "David Kim",
      app_or_system: "Salesforce",
      priority: "medium",
      status: "open",
      suggested_team: "IAM",
      collected_details: {
        access_level: "Admin",
        justification: "New role - Sales Operations Manager",
        manager_name: "Mary Johnson",
        manager_email: "mary.johnson@company.com",
        duration: "permanent",
      },
    },
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "Access Request: HR Shared Drive",
      description: `Need access to HR shared drive for onboarding documentation.

**Required folders**:
- Employee Handbooks
- Onboarding Templates
- Policy Documents

**Reason**: Starting as HR Coordinator next week
**Manager approval**: Received from Lisa Anderson`,
      user_name: "Emma Watson",
      app_or_system: "Shared Drive",
      priority: "low",
      status: "resolved",
      suggested_team: "IAM",
      collected_details: {
        folder_path: "/HR/Onboarding",
        access_level: "Read/Write",
        manager_name: "Lisa Anderson",
        start_date: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    },
    {
      lyzrUserId,
      ticket_type: "access_request",
      title: "MFA Reset Required - Lost Phone",
      description: `Lost my phone with authenticator app. Need MFA reset to access company accounts.

**Verification completed**:
- Manager confirmed identity via video call
- Provided backup codes
- Security questions answered

**Urgency**: High - Cannot access critical systems`,
      user_name: "Robert Taylor",
      app_or_system: "Okta",
      priority: "high",
      status: "resolved",
      suggested_team: "IAM",
      collected_details: {
        verification_method: "Manager video call",
        manager_name: "Patricia Lee",
        identity_verified: true,
        new_device: "iPhone 14 Pro",
      },
    },

    // Service Requests
    {
      lyzrUserId,
      ticket_type: "request",
      title: "New Laptop Request for New Hire",
      description: `Requesting new laptop setup for incoming Software Engineer.

**Specifications needed**:
- MacBook Pro 16" M2
- 32GB RAM
- 1TB SSD
- External monitor (27")

**Start date**: Next Monday
**Department**: Engineering
**Cost center**: ENG-2024-Q1`,
      user_name: "Thomas Anderson",
      app_or_system: "Laptop",
      priority: "medium",
      status: "in_progress",
      suggested_team: "Endpoint Support",
      collected_details: {
        employee_name: "Alex Martinez",
        department: "Engineering",
        start_date: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cost_center: "ENG-2024-Q1",
        equipment: "MacBook Pro 16, M2, 32GB RAM, 1TB SSD",
      },
    },
    {
      lyzrUserId,
      ticket_type: "request",
      title: "Software Installation: Adobe Creative Suite",
      description: `Need Adobe Creative Suite installed on my work laptop for marketing materials.

**Applications required**:
- Photoshop
- Illustrator
- InDesign
- Premiere Pro

**License**: Have existing company license
**Urgency**: Needed for campaign launch next week`,
      user_name: "Olivia Martinez",
      app_or_system: "Adobe Creative Suite",
      priority: "medium",
      status: "resolved",
      suggested_team: "Application Support",
      collected_details: {
        license_available: true,
        department: "Marketing",
        business_justification: "Campaign material creation",
      },
    },
    {
      lyzrUserId,
      ticket_type: "request",
      title: "Conference Room AV Setup Not Working",
      description: `Conference room B video conferencing system is not functioning.

**Issues**:
- Monitor not displaying
- Microphone not picking up audio
- Camera showing "No Signal"

**Impact**: Important client meeting scheduled in 2 hours
**Room**: Building A, Floor 3, Conference Room B`,
      user_name: "James Wilson",
      app_or_system: "Conference Room AV",
      priority: "high",
      status: "resolved",
      suggested_team: "Endpoint Support",
      collected_details: {
        room_location: "Building A, Floor 3, Conf Room B",
        equipment: "Zoom Room System",
        meeting_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    },

    // Resolved tickets with CSAT scores
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Cannot Access Shared Network Drive",
      description: `Getting "Access Denied" error when trying to open shared network drive.

**Drive**: \\\\fileserver\\projects
**Error**: Windows Error 0x80070005

User has been able to access this drive previously.`,
      user_name: "Linda Brown",
      app_or_system: "Network Drive",
      priority: "medium",
      status: "resolved",
      suggested_team: "Network",
      collected_details: {
        drive_path: "\\\\fileserver\\projects",
        error_code: "0x80070005",
        resolution:
          "Reset permissions and verified Active Directory group membership",
      },
      csat_score: 1,
    },
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Printer Offline in Marketing Department",
      description: `Marketing department printer showing as offline. Cannot print documents.

**Printer**: HP LaserJet Pro MFP M428fdw
**Location**: Floor 2, Marketing Area
**Network**: Connected via WiFi`,
      user_name: "Amanda White",
      app_or_system: "Printer",
      priority: "low",
      status: "resolved",
      suggested_team: "Endpoint Support",
      collected_details: {
        printer_model: "HP LaserJet Pro MFP M428fdw",
        location: "Floor 2, Marketing",
        resolution: "Restarted printer and updated drivers",
      },
      csat_score: 1,
    },
    {
      lyzrUserId,
      ticket_type: "request",
      title: "Password Reset - Account Locked",
      description: `Account locked after too many failed login attempts. Need password reset.

**Username**: john.smith@company.com
**Last successful login**: Yesterday 5:30 PM`,
      user_name: "John Smith",
      app_or_system: "Active Directory",
      priority: "high",
      status: "resolved",
      suggested_team: "IAM",
      collected_details: {
        username: "john.smith@company.com",
        lock_reason: "Multiple failed login attempts",
        resolution: "Account unlocked and password reset link sent",
      },
      csat_score: 1,
    },

    // More diverse tickets
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Jira Dashboard Not Loading",
      description: `Jira dashboard stuck on loading screen for past hour.

**Browser**: Chrome (latest version)
**Issue**: Dashboard shows infinite loading spinner
**Tried**: Clearing cache, different browser, incognito mode`,
      user_name: "Kevin Zhang",
      app_or_system: "Jira",
      priority: "medium",
      status: "resolved",
      suggested_team: "Application Support",
      collected_details: {
        browser: "Chrome 119",
        dashboard: "Engineering Sprint Board",
        error_in_console: "API timeout",
        resolution: "Cleared browser cache and restarted Jira service",
      },
    },
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Zoom Meetings Audio Echoing",
      description: `Experiencing severe audio echo in all Zoom meetings.

**Issue**: Other participants hear echo of their own voice
**Setup**: Using laptop microphone and speakers
**Impact**: Cannot conduct meetings effectively`,
      user_name: "Rachel Green",
      app_or_system: "Zoom",
      priority: "medium",
      status: "resolved",
      suggested_team: "Application Support",
      collected_details: {
        zoom_version: "5.16.5",
        audio_device: "Built-in laptop audio",
        resolution: "Configured audio settings and recommended headset use",
      },
    },
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Security Alert: Suspicious Login Attempt",
      description: `Received security alert about login attempt from unfamiliar location.

**Details**:
- Location: Moscow, Russia
- Time: 3:47 AM local time
- Device: Unknown Windows PC

I was not trying to log in at this time. Account may be compromised.`,
      user_name: "Daniel Cooper",
      app_or_system: "Okta",
      priority: "high",
      status: "in_progress",
      suggested_team: "Security",
      collected_details: {
        suspicious_location: "Moscow, Russia",
        attempt_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        action_taken: "Account temporarily locked, investigation ongoing",
      },
    },
    {
      lyzrUserId,
      ticket_type: "request",
      title: "MS Teams Not Syncing Messages",
      description: `Teams messages not syncing across devices.

**Issue**:
- Messages sent from desktop not appearing on mobile
- Notification delays of 10+ minutes
- Some channels not updating at all

**Started**: This morning after network maintenance`,
      user_name: "Michelle Lee",
      app_or_system: "Microsoft Teams",
      priority: "low",
      status: "resolved",
      suggested_team: "Application Support",
      collected_details: {
        teams_version_desktop: "1.6.00.4472",
        teams_version_mobile: "iOS 5.8.0",
        issue_start: "After network maintenance",
        resolution: "Cleared Teams cache and re-synced account",
      },
    },
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "Production Server CPU at 100%",
      description: `Production application server showing sustained 100% CPU usage.

**Impact**: 
- Application response times degraded
- User complaints of slow performance
- Risk of service outage

**Server**: prod-app-server-03
**Monitoring**: CloudWatch alerts triggered`,
      user_name: "Alex Johnson",
      app_or_system: "Production Server",
      priority: "high",
      status: "in_progress",
      suggested_team: "DevOps",
      collected_details: {
        server_id: "prod-app-server-03",
        cpu_usage: "100%",
        memory_usage: "87%",
        suspected_cause: "Memory leak in background job",
      },
    },
    {
      lyzrUserId,
      ticket_type: "request",
      title: "External Monitor Not Detected",
      description: `Laptop not detecting external monitor when connected via USB-C.

**Monitor**: Dell UltraSharp U2720Q
**Connection**: USB-C to USB-C cable
**Laptop**: MacBook Pro M1

Monitor works with other laptops, so cable and monitor are functioning.`,
      user_name: "Christopher Davis",
      app_or_system: "Monitor",
      priority: "low",
      status: "resolved",
      suggested_team: "Endpoint Support",
      collected_details: {
        monitor_model: "Dell UltraSharp U2720Q",
        laptop_model: "MacBook Pro M1",
        resolution: "Reset SMC and NVRAM, monitor detected successfully",
      },
      csat_score: 1,
    },
    {
      lyzrUserId,
      ticket_type: "incident",
      title: "WiFi Disconnecting Every Few Minutes",
      description: `Office WiFi keeps disconnecting every 5-10 minutes.

**Symptoms**:
- Connection drops randomly
- Have to manually reconnect
- Affects all apps and services

**Location**: Floor 4, west wing
**Network**: Company-Secure`,
      user_name: "Sophia Miller",
      app_or_system: "WiFi",
      priority: "medium",
      status: "in_progress",
      suggested_team: "Network",
      collected_details: {
        location: "Floor 4, west wing",
        network_ssid: "Company-Secure",
        access_point: "AP-04-W12",
      },
    },
    {
      lyzrUserId,
      ticket_type: "request",
      title: "Request: Increase Google Drive Storage",
      description: `Running out of Google Drive storage space. Need increase from 100GB to 500GB.

**Current usage**: 98GB / 100GB
**Reason**: Store large video files for marketing campaigns
**Manager approval**: Received`,
      user_name: "Brian Thompson",
      app_or_system: "Google Drive",
      priority: "low",
      status: "resolved",
      suggested_team: "Application Support",
      collected_details: {
        current_storage: "100GB",
        requested_storage: "500GB",
        usage: "98GB",
        manager_approval: true,
      },
      csat_score: 1,
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
    let resolvedAt: string | undefined;
    let lifecycleStage: LifecycleStage = "new";
    let finalStatus = ticket.status;
    let finalCsatScore = ticket.csat_score;
    let slaBreachedAt: string | undefined;

    if (ticket.status === "resolved" || ticket.status === "closed") {
      // MTTR Target: ~4 hours (3-5 hour range for most, 1-3 for high priority)
      const hoursToResolve =
        ticket.priority === "high"
          ? 1 + Math.random() * 2 // High priority: 1-3 hours
          : ticket.priority === "medium"
          ? 3 + Math.random() * 2 // Medium: 3-5 hours
          : 4 + Math.random() * 2; // Low: 4-6 hours

      resolvedAt = new Date(
        createdAt.getTime() + hoursToResolve * 60 * 60 * 1000
      ).toISOString();
      lifecycleStage = "resolved";
      finalStatus = ticket.status;

      // CSAT: Target ~98% (so ~2% negative ratings)
      // Out of 8 resolved tickets, make 1 have negative CSAT
      if (i % 8 === 0 && finalCsatScore === undefined) {
        // ~12.5% chance of negative CSAT to get ~98% overall
        finalCsatScore = 0;
      } else if (finalCsatScore === undefined) {
        finalCsatScore = 1;
      }

      // SLA Compliance: Target ~97% (so ~3% should breach)
      const slaHours =
        ticket.priority === "high"
          ? 24
          : ticket.priority === "medium"
          ? 48
          : 72;
      const slaDueAt = new Date(
        createdAt.getTime() + slaHours * 60 * 60 * 1000
      );
      const resolvedDate = new Date(resolvedAt);

      // Make ~3% of resolved tickets breach SLA
      if (
        (i % 30 === 0 || (i % 15 === 0 && ticket.priority === "high")) &&
        resolvedDate > slaDueAt
      ) {
        slaBreachedAt = slaDueAt.toISOString();
        // If breached, might affect CSAT
        if (finalCsatScore === undefined) {
          finalCsatScore = Math.random() > 0.3 ? 1 : 0; // 70% chance of positive even if breached
        }
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
