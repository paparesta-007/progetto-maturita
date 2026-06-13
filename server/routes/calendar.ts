import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { OPENROUTER_KEY } from "../config/enviroments.js";
import { applyPromptCaching } from "../utils/promptCaching.js";

const router = express.Router();

// --- HELPER: data/ora corrente formattata ---
function getCurrentDateInfo(timezone: string = "Europe/Rome"): string {
    const now = new Date();
    
    const formatter = new Intl.DateTimeFormat('it-IT', {
        timeZone: timezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const getValue = (type: string) => parts.find(p => p.type === type)?.value || '';
    const weekday = getValue('weekday');
    const day = getValue('day');
    const month = getValue('month');
    const year = getValue('year');
    const hour = getValue('hour');
    const minute = getValue('minute');
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isoFormatter = new Intl.DateTimeFormat('fr-CA', { 
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const todayIso = isoFormatter.format(now);
    const tomorrowIso = isoFormatter.format(tomorrow);

    return `OGGI è ${weekday} ${day} ${month} ${year}, ore ${hour}:${minute}.
Data ISO oggi: ${todayIso}
Data ISO domani: ${tomorrowIso}
Fuso orario corrente del client: ${timezone}.`;
}

// --- DEFINIZIONE TOOLS (Formato OpenAI) ---
const TOOLS = [
    {
        type: "function",
        function: {
            name: "list_events",
            description: "Recupera eventi Google Calendar tra due date ISO 8601.",
            parameters: {
                type: "object",
                properties: {
                    timeMin: { type: "string", description: "Inizio intervallo ISO 8601" },
                    timeMax: { type: "string", description: "Fine intervallo ISO 8601" }
                },
                required: ["timeMin", "timeMax"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_event",
            description: "Crea un evento nel calendario. Titolo e descrizione sono obbligatori.",
            parameters: {
                type: "object",
                properties: {
                    summary: { type: "string", description: "Titolo significativo" },
                    description: { type: "string", description: "Descrizione dettagliata" },
                    start: { type: "string", description: "Inizio ISO 8601" },
                    end: { type: "string", description: "Fine ISO 8601" }
                },
                required: ["summary", "description", "start", "end"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_event",
            description: "Aggiorna un evento esistente nel calendario tramite il suo ID. Permette di spostare l'ora/data, cambiare titolo o descrizione.",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string", description: "ID dell'evento da modificare" },
                    summary: { type: "string", description: "Nuovo titolo" },
                    description: { type: "string", description: "Nuova descrizione" },
                    start: { type: "string", description: "Nuova data e ora di inizio ISO 8601" },
                    end: { type: "string", description: "Nuova data e ora di fine ISO 8601" }
                },
                required: ["eventId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_event",
            description: "Elimina un evento tramite ID.",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string", description: "ID evento" }
                },
                required: ["eventId"]
            }
        }
    }
];

// --- ESECUZIONE TOOLS ---
async function executeTool(name: string, args: any, token: string, options?: { sendNotifications?: boolean; timezone?: string }) {
    const tz = options?.timezone || "Europe/Rome";
    const sendNotifications = options?.sendNotifications !== false; // Default true

    switch (name) {
        case "list_events":
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(args.timeMin)}&timeMax=${encodeURIComponent(args.timeMax)}`;
            const resL = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!resL.ok) return { error: await resL.text() };
            const dataL = await resL.json();
            return {
                events: (dataL.items || []).slice(0, 15).map((e: any) => ({
                    id: e.id,
                    summary: e.summary || "(Senza titolo)",
                    start: e.start?.dateTime || e.start?.date,
                    end: e.end?.dateTime || e.end?.date,
                    description: e.description || "",
                    location: e.location || "",
                    htmlLink: e.htmlLink || ""
                }))
            };

        case "create_event":
            const summary = args.summary || "Nuovo Impegno";
            const description = args.description || summary;
            const bodyC: any = {
                summary, description,
                start: { dateTime: args.start, timeZone: tz },
                end: { dateTime: args.end, timeZone: tz }
            };

            if (!sendNotifications) {
                bodyC.reminders = { useDefault: false, overrides: [] };
            }

            const queryParams = new URLSearchParams({
                sendUpdates: sendNotifications ? "all" : "none"
            });

            const resC = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${queryParams}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(bodyC)
            });
            if (!resC.ok) return { error: await resC.text() };
            return await resC.json();

        case "update_event":
            const bodyU: any = {};
            if (args.summary) bodyU.summary = args.summary;
            if (args.description) bodyU.description = args.description;
            if (args.start) bodyU.start = { dateTime: args.start, timeZone: tz };
            if (args.end) bodyU.end = { dateTime: args.end, timeZone: tz };

            const queryParamsU = new URLSearchParams({
                sendUpdates: sendNotifications ? "all" : "none"
            });

            const resU = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}?${queryParamsU}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(bodyU)
            });
            if (!resU.ok) return { error: await resU.text() };
            return await resU.json();

        case "delete_event":
            const resD = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!resD.ok) return { error: await resD.text() };
            return { status: "success" };

        default: return { error: "Tool non supportato" };
    }
}

// --- ENDPOINT AGENTE ---
router.post("/api/calendar/action", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
        const { text, modelName, messages: history = [], temperature, sendNotifications, stream = false, timezone = "Europe/Rome" } = req.body;
        const googleToken = req.body.googleToken || req.headers['x-google-token'] || "";
        const selectedModel = modelName || "deepseek/deepseek-chat";

        console.log(`[CalendarAPI] Avvio Agente: ${selectedModel} | Notifications: ${sendNotifications !== false} | Stream: ${stream} | Timezone: ${timezone}`);

        if (stream) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Transfer-Encoding', 'chunked');
        }

        const sendChunk = (data: any) => {
            if (stream) {
                res.write(JSON.stringify(data) + "\n");
            }
        };

        const rawMessages: any[] = [
            { role: "system", content: "Sei un Agente Calendar.\nREGOLE:\n1. Chiama i tool per ogni azione.\n2. Forza sempre titolo e descrizione per ogni evento.\n3. NON usare MAI tabelle (Markdown o HTML) nelle tue risposte.\n4. Ogni volta che visualizzi degli eventi (list_events) o completi un'operazione di scrittura (create_event, update_event, delete_event), fornisci una descrizione testuale concisa e inserisci alla fine della risposta un blocco Generative UI per visualizzare graficamente l'azione in una scheda elegante:\n<ui-component type=\"calendar\">{\"action\": \"create|update|delete|list\", \"events\": [{\"id\": \"...\", \"summary\": \"...\", \"start\": \"...\", \"end\": \"...\", \"description\": \"...\", \"location\": \"...\", \"htmlLink\": \"...\"}]}</ui-component>\nAssicurati che il JSON dentro i tag sia valido, non contenga commenti ed elenchi esattamente gli eventi coinvolti." },
            { role: "system", content: getCurrentDateInfo(timezone) },
            ...history,
            { role: "user", content: text }
        ];

        const cachedMessages = applyPromptCaching(rawMessages);

        const reasoning: any[] = [];
        let finalResponse = "";

        for (let i = 0; i < 6; i++) {
            console.log(`[CalendarAPI] Step ${i+1}...`);
            const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Smart Calendar Assistant",
                    "X-OpenRouter-Cache": "true"
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: cachedMessages,
                    tools: TOOLS,
                    tool_choice: "auto",
                    temperature: temperature ?? 0.5,
                    provider: { allow_fallbacks: false }
                })
            });

            if (!apiRes.ok) throw new Error(`OpenRouter Error: ${await apiRes.text()}`);
            const data = await apiRes.json();
            const choice = data.choices[0];
            const msg = choice.message;

            if (msg.content) {
                const chunk = { type: "text", content: msg.content };
                sendChunk(chunk);
                reasoning.push({ type: "text", content: msg.content });
                finalResponse = msg.content;
            }

            if (msg.tool_calls) {
                cachedMessages.push(msg);
                for (const toolCall of msg.tool_calls) {
                    const name = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`[CalendarAPI] Eseguo tool: ${name}`);
                    
                    const rStep = { type: "tool_call", content: `🛠️ ${name}: ${JSON.stringify(args)}` };
                    reasoning.push(rStep);
                    sendChunk({ type: "reasoning", reasoningType: "tool_call", content: rStep.content });

                    const result = await executeTool(name, args, googleToken, { sendNotifications, timezone });
                    
                    const rResult = { type: "tool_result", content: `📦 ${name}: ${JSON.stringify(result).substring(0, 100)}` };
                    reasoning.push(rResult);
                    sendChunk({ type: "reasoning", reasoningType: "tool_result", content: rResult.content });

                    cachedMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: name,
                        content: JSON.stringify(result)
                    });
                }
                continue;
            }
            break;
        }

        if (stream) {
            res.end();
            return;
        }

        return res.json({ success: true, message: finalResponse, reasoning });

    } catch (error: any) {
        console.error("[CalendarAPI] Crash:", error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, error: error.message });
        } else {
            res.write(JSON.stringify({ type: "error", content: error.message }) + "\n");
            res.end();
        }
    }
});

export default router;