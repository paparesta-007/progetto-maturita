import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { OPENROUTER_KEY } from "../config/enviroments.js";
import { applyPromptCaching } from "../utils/promptCaching.js";

const router = express.Router();

// --- HELPER: data/ora corrente formattata ---
function getCurrentDateInfo(): string {
    const now = new Date();
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return `OGGI è ${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ore ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}.
Data ISO oggi: ${now.toISOString().split('T')[0]}
Data ISO domani: ${tomorrow.toISOString().split('T')[0]}
Fuso orario: Europe/Rome (+02:00).`;
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
async function executeTool(name: string, args: any, token: string) {
    const tz = "Europe/Rome";
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
                    end: e.end?.dateTime || e.end?.date
                }))
            };

        case "create_event":
            // Forza titolo e descrizione se il modello è pigro
            const summary = args.summary || "Nuovo Impegno";
            const description = args.description || summary;
            const bodyC = {
                summary, description,
                start: { dateTime: args.start, timeZone: tz },
                end: { dateTime: args.end, timeZone: tz }
            };
            const resC = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(bodyC)
            });
            if (!resC.ok) return { error: await resC.text() };
            return await resC.json();

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
        const { text, modelName, messages: history = [] } = req.body;
        const googleToken = req.body.googleToken || req.headers['x-google-token'] || "";
        const selectedModel = modelName || "deepseek/deepseek-chat";

        console.log(`[CalendarAPI] Avvio Agente: ${selectedModel}`);

        const rawMessages: any[] = [
            { role: "system", content: "Sei un Agente Calendar.\nREGOLE: 1. Chiama i tool per ogni azione. 2. Forza titolo e descrizione per ogni evento." },
            { role: "system", content: getCurrentDateInfo() },
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
                    provider: { allow_fallbacks: false }
                })
            });

            if (!apiRes.ok) throw new Error(`OpenRouter Error: ${await apiRes.text()}`);
            const data = await apiRes.json();
            const choice = data.choices[0];
            const msg = choice.message;

            if (msg.content) {
                reasoning.push({ type: "text", content: msg.content });
                finalResponse = msg.content;
            }

            if (msg.tool_calls) {
                messages.push(msg); // L'assistente deve stare in history prima dei tool results
                for (const toolCall of msg.tool_calls) {
                    const name = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`[CalendarAPI] Eseguo tool: ${name}`);
                    reasoning.push({ type: "tool_call", content: `🛠️ ${name}: ${JSON.stringify(args)}` });

                    const result = await executeTool(name, args, googleToken);
                    reasoning.push({ type: "tool_result", content: `📦 ${name}: ${JSON.stringify(result).substring(0, 100)}` });

                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: name,
                        content: JSON.stringify(result)
                    });
                }
                continue; // Altro giro per far elaborare i risultati all'IA
            }
            break; // Se non ci sono tool_calls, abbiamo finito
        }

        return res.json({ success: true, message: finalResponse, reasoning });

    } catch (error: any) {
        console.error("[CalendarAPI] Crash:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;