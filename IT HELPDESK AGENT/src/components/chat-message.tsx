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
        "group flex gap-3 mb-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarFallback 
          className={cn(
            "border-0",
            isUser 
              ? "bg-[#603BFC] text-white" 
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-1.5",
          isUser ? "items-end max-w-[75%]" : "items-start max-w-[80%]"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-base leading-relaxed break-words",
            isUser
              ? "bg-[#603BFC] text-white rounded-tr-sm shadow-sm"
              : "bg-[#f3f4f6] dark:bg-[#1f1f1f] border border-[#e5e7eb] dark:border-[#374151] text-foreground rounded-tl-sm"
          )}
        >
          {/* Message text with markdown-like formatting */}
          <div className="whitespace-pre-wrap">
            {message.content.split('\n').map((line, i) => {
              // Handle bold text
              const formattedLine = line.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="font-semibold">$1</strong>'
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

        {/* Timestamp */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground px-1",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>{format(new Date(message.timestamp), "h:mm:ss a")}</span>
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent"
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

