"use strict";
// SUGGERIMENTO: Per progetti più grandi, considera di dividere le rotte in file separati
// (ad es. una cartella 'routes') per migliorare la manutenibilità.

// A) importing librerie
import http from "http";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";
import cors from "cors";
import {
    setupConsoleLogging,
    setupGlobalErrorHandlers,
    httpLoggingMiddleware,
    logSupabaseAction,
    addClientLog,
    getAuditLogs,
    getClientLogs,
    clearAllLogs
} from "./middleware/logging.js";
import { OPENROUTER_KEY, PORT, SUPABASE_KEY, SUPABASE_URL } from "./config/enviroments.js";

import { ingestDocument, askPdf } from "./services/documentService.js";

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
const upload = multer({ storage: multer.memoryStorage() });
const port: number = PORT;
let paginaErr: string = "";
const app: express.Express = express();

type BetterViewRenderMode = 'html' | 'markdown';

function isCodeOrDebugIntent(message: string): boolean {
    if (!message || typeof message !== 'string') return false;

    const normalized = message.toLowerCase();
    const codeSignals = [
        /```[\s\S]*?```/,
        /\b(debug|bug|errore|error|stack trace|traceback|exception|fix|refactor|compile|build failed)\b/,
        /\b(function|class|interface|import|export|const|let|var|return|async|await|sql|query|regex)\b/,
        /\bjavascript|typescript|python|java|c\+\+|c#|php|go|rust|html|css|react|node\b/,
        /\bwrite code|scrivi codice|generate code|genera codice|implement|implementa\b/
    ];

    return codeSignals.some((rx) => rx.test(normalized));
}

// ────────────────────────────────────────────────────────────────
// SETUP: Logging & Error Handlers
// ────────────────────────────────────────────────────────────────
setupConsoleLogging();
setupGlobalErrorHandlers();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openrouter = new OpenRouter({
    apiKey: OPENROUTER_KEY,
});

// Configura la cartella static puntando a server/static
app.use(express.static(path.join(__dirname, "static")));

const openRouter = createOpenRouter({
    apiKey: OPENROUTER_KEY,

});

const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_KEY;
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

// Middleware per il parsing del body JSON
app.use(express.json({ limit: "10mb" }));

// Middleware di logging per ogni richiesta
app.use(httpLoggingMiddleware);

app.post("/api/completion/chat", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, history, modelName, systemPromptUser, personalInfo, tone, allowedCustomInstructions, reasoning, isBetterView } = req.body;

        const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";
        const betterViewRenderMode: BetterViewRenderMode = isBetterView && !isCodeOrDebugIntent(message || "") ? 'html' : 'markdown';
        const systemPrompt = getSystemPrompt({ selectedModel, systemPromptUser, personalInfo, tone, allowedCustomInstructions, isBetterView, betterViewRenderMode } as any);

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
            ...data.usage,
            prompt_tokens: data.usage?.prompt_tokens || 0,
            completion_tokens: data.usage?.completion_tokens || 0,
            total_tokens: data.usage?.total_tokens || 0,
            cost: data.usage?.cost || data.cost || 0
        };

        // 2. STOP Timer
        const endTime = Date.now();

        // 3. Calcoli Metriche
        const latencyMs = endTime - startTime;
        const latencySec = latencyMs / 1000;

        const throughput = latencySec > 0 && usage.outputTokens
            ? (usage.outputTokens / latencySec)
            : 0;

        console.log("******TEST COMPLETATO: METRICHE******");
        console.log("Usage:", usage);
        console.log(`Latenza: ${latencyMs} ms, Throughput: ${throughput.toFixed(2)} t/s`);
        if (reasoningContent) console.log(`Reasoning presente: ${reasoningContent.length} caratteri`);

        res.send({
            text,
            renderMode: betterViewRenderMode,
            usage,
            suggestedQuestions: [], // Saranno caricate dal client separatamente per non bloccare il salvataggio
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
                max_tokens: 50,    // Limitiamo i token perché il titolo deve essere breve
                reasoning: { effort: "none" }
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
            ...data.usage,
            prompt_tokens: data.usage?.prompt_tokens || 0,
            completion_tokens: data.usage?.completion_tokens || 0,
            total_tokens: data.usage?.total_tokens || 0,
            cost: data.usage?.cost || data.cost || 0
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
                model: "openai/gpt-oss-20b:free:nitro",
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
                reasoning: { effort: "minimal" }
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

        const { message, history, modelName, systemPromptUser, personalInfo,
            tone, allowedCustomInstructions, reasoning, isBetterView } = req.body;
        const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";
        const betterViewRenderMode: BetterViewRenderMode = isBetterView && !isCodeOrDebugIntent(message || "") ? 'html' : 'markdown';

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
            allowedCustomInstructions,
            isBetterView,
            betterViewRenderMode
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
                reasoning: { effort: reasoningEffort, }
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
        res.write(JSON.stringify({ type: "meta", renderMode: betterViewRenderMode }) + "\n");

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
                                await delay(3);
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
            reader.cancel().catch(() => { });
        });

    } catch (error) {
        next(error);
    }
});

