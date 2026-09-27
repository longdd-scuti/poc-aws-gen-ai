"use client";

import React from "react";
import { Cpu, Clock, ArrowDownLeft, ArrowUpRight, Zap, ShieldCheck } from "lucide-react";
import { RoutingTelemetry } from "@/types/chat";

interface RoutingTelemetryProps {
  telemetry: RoutingTelemetry;
}

export const RoutingTelemetryCard: React.FC<RoutingTelemetryProps> = ({ telemetry }) => {
  const isHeuristic = telemetry.routingMode === "heuristic";

  return (
    <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/80 text-sm font-mono select-text animate-fadeIn">
      {/* Header bar matching the user wireframe */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-slate-800">
        <span className="font-semibold tracking-wider text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2 text-xs 2xl:text-sm">
          <Zap className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          Routing Information
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isHeuristic
              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
              : "bg-blue-50 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {isHeuristic ? "Local Heuristic Fallback" : "Native Bedrock Prompt Router"}
        </span>
      </div>

      {/* Grid view formatted cleanly with light background */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/90 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Routed Model */}
        <div>
          <div className="text-xs 2xl:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-sans">
            <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            Routed Model
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 text-sm 2xl:text-base truncate" title={telemetry.routedModelId}>
            {telemetry.routedModelName}
          </div>
        </div>

        {/* Latency */}
        <div>
          <div className="text-xs 2xl:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-sans">
            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Latency
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 text-sm 2xl:text-base">
            {(telemetry.endToEndLatencyMs / 1000).toFixed(1)} sec
            <span className="text-xs text-slate-500 ml-1.5 font-normal">
              (TTFT {Math.round(telemetry.ttftMs)}ms)
            </span>
          </div>
        </div>

        {/* Input Tokens */}
        <div>
          <div className="text-xs 2xl:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-sans">
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            Input Tokens
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 text-sm 2xl:text-base">
            {telemetry.inputTokens}
          </div>
        </div>

        {/* Output Tokens */}
        <div>
          <div className="text-xs 2xl:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-sans">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Output Tokens
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 text-sm 2xl:text-base">
            {telemetry.outputTokens}
          </div>
        </div>
      </div>

      {telemetry.routingReason && (
        <div className="mt-2.5 text-xs 2xl:text-sm text-slate-600 dark:text-slate-400 italic font-sans">
          ↳ {telemetry.routingReason}
        </div>
      )}
    </div>
  );
};
