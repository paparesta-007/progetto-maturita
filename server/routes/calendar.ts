import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { OPENROUTER_KEY } from "../config/enviroments.js";

const router = express.Router();

// --- MOCK CRUD FUNCTIONS ---

function mockCreateEvent(summary: string, dateInfo: string) {
    return {
        action: "CREATE_EVENT",
        endpoint: "POST https://www.googleapis.com/calendar/v3/calendars/primary/events",
        params: {
            summary,
            start: { date: dateInfo }, // format semplificato
            end: { date: dateInfo }
        }
    };
}

function mockListEvents(timeMin: string) {
    return {
        action: "LIST_EVENTS",
        endpoint: "GET https://www.googleapis.com/calendar/v3/calendars/primary/events",
        params: {
            timeMin,
            singleEvents: true,
            orderBy: "startTime"
        }
    };
}

function mockUpdateEvent(eventId: string, updates: any) {
    return {
        action: "UPDATE_EVENT",
        endpoint: `PATCH https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        params: updates
    };
}

function mockDeleteEvent(eventId: string) {
    return {
        action: "DELETE_EVENT",
        endpoint: `DELETE https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        params: {}
    };
}

// --- ENDPOINT ---

const calendarTools = [
    {
        type: "function",
        function: {
            name: "create_event",
            description: "Es. 'devo andare a comprare x entro mercoledì'. Crea nuovo evento",
            parameters: {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    dateInfo: { type: "string" }
                },
                required: ["summary", "dateInfo"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_events",
            description: "Elenca gli eventi del calendario.",
            parameters: {
                type: "object",
                properties: {
                    timeMin: { type: "string" }
                },
                required: ["timeMin"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_event",
            description: "Modifica evento",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string" },
                    updates: { type: "object" }
                },
                required: ["eventId", "updates"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_event",
            description: "Elimina evento",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string" }
                },
                required: ["eventId"]
            }
        }
    }
];

router.post("/api/calendar/action", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
        const { text, modelName } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: "Campo 'text' mancante nel body." });
        }

        const selectedModel = modelName || "deepseek/deepseek-chat"; 

        const messages = [
            { 
                role: "system", 
                content: "Sei un assistente per Google Calendar. Devi invocare uno dei tool forniti estraendo i parametri dal messaggio. Oggi è il 27 Aprile 2026."
            },
            { role: "user", content: text }
        ];

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: messages,
                tools: calendarTools,
                tool_choice: "auto",
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API Error: ${response.status}`);
        }

        const data = await response.json();
        const responseMessage = data.choices[0].message;

        let results: any[] = [];

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                let currentMock;

                switch (functionName) {
                    case "create_event": 
                        currentMock = mockCreateEvent(functionArgs.summary, functionArgs.dateInfo); 
                        break;
                    case "list_events": 
                        currentMock = mockListEvents(functionArgs.timeMin); 
                        break;
                    case "update_event": 
                        currentMock = mockUpdateEvent(functionArgs.eventId, functionArgs.updates); 
                        break;
                    case "delete_event": 
                        currentMock = mockDeleteEvent(functionArgs.eventId); 
                        break;
                    default: 
                        currentMock = { error: `Funzione ${functionName} ignota.` };
                }
                results.push(currentMock);
            }
        } else {
            results.push({ action: "NO_ACTION", detail: responseMessage.content || "Nessuna azione dedotta" });
        }

        return res.json({
            success: true,
            originalText: text,
            parsedActions: results
        });

    } catch (error) {
        console.error("Errore nell'endpoint mock calendar:", error);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

export default router;