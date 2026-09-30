export interface SSEMessage {
  event: string;
  data: Record<string, any>;
}

type SSEMessageHandler = (message: SSEMessage) => void;

function createAbortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}

export async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onMessage: SSEMessageHandler,
  signal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let eventName = "";
  let dataLines: string[] = [];

  const dispatchEvent = () => {
    if (dataLines.length === 0) {
      eventName = "";
      return;
    }

    onMessage({
      event: eventName || "message",
      data: JSON.parse(dataLines.join("\n")),
    });
    eventName = "";
    dataLines = [];
  };

  const processLine = (line: string) => {
    if (line === "") {
      dispatchEvent();
      return;
    }

    if (line.startsWith(":")) return;

    const separatorIndex = line.indexOf(":");
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    let value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);
    if (value.startsWith(" ")) value = value.slice(1);

    if (field === "event") eventName = value;
    if (field === "data") dataLines.push(value);
  };

  const processBufferedLines = (flush: boolean) => {
    while (buffer.length > 0) {
      const lfIndex = buffer.indexOf("\n");
      const crIndex = buffer.indexOf("\r");
      let lineEnd = -1;

      if (lfIndex !== -1 && crIndex !== -1) lineEnd = Math.min(lfIndex, crIndex);
      else lineEnd = Math.max(lfIndex, crIndex);

      if (lineEnd === -1) break;
      if (!flush && buffer[lineEnd] === "\r" && lineEnd === buffer.length - 1) break;

      const line = buffer.slice(0, lineEnd);
      const newlineLength =
        buffer[lineEnd] === "\r" && buffer[lineEnd + 1] === "\n" ? 2 : 1;
      buffer = buffer.slice(lineEnd + newlineLength);
      processLine(line);
    }

    if (flush && buffer.length > 0) {
      processLine(buffer);
      buffer = "";
    }
  };

  const handleAbort = () => {
    void reader.cancel().catch(() => undefined);
  };

  if (signal?.aborted) throw createAbortError();
  signal?.addEventListener("abort", handleAbort, { once: true });

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (signal?.aborted) throw createAbortError();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      processBufferedLines(false);
    }

    buffer += decoder.decode();
    processBufferedLines(true);
    dispatchEvent();
  } finally {
    signal?.removeEventListener("abort", handleAbort);
  }
}
