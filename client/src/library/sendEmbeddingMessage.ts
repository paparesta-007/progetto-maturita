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
    setMessageHistory((prev) => [...prev, { role: 'user', content: message, files: attachedFiles }]);

    if (!documentId) {
        setMessageHistory((prev) => [
            ...prev,
            {
                role: 'bot',
                content: "⚠️ Errore: Nessun documento caricato o selezionato. Attendi il caricamento completo del documento prima di inviare un messaggio.",
                model: model?.name || "RAG Assistant",
                logs: []
            }
        ]);
        return;
    }
    
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/docs/ask-pdf`, {
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
                                        content: msg.isStreaming || msg.isComplete ? msg.content : "Elaborazione in corso...", 
                                        logs: [...(msg.logs || []), data.content] 
                                      } 
                                    : msg
                            )
                        );
                    } else if (data.type === "chunk") {
                        // Aggiornamento in tempo reale dei token
                        setMessageHistory((prev) => 
                            prev.map(msg => {
                                if (msg.id === botMessageId) {
                                    let currentContent = msg.isStreaming ? msg.content : "";
                                    let newContent = currentContent + data.content;
                                    
                                    // Pulizia preliminare del tag FONTI se appare durante lo streaming
                                    // (Il tag completo viene rimosso nel tipo "result", ma puliamo qui per pulizia visiva)
                                    const cleanedContent = newContent.replace(/\[\[FONTI:\s*.*$/, "");

                                    return {
                                        ...msg,
                                        content: cleanedContent,
                                        isStreaming: true
                                    };
                                }
                                return msg;
                            })
                        );
                    } else if (data.type === "result") {
                        // 3. Formattazione finale della risposta con le fonti (se presenti)
                        let botContent = data.answer;
                        
                        // Aggiornamento finale del messaggio (aggiungendo fonti strutturate)
                        setMessageHistory((prev) => 
                            prev.map(msg => 
                                msg.id === botMessageId 
                                    ? { 
                                        ...msg, 
                                        content: botContent, 
                                        sources: data.sources || [], // Fonti strutturate con pagina e contenuto
                                        suggestedQuestions: data.suggested_questions || [],
                                        isStreaming: false,
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