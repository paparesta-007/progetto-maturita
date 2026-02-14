import createMessage from "../services/supabase/Conversation/createMessage";
export const sendNormalMessage = async (
    message: string, 
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>, 
    setLoading: React.Dispatch<React.SetStateAction<boolean>>, 
    model: any, 
    messageHistory: any[],
    currentConversationId: string | null
) => {
    if (!message.trim()) return;

    // 1. Aggiornamento UI Immediato (Messaggio Utente)
    // Nota: Non salviamo ancora su DB, aspettiamo che la chiamata API abbia successo
    setMessageHistory((prev) => [...prev, { role: 'user', content: message }]);

    try {
        setLoading(true);

        // 2. Preparazione History per il Backend
        const historyForBackend = messageHistory.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        }));

        // Controllo Costi
        if ((model.cost_per_input_token + model.cost_per_output_token) > 2) {
             // Gestisci errore o alert
             return; 
        }

        // 3. Chiamata API
        const response = await fetch("http://localhost:3000/api/gemini/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: historyForBackend,
                modelName: model.name_id,
            }),
        });

        if (!response.ok) throw new Error(`Errore API: ${response.statusText}`);

        // 4. Ricezione Dati
        const data = await response.json(); 
        // data è tipo: { text: "Ciao!", usage: { ... } }

        // 5. Aggiornamento UI (Messaggio Bot)
        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: data.text, usage: data.usage },
        ]);

        // 6. Salvataggio su Supabase (CORREZIONE CRUCIALE)
        // Usiamo 'data.text' e 'data.usage' direttamente, NON messageHistory!
        if (currentConversationId) {
            console.log("Salvataggio su DB per:", currentConversationId);
            
            const responseToSave = {
                sender: message,      // Il messaggio che l'utente ha appena mandato
                content: data.text,   // La risposta appena arrivata dall'API
                usage: data.usage     // L'usage appena arrivato dall'API
            };

            await createMessage(responseToSave, currentConversationId);
        } else {
            console.warn("currentConversationId è null, salvataggio saltato.");
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
    const botMsgPlaceholder = { role: 'bot' as const, content: "" };

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