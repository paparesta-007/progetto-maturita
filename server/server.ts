"use strict";
// SUGGERIMENTO: Per progetti più grandi, considera di dividere le rotte in file separati
// (ad es. una cartella 'routes') per migliorare la manutenibilità.

import dotenv from "dotenv";
// A) importing librerie
import http from "http";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";
import cors from "cors";

import { generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import getSystemPrompt from "./static/systemPrompt.js"; // Funzione per generare un prompt di sistema dettagliato e specifico per il modello selezionato. Definita in client/src/library/systemPrompt.ts
import { z } from 'zod';
import path from "path";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// B) configurazione server
// SUGGERIMENTO: Rendi la porta configurabile tramite variabili d'ambiente per una maggiore flessibilità.
// const port: number = parseInt(process.env.PORT || "3000", 10);
const port: number = 3000;
let paginaErr: string = "";
const app: express.Express = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configura la cartella static puntando a server/static
app.use(express.static(path.join(__dirname, "static")));

// Sostituisci la tua riga dotenv.config con questa:
const envPath = path.resolve(__dirname, ".env");
dotenv.config({ path: envPath });

console.log("Percorso cercato per .env:", envPath);
console.log("Controllo API Key:", process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Presente" : "Mancante");

// Update dotenv configuration to load .env.local if it exists
dotenv.config({ path: path.resolve(__dirname, ".env.local") });
const openrouter = createOpenRouter({
    apiKey: process.env.VITE_OPENROUTER_API_KEY,
});
// C) creazione server e lettura file sincrona
// SUGGERIMENTO: È meglio leggere i file necessari all'avvio in modo sincrono
// per evitare race condition in cui il server potrebbe rispondere a una richiesta
// prima che il file sia stato completamente letto.
try {
    const errorPagePath = path.join(__dirname, 'static', 'error.html');
    paginaErr = fs.readFileSync(errorPagePath, 'utf-8'); // o il tuo metodo di lettura
} catch (err) {
    paginaErr = "<h1>Risorsa non trovata</h1>";
    console.error("Impossibile leggere la pagina di errore:", err);
}

const server: http.Server = http.createServer(app);

server.listen(port, function () {
    // SUGGERIMENTO: Per un logging più avanzato e strutturato, considera librerie come 'winston' o 'pino'.
    // Permettono di avere log con diversi livelli (info, warn, error) e in formati come JSON,
    // più facili da analizzare in produzione.
    console.log("Server in ascolto sulla porta " + port);
});


// D) Middleware
// SUGGERIMENTO PER LA SICUREZZA: Limita l'accesso solo ai domini che ospitano il tuo frontend.
// Esempio: app.use(cors({ origin: 'https://tuo-frontend.com' }));
app.use(cors());

// Middleware di logging per ogni richiesta
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const start = Date.now();
    console.log(`Metodo: ${req.method}, URL: ${req.originalUrl}`);
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`Request to ${req.originalUrl} took ${duration}ms - Status: ${res.statusCode}`);
    });
    next();
});

// SUGGERIMENTO: La riga qui sotto è ridondante perché hai già una gestione più robusta
// dei file statici con path.join all'inizio del file. Puoi rimuoverla.
// app.use("/", express.static("./static"));

// Middleware per il parsing del body JSON
app.use("/", express.json({ limit: "10mb" }));

// Middleware per loggare il body delle richieste POST
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.body && Object.keys(req.body).length > 0) {
        console.log("-------------------\nParametri post: " + JSON.stringify(req.body));
    }
    next();
});


// E) Rotte API
app.get("/api/gemini/generate", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const startTime = Date.now();
        const prompt = decodeURIComponent(req.query.prompt as string) || "Explain what is climate change like I am 10 years old. short answer.";

        // SUGGERIMENTO: Sposta i nomi dei modelli in variabili d'ambiente per non averli hardcoded.
        // const modelName = process.env.GEMINI_GENERATE_MODEL || "gemini-2.5-flash-lite";
        const { text, usage } = await generateText({
            model: google("gemini-2.5-flash-lite"), // SUGGERIMENTO: Valuta se usare un modello stabile per produzione.
            system: "You are a 8 years old kid",
            prompt: prompt,
        });

        const endTime = Date.now();
        res.send({ text, usage, totaltime: endTime - startTime });
    } catch (error) {
        next(error);
    }
});

app.get("/api/gemini/structured-output", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const randomNum = Math.floor(Math.random() * 1000);
        const prompt = `Generate 10 flashcard about ${decodeURIComponent(req.query.prompt as string)} Use a random creative angle seed: ${randomNum}.` || "Generate quiz for learning basic of Star Wars universe";
        const startTime = Date.now();

        const { object, usage } = await generateObject({
            model: google("gemini-2.5-flash-lite"), // SUGGERIMENTO: Valuta se usare un modello stabile per produzione.
            temperature: 1.2,
            seed: randomNum,
            schema: z.object({
                flashcards: z.array(z.object({
                    question: z.string().describe("The question on the front of the flashcard"),
                    options: z.array(z.string()).describe("Multiple choice options for the question, 4 choices"),
                    answer: z.string().describe("The correct answer to the question"),
                    explanation: z.string().optional().describe("A brief explanation of the answer"),
                })).describe("A list of quiz to help learn about the topic"),
            }),
            prompt: prompt,
        });
        const endTime = Date.now();
        res.send({ object, usage, totaltime: endTime - startTime });
    } catch (error) {
        next(error);
    }
});

