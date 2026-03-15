import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import getAllConversation from "../services/supabase/Conversation/getAllConversation";
import { useAuth } from "./AuthContext";
import getMessages from "../services/supabase/Conversation/getMessages";
import { sendNormalMessage, sendStreamedMessage, sendCanvasMessage, sendWebSearchMessage, type ChatOptions } from "../library/sendMessage";
import { useNavigate } from "react-router-dom";
interface ChatContextType {
    sendMessage: (message: string, functionality: string,reasoning:string) => void;
    messageHistory: { role: 'user' | 'bot'; content: string; usage?: any, model?: string, suggestedQuestions?: string[] }[];
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

    currentConversationId: string | null;
    setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
    
    currentConversationName: string | null;
    setCurrentConversationName: React.Dispatch<React.SetStateAction<string | null>>;

    isTemporaryConversation: boolean;
    setIsTemporaryConversation: React.Dispatch<React.SetStateAction<boolean>>;
}

// 1. Creazione del Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 2. Provider
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const { user ,systemPrompt, personalInfo, tone, allowedCustomInstructions} = useAuth();
    // const [inputValue, setInputValue] = useState("");
    const [messageHistory, setMessageHistory] = useState<{ role: 'user' | 'bot'; content: string; usage?: any, model: string, suggestedQuestions?: string[] }[]>([]); // Per tenere traccia della cronologia dei messaggi
    const [loading, setLoading] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]); // Per tenere traccia delle conversazioni salvate
    const [areConversationsLoaded, setAreConversationsLoaded] = useState(false); // Per sapere quando abbiamo finito di caricare le conversazioni
    const [model, setModel] = useState<any>({ name: "OpenAI: gpt-oss-safeguard-20b", provider: "OpenAI", name_id: "openai/gpt-oss-safeguard-20b", cost_per_input_token: 0.10, cost_per_output_token: 0.40 });
    const [isStreamTextEnabled, setIsStreamTextEnabled] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [currentConversationName, setCurrentConversationName] = useState<string | null>(null);
    const [isTemporaryConversation, setIsTemporaryConversation] = useState(false);
    const navigate = useNavigate();

    const fetchConversations = useCallback(async () => {
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
    }, [user?.id]);

    const sendMessage = useCallback(async (message: string, functionality: string, reasoning: string) => {
        const chatOptions: ChatOptions = {
            systemPrompt,
            personalInfo,
            tone,
            allowedCustomInstructions,
            isTemporary: isTemporaryConversation,
            reasoning
        };

        try {
            switch (functionality) {
                case "canvas":
                    await sendCanvasMessage(message, setMessageHistory, setLoading, model, messageHistory);
                    break;
                case "web_search":
                    await sendWebSearchMessage(message, setMessageHistory, setLoading, model, messageHistory);
                    break;
                default:
                    if (isStreamTextEnabled) {
                        await sendStreamedMessage(message, setMessageHistory, setLoading, model, messageHistory, currentConversationId, user?.id, setCurrentConversationId, fetchConversations, navigate, chatOptions);
                    } else {
                        await sendNormalMessage(
                            message,
                            setMessageHistory,
                            setLoading,
                            model,
                            messageHistory,
                            currentConversationId,
                            user?.id,
                            setCurrentConversationId,
                            fetchConversations,
                            navigate,
                            chatOptions
                        );
                    }
                    break;
            }
        } catch (error) {
            console.error("Errore durante l'invio del messaggio:", error);
        }
    }, [isStreamTextEnabled, model, messageHistory, currentConversationId, user, systemPrompt, personalInfo, tone, allowedCustomInstructions, fetchConversations, navigate, isTemporaryConversation]);

    const loadConversation = useCallback(async (conversationId: string) => {
        try {
            setLoading(true);
            setMessageHistory([]); // Pulisci la cronologia precedente prima di caricare

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
                        content: row.sender,
                        model: row.model || "" // Provide default model for user messages
                    });
                }
                if (row.content) {
                    messages.push({
                        role: 'bot' as const,
                        content: row.content,
                        usage: row.usage, // Assumiamo che usage sia una colonna nella tabella messages
                        model: row.model, // Assumiamo che model sia una colonna nella tabella messages
                        suggestedQuestions: row.suggestedQuestions // Se salvato
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
    }, []);

    useEffect(() => {


        if (user?.id) {
            fetchConversations();
        } else {
            // Se non c'è user, non caricheremo mai, quindi sblocchiamo comunque o gestiamo diversamente
            // Di solito qui si aspetta l'auth, ma per sicurezza:
            setAreConversationsLoaded(false);
        }
    }, [user?.id, fetchConversations]);

    const userOwnsConversation = useCallback((conversationId: string) => {
        // Se la lista è vuota, controlliamo se è perché non abbiamo ancora caricato
        return conversations.some(conv => conv.id === conversationId);
    }, [conversations]);

    const contextValue = useMemo(() => ({


        sendMessage,
        messageHistory,
        loading,
        conversations,
        loadConversation,
        userOwnsConversation,
        areConversationsLoaded,
        setMessageHistory,
        model,
        setModel,
        isStreamTextEnabled,
        setIsStreamTextEnabled,
        fetchConversations,
        currentConversationId,
        setCurrentConversationId,
        currentConversationName,
        setCurrentConversationName,
        isTemporaryConversation,
        setIsTemporaryConversation

    }), [


        sendMessage,
        messageHistory,
        loading,
        conversations,
        loadConversation,
        userOwnsConversation,
        areConversationsLoaded,
        model,
        isStreamTextEnabled,
        fetchConversations,
        currentConversationId,
        currentConversationName,
        setCurrentConversationName,
        isTemporaryConversation,
        setIsTemporaryConversation
    ]);

    return (
        <ChatContext.Provider value={contextValue}>
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

