"use client";

import React, { useEffect, useRef } from "react";
import { Bot, Sparkles } from "lucide-react";
import { ExtendedMessage } from "@/types/chat";
import { StreamingMessage } from "@/components/streaming-message";

interface MessageListProps {
  messages: ExtendedMessage[];
  emptyTitle: string;
  emptySubtitle: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  emptyTitle,
  emptySubtitle,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
        <div className="w-16 h-16 2xl:w-20 2xl:h-20 rounded-2xl bg-blue-50 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-indigo-500/20 border border-blue-200 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 mb-5 shadow-md shadow-blue-500/10">
          <Bot className="w-8 h-8 2xl:w-10 2xl:h-10" />
        </div>
        <h3 className="text-xl 2xl:text-3xl font-bold text-slate-900 dark:text-slate-100">{emptyTitle}</h3>
        <p className="text-sm 2xl:text-base text-slate-600 dark:text-slate-400 max-w-lg mt-2 leading-relaxed">{emptySubtitle}</p>
        <div className="mt-5 flex items-center gap-2 text-xs 2xl:text-sm text-blue-600 dark:text-cyan-400 font-mono font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Select a quick prompt below or type your question</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 md:px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <StreamingMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
