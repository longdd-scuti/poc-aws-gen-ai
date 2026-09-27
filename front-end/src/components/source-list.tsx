"use client";

import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, FileText, Info } from "lucide-react";
import { RagSourceItem } from "@/types/chat";

interface SourceListProps {
  sources: RagSourceItem[];
}

export const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!sources || sources.length === 0) return null;

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/80 text-sm select-text animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5">
        <span className="font-semibold tracking-wider text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2 font-mono text-xs 2xl:text-sm">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          Sources & Citations ({sources.length})
        </span>
        <div className="flex items-center gap-1.5 text-xs 2xl:text-sm text-slate-500 dark:text-slate-400" title="Relevance score is a relative vector ranking score, not an accuracy percentage.">
          <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Vector similarity score</span>
        </div>
      </div>

      {/* Source Cards */}
      <div className="space-y-2.5">
        {sources.map((src) => {
          const isExpanded = expandedId === src.id;
          return (
            <div
              key={src.id}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? "bg-blue-50/40 dark:bg-slate-900 border-blue-300 dark:border-cyan-500/40 shadow-sm"
                  : "bg-slate-50/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExpand(src.id)}
                className="w-full flex items-center justify-between p-3.5 text-left text-sm 2xl:text-base font-mono"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-cyan-950/80 border border-blue-200 dark:border-cyan-500/40 text-blue-700 dark:text-cyan-300 font-bold text-xs 2xl:text-sm">
                    [{src.id}]
                  </span>
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-900 dark:text-slate-200 truncate">{src.title}</span>
                  {src.page && (
                    <span className="text-xs 2xl:text-sm text-slate-500 dark:text-slate-400 flex-shrink-0 font-sans">
                      · Page {src.page}
                    </span>
                  )}
                  <span className="text-xs 2xl:text-sm text-blue-600 dark:text-cyan-400 font-semibold flex-shrink-0">
                    · Score: {src.score}
                  </span>
                </div>

                <div className="text-slate-400 ml-2 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800 text-sm 2xl:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-white dark:bg-slate-950/40 rounded-b-xl">
                  <div className="text-xs 2xl:text-sm text-slate-500 mb-1.5 font-mono uppercase tracking-wider font-semibold">
                    Retrieved passage:
                  </div>
                  <p className="whitespace-pre-wrap italic text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    "{src.snippet}"
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
