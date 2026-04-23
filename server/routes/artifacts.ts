import express from "express";
import { OPENROUTER_KEY } from "../config/enviroments.js";

const router = express.Router();

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
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ],
                response_format: { type: "json_object" }
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
