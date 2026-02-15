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

app.post("/api/completion/chat", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        //const { user, systemPromptUser, personalInfo, tone, allowedCustomInstructions,loading } = useAuth()

        const { message, history, modelName, systemPromptUser, personalInfo, tone, allowedCustomInstructions } = req.body;
        
        // SUGGERIMENTO PER LA SICUREZZA: Valida l'input ricevuto dal client.
        // Ad esempio, assicurati che 'modelName' sia uno dei modelli che intendi esporre.

        const selectedModel = modelName ? modelName : "gemini-2.5-flash-lite";
        console.log(systemPromptUser, personalInfo, tone, allowedCustomInstructions);
        const systemPrompt = getSystemPrompt({ selectedModel, systemPromptUser, personalInfo, tone, allowedCustomInstructions } as any)
        const messages = [
            ...history,
            { role: 'user', content: message }
        ];

        const { text, usage } = await generateText({
            model: openrouter(selectedModel),
            messages: messages,
            system: systemPrompt,
            headers: {
                "HTTP-Referer": "localhost:3000/completion",
                "X-Title": "NomeTuaApp"
            }
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