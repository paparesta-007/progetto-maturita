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

        const systemPrompt = `Sei un assistente specializzato nella creazione e modifica di schemi visivi ad albero.
L'utente ti chiederà di modificare o creare un nuovo schema, o ti farà domande a riguardo.
Il tuo compito è restituire un oggetto JSON con due campi:
- "message": una risposta discorsiva per l'utente.
- "schema": l'intero albero dello schema aggiornato. Se l'utente fa solo una domanda e non richiede modifiche allo schema, ometti questo campo o restituisci null.

Attualmente lo schema è il seguente:
${JSON.stringify(currentSchema, null, 2)}

Quando modifichi lo schema, preserva gli 'id' esistenti per i nodi che non cambiano. Genera nuovi UUID v4 per i nuovi nodi.
Assicurati di restituire SEMPRE l'intero albero a partire dalle radici, non solo i nodi modificati.`;

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
