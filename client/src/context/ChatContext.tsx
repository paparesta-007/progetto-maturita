import React, { createContext, useContext, useState } from "react";

interface ChatContextType {
    inputValue: string;
    setInputValue: (val: string) => void;
    clearInput: () => void;
    sendMessage: (message: string) => void;
    messageHistory: { role: 'user' | 'bot'; content: string; usage?: any }[];
    loading: boolean;
}

// 1. Creazione del Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 2. Provider
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [inputValue, setInputValue] = useState("");
    const [messageHistory, setMessageHistory] = useState<{ role: 'user' | 'bot'; content: string; usage?: any }[]>([]); // Per tenere traccia della cronologia dei messaggi
    const [loading, setLoading] = useState(false);
    const clearInput = () => setInputValue("");
    const sendMessage = async (message: string) => {
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

            const response = await fetch("http://localhost:3000/api/gemini/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    history: historyForBackend, // Inviamo la storia corretta
                    modelName: "gemini-2.5-flash-lite",
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
    return (
        <ChatContext.Provider value={{ inputValue, setInputValue, clearInput, sendMessage, messageHistory, loading }}>
            {children}
        </ChatContext.Provider>
    );
};

// 3. Hook personalizzato per usare il context facilmente
export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat deve essere usato all'interno di un ChatProvider");
    }
    return context;
};

