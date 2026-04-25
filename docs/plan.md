Created 7 todos

Read [](file:///home/tommaso/.config/Code/User/workspaceStorage/88b919f8e00d2ee183d793dc51bc7f72/GitHub.copilot-chat/chat-session-resources/d6baf954-5564-40a6-a439-6dc793a7e4a6/call_00_rmw9CyaRYBI58Druw9Zj7TOb__vscode-1777104527621/content.txt)

Read memory [](file:///home/tommaso/.config/Code/User/workspaceStorage/88b919f8e00d2ee183d793dc51bc7f72/GitHub.copilot-chat/memory-tool/memories/repo/DocumentPage-improvements.md)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/server.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/package.json)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/package.json)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/package.json)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/static/systemPrompt.ts#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/routes/chat.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/routes/documents.ts#1-1), lines 1 to 300

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/routes/artifacts.ts#1-1), lines 1 to 200

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/routes/support.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/routes/conversation.ts#1-1), lines 1 to 200

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/utils/parseGenerativeUI.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/library/sendMessage.ts#1-1), lines 1 to 200

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/library/sendEmbeddingMessage.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/context/ChatContext.tsx#1-1), lines 1 to 200

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/context/AuthContext.tsx)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/services/supabase.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/App.tsx)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/services/firebase.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/config/enviroments.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/middleware/auth.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/utils/textProcessing.ts#1-1), lines 1 to 200

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/pages/DocumentPage.tsx#1-1), lines 1 to 250

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/pages/CalendarPage/CalendarPage.tsx#1-1), lines 1 to 200

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/pages/SchemaPage/SchemaPage.tsx#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/pages/ArtifactsPage.tsx#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/library/calendarTools.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/context/CalendarContext.tsx)

