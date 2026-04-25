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
import { requireAdminAuth } from "./middleware/adminAuth.js";

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
app.get("/api/client-logs", requireAdminAuth, (req, res) => {
    res.json(getClientLogs());
});

// Endpoint API per l'Audit Log unificato (HTTP + SYSTEM)
app.get("/api/logs", requireAdminAuth, (req, res) => {
    res.json(getAuditLogs());
});

// Endpoint API per svuotare tutti i log (svuotamento in memory)
app.delete("/api/logs", requireAdminAuth, (req, res) => {
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