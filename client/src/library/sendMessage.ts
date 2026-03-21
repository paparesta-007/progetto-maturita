import createConversation from "../services/supabase/Conversation/createConversation";
import createMessage from "../services/supabase/Conversation/createMessage";
import { type NavigateFunction } from "react-router-dom";
export interface ChatOptions {
    systemPrompt?: string;
    personalInfo?: any;
    tone?: string;
    allowedCustomInstructions?: string | boolean;
    isTemporary?: boolean;
    reasoning?: string;
    attachedFiles?: any[];
}

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
    options: ChatOptions
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

        const response = await fetch("http://localhost:3000/api/completion/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: historyForBackend,
                modelName: model.name_id,
                systemPromptUser: systemPrompt,
                personalInfo,
                tone,
                allowedCustomInstructions,
                reasoning,
                attachedFiles: options.attachedFiles
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
        const responseUsage = data.usage || { total_tokens: 0 };
        const responseModel = model?.name || model?.name_id || "Unknown";
        const suggestedQuestions = data.suggestedQuestions || [];
        const reasoningContent = data.reasoning || null;

        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: responseText, usage: responseUsage, model: responseModel, suggestedQuestions, reasoning: reasoningContent },
        ]);

        const messagePayload = {
            sender: message,
            content: responseText,
            usage: responseUsage,
            model: model,
            reasoning: reasoningContent
        };

        if (options.isTemporary) {
            setLoading(false);
            return;
        }

        if (currentConversationId && userId) {
            await createMessage(messagePayload, currentConversationId, model);
        } else if (userId) {
            let newTitle = "New Chat";
            try {
                const titleRes = await fetch("http://localhost:3000/api/gemini/getTitleConversation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message }),
                });
                const titleData = await titleRes.json();
                newTitle = titleData.text || "New Chat";
            } catch (e) {
                console.warn("Fallimento generazione titolo, uso default");
            }

            const newConvData = await createConversation(userId, newTitle);
            if (newConvData && newConvData.length > 0) {
                const newConvId = newConvData[0].id;
                await createMessage(messagePayload, newConvId, model);
                setCurrentConversationId(newConvId);
                _navigate(`/app/chat/${newConvId}`);
                await fetchConversations();
            }
        }

    } catch (error: any) {
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
    options: ChatOptions
) => {
    if (!message.trim()) return;

    const { systemPrompt, personalInfo, tone, allowedCustomInstructions, reasoning } = options;

    const userMsg = { role: 'user' as const, content: message };
    const modelLabel = model?.name ?? model?.name_id ?? "Unknown";
    const botMsgPlaceholder = { role: 'bot' as const, content: "", model: modelLabel };

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

        const response = await fetch("http://localhost:3000/api/streamingOutput", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: historyForBackend,
                modelName: model.name_id,
                systemPromptUser: systemPrompt,
                personalInfo,
                tone,
                allowedCustomInstructions,
                reasoning,
                attachedFiles: options.attachedFiles
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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let accumulatedText = "";
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
                            ...(accumulatedReasoning ? { reasoning: accumulatedReasoning } : {}),
                            ...(Object.keys(accumulatedUsage).length > 0 ? { usage: accumulatedUsage } : {})
                        };
                    }
                    return newHistory;
                });
            }
        }

        // Fetch suggested questions after streaming
        let finalSuggestedQuestions: string[] = [];
        try {
            const resSQ = await fetch("http://localhost:3000/api/getSuggestedQuestion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

        // Save the message after streaming is complete
        const messagePayload = {
            sender: message,
            content: accumulatedText,
            usage: Object.keys(accumulatedUsage).length > 0 ? accumulatedUsage : { total_tokens: 0 },
            model: model,
            reasoning: accumulatedReasoning
        };

        if (options.isTemporary) {
            setLoading(false);
            return;
        }

        if (currentConversationId && userId) {
            await createMessage(messagePayload, currentConversationId, model);
        } else if (userId) {
            let newTitle = "New Chat";
            try {
                const titleRes = await fetch("http://localhost:3000/api/gemini/getTitleConversation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message }),
                });
                const titleData = await titleRes.json();
                newTitle = titleData.text || "New Chat";
            } catch (e) {
                console.warn("Fallimento generazione titolo, uso default");
            }

            const newConvData = await createConversation(userId, newTitle);
            if (newConvData && newConvData.length > 0) {
                const newConvId = newConvData[0].id;
                await createMessage(messagePayload, newConvId, model);
                setCurrentConversationId(newConvId);
                _navigate(`/app/chat/${newConvId}`);
                await fetchConversations();
            }
        }

    } catch (error: any) {
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

// ============================================================
// WEB SEARCH: Mock function — no server request
// ============================================================
export const sendWebSearchMessage = async (
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
        // Mock delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const modelLabel = model?.name ?? model?.name_id ?? "Unknown";
        const mockResponse = `**[Web Search Mock]**\n\nSearching the web for: "${message}"\n\n**Results:**\n1. *Example result 1* — This is a mock search result.\n2. *Example result 2* — Web search integration coming soon.\n3. *Example result 3* — Placeholder data.\n\n> Real web search will be connected to a backend endpoint.`;

        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: mockResponse, usage: { total_tokens: 0 }, model: modelLabel },
        ]);
    } catch (error) {
        console.error("Errore sendWebSearchMessage:", error);
        setMessageHistory((prev) => [...prev, { role: 'bot', content: "Errore nella funzionalità Web Search.", model: "System" }]);
    } finally {
        setLoading(false);
    }
};