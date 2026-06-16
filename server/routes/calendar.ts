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
        const { text, modelName, messages: history = [], temperature, sendNotifications, stream = false, timezone = "Europe/Rome", reasoning: reasoningEffort } = req.body;
        const googleToken = req.body.googleToken || req.headers['x-google-token'] || "";
        const selectedModel = modelName || "deepseek/deepseek-chat";

        console.log(`[CalendarAPI] Avvio Agente: ${selectedModel} | Notifications: ${sendNotifications !== false} | Stream: ${stream} | Timezone: ${timezone} | Reasoning: ${reasoningEffort}`);

        const reasoningEffortMap: Record<string, string> = {
            fast: "minimal",
            standard: "medium",
            accurate: "high"
        };
        const effortValue = reasoningEffort ? reasoningEffortMap[reasoningEffort] || "medium" : "medium";

        if (stream) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.setHeader("X-Accel-Buffering", "no");
            if (typeof (res as any).flushHeaders === 'function') {
                (res as any).flushHeaders();
            }
        }

        const sendChunk = (data: any) => {
            if (stream) {
                res.write(JSON.stringify(data) + "\n");
            }
        };

        const rawMessages: any[] = [
            { role: "system", content: "Sei un Agente Calendar.\nREGOLE:\n1. Chiama i tool per ogni azione.\n2. NON creare MAI un evento a meno che l'utente non ti chieda ESPLICITAMENTE di crearlo, salvarlo o aggiungerlo (es. 'crea l'evento', 'salvalo', 'aggiungilo al calendario'). Se l'utente esprime solo un'intenzione o una necessità (es. 'devo andare al negozio ora', 'ho una riunione alle 15'), devi prima controllare il calendario usando `list_events` e poi proporre all'utente le opzioni disponibili o gli orari liberi, chiedendogli conferma prima di procedere, senza creare l'evento in automatico.\n3. Forza sempre titolo e descrizione per ogni evento quando lo crei o lo modifichi.\n4. NON usare MAI tabelle (Markdown o HTML) nelle tue risposte.\n5. Ogni volta che proponi degli slot o orari liberi, considera l'orario corrente. Qualsiasi fascia oraria o slot antecedente all'ora corrente è considerata nel passato e NON può essere proposta come slot libero o disponibile per oggi.\n6. Ogni volta che visualizzi degli eventi (list_events) o completi un'operazione di scrittura (create_event, update_event, delete_event), fornisci una descrizione testuale concisa e inserisci alla fine della risposta un blocco Generative UI per visualizzare graficamente l'azione in una scheda elegante. Per risparmiare token, includi solo titolo (summary), data/ora inizio (start) e data/ora fine (end) nel JSON degli eventi:\n<ui-component type=\"calendar\">{\"action\": \"create|update|delete|list\", \"events\": [{\"summary\": \"...\", \"start\": \"...\", \"end\": \"...\"}]}</ui-component>\nAssicurati che il JSON dentro i tag sia valido, non contenga commenti ed elenchi esattamente gli eventi coinvolti." },
            { role: "system", content: getCurrentDateInfo(timezone) },
            ...history,
            { role: "user", content: text }
        ];

        const cachedMessages = applyPromptCaching(rawMessages);

        const reasoning: any[] = [];
        let finalResponse = "";

        const controller = new AbortController();
        req.on("close", () => {
            console.log("[CalendarAPI] Client disconnesso prima della fine. Aborto richiesta.");
            controller.abort();
        });

        for (let i = 0; i < 6; i++) {
            console.log(`[CalendarAPI] Step ${i+1}...`);
            const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                signal: controller.signal,
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
                    reasoning: { effort: effortValue },
                    provider: { allow_fallbacks: false },
                    stream: stream
                })
            });

            if (!apiRes.ok) throw new Error(`OpenRouter Error: ${await apiRes.text()}`);

            if (stream) {
                if (!apiRes.body) throw new Error("OpenRouter response body is null");
                const reader = (apiRes.body as any).getReader();
                const decoder = new TextDecoder("utf-8");
                let buffer = "";
                let accumulatedContent = "";
                const toolCallsMap: Record<number, {
                    id?: string;
                    type?: string;
                    function?: {
                        name?: string;
                        arguments?: string;
                    }
                }> = {};

                let streamDone = false;
                while (!streamDone) {
                    const { done, value } = await reader.read();
                    if (done) {
                        streamDone = true;
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith("data: ")) {
                            const dataStr = trimmedLine.slice(6);
                            if (dataStr === "[DONE]") {
                                streamDone = true;
                                break;
                            }

                            try {
                                const parsed = JSON.parse(dataStr);
                                const choice = parsed.choices?.[0];
                                if (!choice) continue;

                                const delta = choice.delta;
                                if (!delta) continue;

                                if (delta.content) {
                                    accumulatedContent += delta.content;
                                    sendChunk({ type: "text", content: delta.content });
                                }

                                if (delta.tool_calls) {
                                    for (const tcDelta of delta.tool_calls) {
                                        const index = tcDelta.index;
                                        if (index === undefined) continue;

                                        if (!toolCallsMap[index]) {
                                            toolCallsMap[index] = {
                                                id: tcDelta.id,
                                                type: tcDelta.type || "function",
                                                function: {
                                                    name: tcDelta.function?.name || "",
                                                    arguments: tcDelta.function?.arguments || ""
                                                }
                                            };
                                        } else {
                                            const tc = toolCallsMap[index];
                                            if (tcDelta.id) tc.id = tcDelta.id;
                                            if (tcDelta.type) tc.type = tcDelta.type;
                                            if (tcDelta.function) {
                                                if (tcDelta.function.name) {
                                                    tc.function = tc.function || {};
                                                    tc.function.name = (tc.function.name || "") + tcDelta.function.name;
                                                }
                                                if (tcDelta.function.arguments) {
                                                    tc.function = tc.function || {};
                                                    tc.function.arguments = (tc.function.arguments || "") + tcDelta.function.arguments;
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (parseError) {
                                console.warn("⚠️ Error parsing JSON chunk:", parseError);
                            }
                        }
                    }
                }

                // Gestione buffer residuo
                if (buffer.trim()) {
                    const trimmedLine = buffer.trim();
                    if (trimmedLine.startsWith("data: ")) {
                        const dataStr = trimmedLine.slice(6);
                        if (dataStr !== "[DONE]") {
                            try {
                                const parsed = JSON.parse(dataStr);
                                const choice = parsed.choices?.[0];
                                const delta = choice?.delta;
                                if (delta) {
                                    if (delta.content) {
                                        accumulatedContent += delta.content;
                                        sendChunk({ type: "text", content: delta.content });
                                    }
                                    if (delta.tool_calls) {
                                        for (const tcDelta of delta.tool_calls) {
                                            const index = tcDelta.index;
                                            if (index !== undefined) {
                                                if (!toolCallsMap[index]) {
                                                    toolCallsMap[index] = {
                                                        id: tcDelta.id,
                                                        type: tcDelta.type || "function",
                                                        function: {
                                                            name: tcDelta.function?.name || "",
                                                            arguments: tcDelta.function?.arguments || ""
                                                        }
                                                    };
                                                } else {
                                                    const tc = toolCallsMap[index];
                                                    if (tcDelta.id) tc.id = tcDelta.id;
                                                    if (tcDelta.type) tc.type = tcDelta.type;
                                                    if (tcDelta.function) {
                                                        if (tcDelta.function.name) {
                                                            tc.function = tc.function || {};
                                                            tc.function.name = (tc.function.name || "") + tcDelta.function.name;
                                                        }
                                                        if (tcDelta.function.arguments) {
                                                            tc.function = tc.function || {};
                                                            tc.function.arguments = (tc.function.arguments || "") + tcDelta.function.arguments;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                console.warn("⚠️ Leftover buffer parsing failed:", e);
                            }
                        }
                    }
                }

                const toolCalls = Object.keys(toolCallsMap)
                    .map(key => parseInt(key, 10))
                    .sort((a, b) => a - b)
                    .map(idx => {
                        const tc = toolCallsMap[idx];
                        return {
                            id: tc.id || `call_${Math.random().toString(36).substring(2, 9)}`,
                            type: tc.type || "function",
                            function: {
                                name: tc.function?.name || "",
                                arguments: tc.function?.arguments || ""
                            }
                        };
                    });

                const msg: any = { role: "assistant" };
                if (accumulatedContent) {
                    msg.content = accumulatedContent;
                    reasoning.push({ type: "text", content: accumulatedContent });
                    finalResponse = accumulatedContent;
                }
                if (toolCalls.length > 0) {
                    msg.tool_calls = toolCalls;
                }

                if (toolCalls.length > 0) {
                    cachedMessages.push(msg);
                    for (const toolCall of toolCalls) {
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

            } else {
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

router.post("/api/calendar/improve-description", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
        const { title, description } = req.body;
        if (!title && !description) {
            return res.status(400).json({ error: "Title or Description is required" });
        }

        const systemPrompt = "Sei un assistente AI integrato nel calendario. Il tuo compito è migliorare e arricchire la descrizione dell'evento di calendario fornito dall'utente in modo professionale, chiaro e conciso. Mantieni la descrizione breve e adatta per un evento lavorativo o personale. Ritorna SOLTANTO il testo migliorato della descrizione, senza preamboli o commenti.";
        const userPrompt = `Titolo evento: ${title || "(Senza titolo)"}\nDescrizione attuale: ${description || "(Vuota)"}\n\nMigliora e completa questa descrizione:`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/paparesta-007/progetto-maturita",
                "X-Title": "Smart Calendar Assistant"
            },
            body: JSON.stringify({
                model: "mistralai/ministral-8b-2512",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter error: ${err}`);
        }

        const data = await response.json();
        const improvedDescription = data.choices?.[0]?.message?.content || "";
        return res.json({ description: improvedDescription.trim() });
    } catch (error: any) {
        console.error("Error improving description:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});

export default router;