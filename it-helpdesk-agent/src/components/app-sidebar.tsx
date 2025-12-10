"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Bot,
  Ticket,
  FileText,
  Settings,
  LogOut,
  Puzzle,
  CalendarDays,
} from "lucide-react";

import { useAuth } from "@/lib/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navMain = [
  {
    title: "AI Assistant",
    icon: Bot,
    url: "/",
  },
  {
    title: "Tickets",
    icon: Ticket,
    url: "/tickets",
  },
  {
    title: "Integrations",
    icon: Puzzle,
    url: "/integrations",
  },
  {
    title: "Knowledge Base",
    icon: FileText,
    url: "/knowledge-base",
  },
];

// Removed navSecondary - Settings and Help buttons

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { email, displayName, logout } = useAuth();

  // Get user initials for avatar
  const userInitials = React.useMemo(() => {
    if (!displayName) return "U";
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [displayName]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="relative flex flex-col gap-2 p-2">
        {/* Expand/Collapse trigger - top-left when collapsed, top-right when expanded */}
        <div className="absolute top-2 right-2 z-10 group-data-[state=collapsed]:relative group-data-[state=collapsed]:top-0 group-data-[state=collapsed]:right-auto group-data-[state=collapsed]:left-0 group-data-[state=collapsed]:self-start group-data-[state=collapsed]:z-auto">
          <SidebarTrigger className="h-7 w-7 rounded-md bg-transparent hover:bg-muted/40" />
        </div>
        {/* Logo and text - below trigger when collapsed */}
        <SidebarMenu className="group-data-[state=collapsed]:mt-0 relative z-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-1.5 group-data-[state=collapsed]:!p-2 group-data-[state=collapsed]:justify-center relative z-0"
            >
              <a href="/">
                <div className="flex items-center gap-2 group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                    <Image
                      src="/lyzr_logo.png"
                      alt="Lyzr Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col group-data-[state=collapsed]:hidden">
                    <span className="text-sm font-semibold">IT Helpdesk</span>
                    <span className="text-xs text-muted-foreground">Agent</span>
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>APPLICATION</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => {
                const isActive = pathname === item.url;
                const isDisabled = "disabled" in item && Boolean(item.disabled);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={!isDisabled}
                      isActive={isActive}
                      tooltip={item.title}
                      disabled={isDisabled}
                      className={
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
                    >
                      {isDisabled ? (
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            Soon
                          </span>
                        </span>
                      ) : (
                        <a href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Book Demo">
                  <a
                    href="https://www.lyzr.ai/book-demo/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>Book Demo</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt={displayName || "User"} />
                    <AvatarFallback className="rounded-lg bg-[#603BFC] text-white text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {displayName || "User"}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {email || ""}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="" alt={displayName || "User"} />
                      <AvatarFallback className="rounded-lg bg-gradient-to-r from-[#603BFC] to-[#A94FA1] text-white text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {displayName || "User"}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {email || ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
