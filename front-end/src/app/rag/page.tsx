"use client";

import React from "react";
import { AppShell } from "@/components/app-shell";
import { MessageList } from "@/components/message-list";
import { ChatComposer } from "@/components/chat-composer";
import { useChatStream } from "@/hooks/use-chat-stream";

const RAG_PRESETS = [
  {
    label: "Quy định nghỉ phép năm",
    prompt: "Chính sách và số ngày nghỉ phép năm của nhân viên chính thức được quy định như thế nào?",
    type: "rag" as const,
  },
  {
    label: "Hạn nộp hóa đơn công tác phí",
    prompt: "Quy trình thanh toán và thời hạn nộp hóa đơn hoàn trả chi phí công tác là bao lâu?",
    type: "rag" as const,
  },
  {
    label: "Phụ cấp lưu trú & tiếp khách",
    prompt: "Mức phụ cấp tiền ăn, lưu trú tối đa cho chuyến công tác nội địa là bao nhiêu?",
    type: "rag" as const,
  },
];

export default function RAGChatPage() {
  const { messages, status, sendMessage, stopGeneration, clearMessages } = useChatStream(
    "/v1/chat/rag/stream"
  );

  return (
    <AppShell
      title="Chat with your data"
      subtitle="Knowledge Base connected RAG with source citations"
      onClearChat={messages.length > 0 ? clearMessages : undefined}
    >
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Messages List Area */}
        <MessageList
          messages={messages}
          emptyTitle="Bedrock Knowledge Base RAG Assistant"
          emptySubtitle="Ask questions grounded in enterprise documents stored on S3. Answers are generated strictly from retrieved chunks with citations [1], [2] and relevance scores."
        />

        {/* Input Composer at bottom */}
        <div className="pt-2">
          <ChatComposer
            onSend={sendMessage}
            onStop={stopGeneration}
            status={status}
            presets={RAG_PRESETS}
            placeholder="Ask your documents (e.g. company policies, financial guidelines)..."
          />
        </div>
      </div>
    </AppShell>
  );
}
