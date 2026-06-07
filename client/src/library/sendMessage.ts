import createConversation from "../services/supabase/Conversation/createConversation";
import createMessage from "../services/supabase/Conversation/createMessage";
import { type NavigateFunction } from "react-router-dom";
import supabase from "./supabaseclient";

export interface ChatOptions {
    systemPrompt?: string;
    personalInfo?: any;
    tone?: string;
    allowedCustomInstructions?: string | boolean;
    isTemporary?: boolean;
    reasoning?: string;
    temperature?: number;
    attachedFiles?: any[];
    signal?: AbortSignal;
    webSearch?: boolean;
}

export interface QuizQuestion {
    domanda: string;
    opzioni: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    rispostaCorretta: "A" | "B" | "C" | "D";
}

export interface QuizResponse {
    success: boolean;
    data: QuizQuestion[];
    error?: string;
}

export type RenderMode = 'html' | 'markdown';

// ============================================================
// DEFAULT: Normal chat message (calls the real server)
// ============================================================
export const sendNormalMessage = async (
    message: string,
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    model: any,
    messageHistory: any[],
    currentConversationId: string | null,
    userId: string | undefined,
    setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>,
    fetchConversations: () => Promise<void>,
    _navigate: NavigateFunction,
    options: ChatOptions,
    isBetterView: boolean
) => {
    const { systemPrompt, personalInfo, tone, allowedCustomInstructions, reasoning } = options;

    if (!message.trim()) return;
    setMessageHistory((prev) => [...prev, { role: 'user', content: message }]);

    const historyForBackend = messageHistory.map(msg => ({
        role: msg.role === 'bot' ? 'assistant' : 'user',
        content: msg.content
    }));

    if ((model.cost_per_input_token + model.cost_per_output_token) > 2) {
        console.warn("Costo modello troppo elevato");
        return;
    }
    try {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("http://localhost:3000/api/completion/chat", {
            method: "POST",
            signal: options.signal,
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message,
                history: historyForBackend,
                modelName: model.name_id,
                systemPromptUser: systemPrompt,
                personalInfo,
                tone,
                allowedCustomInstructions,
                reasoning,
                temperature: options.temperature,
                attachedFiles: options.attachedFiles,
                isBetterView,
                webSearch: options.webSearch
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errorMsg = errData?.error?.message?.toLowerCase() || JSON.stringify(errData).toLowerCase();
            if (errorMsg.includes("image") || errorMsg.includes("vision") || errorMsg.includes("support")) {
                throw new Error("Il modello selezionato non supporta l'analisi di immagini.");
            }
            throw new Error(`Errore API Chat: ${errData?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const responseText = data.text;
        const renderMode: RenderMode = data.renderMode === 'html' ? 'html' : 'markdown';
        const responseUsage = data.usage || { total_tokens: 0 };
        const responseModel = model?.name || model?.name_id || "Unknown";
        const suggestedQuestions = data.suggestedQuestions || [];
        const reasoningContent = data.reasoning || null;

        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: responseText, renderMode, usage: responseUsage, model: responseModel, suggestedQuestions, reasoning: reasoningContent },
        ]);

        const messagePayload = {
            sender: message,
            content: responseText,
            usage: responseUsage,
            renderMode,
            model: model,
            reasoning: reasoningContent
        };

        if (!options.isTemporary) {
            if (currentConversationId && userId) {
                await createMessage(messagePayload, currentConversationId, model,userId);
            } else if (userId) {
                let newTitle = "New Chat";
                try {
                    const titleRes = await fetch("http://localhost:3000/api/conversations/getTitleConversation", {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ message }),
                    });
                    const titleData = await titleRes.json();
                    newTitle = titleData.title || "New Chat";
                } catch (e) {
                    console.warn("Fallimento generazione titolo, uso default");
                }

                const newConvData = await createConversation(userId, newTitle);
                if (newConvData && newConvData.length > 0) {
                    const newConvId = newConvData[0].id;
                    await createMessage(messagePayload, newConvId, model, userId);
                    setCurrentConversationId(newConvId);
                    _navigate(`/app/chat/${newConvId}`);
                    await fetchConversations();
                }
            }
        }

        // Dopo il salvataggio (o se temporanea), recuperiamo comunque le domande suggerite se non presenti
        let finalSuggestedQuestions = suggestedQuestions;
        if (finalSuggestedQuestions.length === 0) {
            try {
                const resSQ = await fetch("http://localhost:3000/api/conversations/getSuggestedQuestion", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ message: message, response: responseText })
                });
                if (resSQ.ok) {
                    const sqData = await resSQ.json();
                    finalSuggestedQuestions = sqData.suggested_questions || [];

                    if (finalSuggestedQuestions.length > 0) {
                        setMessageHistory((prev) => {
                            const newHistory = [...prev];
                            const lastMsgIndex = newHistory.length - 1;
                            if (newHistory[lastMsgIndex].role === 'bot') {
                                newHistory[lastMsgIndex] = {
                                    ...newHistory[lastMsgIndex],
                                    suggestedQuestions: finalSuggestedQuestions
                                };
                            }
                            return newHistory;
                        });
                    }
                }
            } catch (e) {
                console.error("Errore fetch suggested questions:", e);
            }
        }

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log("Richiesta abortita dall'utente");
            // Rimuovo il placeholder o non faccio nulla, dato che la request non è partita o terminata.
            setMessageHistory((prev) => {
                const newHistory = [...prev];
                if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'bot' && !newHistory[newHistory.length - 1].content) {
                    newHistory.pop(); // Rimuovere il placeholder
                }
                return newHistory;
            });
            return;
        }

        console.error("Errore sendNormalMessage:", error);

        let displayError = error.message || "Si è verificato un errore durante la richiesta.";
        const lowerError = displayError.toLowerCase();
        if (lowerError.includes("image") || lowerError.includes("vision") || lowerError.includes("support")) {
            displayError = "Il modello selezionato non supporta l'analisi di immagini.";
        }

        setMessageHistory((prev) => [...prev, { role: 'bot', content: `⚠️ Errore: ${displayError}`, model: "System" }]);
    } finally {
        setLoading(false);
    }
};

// ============================================================
// DEFAULT: Streamed chat message (calls the real server)
// ============================================================
export const sendStreamedMessage = async (
    message: string,
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    model: any,
    messageHistory: any[],
    currentConversationId: string | null,
    userId: string | undefined,
    setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>,
    fetchConversations: () => Promise<void>,
    _navigate: NavigateFunction,
    options: ChatOptions,
    isBetterView: boolean
) => {
    if (!message.trim()) return;

    const { systemPrompt, personalInfo, tone, allowedCustomInstructions, reasoning } = options;

    const userMsg = { role: 'user' as const, content: message };
    const modelLabel = model?.name ?? model?.name_id ?? "Unknown";
    const botMsgPlaceholder = { role: 'bot' as const, content: "", model: modelLabel, renderMode: 'markdown' as RenderMode };

    setMessageHistory((prev) => [...prev, userMsg, botMsgPlaceholder]);
    setLoading(true);

    try {
        const historyForBackend = messageHistory.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        }));

        if (model.cost_per_input_token + model.cost_per_output_token > 2) {
            console.warn("Costo alto rilevato");
            setLoading(false);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("http://localhost:3000/api/streamingOutput", {
            method: "POST",
            signal: options.signal,
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message,
                history: historyForBackend,
                modelName: model.name_id,
                systemPromptUser: systemPrompt,
                personalInfo,
                tone,
                allowedCustomInstructions,
                reasoning,
                temperature: options.temperature,
                attachedFiles: options.attachedFiles,
                isBetterView,
                webSearch: options.webSearch // Aggiunto flag webSearch
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errorMsg = errData?.error?.message?.toLowerCase() || JSON.stringify(errData).toLowerCase();
            if (errorMsg.includes("image") || errorMsg.includes("vision") || errorMsg.includes("support")) {
                throw new Error("Il modello selezionato non supporta l'analisi di immagini.");
            }
            throw new Error(errData?.error?.message || response.statusText);
        }

        if (!response.body) {
            throw new Error("Risposta streaming non valida: body assente.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let accumulatedText = "";
        let accumulatedRenderMode: RenderMode = 'markdown';
        let accumulatedReasoning = "";
        let accumulatedUsage: any = {};
        let ndjsonBuffer = "";

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;

            if (value) {
                ndjsonBuffer += decoder.decode(value, { stream: true });

                // Parsing NDJSON: processa riga per riga
                let eolIndex;
                while ((eolIndex = ndjsonBuffer.indexOf('\n')) >= 0) {
                    const line = ndjsonBuffer.slice(0, eolIndex).trim();
                    ndjsonBuffer = ndjsonBuffer.slice(eolIndex + 1);

                    if (!line) continue;

                    try {
                        const data = JSON.parse(line);

                        if (data.type === "reasoning" && data.content) {
                            accumulatedReasoning += data.content;
                        } else if (data.type === "meta" && data.renderMode) {
                            accumulatedRenderMode = data.renderMode === 'html' ? 'html' : 'markdown';
                        } else if (data.type === "text" && data.content) {
                            accumulatedText += data.content;
                        } else if (data.type === "usage" && data.content) {
                            accumulatedUsage = data.content;
                        } else if (data.type === "error") {
                            throw new Error(data.error);
                        }
                    } catch (parseErr: any) {
                        if (parseErr.message && !parseErr.message.includes("JSON")) {
                            throw parseErr; // Rilancia errori applicativi (ex. data.type === 'error')
                        }
                        // Debug: logga perché il parsing fallisce
                        console.error("NDJSON parse error:", parseErr, "Line:", line.substring(0, 100));
                    }
                }

                setMessageHistory((prev) => {
                    const newHistory = [...prev];
                    const lastMsgIndex = newHistory.length - 1;
                    if (newHistory[lastMsgIndex].role === 'bot') {
                        newHistory[lastMsgIndex] = {
                            ...newHistory[lastMsgIndex],
                            content: accumulatedText,
                            renderMode: accumulatedRenderMode,
                            ...(accumulatedReasoning ? { reasoning: accumulatedReasoning } : {}),
                            ...(Object.keys(accumulatedUsage).length > 0 ? { usage: accumulatedUsage } : {})
                        };
                    }
                    return newHistory;
                });
            }
        }

        // Save the message after streaming is complete
        const messagePayload = {
            sender: message,
            content: accumulatedText,
            usage: Object.keys(accumulatedUsage).length > 0 ? accumulatedUsage : { total_tokens: 0 },
            renderMode: accumulatedRenderMode,
            model: model,
            reasoning: accumulatedReasoning
        };

        if (!options.isTemporary) {
            if (currentConversationId && userId) {
                await createMessage(messagePayload, currentConversationId, model, userId);
            } else if (userId) {
                let newTitle = "New Chat";
                try {
                    const titleRes = await fetch("http://localhost:3000/api/conversations/getTitleConversation", {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ message }),
                    });
                    const titleData = await titleRes.json();
                    newTitle = titleData.title || "New Chat";
                } catch (e) {
                    console.warn("Fallimento generazione titolo, uso default");
                }

                const newConvData = await createConversation(userId, newTitle);
                if (newConvData && newConvData.length > 0) {
                    const newConvId = newConvData[0].id;
                    await createMessage(messagePayload, newConvId, model, userId);
                    setCurrentConversationId(newConvId);
                    _navigate(`/app/chat/${newConvId}`);
                    await fetchConversations();
                }
            }
        }

        // Fetch suggested questions after saving (so the message is secure even if this fails)
        let finalSuggestedQuestions: string[] = [];
        try {
            const resSQ = await fetch("http://localhost:3000/api/conversations/getSuggestedQuestion", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ message: message, response: accumulatedText })
            });
            if (resSQ.ok) {
                const sqData = await resSQ.json();
                finalSuggestedQuestions = sqData.suggested_questions || [];

                if (finalSuggestedQuestions.length > 0) {
                    setMessageHistory((prev) => {
                        const newHistory = [...prev];
                        const lastMsgIndex = newHistory.length - 1;
                        if (newHistory[lastMsgIndex].role === 'bot') {
                            newHistory[lastMsgIndex] = {
                                ...newHistory[lastMsgIndex],
                                suggestedQuestions: finalSuggestedQuestions
                            };
                        }
                        return newHistory;
                    });
                }
            }
        } catch (e) {
            console.error("Errore fetch suggested questions streaming:", e);
        }

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log("Stream abortito dall'utente");
            // Non aggiungere l'errore in chat, l'utente sa di aver interrotto
            return;
        }

        console.error("Errore durante lo streaming:", error);

        let displayError = error.message || "Si è verificato un problema.";
        const lowerError = displayError.toLowerCase();
        if (lowerError.includes("image") || lowerError.includes("vision") || lowerError.includes("support")) {
            displayError = "Il modello selezionato non supporta l'analisi di immagini.";
        }

        setMessageHistory((prev) => [...prev, { role: 'bot', content: `⚠️ Errore: ${displayError}`, model: "System" }]);
    } finally {
        setLoading(false);
    }
};

// ============================================================
// CANVAS: Mock function — no server request
// ============================================================
export const sendCanvasMessage = async (
    message: string,
    setMessageHistory: React.Dispatch<React.SetStateAction<any[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    model: any,
    _messageHistory: any[]
) => {
    if (!message.trim()) return;

    setMessageHistory((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const modelLabel = model?.name ?? model?.name_id ?? "Unknown";
        const mockResponse = `**[Canvas Mock]**\n\nCanvas output for: "${message}"\n\n\`\`\`html\n<div class="canvas-preview">\n  <h1>Hello from Canvas</h1>\n  <p>This is a placeholder. Real canvas rendering coming soon.</p>\n</div>\n\`\`\``;

        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: mockResponse, usage: { total_tokens: 0 }, model: modelLabel },
        ]);
    } catch (error) {
        console.error("Errore sendCanvasMessage:", error);
        setMessageHistory((prev) => [...prev, { role: 'bot', content: "Errore nella funzionalità Canvas.", model: "System" }]);
    } finally {
        setLoading(false);
    }
};

