import { useAuth } from "../context/AuthContext";
import createConversation from "../services/supabase/Conversation/createConversation";
import createMessage from "../services/supabase/Conversation/createMessage";
import { type NavigateFunction } from "react-router-dom";

// Interfaccia per i parametri opzionali (per pulizia)
interface ChatOptions {
    systemPrompt?: string;
    personalInfo?: string;
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
        console.log("Custom Instruction inviato al backend:", customInstruction);
        const response = await fetch("http://localhost:3000/api/completion/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body:customInstruction,
        });

        if (!response.ok) throw new Error(`Errore API: ${response.statusText}`);

        // 4. Ricezione Dati
        const data = await response.json();

        // 5. Aggiornamento UI (Messaggio Bot)
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


export const sendStreamedMessage = async (message: string, setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, model: any, messageHistory: any[]) => {
    if (!message.trim()) return;

    // 1. Aggiungi subito il messaggio dell'utente
    const userMsg = { role: 'user' as const, content: message };

    // 2. Aggiungi subito un messaggio "bot" vuoto (placeholder) che riempiremo
    const modelLabel = model?.name ?? model?.name_id ?? "Unknown";
    const botMsgPlaceholder = { role: 'bot' as const, content: "", model: modelLabel };

    setMessageHistory((prev) => [...prev, userMsg, botMsgPlaceholder]);

    setLoading(true);

    try {
        // Prepara la storia per il backend (escludendo il messaggio corrente e il placeholder)
        const historyForBackend = messageHistory.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        }));

        // Controllo costi (come nel tuo codice originale)
        if (model.cost_per_input_token + model.cost_per_output_token > 2) {
            alert("Costo troppo alto...");
            setLoading(false);
            return;
        }

        const response = await fetch("http://localhost:3000/api/streamingOutput", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: historyForBackend,
                modelName: model.name_id,
            }),
        });

        if (!response.ok || !response.body) throw new Error(response.statusText);

        // 3. Inizia a leggere lo stream
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

                // 4. Aggiorna l'ultimo messaggio (quello del bot) con il testo accumulato
                setMessageHistory((prev) => {
                    const newHistory = [...prev];
                    const lastMsgIndex = newHistory.length - 1;
                    // Assicuriamoci di modificare solo l'ultimo messaggio se è del bot
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
        // Opzionale: gestire l'errore nell'ultimo messaggio
    } finally {
        setLoading(false);
    }
};