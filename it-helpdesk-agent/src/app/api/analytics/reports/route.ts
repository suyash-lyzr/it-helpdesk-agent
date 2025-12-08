import { NextRequest, NextResponse } from "next/server";
import { getTickets } from "@/lib/ticket-store";
import {
  getKPIMetrics,
  getSLAFunnel,
  getTopIssues,
  getTeamPerformance,
} from "@/lib/analytics-store";
import { appendAuditLog } from "@/lib/analytics-store";

// In-memory scheduled reports store
const scheduledReports: Array<{
  id: string;
  name: string;
  metrics: string[];
  filters: Record<string, unknown>;
  frequency: "daily" | "weekly" | "monthly";
  recipients: string[];
  createdAt: string;
  lastRun?: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, filters, format, schedule } = body;

    const { tickets } = await getTickets();

    // Build report data based on selected metrics
    const reportData: Record<string, unknown> = {};

    if (metrics.includes("kpis")) {
      reportData.kpis = getKPIMetrics(tickets);
    }
    if (metrics.includes("sla_funnel")) {
      reportData.slaFunnel = getSLAFunnel(tickets);
    }
    if (metrics.includes("top_issues")) {
      reportData.topIssues = getTopIssues(tickets, 20);
    }
    if (metrics.includes("team_performance")) {
      reportData.teamPerformance = getTeamPerformance(tickets);
    }

    // If schedule is provided, save it
    if (schedule) {
      const scheduledReport = {
        id: `report-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: schedule.name || "Scheduled Report",
        metrics,
        filters,
        frequency: schedule.frequency || "weekly",
        recipients: schedule.recipients || [],
        createdAt: new Date().toISOString(),
      };
      scheduledReports.push(scheduledReport);
      appendAuditLog(
        "system",
        "report_scheduled",
        `Scheduled report: ${scheduledReport.name}`
      );
    }

    // Generate CSV if requested
    if (format === "csv") {
      const csv = generateCSV(reportData);
      appendAuditLog("system", "report_exported", `Report exported as CSV`);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON report
    appendAuditLog(
      "system",
      "report_generated",
      `Report generated with metrics: ${metrics.join(", ")}`
    );
    return NextResponse.json({
      success: true,
      data: reportData,
      format: format || "json",
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate report",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return scheduled reports
    return NextResponse.json({
      success: true,
      data: scheduledReports,
    });
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scheduled reports",
      },
      { status: 500 }
    );
  }
}

function generateCSV(data: Record<string, unknown>): string {
  // Simple CSV generation for demo
  const lines: string[] = [];

  if (data.kpis) {
    lines.push("Metric,Value");
    const kpis = data.kpis as Record<string, unknown>;
    lines.push(`Total Tickets,${kpis.totalTickets}`);
    lines.push(`Open,${kpis.open}`);
    lines.push(`In Progress,${kpis.inProgress}`);
    lines.push(`Resolved,${kpis.resolved}`);
    lines.push(`MTTR (hours),${kpis.mttr}`);
    lines.push(`First Response Time (hours),${kpis.firstResponseTime}`);
    lines.push(`SLA Compliance (%),${kpis.slaCompliance}`);
    lines.push(`CSAT (%),${kpis.csat}`);
  }

  return lines.join("\n");
}
