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

import multer from 'multer';

import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { ur } from "zod/v4/locales";

const upload = multer({ storage: multer.memoryStorage() });
import { PDFParse } from "pdf-parse";
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

// Update dotenv configuration to load .env.local if it exists
dotenv.config({ path: path.resolve(__dirname, ".env.local") });
const openrouter = createOpenRouter({
    apiKey: process.env.VITE_OPENROUTER_API_KEY,
});

const openrouterEmbeddings = createOpenAI({
    apiKey: process.env.VITE_OPENROUTER_API_KEY, // La tua chiave OpenRouter
    baseURL: "https://openrouter.ai/api/v1",
});
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

try {
    const errorPagePath = path.join(__dirname, 'static', 'error.html');
    paginaErr = fs.readFileSync(errorPagePath, 'utf-8'); // o il tuo metodo di letturaf
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
app.post("/api/completion/chat", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, history, modelName, systemPromptUser, personalInfo, tone, allowedCustomInstructions } = req.body;

        // Assicurati di usare un ID modello valido per OpenRouter
        const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";

        const systemPrompt = getSystemPrompt({ selectedModel, systemPromptUser, personalInfo, tone, allowedCustomInstructions } as any);
        const messages = [
            ...history,
            { role: 'user', content: message }
        ];

        // 1. START Timer 
        const startTime = Date.now();

        const { text, usage } = await generateText({
            model: openrouter(selectedModel),
            messages: messages,
            system: systemPrompt,
            headers: {
                "HTTP-Referer": "localhost:3000/completion",
                "X-Title": "NomeTuaApp"
            }
        });

        // 2. STOP Timer
        const endTime = Date.now();

        // 3. Calcoli Metriche
        const latencyMs = endTime - startTime; // Tempo totale in millisecondi (Latenza)
        const latencySec = latencyMs / 1000;   // Tempo totale in secondi per il calcolo del throughput

        // Calcolo Throughput: (Token Generati / Tempo Totale in secondi)
        // Controllo latencySec > 0 per evitare divisioni per zero in casi limite (es. risposte istantanee in mock)
        const throughput = latencySec > 0 && usage.outputTokens
            ? (usage.outputTokens / latencySec)
            : 0;
        console.log("******TEST COMPLETATO: METRICHE******");
        console.log("Usage:", usage);
        console.log(`Latenza: ${latencyMs} ms, Throughput: ${throughput.toFixed(2)} t/s`);
        res.send({
            text,
            usage,
            metrics: {
                latencyMs: Math.round(latencyMs),             // Es: 1250 ms
                throughput: parseFloat(throughput.toFixed(2)) // Es: 54.30 t/s
            }
        });

    } catch (error) {
        next(error);
    }
});
app.post("/api/gemini/getTitleConversation", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message } = req.body;// Funzione che genera un prompt di sistema dettagliato e specifico per il modello selezionato. Definita in client/src/library/systemPrompt.ts


        const { text, usage } = await generateText({
            model: openrouter("mistralai/mistral-nemo"),
            prompt: `Genera un titolo breve e coinciso (massimo 8 parole) e descrittivo per una conversazione basata su questo messaggio iniziale: "${message}". Il titolo dovrebbe catturare l'essenza del messaggio in modo accattivante e informativo. 
            EVITA ASSOLUTAMENTE USO MARKDOWN, SOLO PLAIN TEXT, e NON includere virgolette o simboli speciali. Il titolo deve essere adatto per essere visualizzato in una lista di conversazioni.`,
            headers: {
                "HTTP-Referer": "localhost:3000/getTitleConversation",
                "X-Title": "NomeTuaApp"
            }
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

        // Funzione per il delay
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const systemPrompt = getSystemPrompt({ selectedModel });
        const messages = [
            ...history,
            { role: 'user', content: message }
        ];

        const result = streamText({
            model: openrouter(selectedModel),
            messages: messages,
            system: systemPrompt,
            onFinish: ({ usage, text }) => {
                console.log("Generazione LLM completata. Usage:", usage);
            },
            headers: {
                "HTTP-Referer": "localhost:3000/streamingOutput",
                "X-Title": "NomeTuaApp"
            }
        });

        // 2. Imposta gli header della risposta
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('X-Accel-Buffering', 'no');

        // 3. Gestione manuale dello stream con Delay
        // Invece di result.pipeTextStreamToResponse(res), facciamo un ciclo for await:
        try {
            for await (const textPart of result.textStream) {
                res.write(textPart);
                // Aggiungi il ritardo di 5ms (o più se necessario)
                await delay(11);
            }
        } catch (streamError) {
            console.error("Errore durante lo streaming:", streamError);
        } finally {
            // Chiudi la risposta alla fine del ciclo
            res.end();
        }

        // 4. Gestione disconnessione client
        res.on('close', () => {
            console.log("Client disconnesso dalla stream.");
        });

    } catch (error) {
        next(error);
    }
});

