// Non servono più gli import di Supabase o router
// import createConversation ...
// import createMessage ...

import supabase from "./supabaseclient";

export const sendEmbeddingMessage = async (
    message: string,
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    model: any,
    userId: string,
    documentId: string,
    functionality: string,
    reasoning: string,
    attachedFiles?: any[]
) => {
    if (!message.trim()) return;

    // 1. Aggiornamento UI Immediato (Messaggio Utente)
    setMessageHistory((prev) => [...prev, { role: 'user', content: message }]);
    
    // Creiamo subito il messaggio del bot con un ID per aggiornarlo via via
    const botMessageId = Date.now().toString() + Math.random().toString();
    setMessageHistory((prev) => [
        ...prev, 
        { 
            id: botMessageId,
            role: 'bot', 
            content: "Avvio della richiesta...", 
            model: model?.name || "RAG Assistant",
            logs: []
        }
    ]);
    
    setLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // 2. Chiamata al Backend in streaming (Endpoint RAG)
        console.log("modello del ask-pdf", model)
        const response = await fetch("http://localhost:3000/api/docs/ask-pdf", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
                question: message,
                model: typeof model === "string" ? model : (model?.name_id || "google/gemini-2.5-flash-lite"),
                user_id: userId,
                document_id: documentId,
                reasoning: reasoning,
                attachedFiles: attachedFiles
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errorMsg = errData?.error?.message?.toLowerCase() || JSON.stringify(errData).toLowerCase();
            if (errorMsg.includes("image") || errorMsg.includes("vision") || errorMsg.includes("support")) {
                throw new Error("Il modello selezionato non supporta l'analisi di immagini.");
            }
            throw new Error(`Errore API: ${errData?.error?.message || response.statusText}`);
        }
        if (!response.body) throw new Error("Risposta vuota dal server");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Processiamo la roba riga per riga per l'ndjson
            let eolIndex;
            while ((eolIndex = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, eolIndex).trim();
                buffer = buffer.slice(eolIndex + 1);
                
                if (!line) continue;
                
                try {
                    const data = JSON.parse(line);
                    
                    if (data.type === "log") {
                        // Aggiorniamo il listato log e il placeholder del messaggio
                        setMessageHistory((prev) => 
                            prev.map(msg => 
                                msg.id === botMessageId
                                    ? { 
                                        ...msg, 
                                        content: msg.isComplete ? msg.content : "Elaborazione in corso...", 
                                        logs: [...(msg.logs || []), data.content] 
                                      } 
                                    : msg
                            )
                        );
                    } else if (data.type === "result") {
                        // 3. Formattazione finale della risposta con le fonti (se presenti)
                        let botContent = data.answer;
                        
                        if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
                            const uniqueSources = [...new Set(data.sources)];
                            botContent += `\n\n**Fonti:**\n` + uniqueSources.map((s: any) => `- ${s}`).join("\n");
                        }

                        // Aggiornamento finale del messaggio (aggiungendo fonti e le domande se supportate)
                        setMessageHistory((prev) => 
                            prev.map(msg => 
                                msg.id === botMessageId 
                                    ? { 
                                        ...msg, 
                                        content: botContent, 
                                        suggestedQuestions: data.suggested_questions || [],
                                        isComplete: true
                                      } 
                                    : msg
                            )
                        );
                    } else if (data.type === "error") {
                        throw new Error(data.error);
                    }
                } catch (e) {
                    console.error("Errore parsing JSON stream:", e, "line:", line);
                }
            }
        }

    } catch (error: any) {
        console.error("Errore sendEmbeddingMessage:", error);
        
        let displayError = error.message || "Errore durante la comunicazione con il server RAG.";
        const lowerError = displayError.toLowerCase();
        if (lowerError.includes("image") || lowerError.includes("vision") || lowerError.includes("support")) {
            displayError = "Il modello selezionato non supporta l'analisi di immagini.";
        }
        
        // Feedback visivo in caso di errore
        setMessageHistory((prev) => 
            prev.map(msg => 
                msg.id === botMessageId 
                    ? { ...msg, content: `⚠️ Errore: ${displayError}` } 
                    : msg
            )
        );
    } finally {
        setLoading(false);
    }
};