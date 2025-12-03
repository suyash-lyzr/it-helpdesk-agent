import { AppSidebar } from "@/components/app-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Home() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen overflow-hidden">
        <ChatInterface />
      </SidebarInset>
    </SidebarProvider>
  )
}

