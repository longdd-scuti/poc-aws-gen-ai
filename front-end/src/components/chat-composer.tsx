"use client";

import React, { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Send, Square, Sparkles } from "lucide-react";
import { ChatStatus } from "@/types/chat";

interface ChatComposerProps {
  onSend: (message: string) => void;
  onStop: () => void;
  status: ChatStatus;
  presets?: { label: string; prompt: string; type: "simple" | "complex" | "rag" }[];
  placeholder?: string;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSend,
  onStop,
  status,
  presets = [],
  placeholder = "Ask something...",
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isBusy = status === "streaming" || status === "connecting";

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isBusy) return;
    onSend(input);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handlePresetClick = (prompt: string) => {
    if (isBusy) return;
    onSend(prompt);
  };

  return (
    <div className="w-full">
      {/* Preset Chips */}
      {presets.length > 0 && (
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs 2xl:text-sm">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1 text-xs 2xl:text-sm font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            Try:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isBusy}
              onClick={() => handlePresetClick(p.prompt)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full border transition-all text-xs 2xl:text-sm font-sans font-medium shadow-2xs ${
                p.type === "simple"
                  ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-300"
                  : p.type === "complex"
                  ? "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-500/30 dark:text-indigo-300"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input container matching wireframe [ Ask something... ] [➤] */}
      <div className="relative flex items-end gap-2.5 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-2xl p-3 shadow-md focus-within:border-blue-500 dark:focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isBusy}
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none text-base 2xl:text-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none max-h-48 min-h-[44px] 2xl:min-h-[52px] py-2 px-2.5 leading-relaxed"
        />

        {isBusy ? (
          <button
            type="button"
            onClick={onStop}
            className="flex-shrink-0 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm 2xl:text-base flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all"
            title="Stop generation"
          >
            <Square className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 p-3 2xl:p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-md shadow-blue-500/20 transition-all"
            title="Send prompt"
          >
            <Send className="w-5 h-5 2xl:w-6 2xl:h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
