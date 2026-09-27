"use client";

import { useCallback, useRef, useState } from "react";
import { parseSSEStream } from "@/lib/sse-parser";
import { ChatMessage, ChatStatus, ExtendedMessage, RagSourceItem, RoutingTelemetry } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function useChatStream(endpoint: "/v1/chat/routing/stream" | "/v1/chat/rag/stream") {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("cancelled");
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false, content: msg.content + " [Stopped by user]" } : msg
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    stopGeneration();
    setMessages([]);
    setStatus("idle");
    setError(null);
  }, [stopGeneration]);

  const sendMessage = useCallback(
    async (userPrompt: string) => {
      const trimmed = userPrompt.trim();
      if (!trimmed || status === "streaming" || status === "connecting") return;

      setError(null);
      setStatus("connecting");

      const userMessageId = `user_${Date.now()}`;
      const assistantMessageId = `asst_${Date.now()}`;

      const newUserMsg: ExtendedMessage = {
        id: userMessageId,
        role: "user",
        content: trimmed,
      };

      const newAssistantMsg: ExtendedMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      const nextMessages = [...messages, newUserMsg];
      setMessages([...nextMessages, newAssistantMsg]);

      // Prepare payload for backend API
      const payloadMessages: ChatMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ messages: payloadMessages }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errText = "Failed to establish stream connection.";
          try {
            const errJson = await response.json();
            errText = errJson.message || errJson.detail || errText;
          } catch (_) {
            errText = `HTTP Error ${response.status}: ${response.statusText}`;
          }
          throw new Error(errText);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable.");
        }

        await parseSSEStream(
          reader,
          ({ event, data }) => {
            switch (event) {
              case "stream.start":
                setStatus("streaming");
                break;

              case "rag.sources":
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, sources: data.sources as RagSourceItem[] }
                      : msg
                  )
                );
                break;

              case "message.delta":
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + (data.text || "") }
                      : msg
                  )
                );
                break;

              case "routing.completed":
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, telemetry: data as RoutingTelemetry }
                      : msg
                  )
                );
                break;

              case "error":
                const errorMsg = data.message || "An error occurred with AWS Bedrock.";
                setError(errorMsg);
                setStatus("error");
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, isStreaming: false, error: errorMsg }
                      : msg
                  )
                );
                break;

              case "stream.done":
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
                  )
                );
                setStatus((current) => (current === "error" ? "error" : "completed"));
                break;
            }
          },
          controller.signal
        );
      } catch (err: any) {
        if (err.name === "AbortError") {
          setStatus("cancelled");
        } else {
          const errMsg = err.message || "Network connection failure.";
          setError(errMsg);
          setStatus("error");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, isStreaming: false, error: errMsg } : msg
            )
          );
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [endpoint, messages, status]
  );

  return {
    messages,
    status,
    error,
    sendMessage,
    stopGeneration,
    clearMessages,
  };
}
