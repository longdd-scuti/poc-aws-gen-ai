"use client";

import React from "react";
import { Bot, User, AlertCircle } from "lucide-react";
import { ExtendedMessage } from "@/types/chat";
import { RoutingTelemetryCard } from "@/components/routing-telemetry";
import { SourceList } from "@/components/source-list";

interface StreamingMessageProps {
  message: ExtendedMessage;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-5 animate-fadeIn">
        <div className="max-w-[85%] md:max-w-[75%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3.5 shadow-md shadow-blue-500/10">
          <div className="flex items-center gap-1.5 text-xs 2xl:text-sm font-medium text-blue-100 mb-1">
            <User className="w-3.5 h-3.5" />
            <span>User</span>
          </div>
          <p className="whitespace-pre-wrap text-base 2xl:text-lg leading-relaxed text-white font-sans">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start mb-6 animate-fadeIn">
      <div className="w-full max-w-[95%] md:max-w-[90%] rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm dark:shadow-lg backdrop-blur-sm transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 2xl:w-8 2xl:h-8 rounded-full bg-blue-50 dark:bg-cyan-500/20 border border-blue-200 dark:border-cyan-500/40 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <Bot className="w-4 h-4 2xl:w-5 2xl:h-5" />
            </div>
            <span className="font-semibold text-sm 2xl:text-base text-slate-900 dark:text-slate-200 tracking-wide">
              AWS Bedrock Assistant
            </span>
          </div>
          {message.isStreaming && (
            <span className="text-xs 2xl:text-sm text-blue-600 dark:text-cyan-400 flex items-center gap-1.5 animate-pulse font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400 inline-block"></span>
              Streaming...
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="prose prose-slate dark:prose-invert prose-base 2xl:prose-lg max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
          {message.content ? (
            <div className="whitespace-pre-wrap text-base 2xl:text-lg leading-relaxed">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block text-blue-600 dark:text-cyan-400 font-mono font-bold animate-pulse ml-0.5 text-lg 2xl:text-xl">
                  █
                </span>
              )}
            </div>
          ) : message.isStreaming ? (
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm 2xl:text-base py-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping"></span>
              Connecting to Bedrock ConverseStream...
            </div>
          ) : null}
        </div>

        {/* Error message */}
        {message.error && (
          <div className="mt-4 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Bedrock Generation Error</div>
              <div className="mt-0.5 text-red-600 dark:text-red-300/90">{message.error}</div>
            </div>
          </div>
        )}

        {/* Telemetry Card (Screen 1) */}
        {message.telemetry && <RoutingTelemetryCard telemetry={message.telemetry} />}

        {/* Sources & Citations (Screen 2) */}
        {message.sources && <SourceList sources={message.sources} />}
      </div>
    </div>
  );
};
