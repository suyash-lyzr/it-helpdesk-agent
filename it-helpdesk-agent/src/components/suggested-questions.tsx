"use client";

import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const suggestedQuestions = [
  "How do I set up VPN on my Mac?",
  "My VPN keeps disconnecting",
  "I need access to Jira",
  "How do I install Outlook?",
  "I need Figma full access for design work",
  "I forgot my password and nothing works",
  "What can you help me with?",
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-wrap justify-center gap-3">
        {suggestedQuestions.map((question, index) => (
          <button
            key={index}
            className="h-auto py-2.5 px-5 rounded-full bg-primary/10 dark:bg-primary/15 hover:bg-primary/15 dark:hover:bg-primary/20 text-primary dark:text-primary border-0 font-normal text-sm transition-colors flex items-center gap-2 cursor-pointer"
            onClick={() => onSelect(question)}
          >
            <ArrowUpRight className="h-4 w-4 shrink-0" />
            <span className="whitespace-normal text-center">{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
