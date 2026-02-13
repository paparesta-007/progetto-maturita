export const sendNormalMessage = async (message: string, setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>, clearInput: () => void, setLoading: React.Dispatch<React.SetStateAction<boolean>>, model: any,messageHistory: any[]) => {
    if (!message.trim()) return;

    // 1. Aggiungiamo subito il messaggio dell'utente alla UI per feedback immediato
    const userMsg = { role: 'user' as const, content: message };
    setMessageHistory((prev) => [...prev, userMsg]);

    console.log("Invio messaggio:", message);
    clearInput();

    try {
        setLoading(true);
        // 2. Mappiamo la storia per il backend (cambiamo 'bot' in 'assistant')
        const historyForBackend = messageHistory.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        }));
        if (model.cost_per_input_token + model.cost_per_output_token > 2) {
            alert("This model has a cost of " + (model.cost_per_input_token + model.cost_per_output_token) + "$ per 1 million tokens. Consider upgrading your plan or selecting a different model to avoid unexpected costs.");
            return
        }
        const response = await fetch("http://localhost:3000/api/gemini/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: historyForBackend, // Inviamo la storia corretta
                modelName: model.name_id,
            }),
        });

        if (!response.ok) throw new Error(`Errore: ${response.statusText}`);

        const data = await response.json();

        // 3. Aggiungiamo solo la risposta del bot (l'utente è già stato aggiunto sopra)
        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: data.text, usage: data.usage },
        ]);
    } catch (error) {
        console.error("Errore durante l'invio:", error);
        // Opzionale: aggiungi un messaggio di errore nella chat
    } finally {
        setLoading(false);
    }
};


export const sendStreamedMessage = async (message: string, setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>, clearInput: () => void, setLoading: React.Dispatch<React.SetStateAction<boolean>>, model: any, messageHistory: any[]) => {
        if (!message.trim()) return;

        // 1. Aggiungi subito il messaggio dell'utente
        const userMsg = { role: 'user' as const, content: message };
        
        // 2. Aggiungi subito un messaggio "bot" vuoto (placeholder) che riempiremo
        const botMsgPlaceholder = { role: 'bot' as const, content: "" };
        
        setMessageHistory((prev) => [...prev, userMsg, botMsgPlaceholder]);
        
        clearInput();
        setLoading(true);

        try {
            // Prepara la storia per il backend (escludendo il messaggio corrente e il placeholder)
            const historyForBackend = messageHistory.map(msg => ({
                role: msg.role === 'bot' ? 'assistant' : 'user',
                content: msg.content
            }));

            // Controllo costi (come nel tuo codice originale)
            if(model.cost_per_input_token + model.cost_per_output_token > 2){
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