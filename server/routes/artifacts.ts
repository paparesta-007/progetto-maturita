import express from "express";
import { OPENROUTER_KEY } from "../config/enviroments.js";
import { TRANSLATOR_SYSTEM_PROMPT } from "../static/prompt/translatePrompt.js";
import { FLASHCARD_SYSTEM_PROMPT } from "../static/prompt/flashcardPrompt.js";
import { FLASHCARD_DEEP_DIVE_PROMPT } from "../static/prompt/flashcardDeepDivePrompt.js";

const router = express.Router();

router.post("/flashcards/generate", async function (req, res) {
    try {
        const { text, difficulty } = req.body;
        if (!text) return res.status(400).json({ error: "Testo mancante" });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "X-OpenRouter-Cache": "true"
            },
            body: JSON.stringify({
                model: "mistralai/mistral-small-3.2-24b-instruct",
                messages: [
                    { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
                    { role: "user", content: `Genera flashcards di livello ${difficulty || 'Medium'} per questo testo:\n\n${text}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.5
            })
        });

        if (!response.ok) throw new Error("Errore API OpenRouter");
        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        
        const cards = Array.isArray(content) ? content : (content.flashcards || content.cards || []);
        // Strip details if present to ensure clean response
        const cleanCards = cards.map((c: any) => ({
            front: c.front,
            back: c.back,
            hint: c.hint
        }));
        return res.status(200).json({ cards: cleanCards });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

router.post("/flashcards/deep-dive", async function (req, res) {
    try {
        const { card, contextText } = req.body;
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "X-OpenRouter-Cache": "true"
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b:nitro",
                messages: [
                    { role: "system", content: FLASHCARD_DEEP_DIVE_PROMPT },
                    { role: "user", content: `Fornisci un approfondimento per questa flashcard:\nDomanda: ${card.front}\nRisposta: ${card.back}\n\nContesto originale (se utile): ${contextText || 'N/A'}` }
                ],
                temperature: 0.5,
                stream: true
            })
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Errore API OpenRouter: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("X-Accel-Buffering", "no");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.lastIndexOf("\n");
            if (boundary === -1) continue;

            const completeData = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 1);

            const lines = completeData.split("\n");
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("data: ")) {
                    const dataStr = trimmedLine.slice(6);
                    if (dataStr === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        const textPart = parsed.choices?.[0]?.delta?.content;
                        if (textPart) {
                            res.write(textPart);
                        }
                    } catch (e) {
                        // Partial JSON or other error
                    }
                }
            }
        }
        res.end();

    } catch (error: any) {
        console.error(error);
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message });
        }
        res.end();
    }
});

router.post("/translate", async function (req: express.Request, res: express.Response) {
    try {
        const { message, history: rawHistory, systemPromptUser } = req.body;
        const history = Array.isArray(rawHistory) ? rawHistory : [];

        // Prioritize custom system prompt if provided, else use default
        const finalSystemPrompt = systemPromptUser || TRANSLATOR_SYSTEM_PROMPT;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "X-OpenRouter-Cache": "true"
            },
            body: JSON.stringify({
                model: "mistralai/mistral-small-24b-instruct-2501",
                messages: [
                    { role: "system", content: finalSystemPrompt },
                    ...history,
                    { role: "user", content: message }
                ],
                temperature: 0.5,
                stream: true
            })
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Errore API OpenRouter: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("X-Accel-Buffering", "no");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.lastIndexOf("\n");
            if (boundary === -1) continue;

            const completeData = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 1);

            const lines = completeData.split("\n");
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("data: ")) {
                    const dataStr = trimmedLine.slice(6);
                    if (dataStr === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        const textPart = parsed.choices?.[0]?.delta?.content;
                        if (textPart) {
                            res.write(textPart);
                        }
                    } catch (e) {
                        // Partial JSON or other error
                    }
                }
            }
        }
        res.end();

    } catch (error: any) {
        console.error("Errore traduzione:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Errore interno del server", details: error.message });
        }
        res.end();
    }
});

router.post("/quiz/generate", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { topic, mode, temperature } = req.body;

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
                "X-OpenRouter-Cache": "true"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: "system",
                        content: [
                            {
                                type: "text",
                                text: "Genera solo JSON valido senza testo extra.",
                                cache_control: { type: "ephemeral" }
                            }
                        ]
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
                temperature: temperature ?? 0.5,
                provider: {
                    require_parameters: true,
                    allow_fallbacks: false
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

router.post("/schema-tree", async (req, res) => {
    try {
        const { messages, currentSchema, model } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Campo 'messages' mancante o non valido." });
        }

        const modeToModelMap: Record<string, string> = {
            fast: "openai/gpt-oss-120b",
            balanced: "google/gemma-4-31b-it",
            pro: "xiaomi/mimo-v2.5"
        };

        const selectedModel = (typeof model === "string" && modeToModelMap[model]) 
            ? modeToModelMap[model] 
            : "openai/gpt-oss-120b";

        const systemPrompt = `Sei un esperto creatore e modificatore di schemi visivi ad albero (Mind Maps / Flowcharts).
Il tuo compito principale è TRADURRE la richiesta dell'utente in un aggiornamento pratico dell'array JSON che rappresenta lo schema.

Regole FONDAMENTALI:
1. Devi SEMPRE rispondere esclusivamente con un oggetto JSON valido.
2. L'oggetto JSON DEVE avere due campi: "message" e "schema".
3. "message" (string): contiene una tua breve risposta discorsiva per l'utente.
4. "schema" (array o null): DEVE contenere l'INTERO albero aggiornato. Se l'utente ti chiede di aggiungere informazioni, spiegare meglio un concetto, inserire un nodo o modificare i contenuti, DEVI NECESSARIAMENTE aggiornare i campi "title", "description" o "children" dei nodi coinvolti e restituire l'intero array.
5. Usa "schema": null SOLO se la richiesta è puramente una domanda generale che non richiede modifiche alla mappa concettuale. In TUTTI gli altri casi in cui l'utente chiede di "aggiungere", "espandere", "migliorare", "completare", DEVI aggiornare lo schema.
6. MANTENERE GLI ID ESISTENTI per i nodi che non cambi. Per i nuovi nodi che crei, genera un nuovo ID alfanumerico casuale (es. "a1b2c3d4").
7. Struttura esatta di un nodo: { "id": "...", "title": "...", "description": "...", "children": [ ...altri nodi... ] }

Stato attuale dello schema (da usare come base per le tue modifiche):
${JSON.stringify(currentSchema, null, 2)}

ESEMPI DI COMPORTAMENTO:
- Utente: "Aggiungi più dettagli al nodo X" -> Aggiorni il campo "description" del nodo X nello "schema".
- Utente: "Aggiungi un nodo figlio a Y che parli di Z" -> Inserisci un nuovo oggetto in "children" del nodo Y nello "schema".
- Utente: "Spiega meglio questo concetto" -> Rispondi in "message" e AGGIORNI le description o crei nodi figli nello "schema".
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "X-OpenRouter-Cache": "true"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { 
                        role: "system", 
                        content: [
                            {
                                type: "text",
                                text: systemPrompt,
                                cache_control: { type: "ephemeral" }
                            }
                        ] 
                    },
                    ...messages
                ],
                response_format: { type: "json_object" },
                temperature: 0.5,
                provider: { allow_fallbacks: false }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Errore API OpenRouter: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const aiData = await response.json();
        let aiContent = aiData?.choices?.[0]?.message?.content;

        if (!aiContent) {
            throw new Error("Risposta del modello vuota o non valida");
        }

        // Parse JSON since response_format is json_object
        const parsedResponse = JSON.parse(aiContent);

        return res.status(200).json(parsedResponse);

    } catch (error: any) {
        console.error("Errore generazione schema:", error);
        return res.status(500).json({ error: "Errore interno del server", details: error.message });
    }
});

export default router;
