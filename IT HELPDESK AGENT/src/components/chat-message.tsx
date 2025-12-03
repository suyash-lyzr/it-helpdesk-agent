"use client"

import { format } from "date-fns"
import { Bot, User, Copy, Check } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { ChatMessage as ChatMessageType } from "@/lib/lyzr-api"

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback 
          className={cn(
            isUser 
              ? "bg-gradient-to-r from-[#603BFC] to-[#A94FA1] text-white" 
              : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-1",
          isUser ? "items-end max-w-[70%]" : "items-start max-w-[85%]"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-gradient-to-r from-[#603BFC] to-[#A94FA1] text-white rounded-tr-sm"
              : "bg-card border border-border text-card-foreground rounded-tl-sm shadow-sm"
          )}
        >
          {/* Message text with basic markdown-like formatting */}
          <div className="whitespace-pre-wrap break-words">
            {message.content.split('\n').map((line, i) => {
              // Handle bold text
              const formattedLine = line.replace(
                /\*\*(.*?)\*\*/g,
                '<strong>$1</strong>'
              )
              return (
                <span key={i}>
                  {i > 0 && <br />}
                  <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                </span>
              )
            })}
          </div>
        </div>

        {/* Timestamp and actions */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground px-1",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>{format(new Date(message.timestamp), "h:mm:ss a")}</span>
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

