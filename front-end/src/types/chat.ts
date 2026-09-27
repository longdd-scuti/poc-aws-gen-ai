export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface RagSourceItem {
  id: number;
  title: string;
  snippet: string;
  score: number;
  page?: number | null;
  documentId?: string | null;
}

export interface RoutingTelemetry {
  routingMode: "native" | "heuristic";
  routedModelId: string;
  routedModelName: string;
  inputTokens: number;
  outputTokens: number;
  modelLatencyMs: number;
  ttftMs: number;
  endToEndLatencyMs: number;
  routingReason?: string;
}

export interface MessageCompletedTelemetry {
  inputTokens: number;
  outputTokens: number;
  modelLatencyMs: number;
  ttftMs: number;
  endToEndLatencyMs: number;
  stopReason: string;
}

export type ChatStatus = "idle" | "connecting" | "streaming" | "completed" | "error" | "cancelled";

export interface ExtendedMessage {
  id: string;
  role: Role;
  content: string;
  isStreaming?: boolean;
  telemetry?: RoutingTelemetry;
  sources?: RagSourceItem[];
  error?: string;
}
