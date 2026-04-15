import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import getAllConversation from "../services/supabase/Conversation/getAllConversation";
import { useAuth } from "./AuthContext";
import getMessages from "../services/supabase/Conversation/getMessages";
import { sendNormalMessage, sendStreamedMessage, sendCanvasMessage, sendWebSearchMessage, type ChatOptions, type RenderMode } from "../library/sendMessage";
import { useNavigate } from "react-router-dom";
interface ChatContextType {
    sendMessage: (message: string, functionality: string, reasoning: string, files?: any[]) => Promise<void>;
    messageHistory: { role: 'user' | 'bot'; content: string; renderMode?: RenderMode; usage?: any, model?: string, suggestedQuestions?: string[], reasoning?: string | null, logs?: string[], isComplete?: boolean }[];
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
    updateConversationPosition: (conversationId: string) => void;

    isBetterView: boolean;
    setIsBetterView: React.Dispatch<React.SetStateAction<boolean>>;
}

// 1. Creazione del Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 2. Provider
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const { user ,systemPrompt, personalInfo, tone, allowedCustomInstructions} = useAuth();
    // const [inputValue, setInputValue] = useState("");
    const [messageHistory, setMessageHistory] = useState<{ role: 'user' | 'bot'; content: string; renderMode?: RenderMode; usage?: any, model: string, suggestedQuestions?: string[], reasoning?: string | null, logs?: string[], isComplete?: boolean }[]>([]); // Per tenere traccia della cronologia dei messaggi
    const [loading, setLoading] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]); // Per tenere traccia delle conversazioni salvate
    const [areConversationsLoaded, setAreConversationsLoaded] = useState(false); // Per sapere quando abbiamo finito di caricare le conversazioni
    const [model, setModel] = useState<any>({ name: "OpenAI: gpt-oss-20b-nitro", provider: "OpenAI", name_id: "openai/gpt-oss-20b:nitro", cost_per_input_token: 0.03, cost_per_output_token: 0.11 });
    const [isStreamTextEnabled, setIsStreamTextEnabled] = useState(true);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [currentConversationName, setCurrentConversationName] = useState<string | null>(null);
    const [isTemporaryConversation, setIsTemporaryConversation] = useState(false);
    const [isBetterView, setIsBetterView] = useState(true);
    const navigate = useNavigate();

    const fetchConversations = useCallback(async () => {
        if (!user?.id) {
            setAreConversationsLoaded(true);
            return;
        }
        try {
            const data = await getAllConversation(user.id);
            if (data) {
                setConversations(data);
            }
        } catch (error) {
            console.error("Errore durante il recupero delle conversazioni:", error);
        } finally {
            setAreConversationsLoaded(true);
        }
    }, [user?.id]);

    const updateConversationPosition = useCallback((conversationId: string) => {
        setConversations(prev => {
            const index = prev.findIndex(c => c.id === conversationId);
            if (index === -1) return prev; // Not found, maybe it's a new one that will be added by fetchConversations later
            if (index === 0) return prev; // Already at top
            
            const newConvs = [...prev];
            const [movedConv] = newConvs.splice(index, 1);
            return [movedConv, ...newConvs];
        });
    }, []);

    const sendMessage = useCallback(async (message: string, functionality: string, reasoning: string, files?: any[]) => {
        const chatOptions: ChatOptions = {
            systemPrompt,
            personalInfo,
            tone,
            allowedCustomInstructions,
            isTemporary: isTemporaryConversation,
            reasoning,
            attachedFiles: files
        };

        try {
            const res = await (functionality === "canvas" 
                ? sendCanvasMessage(message, setMessageHistory, setLoading, model, messageHistory)
                : functionality === "web_search"
                ? sendWebSearchMessage(message, setMessageHistory, setLoading, model, messageHistory)
                : isStreamTextEnabled
                ? sendStreamedMessage(message, setMessageHistory, setLoading, model, messageHistory, currentConversationId, user?.id, setCurrentConversationId, fetchConversations, navigate, chatOptions,isBetterView)
                : sendNormalMessage(message, setMessageHistory, setLoading, model, messageHistory, currentConversationId, user?.id, setCurrentConversationId, fetchConversations, navigate, chatOptions,isBetterView));
            
            if (currentConversationId) {
                updateConversationPosition(currentConversationId);
            }
            
            return res;
        } catch (error) {
            console.error("Errore durante l'invio del messaggio:", error);
        }
    }, [isStreamTextEnabled, model, messageHistory, currentConversationId, user, systemPrompt, personalInfo, tone, allowedCustomInstructions, fetchConversations, navigate, isTemporaryConversation, updateConversationPosition, isBetterView]);

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
                        renderMode: row.render_mode === 'html'
                            ? 'html'
                            : row.render_mode === 'markdown'
                                ? 'markdown'
                                : undefined,
                        usage: row.usage, // Assumiamo che usage sia una colonna nella tabella messages
                        model: row.model, // Assumiamo che model sia una colonna nella tabella messages
                        suggestedQuestions: row.suggestedQuestions, // Se salvato
                        reasoning: row.reasoning_text === "none" ? null : row.reasoning_text
                    });
                }

                return messages;
            });

            setMessageHistory(parsedMessages);
            
            // Nuova logica: Carica le domande suggerite per l'ultimo scambio se non ci sono già
            if (parsedMessages.length >= 2) {
                const latestBotMsg = parsedMessages[parsedMessages.length - 1];
                if (latestBotMsg.role === 'bot' && (!latestBotMsg.suggestedQuestions || latestBotMsg.suggestedQuestions.length === 0)) {
                    const lastExchange = {
                        message: parsedMessages[parsedMessages.length - 2].content,
                        response: latestBotMsg.content
                    };

                    try {
                        const resSQ = await fetch("http://localhost:3000/api/getSuggestedQuestion", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(lastExchange)
                        });
                        
                        if (resSQ.ok) {
                            const sqData = await resSQ.json();
                            const suggestedQuestions = sqData.suggested_questions || [];
                            
                            setMessageHistory((prev) => {
                                const newHistory = [...prev];
                                const lastIndex = newHistory.length - 1;
                                if (lastIndex >= 0 && newHistory[lastIndex].role === 'bot' && (!newHistory[lastIndex].suggestedQuestions || newHistory[lastIndex].suggestedQuestions.length === 0)) {
                                    newHistory[lastIndex] = {
                                        ...newHistory[lastIndex],
                                        suggestedQuestions: suggestedQuestions
                                    };
                                }
                                return newHistory;
                            });
                        }
                    } catch (e) {
                        console.error("Errore fetch suggested questions loading:", e);
                    }
                }
            }
            

        } catch (error) {
            console.error("Errore durante il caricamento dei messaggi:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {


        if (user?.id) {
            fetchConversations();
        } else if (user === null) {
            // Se l'utente è esplicitamente null (non loggato), carichiamo come finito
            setAreConversationsLoaded(true);
            setConversations([]);
        }
    }, [user, fetchConversations]);

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
        setIsTemporaryConversation,
        updateConversationPosition,
        isBetterView,
        setIsBetterView
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
        setIsTemporaryConversation,
        updateConversationPosition,
        isBetterView,
        setIsBetterView
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

