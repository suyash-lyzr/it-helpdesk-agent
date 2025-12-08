"use client";

import * as React from "react";
import Image from "next/image";
import { Bot, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat-message";
import { SuggestedQuestions } from "@/components/suggested-questions";
import {
  generateSessionId,
  generateMessageId,
  LYZR_CONFIG,
  type ChatMessage as ChatMessageType,
} from "@/lib/lyzr-api";

export function ChatInterface() {
  const [messages, setMessages] = React.useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Initialize session ID on mount
  React.useEffect(() => {
    const storedSessionId = localStorage.getItem("it-helpdesk-session-id");
    const storedMessages = localStorage.getItem("it-helpdesk-messages");

    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = generateSessionId(LYZR_CONFIG.agentId);
      setSessionId(newSessionId);
      localStorage.setItem("it-helpdesk-session-id", newSessionId);
    }

    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        setMessages(
          parsed.map((m: ChatMessageType) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } catch (e) {
        console.error("Failed to parse stored messages:", e);
      }
    }
  }, []);

  // Save messages to localStorage
  React.useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("it-helpdesk-messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: generateMessageId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content.trim(),
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessageType = {
        id: generateMessageId(),
        role: "assistant",
        content:
          data.response ||
          data.message ||
          "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");

      // Remove the user message if there was an error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInputValue(content);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("it-helpdesk-messages");
    const newSessionId = generateSessionId(LYZR_CONFIG.agentId);
    setSessionId(newSessionId);
    localStorage.setItem("it-helpdesk-session-id", newSessionId);
    toast.success("Chat cleared");
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="shrink-0 flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
            <Image
              src="/lyzr_logo.png"
              alt="Lyzr Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold">IT Helpdesk AI</h1>
            <p className="text-sm text-muted-foreground">
              Your intelligent IT support assistant
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Area - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-col py-8">
              {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-12 py-12">
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden">
                      <Image
                        src="/lyzr_logo.png"
                        alt="Lyzr Logo"
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-semibold text-foreground">
                        IT Helpdesk Agent
                      </h2>
                      <p className="text-base text-muted-foreground">
                        Your intelligent IT support assistant
                      </p>
                    </div>
                  </div>
                  <SuggestedQuestions onSelect={handleSuggestedQuestion} />
                </div>
              ) : (
                <div className="flex flex-col">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 mb-6">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 mt-1">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-[#f3f4f6] dark:bg-[#1f1f1f] border border-[#e5e7eb] dark:border-[#374151] px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-base text-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="shrink-0 border-t bg-background px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question..."
              className="min-h-[52px] max-h-32 resize-none pr-14 rounded-xl border-border text-base"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="absolute right-2 bottom-2 h-9 w-9"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