// Add this inside server.ts, before the default 404 route

app.post("/api/gemini/chat/stream", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, history, modelName } = req.body;

        const allowedModels = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
        const selectedModel = modelName && allowedModels.includes(modelName) ? modelName : "gemini-2.5-flash-lite";

        const messages = [
            ...history,
            { role: 'user', content: message }
        ];

        // Intestazioni per lo streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader("Transfer-Encoding", "chunked");
        res.flushHeaders(); // FONDAMENTALE: forza l'invio immediato degli header e apre il flusso

        const { textStream } = streamText({
            model: google(selectedModel as any),
            messages: messages,
        });

        for await (const textPart of textStream) {
            res.write(textPart);
        }

        res.end();
    } catch (error) {
        next(error);
    }
});

app.post("/api/gemini/chat", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, history, modelName } = req.body;

        // SUGGERIMENTO PER LA SICUREZZA: Valida l'input ricevuto dal client.
        // Ad esempio, assicurati che 'modelName' sia uno dei modelli che intendi esporre.

        const selectedModel = modelName ? modelName : "gemini-2.5-flash-lite";
      const systemPrompt = getSystemPrompt({ selectedModel }); // Funzione che genera un prompt di sistema dettagliato e specifico per il modello selezionato. Definita in client/src/library/systemPrompt.ts
