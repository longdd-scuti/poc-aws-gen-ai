"use client";

import React from "react";
import { AppShell } from "@/components/app-shell";
import { MessageList } from "@/components/message-list";
import { ChatComposer } from "@/components/chat-composer";
import { useChatStream } from "@/hooks/use-chat-stream";

const ROUTING_PRESETS = [
  {
    label: "What is S3? (Simple)",
    prompt: "What is Amazon S3?",
    type: "simple" as const,
  },
  {
    label: "S3 Versioning (Simple)",
    prompt: "How does S3 bucket versioning work in one concise paragraph?",
    type: "simple" as const,
  },
  {
    label: "AWS Storage Types (Simple)",
    prompt: "List 3 common AWS storage services and their primary use cases.",
    type: "simple" as const,
  },
  {
    label: "IoT Architecture (Complex)",
    prompt:
      "Design a resilient, distributed event-driven architecture on AWS for processing IoT telemetry at scale. Compare DynamoDB vs S3 data lake trade-offs.",
    type: "complex" as const,
  },
  {
    label: "Multi-Region Backup Code (Complex)",
    prompt:
      "Write a production-grade Python script using Boto3 to backup S3 buckets across regions with KMS customer-managed encryption and retry logic.",
    type: "complex" as const,
  },
  {
    label: "Aurora Serverless Analysis (Complex)",
    prompt:
      "Analyze the architectural trade-offs between Amazon Aurora Serverless v2 and provisioned Aurora for unpredictable spiky enterprise workloads.",
    type: "complex" as const,
  },
];

export default function RoutingChatPage() {
  const { messages, status, sendMessage, stopGeneration, clearMessages } = useChatStream(
    "/v1/chat/routing/stream"
  );

  return (
    <AppShell
      title="Intelligent Prompt Routing"
      subtitle="One endpoint, the right Nova model for each request"
      onClearChat={messages.length > 0 ? clearMessages : undefined}
    >
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Messages List Area */}
        <MessageList
          messages={messages}
          emptyTitle="Bedrock Intelligent Prompt Routing Demo"
          emptySubtitle="Test how AWS Bedrock routes simple queries to fast, cost-effective models (Nova Lite) and complex reasoning tasks to high-performance models (Nova Pro)."
        />

        {/* Input Composer at bottom */}
        <div className="pt-2">
          <ChatComposer
            onSend={sendMessage}
            onStop={stopGeneration}
            status={status}
            presets={ROUTING_PRESETS}
            placeholder="Ask something to test intelligent routing (e.g. simple definition vs complex architecture)..."
          />
        </div>
      </div>
    </AppShell>
  );
}
