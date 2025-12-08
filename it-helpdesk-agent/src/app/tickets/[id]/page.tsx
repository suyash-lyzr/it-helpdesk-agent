"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  User,
  Bot,
  Shield,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Ticket } from "@/lib/ticket-types";
import { TicketMessage } from "@/lib/ticket-message-types";

// Status colors
const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200",
  open: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200",
  resolved:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200",
  closed:
    "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200",
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [messages, setMessages] = React.useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [messageText, setMessageText] = React.useState("");
  const [isInternalNote, setIsInternalNote] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch ticket details and messages
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [ticketRes, messagesRes] = await Promise.all([
        fetch(`/api/tickets/${ticketId}`),
        fetch(`/api/tickets/${ticketId}/messages`),
      ]);

      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        if (ticketData.success) {
          setTicket(ticketData.data);
        }
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        if (messagesData.success) {
          setMessages(messagesData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching ticket data:", error);
      toast.error("Failed to load ticket details");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (resolveTicket = false) => {
    if (!messageText.trim()) {
      toast.info("Please enter a message");
      return;
    }

    setIsSending(true);
    try {
      // Send the message
      const messageRes = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: messageText.trim(),
          author_type: "agent",
          author_name: "Admin",
          is_internal_note: isInternalNote,
        }),
      });

      if (!messageRes.ok) {
        throw new Error("Failed to send message");
      }

      const messageData = await messageRes.json();
      if (messageData.success) {
        // Add message to local state
        setMessages((prev) => [...prev, messageData.data]);
        setMessageText("");
        setIsInternalNote(false);
        toast.success("Message sent");

        // If resolving, update the ticket status
        if (resolveTicket && ticket) {
          const updateRes = await fetch(`/api/tickets/${ticketId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "resolved",
              resolved_at: new Date().toISOString(),
              collected_details: {
                ...(ticket.collected_details || {}),
                resolution: messageText.trim(),
              },
            }),
          });

          if (updateRes.ok) {
            const updateData = await updateRes.json();
            if (updateData.success) {
              setTicket(updateData.data);
              toast.success(`Ticket ${ticketId} marked as resolved`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const getAuthorIcon = (authorType: string) => {
    switch (authorType) {
      case "user":
        return <User className="h-4 w-4" />;
      case "agent":
        return <Shield className="h-4 w-4" />;
      case "ai":
        return <Bot className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getMessageBubbleStyle = (authorType: string, isInternal: boolean) => {
    if (isInternal) {
      return "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800";
    }
    switch (authorType) {
      case "user":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800";
      case "agent":
        return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800";
      case "ai":
        return "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800";
      default:
        return "bg-muted border-border";
    }
  };

  const handleRatingSubmit = async (rating: 0 | 1) => {
    if (
      !ticket ||
      (ticket.status !== "resolved" && ticket.status !== "closed")
    ) {
      return;
    }

    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csat_score: rating,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      const data = await response.json();
      if (data.success) {
        setTicket(data.data);
        toast.success(
          rating === 1
            ? "Thank you for your positive feedback!"
            : "We appreciate your feedback and will work to improve."
        );
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button onClick={() => router.push("/tickets")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/tickets")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-xs">
                  {ticket.id}
                </Badge>
                <Badge
                  variant="outline"
                  className={statusColors[ticket.status]}
                >
                  {ticket.status.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge
                  variant="outline"
                  className={priorityColors[ticket.priority]}
                >
                  {ticket.priority.toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-xl font-semibold">{ticket.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 2 columns */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full flex gap-4 p-4">
          {/* Left: Conversation */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Ticket description as first message */}
                <div
                  className={`p-4 rounded-lg border ${getMessageBubbleStyle(
                    "user",
                    false
                  )}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getAuthorIcon("user")}
                    <span className="font-medium text-sm">
                      {ticket.user_name || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ticket.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>

                {/* Conversation messages */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border ${getMessageBubbleStyle(
                      message.author_type,
                      message.is_internal_note
                    )}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getAuthorIcon(message.author_type)}
                      <span className="font-medium text-sm">
                        {message.author_name || message.author_type}
                      </span>
                      {message.is_internal_note && (
                        <Badge variant="secondary" className="text-xs">
                          Internal Note
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.body}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>

            {/* Composer */}
            <Card className="mt-4">
              <CardContent className="p-4 space-y-3">
                <Textarea
                  placeholder="Write your reply or internal note..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  disabled={isSending || ticket.status === "resolved"}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="internal-note"
                      checked={isInternalNote}
                      onCheckedChange={(checked) =>
                        setIsInternalNote(checked as boolean)
                      }
                      disabled={isSending}
                    />
                    <label
                      htmlFor="internal-note"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Internal note (not visible to user)
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSendMessage(false)}
                      disabled={
                        isSending ||
                        !messageText.trim() ||
                        ticket.status === "resolved"
                      }
                      variant="outline"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                    <Button
                      onClick={() => handleSendMessage(true)}
                      disabled={
                        isSending ||
                        !messageText.trim() ||
                        ticket.status === "resolved"
                      }
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Send & Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Ticket Metadata */}
          <Card className="w-80 overflow-y-auto">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Ticket Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Type</p>
                    <p className="font-medium capitalize">
                      {ticket.ticket_type.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Application / System
                    </p>
                    <p className="font-medium">{ticket.app_or_system}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Team</p>
                    <p className="font-medium">{ticket.suggested_team}</p>
                  </div>
                  {ticket.assignee && (
                    <div>
                      <p className="text-muted-foreground text-xs">Assignee</p>
                      <p className="font-medium">{ticket.assignee}</p>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="font-medium">
                      {format(
                        new Date(ticket.created_at),
                        "MMM d, yyyy • h:mm a"
                      )}
                    </p>
                  </div>
                  {ticket.resolved_at && (
                    <div>
                      <p className="text-muted-foreground text-xs">Resolved</p>
                      <p className="font-medium">
                        {format(
                          new Date(ticket.resolved_at),
                          "MMM d, yyyy • h:mm a"
                        )}
                      </p>
                    </div>
                  )}
                  {ticket.sla_due_at && (
                    <div>
                      <p className="text-muted-foreground text-xs">SLA Due</p>
                      <p className="font-medium">
                        {format(
                          new Date(ticket.sla_due_at),
                          "MMM d, yyyy • h:mm a"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CSAT Rating Section - Only show for resolved/closed tickets */}
              {(ticket.status === "resolved" || ticket.status === "closed") && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Rate Your Experience</h3>
                  {ticket.csat_score !== undefined ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {ticket.csat_score === 1 ? (
                          <>
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">
                              You rated this ticket positively
                            </span>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                            <span className="text-muted-foreground">
                              You rated this ticket negatively
                            </span>
                          </>
                        )}
                      </div>
                      {ticket.csat_submitted_at && (
                        <p className="text-xs text-muted-foreground">
                          Rated on{" "}
                          {format(
                            new Date(ticket.csat_submitted_at),
                            "MMM d, yyyy • h:mm a"
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        How satisfied were you with the resolution?
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRatingSubmit(1)}
                          disabled={isSubmittingRating}
                          className="h-10 w-10"
                          title="Thumbs Up"
                        >
                          <ThumbsUp className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRatingSubmit(0)}
                          disabled={isSubmittingRating}
                          className="h-10 w-10"
                          title="Thumbs Down"
                        >
                          <ThumbsDown className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
