import createConversation from "../services/supabase/Conversation/createConversation";
import createMessage from "../services/supabase/Conversation/createMessage";
import { type NavigateFunction } from "react-router-dom";
export interface ChatOptions {
    systemPrompt?: string;
    personalInfo?: any;
    tone?: string;
    allowedCustomInstructions?: string | boolean;
    isTemporary?: boolean;
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
    const { systemPrompt, personalInfo, tone, allowedCustomInstructions } = options;

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
                allowedCustomInstructions
            }),
        });

        if (!response.ok) throw new Error(`Errore API Chat: ${response.statusText}`);

        const data = await response.json();
        const responseText = data.text;
        const responseUsage = data.usage || { total_tokens: 0 };
        const responseModel = model?.name || model?.name_id || "Unknown";
        const suggestedQuestions = data.suggestedQuestions || [];

        setMessageHistory((prev) => [
            ...prev,
            { role: 'bot', content: responseText, usage: responseUsage, model: responseModel, suggestedQuestions },
        ]);

        const messagePayload = {
            sender: message,
            content: responseText,
            usage: responseUsage,
            model: model
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
                await fetchConversations();
            }
        }

    } catch (error) {
        console.error("Errore sendNormalMessage:", error);
        setMessageHistory((prev) => [...prev, { role: 'bot', content: "Si è verificato un errore durante la richiesta.", model: "System" }]);
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

    const { systemPrompt, personalInfo, tone, allowedCustomInstructions } = options;

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
                allowedCustomInstructions
            }),
        });

        if (!response.ok || !response.body) throw new Error(response.statusText);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let accumulatedText = "";

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;

            if (value) {
                const chunkValue = decoder.decode(value, { stream: true });
                accumulatedText += chunkValue;

                setMessageHistory((prev) => {
                    const newHistory = [...prev];
                    const lastMsgIndex = newHistory.length - 1;
                    if (newHistory[lastMsgIndex].role === 'bot') {
                        newHistory[lastMsgIndex] = {
                            ...newHistory[lastMsgIndex],
                            content: accumulatedText
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
            usage: { total_tokens: 0 },
            model: model
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
                await fetchConversations();
            }
        }

    } catch (error) {
        console.error("Errore durante lo streaming:", error);
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