// ✅ VERSIONE MIGLIORATA: Parser intelligente con overlapping preservato
function splitTextIntoChunks(
    text: string,
    chunkSize: number = 1000,
    overlap: number = 200,
    options: {
        respectSentences?: boolean;  // Rispetta i confini delle frasi
        respectParagraphs?: boolean; // Preferisce i limiti dei paragrafi
        minChunkSize?: number;       // Grandezza minima del chunk
    } = {}
): Array<{ content: string; metadata: { startChar: number; endChar: number; order: number } }> {

    const {
        respectSentences = true,
        respectParagraphs = true,
        minChunkSize = 100
    } = options;

    // Pulisci il testo mantenendo la struttura
    let cleanedText = text
        .replace(/\r\n/g, '\n')      // Normalizza line endings
        .replace(/\n{3,}/g, '\n\n'); // Riduci spazi verticali eccessivi

    const chunks: Array<{ content: string; metadata: any }> = [];
    let currentPosition = 0;
    let chunkOrder = 0;

    while (currentPosition < cleanedText.length) {
        let endPosition = Math.min(currentPosition + chunkSize, cleanedText.length);

        // 1️⃣ Se non siamo alla fine, evita di spezzare le parole
        if (endPosition < cleanedText.length && cleanedText[endPosition] !== ' ' && cleanedText[endPosition] !== '\n') {
            // Torna indietro fino allo spazio più vicino
            const lastSpace = cleanedText.lastIndexOf(' ', endPosition);
            const lastNewline = cleanedText.lastIndexOf('\n', endPosition);
            const breakPoint = Math.max(lastSpace, lastNewline);

            if (breakPoint > currentPosition) {
                endPosition = breakPoint;
            }
        }

        // 2️⃣ Se respectSentences è attivo, tenta di spezzare dopo un punto
        if (respectSentences && endPosition < cleanedText.length) {
            const nextSentenceEnd = cleanedText.indexOf('.', endPosition);
            const nextParagraph = cleanedText.indexOf('\n\n', endPosition);

            // Se il prossimo punto è vicino (entro 10% del chunkSize), usa quello
            if (nextSentenceEnd !== -1 && nextSentenceEnd - endPosition < chunkSize * 0.1) {
                endPosition = nextSentenceEnd + 1;
            }
            // Altrimenti se c'è un paragrafo, preferisci quello
            else if (respectParagraphs && nextParagraph !== -1 && nextParagraph - endPosition < chunkSize * 0.15) {
                endPosition = nextParagraph;
            }
        }

        // 3️⃣ Estrai il chunk
        let chunk = cleanedText.substring(currentPosition, endPosition).trim();

        // 4️⃣ Salta chunk troppo piccoli (a meno che non sia l'ultimo)
        if (chunk.length < minChunkSize && currentPosition + chunkSize < cleanedText.length) {
            currentPosition = endPosition;
            continue;
        }

        if (chunk.length > 0) {
            chunks.push({
                content: chunk,
                metadata: {
                    startChar: currentPosition,
                    endChar: endPosition,
                    order: chunkOrder++,
                    length: chunk.length
                }
            });
        }

        // 5️⃣ Calcola il prossimo punto di partenza CON overlapping intelligente
        // L'overlapping si basa sulla posizione precedente, non sulla nuova
        const stepSize = Math.max(chunkSize - overlap, minChunkSize);
        currentPosition += stepSize;

        // Evita che i chunk si sovrappongano eccessivamente
        if (currentPosition < endPosition - overlap) {
            currentPosition = endPosition - overlap;
        }
    }

    return chunks;
}

