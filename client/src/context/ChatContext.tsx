import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import getAllConversation from "../services/supabase/Conversation/getAllConversation";
import { useAuth } from "./AuthContext";
import getMessages from "../services/supabase/Conversation/getMessages";
import { sendNormalMessage, sendStreamedMessage, sendCanvasMessage, type ChatOptions, type RenderMode } from "../library/sendMessage";
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

    temperature: number;
    setTemperature: React.Dispatch<React.SetStateAction<number>>;

    draftMessage: string;
    setDraftMessage: React.Dispatch<React.SetStateAction<string>>;
    abortRequest: () => void;
}

// 1. Creazione del Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 2. Provider
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const { user ,systemPrompt, personalInfo, tone, allowedCustomInstructions, theme} = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalReason, setAuthModalReason] = useState("");
    const [authPasswordInput, setAuthPasswordInput] = useState("");
    const [authErrorMessage, setAuthErrorMessage] = useState("");
    const pendingAuthRef = useRef<((value: string | null) => void) | null>(null);

    const handleConfirmAuth = useCallback(() => {
        if (authPasswordInput === "diavolorosso07") {
            setIsAuthModalOpen(false);
            if (pendingAuthRef.current) {
                pendingAuthRef.current(authPasswordInput);
                pendingAuthRef.current = null;
            }
        } else {
            setAuthErrorMessage("Password errata. Riprova.");
        }
    }, [authPasswordInput]);

    const handleCancelAuth = useCallback(() => {
        setIsAuthModalOpen(false);
        if (pendingAuthRef.current) {
            pendingAuthRef.current(null);
            pendingAuthRef.current = null;
        }
    }, []);
    // const [inputValue, setInputValue] = useState("");
    const [messageHistory, setMessageHistory] = useState<{ role: 'user' | 'bot'; content: string; renderMode?: RenderMode; usage?: any, model: string, suggestedQuestions?: string[], reasoning?: string | null, logs?: string[], isComplete?: boolean }[]>([]); // Per tenere traccia della cronologia dei messaggi
    const [loading, setLoading] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]); // Per tenere traccia delle conversazioni salvate
    const [areConversationsLoaded, setAreConversationsLoaded] = useState(false); // Per sapere quando abbiamo finito di caricare le conversazioni
    const [model, setModel] = useState<any>({ name: "OpenAI: gpt-oss-20b", provider: "OpenAI", name_id: "openai/gpt-oss-20b", cost_per_input_token: 0.03, cost_per_output_token: 0.11 });
    const [isStreamTextEnabled, setIsStreamTextEnabled] = useState(true);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [currentConversationName, setCurrentConversationName] = useState<string | null>(null);
    const [isTemporaryConversation, setIsTemporaryConversation] = useState(false);
    const [isBetterView, setIsBetterView] = useState(true);
    const [temperature, setTemperature] = useState(1.0);
    const [draftMessage, setDraftMessage] = useState("");
    const [abortController, setAbortController] = useState<AbortController | null>(null);
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

    const abortRequest = useCallback(() => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
            setLoading(false);
        }
    }, [abortController]);

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
        // Abort previous request before starting a new one
        if (abortController) {
            abortController.abort();
        }
        
        const controller = new AbortController();
        setAbortController(controller);

        let adminPassword = undefined;
        const isExpensiveModel = model && (Number(model.cost_per_input_token || 0) + Number(model.cost_per_output_token || 0)) > 2;
        const isWebSearch = functionality === "web_search";

        if (isExpensiveModel || isWebSearch) {
            let reasonStr = "Essendo questo un progetto open source, la ricerca web e i modelli ad alto costo (> 2€/1M tokens) richiedono verifica amministratore per evitare abusi.";
            
            
            setAuthModalReason(reasonStr);
            setAuthPasswordInput("");
            setAuthErrorMessage("");
            setIsAuthModalOpen(true);

            const entered = await new Promise<string | null>((resolve) => {
                pendingAuthRef.current = resolve;
            });

            if (!entered) {
                setAbortController(null);
                setLoading(false);
                return;
            }
            adminPassword = entered;
        }

        const chatOptions: ChatOptions = {
            systemPrompt,
            personalInfo,
            tone,
            allowedCustomInstructions,
            isTemporary: isTemporaryConversation,
            reasoning,
            temperature,
            attachedFiles: files,
            signal: controller.signal,
            webSearch: functionality === "web_search",
            adminPassword
        };

        try {
            const res = await (functionality === "canvas" 
                ? sendCanvasMessage(message, setMessageHistory, setLoading, model, messageHistory)
                : isStreamTextEnabled
                ? sendStreamedMessage(message, setMessageHistory, setLoading, model, messageHistory, currentConversationId, user?.id, setCurrentConversationId, fetchConversations, navigate, chatOptions,isBetterView)
                : sendNormalMessage(message, setMessageHistory, setLoading, model, messageHistory, currentConversationId, user?.id, setCurrentConversationId, fetchConversations, navigate, chatOptions,isBetterView));
            
            if (currentConversationId) {
                updateConversationPosition(currentConversationId);
            }
            
            return res;
        } catch (error) {
            console.error("Errore durante l'invio del messaggio:", error);
        } finally {
            setAbortController(null);
        }
    }, [abortController, isStreamTextEnabled, model, messageHistory, currentConversationId, user, systemPrompt, personalInfo, tone, allowedCustomInstructions, fetchConversations, navigate, isTemporaryConversation, updateConversationPosition, isBetterView, temperature]);

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
                    let content = row.sender;
                    let files = undefined;

                    // Cercare blocco metadata dei file
                    const fileMetaRegex = /\[FILES_METADATA:(.+)\]$/s;
                    const match = content.match(fileMetaRegex);
                    if (match) {
                        try {
                            const parsed = JSON.parse(match[1]);
                            files = parsed.files;
                            content = content.replace(fileMetaRegex, "").trim();
                        } catch (e) {
                            console.error("Failed to parse file metadata:", e);
                        }
                    }

                    messages.push({
                        role: 'user' as const,
                        content: content,
                        model: row.model || "", // Provide default model for user messages
                        files: files
                    });
                }
                if (row.content) {
                    messages.push({
                        role: 'bot' as const,
                        content: row.content,
                        renderMode: row.render_mode === 'structured'
                            ? 'structured'
                            : row.render_mode === 'html'
                                ? 'html'
                                : row.render_mode === 'markdown'
                                    ? 'markdown'
                                    : undefined,
                        sections: row.sections || null,
                        usage: row.usage, // Assumiamo che usage sia una colonna nella tabella messages
                        model: row.model, // Assumiamo che model sia una colonna nella tabella messages
                        suggestedQuestions: row.suggestedQuestions, // Se salvato
                        reasoning: row.reasoning_text === "none" ? null : row.reasoning_text,
                        isComplete: true,
                        isStreaming: false
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
                        const resSQ = await fetch(`${import.meta.env.VITE_API_URL}/conversations/getSuggestedQuestion`, {
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
        setIsBetterView,
        temperature,
        setTemperature,
        draftMessage,
        setDraftMessage,
        abortRequest
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
        setIsBetterView,
        temperature,
        setTemperature,
        draftMessage,
        setDraftMessage,
        abortRequest
    ]);

    return (
        <ChatContext.Provider value={contextValue}>
            {children}

            {/* Custom Admin Auth Modal */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
                        onClick={handleCancelAuth}
                    />
                    <div className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl border transition-all duration-300 ${
                        theme === 'dark' 
                            ? "bg-[#0d0e14] border-white/10 text-white" 
                            : "bg-white border-neutral-200 text-neutral-900"
                    }`}>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">Verifica Amministratore</h3>
                                <button 
                                    onClick={handleCancelAuth}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        theme === 'dark' ? "hover:bg-white/10 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <p className={`text-sm leading-relaxed ${
                                theme === 'dark' ? "text-neutral-400" : "text-neutral-500"
                            }`}>
                                {authModalReason}
                            </p>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider opacity-60">Password</label>
                                <input 
                                    type="password" 
                                    value={authPasswordInput}
                                    onChange={(e) => {
                                        setAuthPasswordInput(e.target.value);
                                        setAuthErrorMessage("");
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirmAuth();
                                    }}
                                    placeholder="Inserisci la password ADMIN_ACCESS"
                                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                        theme === 'dark' 
                                            ? "bg-white/5 border-white/10 text-white placeholder-white/20" 
                                            : "bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400"
                                    }`}
                                    autoFocus
                                />
                                {authErrorMessage && (
                                    <span className="text-xs text-red-500 font-semibold">{authErrorMessage}</span>
                                )}
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button 
                                    onClick={handleCancelAuth}
                                    className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                                        theme === 'dark' ? "bg-white/5 hover:bg-white/10" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                                    }`}
                                >
                                    Annulla
                                </button>
                                <button 
                                    onClick={handleConfirmAuth}
                                    className={`flex-1 py-3 rounded-2xl font-bold transition-all active:scale-95 ${
                                        theme === 'dark' ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-neutral-900 text-white hover:bg-neutral-800"
                                    }`}
                                >
                                    Verifica
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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

