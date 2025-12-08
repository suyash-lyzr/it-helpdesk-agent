"use client"

import { Button } from "@/components/ui/button"

const suggestedQuestions = [
  "How do I set up VPN on my Mac?",
  "My VPN keeps disconnecting",
  "I need access to Jira",
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
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestedQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto min-h-[52px] py-3 px-4 text-left justify-start whitespace-normal text-sm font-medium hover:border-primary hover:bg-accent/50 transition-colors"
            onClick={() => onSelect(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  )
}