// ─── HELPER: Normalizza il testo estratto dal PDF prima del chunking ───

// ROUTE: Ingestione Documenti (PDF -> Vector DB)
app.post("/api/documents/ingest", upload.single("file"), ingestDocument);


// ============================================================
// ENDPOINT: Gestione Conversazioni e Messaggi (Supabase server-side)
// ============================================================

// Crea una nuova conversazione
app.post("/api/conversations/create", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { user_id, title } = req.body;
        if (!user_id) throw new Error("user_id mancante");

        logSupabaseAction("insert_conversation", user_id);
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
        const { conversation_id, sender, content, usage, model, render_mode, reasoning_text, user_id } = req.body;
        if (!conversation_id) throw new Error("conversation_id mancante");

        // Dobbiamo avere l'user_id per passarlo ai log se presente nella session, ma potremmo non averlo nel body... passiamo 'unknown'
        logSupabaseAction("insert_message", user_id || "unknown");
        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversation_id,
                created_at: new Date().toISOString(),
                sender: sender,
                content: content,
                usage: usage,
                model: model,
                render_mode: render_mode === 'html' ? 'html' : 'markdown',
                reasoning_text: reasoning_text,
            });

        //update conversation updated_at
        logSupabaseAction("update_conversation", user_id);
        const { data: updatedConversation, error: updateError } = await supabase
            .from("conversations")
            .update({
                updated_at: new Date().toISOString(),
            })
            .eq("id", conversation_id);
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

        logSupabaseAction("select_conversations_list", user_id);
        const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", { ascending: false })
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

        logSupabaseAction("select_messages", "unknown");
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

        logSupabaseAction("delete_conversation", user_id);
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

