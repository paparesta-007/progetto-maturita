import React, { createContext, useContext, useEffect, useState } from "react";
import getAllConversation from "../services/supabase/Conversation/getAllConversation";
import { useAuth } from "./AuthContext";
import getMessages from "../services/supabase/Conversation/getMessages";
import { sendNormalMessage,sendStreamedMessage } from "../library/sendMessage";
interface ChatContextType {
    inputValue: string;
    setInputValue: (val: string) => void;
    clearInput: () => void;
    sendMessage: (message: string) => void;
    messageHistory: { role: 'user' | 'bot'; content: string; usage?: any }[];
    loading: boolean;
    conversations: any[]; // Per tenere traccia delle conversazioni salvate
    loadConversation: (conversationId: string) => Promise<void>;
    userOwnsConversation: (conversationId: string) => boolean;
    areConversationsLoaded: boolean; // Per sapere quando abbiamo finito di caricare le conversazioni
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>; // Per aggiornare la lista delle 
    model: any;
    setModel: React.Dispatch<React.SetStateAction<any>>;
    isStreamTextEnabled: boolean;
    setIsStreamTextEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    fetchConversations: () => Promise<void>;
}

// 1. Creazione del Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 2. Provider
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [inputValue, setInputValue] = useState("");
    const [messageHistory, setMessageHistory] = useState<{ role: 'user' | 'bot'; content: string; usage?: any }[]>([]); // Per tenere traccia della cronologia dei messaggi
    const [loading, setLoading] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]); // Per tenere traccia delle conversazioni salvate
    const [areConversationsLoaded, setAreConversationsLoaded] = useState(false); // Per sapere quando abbiamo finito di caricare le conversazioni
    const [model, setModel] = useState<any>({ name: "Gemini 2.5 Flash Lite", provider: "Google",name_id: "google/gemini-2.5-flash-lite", cost_per_input_token: 0.10, cost_per_output_token: 0.40 });
    const [isStreamTextEnabled, setIsStreamTextEnabled] = useState(false);
    const clearInput = () => setInputValue("");
   
    const sendMessage = async (message: string) => {
        try {
            if (isStreamTextEnabled) {
                await sendStreamedMessage(message, setMessageHistory, clearInput, setLoading, model, messageHistory);
            } else {
                await sendNormalMessage(message, setMessageHistory, clearInput, setLoading, model, messageHistory);
            }
        } catch (error) {
            console.error("Errore durante l'invio del messaggio:", error);
        }
    }
    const loadConversation = async (conversationId: string) => {
        try {
            setLoading(true);

            const rawData = await getMessages(conversationId);

            if (!rawData) {
                setMessageHistory([]);
                return;
            }

            const parsedMessages = rawData.flatMap((row: any) => {
                const messages = [];

                // Messaggio utente
                if (row.sender) {
                    messages.push({
                        role: 'user' as const,
                        content: row.sender
                    });
                }

                // Messaggio bot
                if (row.content) {
                    messages.push({
                        role: 'bot' as const,
                        content: row.content
                    });
                }

                return messages;
            });

            setMessageHistory(parsedMessages);

        } catch (error) {
            console.error("Errore durante il caricamento dei messaggi:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchConversations = async () => {
            try {
                if (!user?.id) return;
                const data = await getAllConversation(user?.id);
                if (data) {
                    setConversations(data);
                }
            } catch (error) {
                console.error("Errore durante il recupero delle conversazioni:", error);
            } finally {
                // NUOVO: Segnaliamo che il caricamento è finito (anche se vuoto o errore)
                setAreConversationsLoaded(true);
            }
        }
    useEffect(() => {
        

        if (user?.id) {
            fetchConversations();
        } else {
            // Se non c'è user, non caricheremo mai, quindi sblocchiamo comunque o gestiamo diversamente
            // Di solito qui si aspetta l'auth, ma per sicurezza:
            setAreConversationsLoaded(false);
        }
    }, [user?.id]);

    const userOwnsConversation = (conversationId: string) => {
        // Se la lista è vuota, controlliamo se è perché non abbiamo ancora caricato
        return conversations.some(conv => conv.id === conversationId);
    };
    return (
        <ChatContext.Provider value={{ inputValue, setInputValue, clearInput, sendMessage, messageHistory, loading, conversations, loadConversation, userOwnsConversation, 
        areConversationsLoaded, setMessageHistory, model, setModel, isStreamTextEnabled, setIsStreamTextEnabled, fetchConversations }}>
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

