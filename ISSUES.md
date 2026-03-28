# Comprehensive Issues Report

> Codebase audit — full review of `server/server.ts`, `server/utils/textProcessing.ts`, all `client/src/` contexts, libraries, components, and pages.
> Findings are tagged with **severity** (`🔴 CRITICAL` · `🟠 HIGH` · `🟡 MEDIUM` · `🟢 LOW`) and **area** (`[BACKEND]` · `[FRONTEND]`).

---

## Table of Contents
1. [Security](#1-security)
2. [Memory Leaks](#2-memory-leaks)
3. [Correctness & Logic Bugs](#3-correctness--logic-bugs)
4. [Type Safety](#4-type-safety)
5. [UX / Unimplemented Features](#5-ux--unimplemented-features)
6. [Performance](#6-performance)
7. [Dependency Issues](#7-dependency-issues)

---

## 1. Security

### 🔴 CRITICAL — [BACKEND] No authentication on any API endpoint
**File:** `server/server.ts`  
**All endpoints** accept a `user_id` value from the request body and pass it directly to Supabase without verifying that the caller actually owns that identity. Any client can impersonate any user by supplying an arbitrary `user_id`.
```ts
// server.ts:730 – user_id comes from req.body, not from a verified JWT
const { user_id, category, title } = req.body;
```
**Impact:** Full horizontal privilege escalation — any user can read, write, and delete data belonging to any other user.

---

### 🔴 CRITICAL — [BACKEND] dotenv loaded AFTER OpenRouter client is instantiated
**File:** `server/server.ts:127–143`  
`openrouter` (the `@openrouter/sdk` instance) is created at **line 127**, but `dotenv.config()` is not called until **line 135**. At the moment of instantiation `process.env.VITE_OPENROUTER_API_KEY` is `undefined`.
```ts
const openrouter = new OpenRouter({
    apiKey: process.env.VITE_OPENROUTER_API_KEY,  // ← undefined here
});
// ... 8 lines later ...
dotenv.config({ path: envPath });
```
**Impact:** The `openrouter` instance always runs without an API key (will fail on every call).

---

### 🔴 CRITICAL — [FRONTEND] Google OAuth tokens logged to the browser console
**File:** `client/src/context/AuthContext.tsx:51–52`  
```ts
console.log("Access Token Google:", googleAccessToken);
console.log("Refresh Token Google:", googleRefreshToken);
```
Access and refresh tokens for Google OAuth are printed to the browser console on every login. They can be harvested by browser extensions, devtools automation, or any XSS payload.

---

### 🟠 HIGH — [BACKEND] CORS wildcard — all origins allowed
**File:** `server/server.ts:176`  
```ts
app.use(cors());   // allows ANY origin
```
In production this allows any website to issue credentialed cross-origin requests to the API.

---

### 🟠 HIGH — [BACKEND] Audit-log and client-log endpoints are unauthenticated
**Files:** `server/server.ts:1349–1363`  
`GET /api/logs`, `GET /api/client-logs`, and `DELETE /api/logs` require no authentication. Any person on the network can read all stored request parameters (including user messages, user IDs, and model names) or wipe the entire audit trail.

---

### 🟠 HIGH — [BACKEND] Full request bodies stored verbatim in audit log
**File:** `server/server.ts:225`  
```ts
params: req.method === 'POST' ? req.body : req.query,
```
Every request body — including `systemPromptUser`, `personalInfo`, `tone`, and history contents — is stored in `auditLogs` (up to 500 entries, in memory, readable via `/api/logs`).

---

### 🟠 HIGH — [BACKEND] Internal error details exposed in HTTP responses
**File:** `server/server.ts:1380–1383`  
The global error handler returns `err.message` and `req.originalUrl` verbatim:
```ts
res.status(500).json({
    error: "Internal Server Error",
    details: err.message,        // ← leaks internal implementation details
    path: req.originalUrl
});
```

---

### 🟠 HIGH — [BACKEND] No rate limiting on any endpoint
There is no rate-limiting middleware. All AI endpoints (`/api/streamingOutput`, `/api/completion/chat`, `/api/quiz/generate`, etc.) can be called without restriction, allowing abuse of the OpenRouter API key and unbounded server load.

---

### 🟠 HIGH — [BACKEND] `x-forwarded-for` trusted without proxy configuration
**File:** `server/server.ts:216`  
```ts
const clientIp = (req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown') as string;
```
`x-forwarded-for` can be set by any client to any value. Without `app.set('trust proxy', 1)` this header is trivially spoofed for IP-based audit records.

---

### 🟠 HIGH — [BACKEND] `attachedFiles` URLs are not validated
**File:** `server/server.ts:345–354, 606–615`  
`attachedFiles` from the request body is iterated and `f.url` values are embedded directly into messages sent to OpenRouter without any validation. A malicious client could supply `data:` URIs, internal server addresses, or arbitrarily large base64 blobs.

---

### 🟡 MEDIUM — [BACKEND] `history` messages from the client are not sanitised
**File:** `server/server.ts:358–362, 618–622`  
The `history` array received from the client is merged directly into the messages sent to OpenRouter. A client could inject a synthetic `system` role message to override the server-side system prompt.

---

### 🟡 MEDIUM — [BACKEND] `VITE_` prefix on server-side API key
**File:** `server/server.ts:128, 144, 148`  
All three API-key references use `VITE_OPENROUTER_API_KEY`. In a Vite-based frontend the `VITE_` prefix causes the variable to be **bundled into the client-side JavaScript**. If the same `.env` file is used for both the Vite build and the Express server the key is effectively public.

---

### 🟡 MEDIUM — [BACKEND] No file-type validation on document upload
**File:** `server/server.ts:722–836`  
`multer` is configured with `memoryStorage()` and no MIME-type filter. Any file can be uploaded to `/api/documents/ingest`; non-PDF files will trigger a runtime error only after the buffer has already been read into memory.

---

### 🟡 MEDIUM — [FRONTEND] All API URLs are hardcoded to `localhost:3000`
**File:** `client/src/library/sendMessage.ts`, `sendEmbeddingMessage.ts`, `ChatContext.tsx`  
Every `fetch()` call targets `http://localhost:3000/...`. In any environment other than local development (staging, production, Docker with a different hostname) all API calls fail silently or throw network errors.

---

## 2. Memory Leaks

### 🟠 HIGH — [BACKEND] Entire streaming response body buffered in audit-log middleware
**File:** `server/server.ts:184–201`  
```ts
res.write = function (...args) {
    responseBody += args[0].toString('utf8');
    ...
};
```
The logging middleware intercepts **every** `res.write()` call and concatenates the result into a single in-memory string. For streaming endpoints like `/api/streamingOutput` and `/api/chat/ask-pdf`, this accumulates the entire streamed payload in a local variable before the request has finished — potentially megabytes per request.

---

### 🟠 HIGH — [FRONTEND] No `AbortController` for in-flight fetch requests
**Files:** `client/src/library/sendMessage.ts`, `sendEmbeddingMessage.ts`  
When the user navigates away from the chat page while a request is in flight, none of the `fetch()` calls are aborted. The `await reader.read()` loop in `sendStreamedMessage` and `sendEmbeddingMessage` will continue running in the background, and the subsequent `setMessageHistory(...)` / `setLoading(...)` calls will execute against an unmounted component's state dispatcher (React will ignore them, but the fetch / stream loop itself wastes resources until the stream ends).

---

### 🟡 MEDIUM — [BACKEND] Streaming reader not cancelled on inner error
**File:** `server/server.ts:700–712`  
```ts
try {
    while (true) { const { done, value } = await reader.read(); ... }
} catch (streamError) {
    // reader.cancel() is NOT called here
} finally {
    res.end();
}
// res.on('close') is registered AFTER res.end() — may never fire
res.on('close', () => {
    reader.cancel().catch(() => {});
});
```
If the inner parse loop throws, `reader.cancel()` is skipped. The `res.on('close')` handler is registered only **after** `res.end()` is already called, meaning the cleanup event may have already been emitted (or may not fire for keepalive connections).

---

### 🟡 MEDIUM — [FRONTEND] `URL.createObjectURL` preview URLs never revoked
**File:** `client/src/components/Textbar.tsx:114`  
```ts
previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
```
Object URLs created with `URL.createObjectURL()` must be freed with `URL.revokeObjectURL()`. There is no cleanup when a file is removed (`removeFile`) or when the component unmounts. Each attached image leaks a Blob URL that holds the underlying `Blob` in memory for the lifetime of the page.

---

### 🟡 MEDIUM — [FRONTEND] `setTimeout` calls without cleanup in route effects
**Files:** `client/src/pages/ChatPage.tsx:96–98`, `DocumentPage.tsx:55–57`  
```ts
setTimeout(() => scrollToBottom(true), 100);
```
If the component unmounts during the 100 ms delay (e.g., fast navigation), the deferred callback runs against a stale ref. There is no `clearTimeout` in the `useEffect` cleanup.

---

### 🟡 MEDIUM — [FRONTEND] `DocumentContext.fetchUserDocuments` recreated on every document add
**File:** `client/src/context/DocumentContext.tsx:80–97`  
`fetchUserDocuments` has `documentList` in its `useCallback` dependency array. Since `documentList` changes every time a document is loaded, the function is recreated on every render — defeating the memoization and causing all consumers to re-render unnecessarily.

---

### 🟢 LOW — [FRONTEND] `BotMessageStyles` inlines a `<style>` block inside every `BotMessage`
**File:** `client/src/components/other/BotMessage.tsx:151–218`  
`BotMessageStyles` is a component that renders a `<style>` tag. It is rendered on every `BotMessage` render. For a long conversation this injects the same block of CSS styles into the DOM repeatedly.

---

## 3. Correctness & Logic Bugs

### 🔴 CRITICAL — [BACKEND] `dotenv` is a devDependency
**File:** `server/package.json`  
```json
"devDependencies": {
    "dotenv": "^17.3.1"
}
```
`dotenv` is used at runtime (`server/server.ts:5, 135, 141`) but declared in `devDependencies`. A production install (`npm install --omit=dev`) will not include it, causing the server to crash on startup with `Cannot find module 'dotenv'`.

---

### 🟠 HIGH — [BACKEND] `openrouter` (OpenRouter SDK instance) is unused
**File:** `server/server.ts:127–129`  
A `new OpenRouter(...)` instance is created and stored in `openrouter`. It is never referenced again in the file — all OpenRouter calls are made with `fetch()` directly. The instance is dead code, but it is initialised before `dotenv.config()` runs (see §1), so it always has an `undefined` API key.

---

### 🟠 HIGH — [BACKEND] `reasoning: { effort: "none" }` sent to OpenRouter for title generation
**File:** `server/server.ts:460`  
```ts
reasoning: { effort: "none" }
```
`"none"` is not a valid OpenRouter reasoning effort value; documented values are `"minimal"`, `"medium"`, and `"high"`. This may silently fall back to a default or generate an API error depending on the model.

---

### 🟠 HIGH — [BACKEND] `getSuggestedQuestion` uses JSON.parse without try/catch
**File:** `server/server.ts:554`  
```ts
const parsed = JSON.parse(content);
```
`JSON.parse` is called outside the outer `try/catch` of `getSuggestedQuestion`. If the LLM returns malformed JSON, the exception propagates to the caller. (The outer function does have its own catch, but `JSON.parse` is one level above it.)

Actually re-reading: the `JSON.parse` is inside the outer `try` block at line 506. However, parsing errors would still surface because the catch only logs and returns `[]`. This is acceptable, but worth noting.

---

### 🟠 HIGH — [BACKEND] No timeout on any external `fetch()` call to OpenRouter
All `fetch("https://openrouter.ai/...")` calls have no `signal` / `AbortSignal` with a timeout. If OpenRouter is slow or unreachable, the Express request will hang until the default Node.js socket timeout (2 minutes), blocking a thread and potentially exhausting the connection pool.

---

### 🟡 MEDIUM — [BACKEND] `req.connection.remoteAddress` is deprecated
**File:** `server/server.ts:216, 1327`  
`req.connection` was deprecated in Node.js v13.0 and removed in v21. Use `req.socket.remoteAddress` instead.

---

### 🟡 MEDIUM — [BACKEND] All quiz modes use the same model
**File:** `server/server.ts:1170–1178`  
```ts
const modeToModelMap: Record<string, string> = {
    fast:     "openai/gpt-oss-120b",
    standard: "openai/gpt-oss-120b",
    accurate: "openai/gpt-oss-120b"
};
```
All three modes map to the identical model. The mode selection UI is non-functional for quizzes.

---

### 🟡 MEDIUM — [BACKEND] Chunk `startChar` calculation is incorrect after overlap
**File:** `server/utils/textProcessing.ts:163–164`  
```ts
const overlapText = currentContent.slice(-overlap);
currentContent = overlapText + '\n\n' + para.text;
// Bug: startChar computed based on the NEW currentContent length, not the actual char offset
currentStartChar = currentStartChar + currentContent.length - overlapText.length - para.text.length - 2;
```
After the overlap is prepended, `currentStartChar` is calculated from lengths of strings that have already been modified. The resulting `startChar` / `endChar` metadata in `validateChunks` output will not accurately reflect positions in the original text, causing the validator to report false gaps/overlaps.

---

### 🟡 MEDIUM — [BACKEND] Duplicate language entries in Shiki highlighter config
**File:** `client/src/library/shikiHighlighter.ts:14–18`  
`'ruby'`, `'php'`, `'rust'`, `'kotlin'`, and `'swift'` appear twice in the `langs` array. This causes Shiki to attempt to register each language twice, which may produce console warnings or a minor initialisation delay.

---

### 🟡 MEDIUM — [FRONTEND] Race condition: stream continues after conversation switch
**File:** `client/src/context/ChatContext.tsx`  
If the user switches to a different conversation while a streaming response is in progress, `sendStreamedMessage` continues to call `setMessageHistory` after `loadConversation` has replaced the history. The streaming updates overwrite the newly loaded conversation's messages.

---

### 🟡 MEDIUM — [FRONTEND] `userOwnsConversation` limited to 20 conversations
**File:** `server/server.ts:911`, `client/src/context/ChatContext.tsx:209–212`  
The server fetches only `LIMIT 20` conversations. If the user has more than 20, `userOwnsConversation()` returns `false` for older ones and the user is redirected away from a valid conversation URL.

---

### 🟡 MEDIUM — [FRONTEND] `LivePreviewMock` renders nothing
**File:** `client/src/pages/ChatPage.tsx:15–24`  
```tsx
const LivePreviewMock = ({ isDark }: { isDark: boolean }) => {
    ...
    return (<></>);
};
```
The component is empty. The `isDark` prop is declared but never used. The Live Preview toggle is visible to users but shows a blank panel.

---

### 🟡 MEDIUM — [FRONTEND] Stop button does not actually cancel the stream
**File:** `client/src/components/Textbar.tsx:209`  
When `loading` is `true`, the send button shows a `StopIcon`, giving the impression that clicking it will stop generation. However, there is no `onClick` handler for the stop action — clicking the button does nothing.

---

### 🟡 MEDIUM — [FRONTEND] Cost guard uses wrong unit comparison
**Files:** `client/src/library/sendMessage.ts:57, 217`  
```ts
if ((model.cost_per_input_token + model.cost_per_output_token) > 2) { return; }
```
`cost_per_input_token` is expressed in **dollars per million tokens** (e.g., `0.03`). The threshold of `2` means the guard triggers only when the combined rate exceeds $2/1M tokens — an extremely high bar that will never block legitimate models. If the intent was to block models above $0.002/token (i.e., $2/1K tokens), the threshold should be `0.004` (per-token cost) or the field semantics should be clarified.

---

### 🟢 LOW — [FRONTEND] `selectedTone` and `selectedLanguage` states are unused
**File:** `client/src/components/Textbar.tsx:65–66`  
```ts
const [selectedTone, setSelectedTone] = useState("default");
const [selectedLanguage, setSelectedLanguage] = useState("auto");
```
Both are set but never read and never passed to `sendMessage`. The tone applied to requests comes from `AuthContext` (via `ChatContext`), not from the `Textbar`.

---

### 🟢 LOW — [FRONTEND] `isGroundingActive` state is unused
**File:** `client/src/components/Textbar.tsx:63`  
```ts
const [isGroundingActive, setIsGroundingActive] = useState(false);
```
Declared but never read or set anywhere in the component.

---

### 🟢 LOW — [FRONTEND] `experimental` field is never set from outside `AuthContext`
**File:** `client/src/context/AuthContext.tsx:40`  
`setExperimental` is never exported through the context value, so `experimental` is always `false` and `setExperimental` is dead code.

---

### 🟢 LOW — [BACKEND] `getSystemPrompt` called with `as any` type cast
**File:** `server/server.ts:334, 603`  
```ts
const systemPrompt = getSystemPrompt({ ... } as any);
```
The type of `getSystemPrompt`'s argument is bypassed. If the signature changes, the call site will silently pass wrong data.

---

## 4. Type Safety

### 🟡 MEDIUM — [BACKEND + FRONTEND] Pervasive use of `any` type
The following identifiers are typed as `any` throughout the codebase, eliminating compile-time safety:
- `model: any` — `ChatContext`, `DocumentContext`, `sendMessage.ts`, server endpoints
- `messageHistory: any[]` — `ChatContext`, multiple pages
- `personalInfo?: any` — `ChatOptions`, `AuthContext`
- `attachedFiles?: any[]` — `ChatOptions`, `sendMessage.ts`
- `data` / `rawData` / `parsedMessages` — all Supabase responses

---

### 🟡 MEDIUM — [FRONTEND] `messageHistory` `model` field stores both `string` and `object`
**File:** `client/src/context/ChatContext.tsx:42, 124–146`  
The type declaration says `model: string`, but some code paths populate it with the full model object (`{ name, name_id, cost_per_input_token, … }`). Components that receive `model` treat it inconsistently.

---

### 🟢 LOW — [FRONTEND] Unused imports that would fail a strict build
**File:** `client/src/pages/ChatPage.tsx:12`  
```ts
import { Rocket, ShieldCheck, Sparkles } from "lucide-react";
```
`Rocket` and `ShieldCheck` are imported but never used. With `noUnusedLocals: true` in `tsconfig.app.json` this should produce a build error.

---

## 5. UX / Unimplemented Features

### 🟡 MEDIUM — [FRONTEND] "Read Aloud" and "Regenerate" buttons have no handlers
**File:** `client/src/components/other/BotMessage.tsx:379–391`  
Both buttons render with no `onClick` prop. Clicking them does nothing.

---

### 🟡 MEDIUM — [FRONTEND] Thumbs up/down feedback is local-only
**File:** `client/src/components/other/BotMessage.tsx:228, 396–413`  
The `feedbackGiven` state is purely in-component memory. No feedback is ever sent to any backend.

---

### 🟡 MEDIUM — [FRONTEND] Canvas and Web Search are mock implementations
**File:** `client/src/library/sendMessage.ts:397–458`  
Both `sendCanvasMessage` and `sendWebSearchMessage` wait 1.5 seconds and return hard-coded placeholder text. They are not connected to any real functionality.

---

### 🟢 LOW — [BACKEND] Phase numbering mismatch in `/api/chat/ask-pdf` logs
**File:** `server/server.ts:1135`  
The logs skip from phase 6 to phase 8:
```
"🧹 [Fase 8/8] Pulizia dei duplicati..."   // immediately after [Fase 6/8]
```
Phase 7 is never logged.

---

### 🟢 LOW — [FRONTEND] `DocumentPage.tsx` uses `styles.main` twice, creating nested scrollable containers
**File:** `client/src/pages/DocumentPage.tsx:28, 103`  
Both the outer `<div>` (with the `ref`) and the inner `<main>` element receive the same `styles.main` class, which includes `overflow-y-auto`. This creates two nested scroll containers showing redundant scrollbars.

---

## 6. Performance

### 🟡 MEDIUM — [FRONTEND] `sendMessage` in `ChatContext` recreated on every message
**File:** `client/src/context/ChatContext.tsx:110`  
`messageHistory` is in the `useCallback` dependency array of `sendMessage`. Since `messageHistory` changes on every message, `sendMessage` is a new function reference after every turn — causing all consumers (including `Textbar`) to re-render unnecessarily.

---

### 🟡 MEDIUM — [FRONTEND] `MarkdownRender` runs full Shiki highlighting pipeline on every streaming chunk
**File:** `client/src/library/markdownRender.tsx:94–115`  
During streaming, `MarkdownRender` is re-rendered every ~50 ms (debounce). Each re-render invokes the full Shiki tokeniser on the entire accumulated text, including all previously highlighted code blocks. This is O(n) in text length for every chunk received.

---

### 🟢 LOW — [FRONTEND] Large dependencies loaded unconditionally
- `firebase` is initialised (`initializeApp`) at module load time even if the user never triggers a Firestore operation.
- `@webcontainer/api` is imported and exported from `webContainer.ts` but the Canvas functionality it supports is a mock.
- `@codesandbox/sandpack-react` appears in `package.json` with no evidence of active usage in the audited pages.

---

## 7. Dependency Issues

### 🟠 HIGH — [BACKEND] `dotenv` in `devDependencies` (see §3 — Correctness #1)

### 🟡 MEDIUM — [BACKEND] Two conflicting OpenRouter client libraries imported simultaneously
**File:** `server/server.ts:19–22`  
Both `@openrouter/ai-sdk-provider` (`createOpenRouter`) and `@openrouter/sdk` (`OpenRouter`) are imported and instantiated, but the former is used only for embeddings and the latter is never used at all (see §3 — Correctness #2). This adds unnecessary bundle weight.

---

*Report generated by static code analysis. No automated tools were run — all findings are from manual code reading.*
