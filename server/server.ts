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
import chatRoutes from "./routes/chat.js";
import supportRoutes from "./routes/support.js";
import documentRoutes from "./routes/documents.js";
import conversationRoutes from "./routes/conversation.js";
import artifactsRoutes from "./routes/artifacts.js";
import { supabase } from "./services/supabase.js";
import { requireAuth } from "./middleware/auth.js";

import { embed, generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
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

// Route chat (sendMessage / sendStreamedMessage)
app.use(chatRoutes);
app.use("/api/support", supportRoutes); 
app.use("/api/docs", requireAuth, documentRoutes);
app.use("/api/conversations", requireAuth, conversationRoutes);
app.use("/api/artifacts", requireAuth, artifactsRoutes);

// ─── HELPER: Normalizza il testo estratto dal PDF prima del chunking ───

app.post("/api/quiz/generate", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { topic, mode } = req.body;

        // 1. Validazione manuale dell'input (Senza Zod)
        if (!topic || typeof topic !== 'string') {
            return res.status(400).json({ error: "Il campo 'topic' è mancante o non valido." });
        }

        const modeToModelMap: Record<string, string> = {
            fast: "openai/gpt-oss-120b",
            standard: "openai/gpt-oss-120b",
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
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
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