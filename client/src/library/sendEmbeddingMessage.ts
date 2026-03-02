// Non servono più gli import di Supabase o router
// import createConversation ...
// import createMessage ...

export const sendEmbeddingMessage = async (
    message: string,
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    model: any
) => {
    if (!message.trim()) return;

    // 1. Aggiornamento UI Immediato (Messaggio Utente)
    setMessageHistory((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
        // 2. Chiamata al Backend (Endpoint RAG)
        const response = await fetch("http://localhost:3000/api/chat/ask-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                question: message,
                model: model?.name || "google/gemini-2.5-flash-lite" 
            }),
        });

        if (!response.ok) throw new Error(`Errore API: ${response.statusText}`);

        const data = await response.json();
        
        // 3. Formattazione risposta con le fonti (se presenti)
        let botContent = data.answer;
        
        if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
            // Rimuovi duplicati dalle fonti per pulizia
            const uniqueSources = [...new Set(data.sources)];
            botContent += `\n\n**Fonti:**\n` + uniqueSources.map((s: any) => `- ${s}`).join("\n");
        }

        const modelLabel = model?.name || "RAG Assistant";

        // 4. Aggiornamento UI (Messaggio Bot)
        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: botContent, model: modelLabel },
        ]);

    } catch (error) {
        console.error("Errore sendEmbeddingMessage:", error);
        
        // Feedback visivo in caso di errore
        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: "⚠️ Errore durante la comunicazione con il server RAG." },
        ]);
    } finally {
        setLoading(false);
    }
};