const messages = [
            ...history,
            { role: 'user', content: message }
        ];

        const { text, usage } = await generateText({
            model: openrouter(modelName),
            messages: messages,
            system: systemPrompt,
        });

        res.send({ text, usage });
    } catch (error) {
        next(error);
    }
});
app.post("/api/gemini/getTitleConversation", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message } = req.body;// Funzione che genera un prompt di sistema dettagliato e specifico per il modello selezionato. Definita in client/src/library/systemPrompt.ts


        const { text, usage } = await generateText({
            model: openrouter("mistralai/ministral-3b-2512"),
            prompt: `Genera un titolo breve (massimo 8 parole) e descrittivo per una conversazione basata su questo messaggio iniziale: "${message}". Il titolo dovrebbe catturare l'essenza del messaggio in modo accattivante e informativo. 
            EVITA ASSOLUTAMENTE USO MARKDOWN, SOLO PLAIN TEXT, e NON includere virgolette o simboli speciali. Il titolo deve essere adatto per essere visualizzato in una lista di conversazioni.`,
        });

        res.send({ text, usage });
    } catch (error) {
        next(error);
    }
});
app.post("/api/streamingOutput", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, history, modelName } = req.body;
        const selectedModel = modelName ? modelName : "gemini-2.5-flash-lite";

        const systemPrompt = `You are ${selectedModel}, an expert AI assistant dedicated to providing precise, high-quality technical and academic responses.

**Core Objective:**
Answer the user's request with maximum clarity, accuracy, and structural organization. Prioritize the "Answer First" principle — provide the direct solution or conclusion before background details, unless asked otherwise.

---

## STRICT FORMATTING RULES (MANDATORY — VIOLATIONS CAUSE RENDERING FAILURES)

### 1. MATHEMATICAL TYPESETTING (CRITICAL — READ CAREFULLY)

**Allowed delimiters (ONLY these two):**
- Inline math: \`$...$\`  — Example: \`$E = mc^2$\`
- Block math: \`$$...$$\` — Example: \`$$\\int_{a}^{b} x^2 \\, dx$$\`

**ABSOLUTELY PROHIBITED delimiters (NEVER use these):**
- \\( ... \\) — FORBIDDEN
- \\[ ... \\] — FORBIDDEN
- \\begin{equation} ... \\end{equation} outside of $$ blocks — FORBIDDEN
- Bare LaTeX without dollar-sign wrappers — FORBIDDEN

**Rules to prevent rendering conflicts:**
- A dollar sign \`$\` used as currency (e.g., $100) must NEVER appear adjacent to another \`$\`. Write "100 USD" or "100 dollari" instead.
- NEVER place math expressions inside Markdown table cells. If you need a table with math, present the data as a definition list or bullet list instead. Tables with \`|\` and LaTeX \`|\` (e.g., absolute value, set notation) WILL break.
- Inside $$...$$ blocks, use \\lvert ... \\rvert instead of | for absolute values.
- Inside $$...$$ blocks, use \\mid instead of | for "such that" or divisibility.
- Inside $$...$$ blocks, use \\| instead of || for norms.
- NEVER use raw underscores _ outside of math or code contexts. In prose, use **bold** instead of _italic_ to avoid conflicts with LaTeX subscripts.
- NEVER start a line with $$ and end it on a different line that also has unrelated $$. Each block equation must be self-contained:

CORRECT:
$$
E = mc^2
$$

INCORRECT:
$$ E = mc^2
some text
$$

### 2. CODE BLOCKS (CRITICAL)

- Use standard fenced code blocks with triple backticks and a language identifier:

\`\`\`python
def hello():
    print("Hello")
\`\`\`

- ALWAYS specify the language after the opening backticks (python, javascript, typescript, bash, sql, json, html, css, text, etc.).
- If unsure of the language, use \`text\`.
- NEVER nest fenced code blocks (triple backticks inside triple backticks). This breaks the parser.
- NEVER place fenced code blocks inside HTML tags like <details>. The Markdown parser cannot handle this correctly.
- Format file names, paths, variables, and functions with single backticks: \`main.py\`, \`useState()\`.
- NEVER use $...$ or $$...$$ inside code blocks. Code blocks are literal text, not math.

### 3. STRUCTURAL ORGANIZATION

For complex responses with supporting details (derivations, dependency lists, historical context):

- Use Markdown headers (##, ###) and bullet/numbered lists for organization.
- Do NOT use HTML <details> or <summary> tags. They conflict with the rendering pipeline.
- Instead, organize content with clear headers:
  - Put the main answer under a "## Solution" or "## Answer" header.
  - Put derivations under "### Derivation" or "### Step-by-step".
  - Put supplementary info under "### Additional Notes".

### 4. TABLES

- Use Markdown tables ONLY for simple textual/numeric data.
- NEVER put LaTeX math ($...$) inside table cells.
- NEVER put code blocks inside table cells.
- If you need to present mathematical data in tabular form, use a bullet list or definition list:

CORRECT (list format for math data):
- **x = 1**: $f(1) = 3$
- **x = 2**: $f(2) = 7$

INCORRECT (math in table):
| x | f(x) |
|---|------|
| $1$ | $3$ |

### 5. GENERAL FORMATTING

- Use Markdown headers, bold, and lists for structure.
- Use **bold** for emphasis. Avoid _underscores for italics_ (conflicts with LaTeX).
- Use *single asterisks* if italics are truly needed.
- Do not use HTML tags except for line breaks (<br>) if absolutely necessary.
- NEVER produce raw HTML tables (<table>, <tr>, <td>). Use Markdown tables only.
- Avoid deeply nested lists (more than 3 levels).

---

## RESPONSE PROTOCOL

1. **Analyze**: Break down the request into components.
2. **Language**: Respond in the same language as the user's message.
3. **Assumptions**: If ambiguous, state assumptions before proceeding.
4. **Execute**: Generate the response following ALL rules above. No filler phrases. Provide the answer directly.`;
        const messages = [
            ...history,
            { role: 'user', content: message }
        ];

        // 1. Configurazione OpenRouter con Header (FONDAMENTALE per il logging corretto)
        // Assicurati che l'istanza 'openrouter' sia configurata o passata qui con gli header custom
        // Se usi createOpenRouter, passali lì. Se non puoi, molti proxy li accettano così:
        const result = streamText({
            model: openrouter(selectedModel),
            messages: messages,
            system: systemPrompt,
            // Aggiungiamo callback per debuggare il problema
            onFinish: ({ usage, text }) => {
                // SE vedi questo log, la chiamata è finita correttamente.
                // SE NON lo vedi, il client ha staccato la spina prima.
                console.log("Stream completato. Usage:", usage);
                console.log("Token usati:", usage.totalTokens);
            },
            headers: {
                // Questi header aiutano OpenRouter a tracciare la chiamata al tuo account
                "HTTP-Referer": "https://tuo-sito.com",
                "X-Title": "NomeTuaApp"
            }
        });

        // 2. Imposta gli header della risposta
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Header opzionali per evitare buffering dei proxy (Nginx, Vercel, ecc.)
        res.setHeader('X-Accel-Buffering', 'no');

        // 3. Pipe alla risposta
        result.pipeTextStreamToResponse(res);

        // 4. Gestione disconnessione client (Opzionale ma utile per debug)
        res.on('close', () => {
            // Questo scatta se l'utente chiude la connessione
            // Se scatta PRIMA del console.log di onFinish, hai trovato il colpevole.
            console.log("Client disconnesso dalla stream.");
        });

    } catch (error) {
        next(error);
    }
});

// F) Gestione rotta di default (404)
app.use("/", function (req: express.Request, res: express.Response) {
    res.status(404);
    if (!req.originalUrl.startsWith("/api/")) {
        res.send(paginaErr);
    } else {
        res.json({ error: "Risorsa non trovata" });
    }
});

// G) Gestione errori globale
app.use("/", function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    console.error("--- SERVER ERROR DETAIL ---");
    console.error(err); // Questo ti dirà se è un errore di autenticazione o di parsing

    res.status(500).json({
        error: "Internal Server Error",
        details: err.message, // Ti aiuta a capire il problema durante lo sviluppo
        path: req.originalUrl
    });
});