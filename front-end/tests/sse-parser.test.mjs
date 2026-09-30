import assert from "node:assert/strict";
import test from "node:test";

import { parseSSEStream } from "../src/lib/sse-parser.ts";

function readerFromChunks(chunks) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  }).getReader();
}

test("parses CRLF-delimited JSON events split across arbitrary UTF-8 chunks", async () => {
  const bytes = new TextEncoder().encode(
    ': keep-alive\r\nevent: stream.start\r\ndata: {"mode":"rag"}\r\n\r\n' +
      'event: message.delta\r\ndata: {"text":"Xin chào 👋"}\r\n\r\n'
  );
  const emojiStart = bytes.indexOf(0xf0);
  const chunks = [
    bytes.slice(0, 15),
    bytes.slice(15, 42),
    bytes.slice(42, emojiStart + 2),
    bytes.slice(emojiStart + 2),
  ];
  const events = [];

  await parseSSEStream(readerFromChunks(chunks), (event) => events.push(event));

  assert.deepEqual(events, [
    { event: "stream.start", data: { mode: "rag" } },
    { event: "message.delta", data: { text: "Xin chào 👋" } },
  ]);
});

test("dispatches the final event when the stream closes without a blank line", async () => {
  const bytes = new TextEncoder().encode('event: stream.done\ndata: {"requestId":"req_1"}');
  const events = [];

  await parseSSEStream(readerFromChunks([bytes]), (event) => events.push(event));

  assert.deepEqual(events, [
    { event: "stream.done", data: { requestId: "req_1" } },
  ]);
});