Read [](file:///home/tommaso/Desktop/progetto-maturita/server/middleware/logging.ts#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/library/sendMessage.ts#200-200), lines 200 to 200

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/components/generativeUI/Sandbox.tsx#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/pages/LandingPage.tsx#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/pages/CalendarPage/FloatingChat.tsx#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/components/generativeUI/GenerativeUIRenderer.tsx)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/components/generativeUI/DynamicCanvas.tsx#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/services/firebase.ts)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/context/SchemaContext.tsx)

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/context/DocumentContext.tsx#1-1), lines 1 to 100

Read [](file:///home/tommaso/Desktop/progetto-maturita/client/src/pages/ArtifactsPages/QuizPage.tsx#1-1), lines 1 to 100

Ecco il piano completo per la tesina. Analisi totalizzante del codebase — ogni API, ogni servizio, ogni flusso dati.

---

# PIANO TESINA: "Smart AI — Piattaforma AI Augmented"

## Struttura 20+ pagine

---

### CAP 1 — INTRODUZIONE (2 pp)
- **1.1** Contesto: AI generativa nel 2025-26. Modelli linguistici, API unificate (OpenRouter), RAG, Generative UI.
- **1.2** Obiettivo del progetto: piattaforma web che integri chat multi-modello, analisi documenti semantica, calendario, mappe concettuali, quiz, UI generativa.
- **1.3** Stack tecnologico: React 19, TypeScript, Vite, Express 5, Supabase, Firebase, OpenRouter, AI SDK, Tailwind CSS, Three.js, Framer Motion.

---

### CAP 2 — ARCHITETTURA GENERALE (2 pp)
- **2.1** Monorepo con concurrently: client (Vite + React) e server (Express).
- **2.2** Diagramma flusso: Browser → Vite dev server → API Express → OpenRouter/Supabase.
- **2.3** Middleware chain: CORS, JSON parser (10mb), HTTP logging, auth JWT.
- **2.4** Gestione errori globale (Express error handler, `setupGlobalErrorHandlers`).

---

### CAP 3 — AUTENTICAZIONE (2 pp)

**3.1 — Supabase Auth**
- AuthContext.tsx: init sessione via `supabase.auth.getSession()`, listener `onAuthStateChange`.
- Provider token Google (per Calendar API): estratto da `session.provider_token`.
- `ProtectedRoute.tsx`: wrapper `<Outlet>` con redirect su mancata auth.

**3.2 — Middleware `requireAuth` (server)**
- Estrae Bearer token da header.
- Verifica con `supabase.auth.getUser(token)`.
- Attacca `req.user` per route successive.

**3.3 — Firebase Auth (secondario)**
- firebase.ts: initializeApp con VITE_FIREBASE_*.
- Doppia auth: Supabase primaria + Firebase secondaria (coesistenza).

---

### CAP 4 — CHAT MULTI-MODELLO (3 pp)

**4.1 — System Prompt Engine**
- systemPrompt.ts: template con 9 sezioni componibili:
  - Core Rules (markdown, math LaTeX, code fencing)
  - User Profile (nome, job, hobby — da DB utente)
  - Tone control
  - Custom Instructions
  - **Generative UI Mode** (RAW HTML + Tailwind, 9 regole: layout adattivo, anti-ripetizione, densità, label semantici, colori ereditati, theming, sandbox)

**4.2 — API `POST /api/completion/chat`**
- Body: `{ message, history, modelName, systemPromptUser, personalInfo, tone, allowedCustomInstructions, reasoning, isBetterView, attachedFiles }`
- Rilevamento intento (code/debug) → `betterViewRenderMode: 'html' | 'markdown'`
- Chiamata OpenRouter chat completions (stream: false)
- Supporto immagini: `userContent = [{type:text}, {type:image_url}]`
- Risposta: `{ text, renderMode, usage, reasoning, metrics: { latencyMs, throughput } }`

**4.3 — API `POST /api/streamingOutput`**
- Stessa struttura ma `stream: true` + `stream_options: { include_usage: true }`
- NDJSON response: righe `{ type: "meta" | "text" | "reasoning" | "usage", content }`
- Abort handling: `req.on("close") → controller.abort()`
- Rate control: `await delay(3)` tra chunk
- Chunked transfer: `res.setHeader("Transfer-Encoding", "chunked")`

**4.4 — Reasoning Effort**
- Mapping: `fast→minimal`, `standard→medium`, `accurate→high`
- Passato a OpenRouter come `reasoning: { effort }`

**4.5 — Client sendMessage.ts**
- `sendNormalMessage`: fetch POST, salvataggio conversazione, generazione titolo automatico via `getTitleConversation`.
- `sendStreamedMessage`: NDJSON reader, update progressivo messaggio.
- `getSuggestedQuestion`: chiamata post-hoc per domande suggerite.

---

### CAP 5 — GESTIONE CONVERSAZIONI (1.5 pp)

**5.1 — API Routes `/api/conversations`**
- `POST /create` → insert Supabase `conversations`
- `POST /messages/create` → insert `messages` + update `updated_at`
- `GET /list` → select 20 conversazioni ordinate per `updated_at DESC`
- `GET /messages` → select messaggi per `conversation_id`, ordinati ASC (con reverse)
- `DELETE /delete` → delete per user_id + conversation_id
- `PATCH /update-title` → update titolo

**5.2 — Generazione Titolo Automatico**
- `POST /getTitleConversation`: prompt → `mistralai/mistral-nemo`
- Regola: max 8 parole, plain text, no markdown, no virgolette.

**5.3 — Suggested Questions**
- `POST /getSuggestedQuestion`: dopo ogni risposta, genera 3 domande di follow-up.

---

### CAP 6 — RAG: RETRIEVAL AUGMENTED GENERATION (3 pp)
**CUORE DELLA TESINA: RICERCA VETTORIALE + COSINE SIMILARITY**

**6.1 — Ingestione PDF (`POST /ingest`)**

*Fase 1:* Multer upload (memory storage).
*Fase 2:* `pdf-parse` → estrazione testo raw.
*Fase 3:* `normalizeText()`:
  - NFC normalization, rimozione caratteri di controllo
  - Collasso spazi multipli, trim

*Fase 4:* Chunking (`splitTextIntoChunks`):
  - Rilevamento heading (`detectHeadings`): linee MAIUSCOLE, pattern numerati (1., 1.2.), keyword (Capitolo, Sezione)
  - Split ricorsivo: paragrafi → frasi → parole
  - `chunkSize: 1500`, `overlap: 300`, `minChunkSize: 100`
  - Preserva confini frase e paragrafo
  - Validazione gap/overlap tra chunk

*Fase 5:* Embedding via OpenRouter:
  - Modello: `openai/text-embedding-3-small`
  - `embedMany()` dal `ai` SDK
  - Prefix: `[Documento: filename | Sezione: ...]`
  - Output: vettori 1536-dim

*Fase 6:* Salvataggio Supabase:
  - Tabella `documents`: `{ user_id, content, embedding, metadata, document_id, created_at }`
  - `metadata`: `{ source, title, category, document_id, order, startChar, endChar, sectionHeading }`

**6.2 — Query RAG (`POST /ask-pdf`)**

*Fase 1:* Ricezione: `{ question, model, user_id, document_id, reasoning }`
*Fase 2:* Embedding domanda:
  - `embed({ model: text-embedding-3-small, value: "Ricerca nel documento: ..." })`
*Fase 3:* **Ricerca vettoriale** — `supabase.rpc('match_documents', ...)`:
  - `query_embedding`: vettore domanda
  - `match_threshold: 0.4` (soglia similarità coseno)
  - `match_count: 7` (top-K)
  - `filter_user_id` + `selected_id` (filtri)
  - **Cosine similarity**: funzione RPC PostgreSQL (pgvector). La similarità coseno misura l'angolo tra due vettori:
    $$\text{cosine\_similarity}(A,B) = \frac{A \cdot B}{\|A\| \|B\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
  - Valori: 1 = identico, 0 = ortogonale, -1 = opposto. Soglia 0.4 garantisce chunks semanticamente correlati.

*Fase 4:* Costruzione contesto: merge chunks con sezione/heading come prefisso.

*Fase 5:* LLM completion: prompt system + `contextText` + domanda → OpenRouter.
*Fase 6:* Risposta NDJSON: `{ type: "result", answer, sources }`.

**6.3 — Flusso Client**
- sendEmbeddingMessage.ts: reader NDJSON, update progressivo log (Fase 1/8...8/8), render finale con fonti.
- DocumentPage.tsx: wizard 3-step, PDF preview via Supabase Storage signed URL.

---

### CAP 7 — GENERATIVE UI (2 pp)

**7.1 — Il Sistema `isBetterView`**
- Flag toggleabile dall'utente "Better View".
- Rilevamento automatico intento: se messaggio contiene codice/debug → force markdown.
- System prompt sezione "Generative UI Mode": 9 regole per output RAW HTML + Tailwind.

**7.2 — Parser parseGenerativeUI.ts**
- Regex: `/<ui-component type="([^"]+)">([\s\S]*?)<\/ui-component>/g`
- Output: `ParsedChunk[]` con alternanza text/component.
- Fallback: JSON malformato → renderizzato come plain text (zero perdita).

**7.3 — Component Registry (GenerativeUIRenderer.tsx)**
- `dynamic` → DynamicCanvas.tsx: motore layout dichiarativo.
  - Primitive: container, text, metric, progress, icon, divider, label, sparkline.
  - Sistema di colori semantici con mapping dark/light.
  - Animazioni Framer Motion progressive.
- `sandbox` → Sandbox.tsx: iframe sandboxato con:
  - Tailwind CDN, Chart.js, Luxon, D3 pre-iniettati.
  - PostMessage per resize dinamico e error reporting.
  - `sandbox="allow-scripts"` per isolamento sicurezza.

**7.4 — Adaptive Layout Strategy**
- AI sceglie layout in base ai dati: colonna singola (narrative) vs griglia (card omogenee).
- 9 regole di composizione: anti-ripetizione, densità, etichette opzionali, colori ereditati, theming.

---

### CAP 8 — CALENDARIO (1.5 pp)

**8.1 — Google Calendar API Integration**
- Provider token da sessione Supabase OAuth.
- `GET calendar/v3/calendars/primary/events` con `timeMin`/`timeMax` settimanali.

**8.2 — Calendar Tools System**
- calendarTools.ts:
  - `searchEvents()`: query eventi per data/keyword
  - `createEvent()`: creazione appuntamenti
  - Schema JSON per Function Calling OpenRouter
  - `executeToolCall()`: dispatcher basato su `toolName`

**8.3 — FloatingChat**
- FloatingChat.tsx: pannello AI per azioni calendario.
- Modello selezionabile (Gemini 2.5 Flash Lite, Mistral 8B, GPT-5 Nano).
- `useCalendar` context per toggle visibilità.

**8.4 — Visualizzazione Settimanale**
- Griglia: 60 colonna ore × 7 giorni.
- Event grouping `O(N)` precomputato per performance.
- `ROW_HEIGHT = 40px`, intervalli orari.

---

### CAP 9 — SCHEMA/MIND MAP (1.5 pp)

**9.1 — `POST /api/artifacts/schema-tree`**
- Body: `{ messages, currentSchema, model }`
- System prompt specializzato: output JSON con `{ message, schema }`
- Regole: mantieni ID esistenti, aggiorna solo nodi modificati, `schema: null` solo per domande non-modificative.
- Modelli: fast→gpt-oss-120b, balanced→gemma-4-31b, pro→miMo-v2.5

**9.2 — SchemaContext.tsx**
- Stato: array `SchemaNodeData[]` (ricorsivo: id, title, description, children)
- `sendMessage()`: chiamata API + update schema + append messaggi cronologia.

**9.3 — `SchemaNode` Componente Ricorsivo**
- input titolo, textarea descrizione, pulsanti add/delete.
- Linee di connessione CSS, animazioni hover.
- Profondità illimitata (albero ricorsivo).

---

### CAP 10 — QUIZ GENERATOR (1 p)

**10.1 — `POST /api/artifacts/quiz/generate`**
- Body: `{ topic, mode }`
- `response_format: { type: "json_schema" }` — costrizione output a schema valido.
- Schema: 10 domande, 4 opzioni (A-D), 1 risposta corretta enum.
- `temperature: 0.5`, `require_parameters: true`.
- Normalizzazione: trim, uppercase, validazione campi.

---

### CAP 11 — OTHER FEATURES (1 p)

**11.1 — Support Tickets** (`/api/support`)
- `POST /submit`: insert in `support_tickets` (user_id, email, problem_type, subject, message, status='open').
- `POST /getUserTickets`: select per userId, ordinati per data.

**11.2 — Logging System**
- Server: monkey-patch `console.log/warn/error` → `auditLogs[]` (max 500).
- HTTP logging middleware: ogni request/response con durata, status, IP.
- Client: `POST /logs` da `remoteLogger.ts` → `clientLogs[]`.
- Admin endpoints: `GET /api/logs`, `GET /api/client-logs`, `DELETE /api/logs`.

**11.3 — WebContainer** (`webContainer.ts`)
- Boot API di WebContainers per esecuzione Node.js in-browser.
- Install dipendenze, esecuzione codice, terminale interattivo.

---

### CAP 12 — INFRASTRUTTURA E DEPLOY (1.5 pp)

**12.1 — Configurazione Ambienti** (enviroments.ts)
- Loading `.env` da multiple directory candidate.
- Variabili: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENROUTER_KEY`, `ADMIN_PASSWORD`, `PORT`.

**12.2 — Supabase Schema**
- `conversations`: id, user_id, title, timestamps
- `messages`: id, conversation_id, sender, content, usage, model, render_mode, reasoning_text
- `documents`: user_id, content, embedding (vector), metadata (jsonb), document_id
- `support_tickets`: user_id, email, problem_type, subject, message, status, admin_reply
- `user_instructions`: user_id, instructions (jsonb)
- `user_preferences`: user_id, preferences (jsonb)

**12.3 — Funzione RPC pgvector**
```sql
CREATE OR REPLACE FUNCTION match_documents(...)
RETURNS TABLE(...)
LANGUAGE plpgsql
AS $$
  SELECT *
  FROM documents
  WHERE user_id = filter_user_id
    AND document_id = selected_id
    AND embedding <=> query_embedding < 1 - match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```
- Operatore `<=>` = distanza coseno. `1 - cosine_similarity = cosine_distance`.
- `match_threshold: 0.4` → `cosine_distance < 0.6`.

---

### CAP 13 — METRICHE E PERFORMANCE (1 p)

- Calcolo latenza: `Date.now()` pre/post richiesta.
- Throughput: `outputTokens / latencySec`.
- Memorizzazione usage tokens per messaggio (`prompt_tokens`, `completion_tokens`, `cost`).
- Ottimizzazioni DocumentPage: `useMemo`, `React.memo`, `useCallback`, scroll debouncing.

---

### CAP 14 — CONCLUSIONI (1 p)

- Risultati: piattaforma funzionante con 6 moduli integrati.
- Open challenges: virtual scrolling per chat lunghe, caching IndexedDB, paginazione messaggi, optimistic updates.
- Possibili evoluzioni: multi-tenant, RAG ibrido, fine-tuning modelli.

---

**TOTALE: ~22-25 pp** con diagrammi, spezzoni di codice chiave, formule matematiche (cosine similarity, embedding), schema architetturale.

---

**Ordine di scrittura suggerito:**
1. Cap 2 (architettura) + diagramma flusso
2. Cap 6 (RAG — cuore tecnico)
3. Cap 4 (chat multi-modello)
4. Cap 7 (Generative UI)
5. Cap 3 (auth)
6. Cap 5 (conversazioni)
7. Cap 8 (calendario)
8. Cap 9-11 (altri moduli)
9. Cap 12 (infrastruttura)
10. Cap 13 (metriche)
11. Cap 1 + 14 (intro/conclusione)