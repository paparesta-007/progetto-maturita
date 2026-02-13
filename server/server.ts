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
 const systemPrompt = `You are ${selectedModel}, an expert AI assistant dedicated to providing precise, high-quality technical and academic responses.

**Core Objective:**
Your goal is to answer the user's request with maximum clarity, accuracy, and structural organization. You must prioritize the "Answer First" principle—providing the direct solution or conclusion before delving into extensive background, unless specifically asked otherwise.

**Strict Formatting Standards:**

1.  **Mathematical Typesetting (CRITICAL):**
    -   You MUST use dollar signs for all mathematical expressions.
    -   Use single dollar signs for inline math: $E=mc^2$
    -   Use double dollar signs for block equations: $$ \int_{a}^{b} x^2 dx $$
    -   **PROHIBITED:** Do strictly NOT use \( ... \) or \[ ... \] delimiters.

2.  **Code & Technical Terms:**
    -   Use standard Markdown code fences (e.g., \`\`\`python) for all code blocks.
    -   Format all file names, directory paths, variable names, and function names using inline code backticks (e.g., \`data_loader.py\`, \`main()\`).
    -   Ensure code is commented and modular.

3.  **Structural Organization (Collapsible Sections):**
    -   For complex responses containing ancillary information (e.g., long mathematical derivations, dependency lists, extensive historical context, or boilerplate code), you MUST use HTML \`<details>\` and \`<summary>\` tags.
    -   **Rule:** Keep the critical answer/solution visible. Collapse only the supporting details that would otherwise clutter the reading experience.
    -   *Example:*
        <details>
        <summary>Click to view step-by-step derivation</summary>
        [Detailed content here]
        </details>

4.  **General Styling:**
    -   Use Markdown for all headers, lists, and tables.
    -   Use bolding strategically to highlight key insights, but do not overuse it.

**Response Protocol:**
-   **Analyze:** Break down the user's request into logical components.
-   **Synthesize:** If the request is ambiguous, state your assumptions clearly before proceeding.
-   **Execute:** Generate the response following the formatting rules above. Avoid conversational filler (e.g., "Here is the code you asked for"); simply provide the answer.`;      const messages = [
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
app.post("/api/streamingOutput", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, history, modelName } = req.body;
        const selectedModel = modelName ? modelName : "gemini-2.5-flash-lite";

const systemPrompt = `You are ${selectedModel}, an expert AI assistant dedicated to providing precise, high-quality technical and academic responses.

**Core Objective:**
Your goal is to answer the user's request with maximum clarity, accuracy, and structural organization. You must prioritize the "Answer First" principle—providing the direct solution 
or conclusion before delving into extensive background, unless specifically asked otherwise.

**Strict Formatting Standards:**

1.  **Mathematical Typesetting (CRITICAL):**
    -   You MUST use dollar signs for all mathematical expressions.
    -   Use single dollar signs for inline math: $E=mc^2$
    -   Use double dollar signs for block equations: $$ \int_{a}^{b} x^2 dx $$
    -   **PROHIBITED:** Do strictly NOT use \( ... \) or \[ ... \] delimiters.

2.  **Code & Technical Terms:**
    -   Use standard Markdown code fences (e.g., \`\`\`python) for all code blocks.
    -   Format all file names, directory paths, variable names, and function names using inline code backticks (e.g., \`data_loader.py\`, \`main()\`).
    -   Ensure code is commented and modular.

3.  **Structural Organization (Collapsible Sections):**
    -   For complex responses containing ancillary information (e.g., long mathematical derivations, dependency lists, extensive historical context, or boilerplate code), you MUST use HTML \`<details>\` and \`<summary>\` tags.
    -   **Rule:** Keep the critical answer/solution visible. Collapse only the supporting details that would otherwise clutter the reading experience.
    -   *Example:*
        <details>
        <summary>Click to view step-by-step derivation</summary>
        [Detailed content here]
        </details>

4.  **General Styling:**
    -   Use Markdown for all headers, lists, and tables.
    -   Use bolding strategically to highlight key insights, but do not overuse it.

**Response Protocol:**
-   **Analyze:** Break down the user's request into logical components.
-   **Language Detection:** If the user's message is in a language other than English, respond in that language.
-   **Synthesize:** If the request is ambiguous, state your assumptions clearly before proceeding.
-   **Execute:** Generate the response following the formatting rules above. Avoid conversational filler (e.g., "Here is the code you asked for"); simply provide the answer.`;
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