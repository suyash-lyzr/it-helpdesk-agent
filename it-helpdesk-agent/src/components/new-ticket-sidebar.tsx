"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { TicketType, TicketPriority, SuggestedTeam } from "@/lib/ticket-types";

interface NewTicketSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketCreated?: () => void;
}

export function NewTicketSidebar({
  open,
  onOpenChange,
  onTicketCreated,
}: NewTicketSidebarProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    ticket_type: "incident" as TicketType,
    priority: "medium" as TicketPriority,
    suggested_team: "Application Support" as SuggestedTeam,
    app_or_system: "",
    user_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_type: formData.ticket_type,
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          suggested_team: formData.suggested_team,
          app_or_system: formData.app_or_system.trim() || undefined,
          user_name: formData.user_name.trim() || undefined,
          source: "manual",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create ticket");
      }

      toast.success(`Ticket ${data.data.id} created successfully`);

      // Reset form
      setFormData({
        title: "",
        description: "",
        ticket_type: "incident",
        priority: "medium",
        suggested_team: "Application Support",
        app_or_system: "",
        user_name: "",
      });

      onOpenChange(false);
      onTicketCreated?.();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create ticket. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="text-xl font-semibold">
              Create New Ticket
            </SheetTitle>
            <SheetDescription className="text-sm">
              Fill in the details below to create a new support request for the
              IT team.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-5 rounded-2xl border bg-card/80 p-4 shadow-xs">
                {/* Ticket basics */}
                <div className="space-y-3">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="description">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed information about the issue, impact, and any troubleshooting already done."
                      rows={10}
                      className="min-h-[15rem] [field-sizing:auto]"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Structured fields */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Ticket Type */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket_type">Type</Label>
                    <Select
                      value={formData.ticket_type}
                      onValueChange={(value: TicketType) =>
                        setFormData({ ...formData, ticket_type: value })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="ticket_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="access_request">
                          Access Request
                        </SelectItem>
                        <SelectItem value="request">Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: TicketPriority) =>
                        setFormData({ ...formData, priority: value })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Suggested Team */}
                  <div className="space-y-1.5">
                    <Label htmlFor="suggested_team">Assigned Team</Label>
                    <Select
                      value={formData.suggested_team}
                      onValueChange={(value: SuggestedTeam) =>
                        setFormData({ ...formData, suggested_team: value })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="suggested_team">
                        <SelectValue placeholder="Choose a team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Endpoint Support">
                          Endpoint Support
                        </SelectItem>
                        <SelectItem value="Application Support">
                          Application Support
                        </SelectItem>
                        <SelectItem value="IAM">IAM</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Application/System */}
                  <div className="space-y-1.5">
                    <Label htmlFor="app_or_system">Application / System</Label>
                    <Input
                      id="app_or_system"
                      placeholder="e.g., VPN, Email, Laptop"
                      value={formData.app_or_system}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          app_or_system: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* User Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="user_name">Requester Name</Label>
                    <Input
                      id="user_name"
                      placeholder="Name of the person requesting support"
                      value={formData.user_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          user_name: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t bg-background px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