export const SendQuizMessage = async (
    message: string,
    mode: string,
    temperature?: number,
    modelName?: string
): Promise<QuizResponse> => {
    if (!message.trim()) {
        return { success: false, data: [], error: "Inserisci un argomento prima di generare il quiz." };
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("http://localhost:3000/api/artifacts/quiz/generate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                topic: message,
                mode,
                temperature,
                modelName
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.details || errData?.error || response.statusText);
        }

        const data = await response.json();
        return {
            success: true,
            data: Array.isArray(data.quiz) ? data.quiz : []
        };
    } catch (error: any) {
        console.error("Errore SendQuizMessage:", error);
        return {
            success: false,
            data: [],
            error: error?.message || "Errore durante la generazione del quiz."
        };
    }
};

export const fetchQuizExplanation = async (
    question: QuizQuestion,
    selectedOption: string,
    modelName: string,
    onChunk: (chunk: string) => void
) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("http://localhost:3000/api/artifacts/quiz/explain", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                domanda: question.domanda,
                opzioni: question.opzioni,
                rispostaCorretta: question.rispostaCorretta,
                selectedOption,
                modelName
            }),
        });

        if (!response.ok || !response.body) throw new Error("Errore durante la spiegazione");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            onChunk(chunk);
        }
    } catch (error) {
        console.error("Errore fetchQuizExplanation:", error);
        onChunk("⚠️ Errore nel caricamento della spiegazione.");
    }
};