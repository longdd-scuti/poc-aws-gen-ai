"use client";

import React from "react";
import { AppShell } from "@/components/app-shell";
import { MessageList } from "@/components/message-list";
import { ChatComposer } from "@/components/chat-composer";
import { useChatStream } from "@/hooks/use-chat-stream";

const ROUTING_PRESETS = [
  {
    label: "What is S3? (Lite)",
    prompt: "What is Amazon S3 and what are its primary storage classes?",
    type: "simple" as const,
  },
  {
    label: "S3 Versioning (Lite)",
    prompt: "How does Amazon S3 bucket versioning work in two concise sentences?",
    type: "simple" as const,
  },
  {
    label: "S3 vs EBS (Lite)",
    prompt: "List 3 core differences between Amazon S3 and Amazon EBS.",
    type: "simple" as const,
  },
  {
    label: "🚀 100k TPS IoT Arch (PRO)",
    prompt:
      "Act as a Principal AWS Solutions Architect. Provide an exhaustive, production-grade architectural design for an event-driven telemetry ingestion system on AWS handling 100,000 TPS.\n\nRequirements:\n1. Specify data ingestion using Amazon Kinesis Data Streams with custom partition key hashing.\n2. Detail stream processing via AWS Lambda with parallelization factor and tumbling window aggregation.\n3. Compare DynamoDB Global Tables vs Amazon Timestream for hot time-series metrics storage.\n4. Design an active-active multi-region Disaster Recovery plan with RTO < 1 min, RPO = 0, and cross-region replication lag mitigation.\n5. Include an ASCII architecture diagram and mathematical throughput sizing.",
    type: "complex" as const,
  },
  {
    label: "🚀 Distributed Saga Code (PRO)",
    prompt:
      "Write a production-grade, highly concurrent Python module using asyncio, aioboto3, and botocore implementing the Saga Orchestration Pattern for distributed e-commerce transactions across Payment, Inventory, and Order microservices.\n\nRequirements:\n1. Implement idempotent state machines with Amazon DynamoDB conditional writes.\n2. Handle network partitions, timeouts, and emit compensating transactions upon downstream failure.\n3. Implement exponential backoff with full jitter and circuit breaker pattern.\n4. Provide full type hints, docstrings, and comprehensive unit tests using pytest and unittest.mock.",
    type: "complex" as const,
  },
  {
    label: "🚀 DynamoDB vs Aurora Deep-Dive (PRO)",
    prompt:
      "Conduct an exhaustive mathematical and technical trade-off analysis between Amazon DynamoDB Single-Table Design versus Amazon Aurora PostgreSQL Serverless v2 for a B2B SaaS platform with 50 million monthly active users.\n\nAnalyze:\n1. Read/Write amplification, B-tree vs LSM-tree I/O characteristics under 80/20 read-heavy workloads.\n2. Partition key hot-spot mitigation strategies using composite keys and write sharding with entropy proofs.\n3. Total Cost of Ownership (TCO) breakdown under steady vs 10x spiky workloads.\n4. Detailed zero-downtime schema evolution and rollback strategies over a 5-year lifecycle.",
    type: "complex" as const,
  },
  {
    label: "🚀 Kiến trúc Ngân hàng số (PRO - VN)",
    prompt:
      "Đóng vai trò là Kiến trúc sư trưởng giải pháp AWS (Principal Solutions Architect). Hãy thiết kế kiến trúc hệ thống xử lý thanh toán tài chính phân tán cho ngân hàng số đạt chuẩn PCI-DSS với thông lượng 50.000 TPS.\n\nYêu cầu phân tích chi tiết:\n1. Thiết kế luồng xử lý event-driven sử dụng Amazon MSK (Managed Kafka), AWS Fargate, và DynamoDB Global Tables đa vùng (Multi-Region Active-Active).\n2. Giải pháp xử lý giao dịch phân tán đảm bảo tính nhất quán dữ liệu ACID (mô hình Two-Phase Commit kết hợp Saga & Outbox Pattern).\n3. Kế hoạch phòng chống thảm họa (Disaster Recovery RTO < 30s, RPO = 0) với AWS Route 53 Application Recovery Controller (ARC).\n4. Viết mã nguồn Python hoàn chỉnh minh họa Saga Orchestrator với retry, circuit breaker và compensating transactions.",
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
