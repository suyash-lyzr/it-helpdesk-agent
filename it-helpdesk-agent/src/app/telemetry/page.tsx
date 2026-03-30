import { AppSidebar } from "@/components/app-sidebar";
import { TelemetryDashboard } from "@/components/telemetry-dashboard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function TelemetryPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen overflow-auto">
        <TelemetryDashboard />
      </SidebarInset>
    </SidebarProvider>
  );
}
