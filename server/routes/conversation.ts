import express from "express";
import { supabase } from "../services/supabase.js";
import { logSupabaseAction } from "../middleware/logging.js";
import { OPENROUTER_KEY } from "../config/enviroments.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Crea una nuova conversazione
router.post("/create", requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { user_id, title } = req.body;
        if (!user_id) throw new Error("user_id mancante");

        logSupabaseAction("insert_conversation", user_id);
        const { data, error } = await supabase
            .from("conversations")
            .insert({
                user_id: user_id,
                title: title || "New Chat",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error("Errore creazione conversazione:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Crea un nuovo messaggio in una conversazione
router.post("/messages/create", requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { conversation_id, sender, content, usage, model, render_mode, reasoning_text, user_id } = req.body;
        if (!conversation_id) throw new Error("conversation_id mancante");

        logSupabaseAction("insert_message", user_id || "unknown");
        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversation_id,
                created_at: new Date().toISOString(),
                sender: sender,
                content: content,
                usage: usage,
                model: model,
                render_mode: render_mode === 'html' ? 'html' : 'markdown',
                reasoning_text: reasoning_text,
            });

        logSupabaseAction("update_conversation", user_id || "unknown");
        await supabase
            .from("conversations")
            .update({
                updated_at: new Date().toISOString(),
            })
            .eq("id", conversation_id);
            
        if (error) {
            console.error("Errore creazione messaggio:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Recupera tutte le conversazioni di un utente
router.get("/list", requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const user_id = req.query.user_id as string;
        if (!user_id) throw new Error("user_id mancante");

        logSupabaseAction("select_conversations_list", user_id);
        const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Errore recupero conversazioni:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Recupera i messaggi di una conversazione
router.get("/messages", requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const conversation_id = req.query.conversation_id as string;
        if (!conversation_id) throw new Error("conversation_id mancante");

        logSupabaseAction("select_messages", "unknown");
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Errore recupero messaggi:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data ? data.reverse() : []);
    } catch (error) {
        next(error);
    }
});

// Cancella una conversazione
router.delete("/delete", requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { user_id, conversation_id } = req.body;
        if (!user_id || !conversation_id) throw new Error("user_id e conversation_id richiesti");

        logSupabaseAction("delete_conversation", user_id);
        const { data, error } = await supabase
            .from("conversations")
            .delete()
            .eq("user_id", user_id)
            .eq("id", conversation_id);

        if (error) {
            console.error("Errore cancellazione conversazione:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// Aggiorna il titolo di una conversazione
router.patch("/update-title", requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { user_id, conversation_id, new_title } = req.body;
        if (!user_id || !conversation_id || !new_title) throw new Error("user_id, conversation_id e new_title richiesti");

        logSupabaseAction("update_conversation_title", user_id);
        const { data, error } = await supabase
            .from("conversations")
            .update({ title: new_title, updated_at: new Date().toISOString() })
            .eq("id", conversation_id)
            .eq("user_id", user_id);

        if (error) {
            console.error("Errore aggiornamento titolo conversazione:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.post("/getTitleConversation", requireAuth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Messaggio mancante" });
        }

        const prompt = `Genera un titolo breve e coinciso (massimo 8 parole) e descrittivo per una conversazione basata su questo messaggio iniziale: "${message}". Il titolo dovrebbe catturare l'essenza del messaggio in modo accattivante e informativo. 
        EVITA ASSOLUTAMENTE USO MARKDOWN, SOLO PLAIN TEXT, e NON includere virgolette o simboli speciali. Il titolo deve essere adatto per essere visualizzato in una lista di conversazioni.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/getTitleConversation",
                "X-Title": "NomeTuaApp",
                "X-OpenRouter-Cache": "true"
            },
            body: JSON.stringify({
                model: "mistralai/mistral-nemo",
                messages: [
                    {
                        role: "system",
                        content: [
                            {
                                type: "text",
                                text: "Sei un esperto di titolazione. Genera titoli brevi, accattivanti e descrittivi.",
                                cache_control: { type: "ephemeral" }
                            }
                        ]
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 50,
                reasoning: { effort: "none" },
                provider: { allow_fallbacks: false }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const text = (data.choices[0]?.message?.content || "Nuova Conversazione").trim();

        const usage = {
            ...data.usage,
            prompt_tokens: data.usage?.prompt_tokens || 0,
            completion_tokens: data.usage?.completion_tokens || 0,
            total_tokens: data.usage?.total_tokens || 0,
            cost: data.usage?.cost || data.cost || 0
        };

        res.json({
            title: text,
            usage: usage
        });
    } catch (error: any) {
        res.status(500).json({ error: "Errore interno del server", details: error.message });
    }
});

router.post("/getSuggestedQuestion", requireAuth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const { message, response } = req.body;

        if (!message || !response) {
            return res.status(400).json({ error: "message and response are required" });
        }

        const suggested_questions = await getSuggestedQuestionInternal(message, response);
        res.send({ suggested_questions });

    } catch (error) {
        next(error);
    }
});

// FUNZIONE UTILITY PER DOMANDE SUGGERITE
async function getSuggestedQuestionInternal(question: string, answer: string): Promise<string[]> {
    try {
        const prompt = `Genera esattamente 4 domande logiche e pertinenti che l'utente potrebbe fare per approfondire l'argomento, basandoti su questo scambio:
        
        Domanda originale: "${question}"
        Risposta: "${answer}"

        REQUISITO: Rispondi ESCLUSIVAMENTE con un oggetto JSON valido nel seguente formato:
        {
          "questions": ["domanda 1", "domanda 2", "domanda 3", "domanda 4"]
        }`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/suggested",
                "X-Title": "NomeTuaApp",
                "X-OpenRouter-Cache": "true"
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b:nitro",
                messages: [
                    {
                        role: "system",
                        content: [
                            {
                                type: "text",
                                text: "Sei un utile assistente AI che risponde sempre in formato JSON. Genera domande brevi dirette e chiare di approfondimento nella stessa lingua dell'input.",
                                cache_control: { type: "ephemeral" }
                            }
                        ]
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" }, // Forza l'output JSON
                temperature: 0.5,
                reasoning: { effort: "minimal" },
                provider: { allow_fallbacks: false }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) return [];

        // Parsiamo il contenuto JSON
        const parsed = JSON.parse(content);

        // Validazione manuale (simile a quello che faceva Zod)
        if (parsed.questions && Array.isArray(parsed.questions)) {
            // Normalizziamo: il LLM a volte ritorna oggetti {domanda: "..."} invece di stringhe
            const normalized = parsed.questions.slice(0, 4).map((q: any) => {
                if (typeof q === 'string') return q;
                if (typeof q === 'object' && q !== null) {
                    // Prendi il primo valore stringa dall'oggetto (domanda, question, text, ecc.)
                    return Object.values(q).find((v) => typeof v === 'string') || '';
                }
                return '';
            }).filter((q: string) => q.length > 0);
            return normalized;
        }

        return [];

    } catch (suggestionError) {
        console.error("Errore durante la generazione delle domande correlate:", suggestionError);
        return [];
    }
}

export default router;