// ✅ HELPER FUNCTION: Validazione dei chunk
function validateChunks(chunks: Array<any>): { isValid: boolean; gaps: number[]; overlaps: number[] } {
    const gaps: number[] = [];
    const overlaps: number[] = [];

    for (let i = 0; i < chunks.length - 1; i++) {
        const currentEnd = chunks[i].metadata.endChar;
        const nextStart = chunks[i + 1].metadata.startChar;

        if (nextStart > currentEnd) {
            gaps.push(nextStart - currentEnd); // Testo mancante tra i chunk
        } else if (nextStart < currentEnd) {
            overlaps.push(currentEnd - nextStart); // Overlapping tra i chunk
        }
    }

    return {
        isValid: gaps.length === 0,
        gaps,
        overlaps
    };
}
// ROUTE: Ingestione Documenti (PDF -> Vector DB)
app.post("/api/documents/ingest", upload.single("file"), async (req: express.Request, res: express.Response) => {
    // NOTA: Ho rimosso 'next' per gestire la risposta direttamente qui ed evitare timeout
    try {
        console.log("📂 [1/6] Ricevuta richiesta ingestione...");

        // 1. Validazione Input
        if (!req.file) throw new Error("Nessun file caricato");

        const { user_id, category, title } = req.body;
        if (!user_id) throw new Error("User ID mancante");

        console.log(`👤 [2/6] Utente: ${user_id}, File: ${req.file.originalname}`);
        let text = "";
        let parser = null;
        try {
            const dataBuffer = req.file.buffer;

            // 1. Istanzia la classe passando il buffer nella proprietà 'data'
            parser = new PDFParse({ data: dataBuffer });

            // 2. Estrai il testo
            const result = await parser.getText();
            text = result.text;

        } catch (pdfError: any) {
            console.error("❌ Errore durante il parsing del PDF:", pdfError);
            throw new Error("Il file PDF è corrotto o illegibile.");
        } finally {
            if (parser) {
                await parser.destroy();
            }
        }

        console.log(`📄 [3/6] Testo estratto: ${text.length} caratteri`);

        // 3. Chunking
        const chunks = splitTextIntoChunks(text, 1000, 200, {
            respectSentences: true,
            respectParagraphs: true,
            minChunkSize: 100
        });
        const validation = validateChunks(chunks);
        if (!validation.isValid) {
            console.warn("⚠️  Detected gaps in chunks:", validation.gaps);
        }

        console.log(`🧩 [4/6] Generati ${chunks.length} chunks con validazione: ${validation.isValid ? '✅' : '❌'}`);
        if (chunks.length === 0) throw new Error("Nessun testo estraibile dal PDF");

        // 4. Generazione Embeddings
        console.log("🤖 [5/6] Richiesta embedding a OpenRouter...");

        // Verifica preventiva del modello
        const modelId = "openai/text-embedding-3-small"; // ID completo per OpenRouter

        const { embeddings } = await embedMany({
            model: openrouterEmbeddings.embedding(modelId),
            values: chunks.map(chunk => chunk.content),
        });

        console.log(`✨ [5/6] Ricevuti ${embeddings.length} vettori da OpenRouter`);
        const docId = crypto.randomUUID();
        // 5. Preparazione dati per Supabase
        const documentsToInsert = chunks.map((chunkData) => ({
            user_id: user_id,
            content: chunkData.content,
            embedding: embeddings[chunkData.metadata.order],
            metadata: {
                ...chunkData.metadata,
                source: req.file?.originalname,
                title: title,
                category: category,
                document_id: docId
            }
        }));

        // 6. Salvataggio su Supabase
        const { error } = await supabase
            .from('documents')
            .insert(documentsToInsert);

        if (error) {
            console.error("❌ Errore Supabase:", JSON.stringify(error, null, 2));
            throw new Error(`Errore DB: ${error.message}`);
        }

        console.log("✅ [6/6] Salvataggio completato con successo!");

        // Risposta finale
        res.status(200).json({
            success: true,
            message: `Processati ${chunks.length} frammenti`,
            filename: req.file.originalname
        });

    } catch (error: any) {
        console.error("❌ ERRORE CRITICO NELLA ROTTA INGEST:", error);

        // Rispondiamo esplicitamente con JSON per evitare "Unexpected end of JSON input" nel frontend
        res.status(500).json({
            success: false,
            error: error.message || "Errore sconosciuto durante l'ingestione"
        });
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