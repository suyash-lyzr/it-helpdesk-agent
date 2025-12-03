"use client"

import { Button } from "@/components/ui/button"

const suggestedQuestions = [
  "How do I set up VPN on my Mac?",
  "My VPN keeps disconnecting",
  "I need access to Jira",
  "My laptop is running very slow",
  "How do I install Outlook?",
  "I need Figma full access for design work",
  "I forgot my password and nothing works",
  "What can you help me with?",
]

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto w-full">
      {suggestedQuestions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          className="h-auto py-3 px-4 text-left justify-start whitespace-normal text-sm font-normal hover:border-primary hover:bg-accent/50 transition-colors rounded-full"
          onClick={() => onSelect(question)}
        >
          {question}
        </Button>
      ))}
    </div>
  )
}

