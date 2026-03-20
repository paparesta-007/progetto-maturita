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

import { embed, generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import getSystemPrompt from "./static/systemPrompt.js"; // Funzione per generare un prompt di sistema dettagliato e specifico per il modello selezionato. Definita in client/src/library/systemPrompt.ts
import { z } from 'zod';
import path from "path";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import multer from 'multer';
import { OpenRouter } from '@openrouter/sdk';
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const upload = multer({ storage: multer.memoryStorage() });
import { PDFParse } from "pdf-parse";
const port: number = 3000;
let paginaErr: string = "";
const app: express.Express = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openrouter = new OpenRouter({
    apiKey: process.env.VITE_OPENROUTER_API_KEY,
});

// Configura la cartella static puntando a server/static
app.use(express.static(path.join(__dirname, "static")));

// Sostituisci la tua riga dotenv.config con questa:
const envPath = path.resolve(__dirname, ".env");
dotenv.config({ path: envPath });

console.log("Percorso cercato per .env:", envPath);

// Update dotenv configuration to load .env.local if it exists
dotenv.config({ path: path.resolve(__dirname, ".env.local") });
const openRouter = createOpenRouter({
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
        const { message, history, modelName, systemPromptUser, personalInfo, tone, allowedCustomInstructions, reasoning } = req.body;

        const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";
        const systemPrompt = getSystemPrompt({ selectedModel, systemPromptUser, personalInfo, tone, allowedCustomInstructions } as any);
        
        // Mappa i valori del client ai livelli di reasoning di OpenRouter
        const reasoningEffortMap: Record<string, string> = {
            fast: "minimal",
            standard: "medium",
            accurate: "high"
        };
        const reasoningEffort = reasoning ? reasoningEffortMap[reasoning] || "medium" : "medium";
        
        let userContent: any = message;
        if (req.body.attachedFiles && req.body.attachedFiles.length > 0) {
            userContent = [{ type: "text", text: message || "Immagine in allegato" }];
            req.body.attachedFiles.forEach((f: any) => {
                if (f.type === "image_url") {
                    userContent.push({
                        type: "image_url",
                        image_url: { url: f.url }
                    });
                }
            });
        }

        // Costruiamo i messaggi nello standard API: System prompt all'inizio
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userContent }
        ];

        // 1. START Timer 
        const startTime = Date.now();

        // Chiamata diretta all'API di OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/completion",
                "X-Title": "NomeTuaApp"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: messages,
                stream: false,
                reasoning: { effort: reasoningEffort }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Estrazione testo e mapping dell'usage per mantenere compatibilità col frontend
        const text = data.choices[0]?.message?.content || "";
        const reasoningContent = data.choices[0]?.message?.reasoning || null;
        const usage = {
            promptTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
        };

        // 2. STOP Timer
        const endTime = Date.now();

        // 3. Calcoli Metriche
        const latencyMs = endTime - startTime;
        const latencySec = latencyMs / 1000;

        const throughput = latencySec > 0 && usage.outputTokens
            ? (usage.outputTokens / latencySec)
            : 0;

        let suggestedQuestions = await getSuggestedQuestion(message, text);
        
        console.log("******TEST COMPLETATO: METRICHE******");
        console.log("Usage:", usage);
        console.log(`Latenza: ${latencyMs} ms, Throughput: ${throughput.toFixed(2)} t/s`);
        if (reasoningContent) console.log(`Reasoning presente: ${reasoningContent.length} caratteri`);
        
        res.send({
            text,
            usage,
            suggestedQuestions,
            reasoning: reasoningContent,
            metrics: {
                latencyMs: Math.round(latencyMs),
                throughput: parseFloat(throughput.toFixed(2))
            }
        });

    } catch (error) {
        next(error);
    }
});
app.post("/api/gemini/getTitleConversation", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Messaggio mancante" });
        }

        const prompt = `Genera un titolo breve e coinciso (massimo 8 parole) e descrittivo per una conversazione basata su questo messaggio iniziale: "${message}". Il titolo dovrebbe catturare l'essenza del messaggio in modo accattivante e informativo. 
        EVITA ASSOLUTAMENTE USO MARKDOWN, SOLO PLAIN TEXT, e NON includere virgolette o simboli speciali. Il titolo deve essere adatto per essere visualizzato in una lista di conversazioni.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/getTitleConversation",
                "X-Title": "NomeTuaApp"
            },
            body: JSON.stringify({
                model: "mistralai/mistral-nemo",
                messages: [
                    { 
                        role: "user", 
                        content: prompt 
                    }
                ],
                temperature: 0.5, // Leggermente più bassa per essere più deterministico nel titolo
                max_tokens: 50    // Limitiamo i token perché il titolo deve essere breve
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Estraiamo il testo e puliamo eventuali spazi bianchi o newline indesiderati
        const text = (data.choices[0]?.message?.content || "Nuova Conversazione").trim();
        
        // Mappiamo l'usage per mantenere la compatibilità con il tuo frontend
        const usage = {
            promptTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
        };

        res.send({ text, usage });
        
    } catch (error) {
        next(error);
    }
});

app.post("/api/getSuggestedQuestion", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, response } = req.body;

        if (!message || !response) {
            return res.status(400).json({ error: "message and response are required" });
        }

        const suggested_questions = await getSuggestedQuestion(message, response);
        res.send({ suggested_questions });
        
    } catch (error) {
        next(error);
    }
});

// FUNZIONE UTILITY PER DOMANDE SUGGERITE
async function getSuggestedQuestion(question: string, answer: string): Promise<string[]> {
    try {
        const prompt = `Genera esattamente 4 domande logiche e pertinenti che l'utente potrebbe fare per approfondire l'argomento, basandoti su questo scambio:
        
        Domanda originale: "${question}"
        Risposta: "${answer}"

        REQUISITO: Rispondi ESCLUSIVAMENTE con un oggetto JSON valido nel seguente formato:
        {
          "questions": ["domanda 1", "domanda 2", "domanda 3", "domanda 4"]
        }`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/suggested",
                "X-Title": "NomeTuaApp"
            },
            body: JSON.stringify({
                model: "mistralai/mistral-nemo",
                messages: [
                    { 
                        role: "system", 
                        content: "Sei un utile assistente AI che risponde sempre in formato JSON. Genera domande brevi dirette e chiare di approfondimento nella stessa lingua dell'input." 
                    },
                    { 
                        role: "user", 
                        content: prompt 
                    }
                ],
                response_format: { type: "json_object" }, // Forza l'output JSON
                temperature: 0.5,
                reasoning: { effort: "none" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) return [];

        // Parsiamo il contenuto JSON
        const parsed = JSON.parse(content);
        
        // Validazione manuale (simile a quello che faceva Zod)
        if (parsed.questions && Array.isArray(parsed.questions)) {
            // Normalizziamo: il LLM a volte ritorna oggetti {domanda: "..."} invece di stringhe
            const normalized = parsed.questions.slice(0, 4).map((q: any) => {
                if (typeof q === 'string') return q;
                if (typeof q === 'object' && q !== null) {
                    // Prendi il primo valore stringa dall'oggetto (domanda, question, text, ecc.)
                    return Object.values(q).find((v) => typeof v === 'string') || '';
                }
                return '';
            }).filter((q: string) => q.length > 0);
            return normalized;
        }

        return [];

    } catch (suggestionError) {
        console.error("Errore durante la generazione delle domande correlate:", suggestionError);
        return [];
    }
}


app.post("/api/streamingOutput", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, history, modelName, systemPromptUser, personalInfo, tone, allowedCustomInstructions, reasoning } = req.body;
        const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";

        // Mappa i valori del client ai livelli di reasoning di OpenRouter
        console.log("Received reasoning level from client:", reasoning);
        const reasoningEffortMap: Record<string, string> = {
            fast: "minimal",
            standard: "medium",
            accurate: "high"
        };
        const reasoningEffort = reasoning ? reasoningEffortMap[reasoning] || "medium" : "medium";

        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        console.log("Custom User Instruction:", systemPromptUser);

        const systemPrompt = getSystemPrompt({
            selectedModel,
            systemPromptUser,
            personalInfo,
            tone,
            allowedCustomInstructions
        } as any);

        let userContent: any = message;
        if (req.body.attachedFiles && req.body.attachedFiles.length > 0) {
            userContent = [{ type: "text", text: message || "Immagine in allegato" }];
            req.body.attachedFiles.forEach((f: any) => {
                if (f.type === "image_url") {
                    userContent.push({
                        type: "image_url",
                        image_url: { url: f.url }
                    });
                }
            });
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userContent }
        ];

        // 1. Chiamata API Streaming
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/streamingOutput",
                "X-Title": "NomeTuaApp"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: messages,
                stream: true,
                stream_options: { include_usage: true },
                reasoning: { effort: reasoningEffort,}
            })
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            throw new Error(`OpenRouter Streaming Error: ${response.status} - ${errorText}`);
        }

        // 2. Imposta gli header della risposta per streaming (NDJSON dentro text/plain per compatibilità browser)
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        // 3. Lettura e parsing manuale del flusso SSE → NDJSON per il client
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith("data: ")) {
                        const dataStr = trimmedLine.slice(6);
                        if (dataStr === "[DONE]") continue;

                        try {
                            const parsed = JSON.parse(dataStr);
                            const reasoningPart = parsed.choices?.[0]?.delta?.reasoning;
                            const textPart = parsed.choices?.[0]?.delta?.content;
                            const usagePart = parsed.usage;
                            
                            // Invia reasoning chunk in tempo reale
                            if (reasoningPart) {
                                res.write(JSON.stringify({ type: "reasoning", content: reasoningPart }) + "\n");
                            }
                            
                            // Invia text chunk in tempo reale
                            if (textPart) {
                                res.write(JSON.stringify({ type: "text", content: textPart }) + "\n");
                                await delay(11);
                            }

                            // Invia usage chunk
                            if (usagePart && Object.keys(usagePart).length > 0) {
                                res.write(JSON.stringify({ type: "usage", content: usagePart }) + "\n");
                                console.log("OpenRouter Stream Usage:", usagePart);
                            }
                        } catch (parseError) {
                            console.warn("⚠️ Errore nel parsing del chunk JSON:", parseError);
                        }
                    }
                }
            }
        } catch (streamError) {
            console.error("Errore durante lo streaming nativo:", streamError);
        } finally {
            res.end();
        }

        // 4. Gestione disconnessione client
        res.on('close', () => {
            console.log("Client disconnesso dalla stream.");
            // NOTA: Se si disconnette, idealmente dovresti fare reader.cancel() per fermare OpenRouter, ma non blocca l'app
            reader.cancel().catch(() => {});
        });

    } catch (error) {
        next(error);
    }
});

// ─── HELPER: Normalizza il testo estratto dal PDF prima del chunking ───
function normalizeText(text: string): string {
    return text
        .normalize('NFC')
        .replace(/\0/g, '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/[\t ]{2,}/g, ' ')
        .replace(/\n{4,}/g, '\n\n\n')
        .trim();
}

// ─── HELPER: Rileva heading/titoli di sezione nel testo ───
function detectHeadings(text: string): Array<{ position: number; heading: string }> {
    const headings: Array<{ position: number; heading: string }> = [];
    const lines = text.split('\n');
    let charPos = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        // Rileva heading: linee corte (<120 char), non vuote,
        // che sono TUTTE MAIUSCOLE, oppure iniziano con numeri tipo "1.", "1.2", "Capitolo"
        // oppure sono seguite da una riga vuota (tipico dei titoli in PDF)
        const isHeading =
            trimmed.length > 0 &&
            trimmed.length < 120 &&
            (
                trimmed === trimmed.toUpperCase() && trimmed.length > 3 ||   // TUTTO MAIUSCOLO
                /^(\d+\.)+\s/.test(trimmed) ||                                // 1. 1.2. 3.1.4.
                /^(capitolo|cap\.|sezione|sez\.|parte|appendice)\s/i.test(trimmed) // Parole chiave italiane
            );

        if (isHeading) {
            headings.push({ position: charPos, heading: trimmed });
        }
        charPos += line.length + 1; // +1 per il \n
    }
    return headings;
}

// ─── HELPER: Trova l'heading più vicino che precede una posizione ───
function getNearestHeading(position: number, headings: Array<{ position: number; heading: string }>): string | null {
    let nearest: string | null = null;
    for (const h of headings) {
        if (h.position <= position) {
            nearest = h.heading;
        } else {
            break; // Headings sono ordinati per posizione
        }
    }
    return nearest;
}

// ─── HELPER: Splitta un blocco di testo in frasi ───
function splitIntoSentences(text: string): string[] {
    // Regex che splitta dopo . ! ? ; seguiti da spazio o fine stringa
    // Evita split su abbreviazioni comuni (es. "dott.", "pag.", "fig.", "es.", "ecc.")
    const sentences = text.split(/(?<=[.!?;])\s+(?=[A-Z\d"«(])/g);
    return sentences.filter(s => s.trim().length > 0);
}

// ─── CHUNKING ENGINE: Recursive Paragraph → Sentence → Word splitting ───
function splitTextIntoChunks(
    text: string,
    chunkSize: number = 1500,
    overlap: number = 300,
    options: {
        respectSentences?: boolean;
        respectParagraphs?: boolean;
        minChunkSize?: number;
    } = {}
): Array<{ content: string; metadata: { startChar: number; endChar: number; order: number; length: number; sectionHeading: string | null } }> {

    const { minChunkSize = 100 } = options;

    // 1️⃣ Normalizza line endings
    const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n');

    // 2️⃣ Rileva gli heading del documento
    const headings = detectHeadings(cleanedText);

    // 3️⃣ Livello 1: splitta per paragrafi (doppio newline)
    const paragraphs: Array<{ text: string; startChar: number }> = [];
    let pos = 0;
    for (const para of cleanedText.split(/\n\n+/)) {
        const trimmed = para.trim();
        if (trimmed.length > 0) {
            paragraphs.push({ text: trimmed, startChar: pos });
        }
        pos += para.length + 2; // +2 per \n\n
    }

    // 4️⃣ Assembla i chunk combinando paragrafi fino a raggiungere chunkSize
    const chunks: Array<{ content: string; metadata: any }> = [];
    let currentContent = '';
    let currentStartChar = paragraphs.length > 0 ? paragraphs[0].startChar : 0;
    let chunkOrder = 0;

    function pushChunk(content: string, startChar: number, endChar: number) {
        const trimmed = content.trim();
        if (trimmed.length >= minChunkSize) {
            chunks.push({
                content: trimmed,
                metadata: {
                    startChar,
                    endChar,
                    order: chunkOrder++,
                    length: trimmed.length,
                    sectionHeading: getNearestHeading(startChar, headings)
                }
            });
        }
    }

    // Funzione per spezzare un blocco troppo grande in sotto-frasi
    function splitLargeBlock(blockText: string, blockStart: number) {
        const sentences = splitIntoSentences(blockText);

        let sentenceBuffer = '';
        let bufferStart = blockStart;

        for (const sentence of sentences) {
            if (sentenceBuffer.length + sentence.length + 1 > chunkSize && sentenceBuffer.length > 0) {
                // Salva il buffer corrente come chunk
                pushChunk(sentenceBuffer, bufferStart, bufferStart + sentenceBuffer.length);
                // Overlap: mantieni le ultime N chars
                const overlapText = sentenceBuffer.slice(-overlap);
                bufferStart = bufferStart + sentenceBuffer.length - overlapText.length;
                sentenceBuffer = overlapText;
            }
            sentenceBuffer += (sentenceBuffer.length > 0 ? ' ' : '') + sentence;
        }

        // Flush buffer rimanente
        if (sentenceBuffer.trim().length > 0) {
            pushChunk(sentenceBuffer, bufferStart, bufferStart + sentenceBuffer.length);
        }
    }

    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];

        // Se il singolo paragrafo è già più grande di chunkSize, spezzalo per frasi
        if (para.text.length > chunkSize) {
            // Prima salva ciò che abbiamo accumulato
            if (currentContent.length > 0) {
                pushChunk(currentContent, currentStartChar, currentStartChar + currentContent.length);
                currentContent = '';
            }
            // Splitta il paragrafo grande
            splitLargeBlock(para.text, para.startChar);
            currentStartChar = para.startChar + para.text.length;
            continue;
        }

        // Se aggiungere questo paragrafo supera chunkSize, salva il chunk corrente
        if (currentContent.length + para.text.length + 2 > chunkSize && currentContent.length > 0) {
            pushChunk(currentContent, currentStartChar, currentStartChar + currentContent.length);

            // Overlap: prendi le ultime N chars del chunk salvato
            const overlapText = currentContent.slice(-overlap);
            currentContent = overlapText + '\n\n' + para.text;
            currentStartChar = currentStartChar + currentContent.length - overlapText.length - para.text.length - 2;
        } else {
            // Aggiungi il paragrafo al chunk corrente
            if (currentContent.length > 0) {
                currentContent += '\n\n' + para.text;
            } else {
                currentContent = para.text;
                currentStartChar = para.startChar;
            }
        }
    }

    // Flush dell'ultimo chunk
    if (currentContent.trim().length > 0) {
        pushChunk(currentContent, currentStartChar, currentStartChar + currentContent.length);
    }

    return chunks;
}

// ─── HELPER: Validazione dei chunk ───
function validateChunks(chunks: Array<any>): { isValid: boolean; gaps: number[]; overlaps: number[] } {
    const gaps: number[] = [];
    const overlaps: number[] = [];

    for (let i = 0; i < chunks.length - 1; i++) {
        const currentEnd = chunks[i].metadata.endChar;
        const nextStart = chunks[i + 1].metadata.startChar;

        if (nextStart > currentEnd) {
            gaps.push(nextStart - currentEnd);
        } else if (nextStart < currentEnd) {
            overlaps.push(currentEnd - nextStart);
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

        // 2.5 Normalizza il testo prima del chunking
        text = normalizeText(text);
        console.log(`🧹 [3/6] Testo normalizzato: ${text.length} caratteri`);

        // 3. Chunking (1500 chars ≈ 375 tokens, 300 overlap ≈ 20%)
        const chunks = splitTextIntoChunks(text, 1500, 300, {
            respectSentences: true,
            respectParagraphs: true,
            minChunkSize: 100
        });
        const date = new Date().toISOString();
        const validation = validateChunks(chunks);
        if (!validation.isValid) {
            console.warn("⚠️  Detected gaps in chunks:", validation.gaps);
        }

        console.log(`🧩 [4/6] Generati ${chunks.length} chunks con validazione: ${validation.isValid ? '✅' : '❌'}`);
        if (chunks.length === 0) throw new Error("Nessun testo estraibile dal PDF");

        // 4. Generazione Embeddings
        console.log("🤖 [5/6] Richiesta embedding a OpenRouter...");


        // Prefisso contestuale arricchito con sezione heading
        const filename = req.file?.originalname || 'sconosciuto';
        const { embeddings } = await embedMany({
            model: openrouterEmbeddings.embedding("openai/text-embedding-3-small"),
            values: chunks.map(chunk => {
                const heading = chunk.metadata.sectionHeading ? ` | Sezione: ${chunk.metadata.sectionHeading}` : '';
                return `[Documento: ${filename}${heading}] ${chunk.content}`;
            }),
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
            },
            document_id: docId,
            created_at: date
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
            filename: req.file.originalname,
            documentId: docId
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


// ============================================================
// ENDPOINT: Gestione Conversazioni e Messaggi (Supabase server-side)
// ============================================================

// Crea una nuova conversazione
app.post("/api/conversations/create", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { user_id, title } = req.body;
        if (!user_id) throw new Error("user_id mancante");

        const { data, error } = await supabase
            .from("conversations")
            .insert({
                user_id: user_id,
                title: title || "New Chat",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error("Errore creazione conversazione:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Crea un nuovo messaggio in una conversazione
app.post("/api/conversations/messages/create", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { conversation_id, sender, content, usage, model } = req.body;
        if (!conversation_id) throw new Error("conversation_id mancante");

        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversation_id,
                created_at: new Date().toISOString(),
                sender: sender,
                content: content,
                usage: usage,
                model: model,
            });

        if (error) {
            console.error("Errore creazione messaggio:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Recupera tutte le conversazioni di un utente
app.get("/api/conversations/list", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const user_id = req.query.user_id as string;
        if (!user_id) throw new Error("user_id mancante");

        const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Errore recupero conversazioni:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Recupera i messaggi di una conversazione
app.get("/api/conversations/messages", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const conversation_id = req.query.conversation_id as string;
        if (!conversation_id) throw new Error("conversation_id mancante");

        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Errore recupero messaggi:", error);
            return res.status(500).json({ error: error.message });
        }

        // Inverti per avere ordine cronologico (vecchio → nuovo)
        res.json(data ? data.reverse() : []);
    } catch (error) {
        next(error);
    }
});

// Cancella una conversazione
app.delete("/api/conversations/delete", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { user_id, conversation_id } = req.body;
        if (!user_id || !conversation_id) throw new Error("user_id e conversation_id richiesti");

        const { data, error } = await supabase
            .from("conversations")
            .delete()
            .eq("user_id", user_id)
            .eq("id", conversation_id);

        if (error) {
            console.error("Errore cancellazione conversazione:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});
app.post("/api/chat/ask-pdf", async (req: express.Request, res: express.Response) => {
    // Abilita lo streaming
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    const sendLog = (msg: string) => {
        console.log(msg);
        res.write(JSON.stringify({ type: "log", content: msg }) + "\n");
    };

    try {
        const { question, model, user_id, document_id, reasoning } = req.body;
        const reasoningEffortMap: Record<string, string> = {
            fast: "minimal",
            standard: "medium",
            accurate: "high"
        };
        const reasoningEffort = reasoning ? reasoningEffortMap[reasoning] || "medium" : "medium";
        // Inizializziamo i timer
        const startTime = Date.now();
        let stepTime = startTime;

        sendLog(`\n📥 [Fase 1/8] Nuova richiesta /ask-pdf ricevuta.`);
        sendLog(`🔍 Dettagli: Domanda="${question}", Documento=${document_id}, Utente=${user_id}`);

        // 1. Genera l'embedding della domanda
        sendLog("🧠 [Fase 2/8] Generazione dell'embedding per la domanda in corso...");
        const { embedding } = await embed({
            model: openrouterEmbeddings.embedding("openai/text-embedding-3-small"),
            value: `Ricerca nel documento: ${question}`,
        });
        
        let now = Date.now();
        sendLog(`✅ [Fase 2/8] Embedding generato con successo. (+${now - stepTime}ms)`);
        stepTime = now;

        // 2. Chiama la funzione RPC su Supabase
        sendLog("🔎 [Fase 3/8] Ricerca dei chunk semantici su Supabase in corso...");
        const { data: chunks, error } = await supabase
            .rpc('match_documents', {
                query_embedding: embedding,
                match_threshold: 0.4,
                match_count: 7,
                filter_user_id: user_id,
                selected_id: document_id
            });

        if (error) {
            console.error("❌ [Errore Fase 3] Errore ricerca Supabase:", error);
            throw new Error("Errore durante la ricerca nel DB");
        }
        
        now = Date.now();
        sendLog(`✅ [Fase 3/8] Ricerca completata. Trovati ${chunks?.length || 0} chunk pertinenti. (+${now - stepTime}ms)`);
        stepTime = now;

        if (!chunks || chunks.length === 0) {
            sendLog("⚠️ [Attenzione] Nessun chunk trovato. Interrompo e rispondo al client.");
            res.write(JSON.stringify({ 
                type: "result",
                answer: "Mi dispiace, non ho trovato informazioni pertinenti nei documenti caricati.",
                sources: [],
                suggested_questions: []
            }) + "\n");
            return res.end();
        }

        sendLog("📄 [Fase 4/8] Costruzione del contesto dai chunk estratti...");
        const contextText = chunks
            .map((chunk: any) => {
                const section = chunk.metadata?.sectionHeading ? `[Sezione: ${chunk.metadata.sectionHeading}]` : '';
                return `--- FONTE: ${chunk.metadata.source} ${section} ---\n${chunk.content}`;
            })
            .join("\n\n");
            
        now = Date.now();
        sendLog(`✅ [Fase 4/8] Contesto creato (Lunghezza: ${contextText.length} caratteri). (+${now - stepTime}ms)`);
        stepTime = now;

        const systemPrompt = `
        Sei un esperto Analista di Documenti. Il tuo compito è rispondere alle domande dell'utente basandoti ESCLUSIVAMENTE sul CONTESTO fornito qui sotto.

        ### REGOLE RIGIDE DI RISPOSTA:
        1.  **Fedeltà al Testo**: Rispondi solo utilizzando le informazioni presenti nel CONTESTO. Se la risposta non è contenuta nel testo, dichiara esplicitamente: "Mi dispiace, ma le informazioni fornite nei documenti non mi permettono di rispondere a questa domanda." Non utilizzare conoscenze esterne.
        2.  **Formattazione Markdown**: Usa titolazioni (###), elenchi puntati e grassetti per rendere la risposta professionale e facile da leggere.
        3.  **Formule Matematiche**: Ogni formula, simbolo matematico o equazione DEVE essere scritta in LaTeX utilizzando il delimitatore "$$" per i blocchi (es. $$E = mc^2$$) o "$" per le formule in linea (es. $x = 2$).
        4.  **Lingua**: Rispondi sempre nella lingua della domanda dell'utente (predefinito: Italiano).

        ### CONTESTO:
        ${contextText}
        `;

        const selectedModel = model || "google/gemini-2.5-flash-lite";

        let userContent: any = question;
        if (req.body.attachedFiles && req.body.attachedFiles.length > 0) {
            userContent = [{ type: "text", text: question || "Immagine in allegato" }];
            req.body.attachedFiles.forEach((f: any) => {
                if (f.type === "image_url") {
                    userContent.push({
                        type: "image_url",
                        image_url: { url: f.url }
                    });
                }
            });
        }

        // 3. Genera la RISPOSTA PRINCIPALE chiamando OpenRouter nativamente
        sendLog(`🤖 [Fase 5/8] Chiamata a OpenRouter (Modello: ${selectedModel}) per la risposta principale... ${reasoningEffort}`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/ask-pdf",
                "X-Title": "NomeTuaApp"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ],
                stream: false,
                reasoning: { effort: reasoningEffort }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Errore Fase 5] OpenRouter API Error: ${response.status} - ${errorText}`);
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content || "";
        
        now = Date.now();
        sendLog(`✅ [Fase 6/8] Risposta principale ricevuta da OpenRouter. (+${now - stepTime}ms)`);
        stepTime = now;

        sendLog("🧹 [Fase 8/8] Pulizia dei duplicati nelle fonti e invio della risposta finale al client...");
        // Rimuoviamo i duplicati dalle fonti (caso in cui più chunk vengano dallo stesso PDF)
        const uniqueSources = Array.from(new Set(chunks.map((c: any) => c.metadata.source)));

        // 5. Rispondi al client con Risposta + Fonti (pulite) + Domande Suggerite
        res.write(JSON.stringify({
            type: "result",
            answer: text,
            sources: uniqueSources,
            // suggested_questions: suggestedQuestions
        }) + "\n");
        
        now = Date.now();
        sendLog(`🎉 [Successo] Risposta inviata al client correttamente! (+${now - stepTime}ms)`);
        sendLog(`⏱️  [METRICHE] Tempo Totale /ask-pdf: ${now - startTime}ms\n`);
        res.end();

    } catch (error: any) {
        console.error("\n❌ [ERRORE CRITICO] Errore non gestito in /ask-pdf:");
        console.error(error);
        res.write(JSON.stringify({ type: "error", error: error.message }) + "\n");
        res.end();
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