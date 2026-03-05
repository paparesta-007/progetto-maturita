<div align="center">

# 🧠 Smart AI

**A full-stack AI-powered chat and document intelligence platform.**

Built with React, Express, and the Vercel AI SDK — connecting to multiple LLM providers through OpenRouter.

[![TypeScript](https://img.shields.io/badge/TypeScript-96.4%25-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](#)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square&logo=gnu&logoColor=white)](./LICENSE)

</div>

---

## 📖 Overview

**Smart AI** is a modern, full-stack web application that provides an AI chat interface with multi-model support, real-time streaming responses, PDF document ingestion with semantic search (RAG), and user authentication — all wrapped in a clean, responsive UI with dark/light theme support.

This project was developed as a **Maturità capstone project** *(Progetto di Maturità)* by **Tommaso Paparesta**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **Multi-Model AI Chat** | Converse with AI using models from Google, OpenAI, Anthropic, Meta, Nvidia, Deepseek, Qwen, and xAI — all through OpenRouter |
| ⚡ **Real-Time Streaming** | Token-by-token streaming output for a smooth, responsive chat experience |
| 📄 **PDF Document Intelligence (RAG)** | Upload PDFs, automatically chunk and embed them, and ask questions grounded in your documents |
| 🧩 **Structured Output** | Generate flashcards and quizzes with structured AI outputs using Zod schemas |
| 🔐 **Authentication** | Secure email/password sign-up and sign-in powered by Supabase Auth |
| 🎨 **Dark / Light Theme** | Full theme support across the entire application |
| 💾 **Conversation Persistence** | Conversations are saved and can be resumed at any time |
| 🛡️ **Protected Routes** | Route guards ensuring authenticated access to the application |
| ⚙️ **Custom System Prompts** | Personalize AI behavior with custom instructions, tone, and personal info |
| 📊 **Performance Metrics** | Latency and throughput metrics reported for every completion |

---

## 🏗️ Architecture

The project follows a **monorepo** structure with two main workspaces:

```
progetto-maturita/
├── client/                  # React frontend (Vite + TypeScript)
│   ├── src/
│   ���   ├── components/      # Reusable UI components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Textbar.tsx
│   │   │   ├── PromptStarter.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── other/       # BotMessage, UserMessage, BotLoading, etc.
│   │   ├── context/         # React context providers (Auth, App, Chat, Document)
│   │   ├── layouts/         # App layout shells (AppLayout, DocumentLayout)
│   │   ├── library/         # Utilities (Markdown renderer, Supabase client, system prompt)
│   │   ├── pages/           # Route-level page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   ├── CompleteProfilePage.tsx
│   │   │   ├── DocumentPage.tsx
│   │   │   └── DocumentWizard/
│   │   ├── services/        # Supabase service layer
│   │   └── assets/          # Static assets
│   └── package.json
│
├── server/                  # Express backend (TypeScript)
│   ├── server.ts            # Main server entry point with all API routes
│   ├── static/              # Static files and system prompt
│   └── package.json
│
└── package.json             # Root workspace with concurrently scripts
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite 7](https://vite.dev/) | Build tool and dev server |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [React Router 7](https://reactrouter.com/) | Client-side routing |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Marked](https://marked.js.org/) + [Shiki](https://shiki.style/) + [KaTeX](https://katex.org/) | Markdown, code highlighting, and LaTeX rendering |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitization |
| [Lucide](https://lucide.dev/) + [Phosphor Icons](https://phosphoricons.com/) | Iconography |

### Backend

| Technology | Purpose |
|---|---|
| [Express 5](https://expressjs.com/) | HTTP server and API framework |
| [Vercel AI SDK](https://sdk.vercel.ai/) | Unified interface for LLM providers |
| [OpenRouter](https://openrouter.ai/) | Multi-model LLM gateway |
| [Google AI SDK](https://ai.google.dev/) | Direct Google Gemini access |
| [Supabase](https://supabase.com/) | Database, vector store, and authentication |
| [Multer](https://github.com/expressjs/multer) | File upload handling |
| [pdf-parse](https://www.npmjs.com/package/pdf-parse) | PDF text extraction |
| [Zod](https://zod.dev/) | Schema validation for structured outputs |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18+**
- [npm](https://www.npmjs.com/) **v9+**
- A [Supabase](https://supabase.com/) project (for auth, database, and vector store)
- An [OpenRouter](https://openrouter.ai/) API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/paparesta-007/progetto-maturita.git
   cd progetto-maturita
   ```

2. **Install dependencies**

   ```bash
   # Root dependencies (concurrently)
   npm install

   # Client dependencies
   cd client && npm install && cd ..

   # Server dependencies
   cd server && npm install && cd ..
   ```

3. **Configure environment variables**

   Create a `.env` file inside the `server/` directory:

   ```env
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key  # Optional, for direct Gemini access
   ```

4. **Set up Supabase**

   - Create a `documents` table to store document chunks and embeddings.
   - Create an RPC function `match_documents` for vector similarity search.
   - Enable Supabase Auth with email/password sign-in.

### Running the Application

```bash
# Start both client and server concurrently
npm run dev
```

This launches:
- **Client** → `http://localhost:5173` (Vite dev server)
- **Server** → `http://localhost:3000` (Express API)

You can also start them individually:

```bash
npm run client   # Frontend only
npm run server   # Backend only
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/gemini/generate` | Generate a simple text completion via Google Gemini |
| `GET` | `/api/gemini/structured-output` | Generate flashcards/quizzes with structured output |
| `POST` | `/api/gemini/chat/stream` | Stream a chat response via Google Gemini |
| `POST` | `/api/completion/chat` | Chat completion via OpenRouter (with metrics) |
| `POST` | `/api/streamingOutput` | Stream a chat response via OpenRouter |
| `POST` | `/api/gemini/getTitleConversation` | Auto-generate a conversation title |
| `POST` | `/api/documents/ingest` | Upload and ingest a PDF (chunking → embedding → vector DB) |
| `POST` | `/api/chat/ask-pdf` | Ask a question grounded in uploaded documents (RAG) |

---

## 📚 How RAG Works

The document intelligence pipeline follows a classic **Retrieval-Augmented Generation** pattern:

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│  Upload   │ →  │  Parse   │ →  │  Chunk    │ →  │  Embed   │ →  │  Store   │
│   PDF     │    │  Text    │    │  (1000c)  │    │  (OpenAI │    │ Supabase │
│           │    │          │    │  overlap  │    │  embed)  │    │ pgvector │
└──────────┘    └──────────┘    └───────────┘    └──────────┘    └──────────┘

                              ┌──────────┐
                              │  Query   │
                              └────┬─────┘
                                   ↓
                    ┌──────────────────────────────┐
                    │  Embed query → Cosine search │
                    │  → Retrieve top-k chunks     │
                    │  → Generate grounded answer  │
                    └──────────────────────────────┘
```

1. **PDF Parsing** — Extract raw text from uploaded PDF files.
2. **Intelligent Chunking** — Split text into ~1000-character chunks with 200-character overlap, respecting sentence and paragraph boundaries.
3. **Embedding** — Generate vector embeddings using `text-embedding-3-small` via OpenRouter.
4. **Storage** — Store chunks with their embeddings in Supabase (pgvector).
5. **Retrieval** — On user query, embed the question, perform cosine similarity search, and retrieve the top 5 relevant chunks.
6. **Generation** — Feed retrieved context to the LLM and generate a grounded answer.

---

## 🎨 Screenshots

> *Coming soon — contributions welcome!*

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**Tommaso Paparesta**

- GitHub: [@paparesta-007](https://github.com/paparesta-007)

---

<div align="center">

*Built with ❤️ as a Maturità capstone project*

</div>