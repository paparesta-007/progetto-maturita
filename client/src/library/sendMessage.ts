import { useAuth } from "../context/AuthContext";
import createConversation from "../services/supabase/Conversation/createConversation";
import createMessage from "../services/supabase/Conversation/createMessage";
import { type NavigateFunction } from "react-router-dom";

// Interfaccia per i parametri opzionali (per pulizia)
export interface ChatOptions {
    systemPrompt?: string;
    personalInfo?: any;
    tone?: string;
    allowedCustomInstructions?: string | boolean;
}

export const sendNormalMessage = async (
    message: string,
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    model: any,
    messageHistory: any[],
    currentConversationId: string | null,
    userId: string | undefined,
    setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>,
    fetchConversations: () => Promise<void>,
    navigate: NavigateFunction,
    // AGGIUNGIAMO I DATI CHE PRIMA CERCAVI DI PRENDERE CON USEAUTH
    options: ChatOptions
) => {

    // Rimosso useAuth! Usiamo i parametri passati.
    const { systemPrompt, personalInfo, tone, allowedCustomInstructions } = options;

    if (!message.trim()) return;

    // 1. Aggiornamento UI Immediato
    setMessageHistory((prev) => [...prev, { role: 'user', content: message }]);

    try {
        setLoading(true);

        // 2. Preparazione History
        const historyForBackend = messageHistory.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        }));

        // Controllo costi...
        if ((model.cost_per_input_token + model.cost_per_output_token) > 2) return;
        let customInstruction = JSON.stringify({
            message,
            history: historyForBackend,
            modelName: model.name_id,
            systemPromptUser: systemPrompt,
            personalInfo,
            tone,
            allowedCustomInstructions
        })
        const response = await fetch("http://localhost:3000/api/completion/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body:customInstruction,
        });

        if (!response.ok) throw new Error(`Errore API: ${response.statusText}`);

        // 4. Ricezione Dati
        const data = await response.json();

        const metrics= data.metrics || { latencyMs: 0, throughput: 0 }; 
        console.log("salva metriche:", metrics);

        const modelLabel = model?.name ?? model?.name_id ?? "Unknown";

        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: data.text, usage: data.usage, model: modelLabel },
        ]);

        // PREPARIAMO L'OGGETTO DA SALVARE
        const messagePayload = {
            sender: message,
            content: data.text,
            usage: data.usage,
            model: model
        };

        // 6. Logica di Salvataggio
        if (currentConversationId && userId) {
            // --- CASO A: CONVERSAZIONE ESISTENTE ---
            console.log("Salvataggio su conversazione esistente:", currentConversationId);
            await createMessage(messagePayload, currentConversationId, model);

        } else if (userId) {
            // --- CASO B: NUOVA CONVERSAZIONE ---
            console.log("Generazione titolo e creazione nuova conversazione...");

            // A. Ottieni il titolo
            const titleRes = await fetch("http://localhost:3000/api/gemini/getTitleConversation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            const { text: newTitle } = await titleRes.json();

            // B. Crea la conversazione su Supabase
            const newConvData = await createConversation(userId, newTitle || "New Chat");

            if (newConvData && newConvData.length > 0) {
                const newConvId = newConvData[0].id;

                // C. Salva messaggio nella nuova conversazione
                await createMessage(messagePayload, newConvId, model);

                // D. Aggiorna stato e lista
                setCurrentConversationId(newConvId);
                await fetchConversations();
            }
        }

    } catch (error) {
        console.error("Errore sendNormalMessage:", error);
    } finally {
        setLoading(false);
    }
};


export const sendStreamedMessage = async (
    message: string, 
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>, 
    setLoading: React.Dispatch<React.SetStateAction<boolean>>, 
    model: any, 
    messageHistory: any[],
    options: ChatOptions // <--- Parametro aggiunto
) => {
    if (!message.trim()) return;

    // 1. Estrazione opzioni dai parametri
    const { systemPrompt, personalInfo, tone, allowedCustomInstructions } = options;

    // 2. Aggiornamento UI Immediato
    const userMsg = { role: 'user' as const, content: message };
    const modelLabel = model?.name ?? model?.name_id ?? "Unknown";
    const botMsgPlaceholder = { role: 'bot' as const, content: "", model: modelLabel };

    setMessageHistory((prev) => [...prev, userMsg, botMsgPlaceholder]);
    setLoading(true);

    try {
        // 3. Preparazione History
        const historyForBackend = messageHistory.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        }));

        // Controllo costi
        if (model.cost_per_input_token + model.cost_per_output_token > 2) {
            alert("Costo troppo alto...");
            setLoading(false);
            return;
        }

        // 4. Chiamata API con System Prompt e altre opzioni
        const response = await fetch("http://localhost:3000/api/streamingOutput", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: historyForBackend,
                modelName: model.name_id,
                // --- NUOVI CAMPI AGGIUNTI ---
                systemPromptUser: systemPrompt,
                personalInfo,
                tone,
                allowedCustomInstructions
            }),
        });

        if (!response.ok || !response.body) throw new Error(response.statusText);

        // 5. Gestione Stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let accumulatedText = "";

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;

            if (value) {
                const chunkValue = decoder.decode(value, { stream: true });
                accumulatedText += chunkValue;

                // 6. Aggiornamento progressivo del messaggio bot
                setMessageHistory((prev) => {
                    const newHistory = [...prev];
                    const lastMsgIndex = newHistory.length - 1;
                    if (newHistory[lastMsgIndex].role === 'bot') {
                        newHistory[lastMsgIndex] = {
                            ...newHistory[lastMsgIndex],
                            content: accumulatedText
                        };
                    }
                    return newHistory;
                });
            }
        }

    } catch (error) {
        console.error("Errore durante lo streaming:", error);
    } finally {
        setLoading(false);
    }
};