# AWS Bedrock GenAI Chat Application PoC

Dự án Proof of Concept (PoC) xây dựng ứng dụng Chat thông minh thế hệ mới khai thác dịch vụ **Amazon Bedrock**, bao gồm 2 năng lực cốt lõi:
1. **Màn hình 1 — Intelligent Prompt Routing + ConverseStream:** Tự động điều hướng câu hỏi đến mô hình tối ưu (Amazon Nova Lite cho câu hỏi nhanh/đơn giản vs Amazon Nova Pro / Claude 3.5 cho câu hỏi phức tạp/lập luận/code), stream thời gian thực và hiển thị chỉ số đo lường (Routed Model, Latency, TTFT, Input/Output Tokens).
2. **Màn hình 2 — Knowledge Base / RAG Chat ("Chat with your data"):** Tra cứu dữ liệu doanh nghiệp từ kho tài liệu S3 qua Bedrock Knowledge Base (vector search) kết hợp LLM sinh câu trả lời đính kèm trích dẫn nguồn (`[1]`, `[2]`, snippet, điểm tương đồng).

---

## 🏗️ Kiến trúc & Công nghệ

- **Front-End:** Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS, Lucide Icons.
- **Back-End:** Python 3.11+ với FastAPI (bất đồng bộ, native Server-Sent Events qua `StreamingResponse`).
- **AWS SDK:** `boto3` (`bedrock-runtime` cho `converse_stream`, `bedrock-agent-runtime` cho `retrieve`).
- **Giao thức:** Server-Sent Events (SSE) qua HTTP POST hỗ trợ stream token text, telemetry metadata và hủy request (`AbortController`).

---

## 📂 Cấu trúc thư mục

```text
poc-aws-gen-ai/
├── .design/
│   └── draft_specs.md                     # Tài liệu thiết kế kỹ thuật v2.0.0
├── back-end/
│   ├── app/
│   │   ├── main.py                        # FastAPI entrypoint, CORS, lifespan
│   │   ├── api/routes/
│   │   │   ├── health.py                  # GET /healthz (liveness), GET /readyz (readiness)
│   │   │   ├── routing.py                 # POST /v1/chat/routing/stream
│   │   │   └── rag.py                     # POST /v1/chat/rag/stream
│   │   ├── core/
│   │   │   ├── config.py                  # Pydantic BaseSettings đọc .env
│   │   │   ├── aws_clients.py             # Singleton Boto3 clients (Bedrock Runtime & Agent)
│   │   │   └── logging.py                 # Structured logger (không log nhạy cảm)
│   │   ├── schemas/
│   │   │   ├── chat.py                    # ChatMessage, ChatRequest validation
│   │   │   ├── events.py                  # SSE event payloads
│   │   │   └── source.py                  # RAG source item schema
│   │   ├── services/
│   │   │   ├── bedrock_chat.py            # ConverseStream generator
│   │   │   ├── prompt_router.py           # Native ARN vs Smart Heuristic router
│   │   │   ├── knowledge_base.py          # Bedrock Agent Runtime retrieve()
│   │   │   └── rag_prompt.py              # Prompt grounding & injection guardrails
│   │   └── streaming/sse.py               # SSE wire format & safe error mapping
│   ├── tests/
│   │   ├── test_unit.py                   # Unit tests (schemas, router, RAG prompt, SSE)
│   │   └── test_api.py                    # Integration tests (/healthz, /readyz)
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── .env.example
├── front-end/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                 # Root layout với Dark theme
│   │   │   ├── page.tsx                   # Redirect đến /routing
│   │   │   ├── routing/page.tsx           # Screen 1: Intelligent Prompt Routing
│   │   │   └── rag/page.tsx               # Screen 2: Knowledge Base RAG Chat
│   │   ├── components/
│   │   │   ├── app-shell.tsx              # Navigation bar, tabs, AWS status indicator
│   │   │   ├── chat-composer.tsx          # Ô nhập liệu đa dòng, nút gửi/dừng, presets
│   │   │   ├── message-list.tsx           # Danh sách tin nhắn & auto-scroll
│   │   │   ├── streaming-message.tsx      # Bubble tin nhắn & con trỏ nhấp nháy █
│   │   │   ├── routing-telemetry.tsx      # Khối Routing Information (Model, Latency, Tokens)
│   │   │   └── source-list.tsx            # Danh sách nguồn trích dẫn [1], [2] & snippet
│   │   ├── hooks/use-chat-stream.ts       # Quản lý SSE stream & state machine
│   │   ├── lib/sse-parser.ts              # Robust multi-chunk SSE parser
│   │   └── types/chat.ts                  # TypeScript types
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.example
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Chuẩn bị Back-End (Python FastAPI)

1. Mở terminal tại thư mục `back-end`:
   ```bash
   cd back-end
   ```
2. Tạo môi trường ảo và cài đặt thư viện:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate   # Trên Windows
   pip install -r requirements.txt
   ```
3. Cấu hình biến môi trường:
   Sao chép `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
   Cấu hình thông tin AWS trong file `.env`:
   - `AWS_REGION`: Mặc định `us-east-1` (hoặc `us-west-2`).
   - `ROUTING_MODE`: `auto` (Mặc định). Nếu có `BEDROCK_PROMPT_ROUTER_ARN`, hệ thống chạy mode `native`; nếu chưa có, tự động fallback sang `heuristic` để bạn demo ngay lập tức.
   - `BEDROCK_KNOWLEDGE_BASE_ID`: Điền ID của Bedrock Knowledge Base nếu đã tạo trên AWS Console.
   > **Lưu ý:** Boto3 tự động nhận diện AWS credentials qua AWS CLI profile (`aws configure`) hoặc biến môi trường `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
4. Chạy kiểm thử (Unit & Integration tests):
   ```bash
   pytest
   ```
5. Khởi động server backend:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   API sẽ chạy tại `http://localhost:8000`. Kiểm tra trạng thái: `http://localhost:8000/readyz`.

---

### 2. Chuẩn bị Front-End (Next.js 15)

1. Mở terminal tại thư mục `front-end`:
   ```bash
   cd front-end
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động dev server:
   ```bash
   npm run dev
   ```
4. Truy cập giao diện ứng dụng tại: `http://localhost:3000`

---

## 🎯 Kiểm chứng các tính năng trong PoC

### Màn hình 1: Intelligent Prompt Routing
1. Chọn một prompt đơn giản từ thanh preset: **"What is S3? (Simple)"** hoặc gõ câu hỏi ngắn.
   - Quan sát câu trả lời stream từng token với con trỏ nhấp nháy `█`.
   - Xem khối **Routing Information**: Model điều hướng đến `Amazon Nova Lite` (tối ưu chi phí và tốc độ), hiển thị thời gian phản hồi (Latency) và số lượng Tokens.
2. Chọn prompt phức tạp: **"IoT Architecture (Complex)"** hoặc **"Multi-Region Backup Code (Complex)"**.
   - Quan sát Bedrock Router điều hướng sang mô hình năng lực cao `Amazon Nova Pro`.

### Màn hình 2: Knowledge Base / RAG Chat
1. Nhấp tab **RAG Chat** trên thanh điều hướng.
2. Đặt câu hỏi tra cứu tài liệu (ví dụ về quy chế công ty, chính sách chi phí).
3. Câu trả lời stream về kèm danh sách trích dẫn nguồn `[1]`, `[2]`.
4. Bấm vào từng thẻ nguồn để mở rộng đoạn trích dẫn (snippet) và kiểm tra điểm tương đồng (Relevance score).
