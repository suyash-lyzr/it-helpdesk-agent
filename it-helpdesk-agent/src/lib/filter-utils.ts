import { Ticket } from "./ticket-types";

export interface AnalyticsFilters {
  team?: string;
  priority?: string;
  category?: string;
  assignee?: string;
  slaStatus?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
}

export function applyTicketFilters(
  tickets: Ticket[],
  filters: AnalyticsFilters
): Ticket[] {
  return tickets.filter((t) => {
    // Team filter
    if (
      filters.team &&
      filters.team !== "all" &&
      t.suggested_team !== filters.team
    ) {
      return false;
    }

    // Priority filter
    if (
      filters.priority &&
      filters.priority !== "all" &&
      t.priority !== filters.priority
    ) {
      return false;
    }

    // Category filter
    if (
      filters.category &&
      filters.category !== "all" &&
      t.ticket_type !== filters.category
    ) {
      return false;
    }

    // Source filter
    if (
      filters.source &&
      filters.source !== "all" &&
      t.source !== filters.source
    ) {
      return false;
    }

    // Assignee filter
    if (filters.assignee && filters.assignee !== "all") {
      if (!t.assignee || t.assignee !== filters.assignee) return false;
    }

    // SLA Status filter
    if (filters.slaStatus && filters.slaStatus !== "all") {
      const now = new Date();
      const slaDueDate = t.sla_due_at ? new Date(t.sla_due_at) : null;
      const isResolved = t.status === "resolved" || t.status === "closed";

      if (filters.slaStatus === "meeting") {
        // Meeting SLA: resolved before SLA due date, or not yet breached
        if (isResolved) {
          if (!slaDueDate || !t.resolved_at) return false;
          const resolvedDate = new Date(t.resolved_at);
          if (resolvedDate > slaDueDate) return false; // Was breached
        } else {
          if (!slaDueDate || now > slaDueDate) return false; // Currently breached
        }
      } else if (filters.slaStatus === "breached") {
        // Breached: resolved after SLA due date, or currently breached
        if (!slaDueDate) return false;
        if (isResolved) {
          if (!t.resolved_at) return false;
          const resolvedDate = new Date(t.resolved_at);
          if (resolvedDate <= slaDueDate) return false; // Didn't breach
        } else {
          if (now <= slaDueDate) return false; // Not breached yet
        }
      } else if (filters.slaStatus === "at_risk") {
        // At risk: unresolved and within 25% of SLA deadline
        if (isResolved || !slaDueDate) return false;
        const createdDate = new Date(t.created_at);
        const totalTime = slaDueDate.getTime() - createdDate.getTime();
        const elapsed = now.getTime() - createdDate.getTime();
        const percentElapsed = (elapsed / totalTime) * 100;
        if (percentElapsed < 75 || now > slaDueDate) return false; // Not at risk or already breached
      }
    }

    // Date range filter
    if (filters.startDate) {
      const created = new Date(t.created_at);
      if (created < filters.startDate) return false;
    }
    if (filters.endDate) {
      const created = new Date(t.created_at);
      if (created > filters.endDate) return false;
    }

    return true;
  });
}