app.patch("/api/conversations/update-title", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { user_id, conversation_id, new_title } = req.body;
        if (!user_id || !conversation_id || !new_title) throw new Error("user_id, conversation_id e new_title richiesti");

        logSupabaseAction("update_conversation_title", user_id);
        const { data, error } = await supabase
            .from("conversations")
            .update({ title: new_title, updated_at: new Date().toISOString() })
            .eq("id", conversation_id)
            .eq("user_id", user_id);

        if (error) {
            console.error("Errore aggiornamento titolo conversazione:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

app.post("/api/chat/ask-pdf", askPdf);


app.post("/api/quiz/generate", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { topic, mode } = req.body;

        // 1. Validazione manuale dell'input (Senza Zod)
        if (!topic || typeof topic !== 'string') {
            return res.status(400).json({ error: "Il campo 'topic' è mancante o non valido." });
        }

        const modeToModelMap: Record<string, string> = {
            fast: "openai/gpt-oss-120b",
            standard: "mistralai/mistral-small-2603b",
            accurate: "nvidia/nemotron-3-super-120b-a12b:free"
        };

        const selectedModel = typeof mode === "string" && modeToModelMap[mode]
            ? modeToModelMap[mode]
            : "openai/gpt-oss-120b";

        const prompt = `Genera un quiz a scelta multipla con esattamente 10 domande sul seguente argomento o testo: "${topic}".`;

        // 2. Chiamata a OpenRouter definendo il JSON Schema nativo
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/quiz",
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: "system",
                        content: "Genera solo JSON valido senza testo extra."
                    },
                    { role: "user", content: prompt }
                ],
                reasoning: { effort: "minimal" },
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "quiz_generation_schema",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                quiz: {
                                    type: "array",
                                    minItems: 10,
                                    maxItems: 10,
                                    items: {
                                        type: "object",
                                        properties: {
                                            domanda: { type: "string" },
                                            opzioni: {
                                                type: "object",
                                                properties: {
                                                    A: { type: "string" },
                                                    B: { type: "string" },
                                                    C: { type: "string" },
                                                    D: { type: "string" }
                                                },
                                                required: ["A", "B", "C", "D"],
                                                additionalProperties: false
                                            },
                                            rispostaCorretta: {
                                                type: "string",
                                                enum: ["A", "B", "C", "D"]
                                            }
                                        },
                                        required: ["domanda", "opzioni", "rispostaCorretta"],
                                        additionalProperties: false
                                    }
                                }
                            },
                            required: ["quiz"],
                            additionalProperties: false
                        }
                    }
                },
                temperature: 0.5,
                provider: {
                    require_parameters: true
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Errore API OpenRouter: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const aiData = await response.json();
        const aiContent = aiData?.choices?.[0]?.message?.content;

        if (!aiContent) {
            throw new Error("Risposta del modello vuota o non valida");
        }

        const parsedQuiz = typeof aiContent === "string"
            ? JSON.parse(
                aiContent
                    .replace(/^```json\s*/i, "")
                    .replace(/^```\s*/i, "")
                    .replace(/\s*```$/i, "")
                    .trim()
            )
            : aiContent;

        if (!Array.isArray(parsedQuiz.quiz)) {
            throw new Error("Formato quiz non valido");
        }

        const normalizedQuiz = parsedQuiz.quiz.slice(0, 10).map((item: any) => ({
            domanda: String(item?.domanda || "").trim(),
            opzioni: {
                A: String(item?.opzioni?.A || "").trim(),
                B: String(item?.opzioni?.B || "").trim(),
                C: String(item?.opzioni?.C || "").trim(),
                D: String(item?.opzioni?.D || "").trim()
            },
            rispostaCorretta: String(item?.rispostaCorretta || "").trim().toUpperCase()
        }));

        const isValidQuiz =
            normalizedQuiz.length === 10 &&
            normalizedQuiz.every((q: any) =>
                q.domanda &&
                q.opzioni.A && q.opzioni.B && q.opzioni.C && q.opzioni.D &&
                ["A", "B", "C", "D"].includes(q.rispostaCorretta)
            );

        if (!isValidQuiz) {
            throw new Error("Formato quiz non valido");
        }

        return res.status(200).json({ quiz: normalizedQuiz });

    } catch (error: any) {
        console.error("Errore generazione quiz:", error);
        return res.status(500).json({ error: "Errore interno del server", details: error.message });
    }
});

app.post("/api/support/getUserTickets", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { userId } = req.body;
        if (!userId) throw new Error("userId mancante");

        logSupabaseAction("select_support_tickets", userId);
        const { data, error } = await supabase
            .from("support_tickets")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Errore recupero ticket di supporto:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, tickets: data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/api/support/submit", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { userId, email, problemType, subject, message } = req.body;
        /*
        -- Create support_tickets table
        CREATE TABLE support_tickets (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id),
            email TEXT NOT NULL,
            problem_type TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'open', -- 'open', 'in-progress', 'resolved', 'closed'
            admin_reply TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        */
        const { data, error } = await supabase
            .from('support_tickets')
            .insert([
                {
                    user_id: userId,
                    email: email,
                    problem_type: problemType,
                    subject: subject,
                    message: message,
                },
            ])
            .select();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
})













// Route per la pagina dei log
app.get("/logs", (req, res) => {
    res.sendFile(path.join(__dirname, "static", "log.html"));
});

// Endpoint per ricevere i log del client via POST
app.post("/logs", (req, res) => {
    const clientIp = (req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown') as string;
    addClientLog(
        req.body.type || 'UNKNOWN',
        req.body.message || '',
        req.body.stack || null,
        req.body.source || null,
        req.body.lineno || null,
        req.body.colno || null,
        req.body.url || '',
        clientIp,
        req.headers['user-agent'] || 'unknown'
    );
    res.status(200).send("OK");
});

// Endpoint API per i log del client (errori frontend)
app.get("/api/client-logs", (req, res) => {
    res.json(getClientLogs());
});

// Endpoint API per l'Audit Log unificato (HTTP + SYSTEM)
app.get("/api/logs", (req, res) => {
    res.json(getAuditLogs());
});

// Endpoint API per svuotare tutti i log (svuotamento in memory)
app.delete("/api/logs", (req, res) => {
    clearAllLogs();
    res.json({ success: true });
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