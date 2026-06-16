import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";

export interface SchemaNodeData {
    id: string;
    title: string;
    description: string;
    color?: string; // Soft color for text/border
    bgColor?: string; // Background color
    x: number;
    y: number;
    children: SchemaNodeData[];
    isCollapsed?: boolean;
}

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface SchemaContextProps {
    schema: SchemaNodeData[];
    setSchema: React.Dispatch<React.SetStateAction<SchemaNodeData[]>>;
    messages: ChatMessage[];
    loading: boolean;
    orientation: 'vertical' | 'horizontal';
    setOrientation: (o: 'vertical' | 'horizontal') => void;
    sendMessage: (text: string, model: string) => Promise<void>;
    expandNodeWithAI: (nodeId: string, nodeTitle: string, model?: string) => Promise<void>;
    clearMessages: () => void;
}

const SchemaContext = createContext<SchemaContextProps | undefined>(undefined);

const NODE_HEIGHT_SPACING = 200;
const LEVEL_SPACING = 350;

const calculateSubtreeHeight = (nodes: SchemaNodeData[]): number => {
    return nodes.reduce((total, node) => {
        const childrenHeight = node.children && node.children.length > 0 
            ? calculateSubtreeHeight(node.children) 
            : NODE_HEIGHT_SPACING;
        return total + childrenHeight;
    }, 0);
};

const positionNodes = (nodes: SchemaNodeData[], startX: number, startY: number): SchemaNodeData[] => {
    let currentY = startY;
    
    return nodes.map((node) => {
        const subtreeHeight = node.children && node.children.length > 0 
            ? calculateSubtreeHeight(node.children) 
            : NODE_HEIGHT_SPACING;
        
        // Centra il genitore rispetto alla sua altezza totale del sottoalbero
        const nodeY = currentY + (subtreeHeight / 2) - 50; 
        const newNode = {
            ...node,
            x: startX,
            y: nodeY,
            children: node.children && node.children.length > 0 
                ? positionNodes(node.children, startX + LEVEL_SPACING, currentY)
                : []
        };
        
        currentY += subtreeHeight;
        return newNode;
    });
};

const repairPartialJSON = (jsonStr: string): string => {
    let cleaned = jsonStr.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.substring(3);
    }
    cleaned = cleaned.trim();

    let insideString = false;
    let escaped = false;
    const stack: string[] = [];

    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (char === '\\') {
            escaped = true;
            continue;
        }
        if (char === '"') {
            insideString = !insideString;
            continue;
        }
        if (!insideString) {
            if (char === '{') {
                stack.push('}');
            } else if (char === '[') {
                stack.push(']');
            } else if (char === '}' || char === ']') {
                if (stack.length > 0 && stack[stack.length - 1] === char) {
                    stack.pop();
                }
            }
        }
    }

    let repaired = cleaned;
    if (insideString) {
        repaired += '"';
    }
    while (stack.length > 0) {
        const closingToken = stack.pop();
        repaired += closingToken;
    }
    return repaired;
};

export const SchemaProvider = ({ children }: { children: ReactNode }) => {
    const { session } = useAuth();

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return Math.random().toString(36).substring(2, 11);
    };

    const [schema, setSchema] = useState<SchemaNodeData[]>([
        { id: generateId(), title: "Radice", description: "", x: 100, y: 100, children: [] }
    ]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const sendMessage = useCallback(async (text: string, model: string) => {
        if (!text.trim()) return;

        const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
        setMessages([...newMessages, { role: "assistant", content: "" }]);
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/artifacts/schema-tree`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    messages: newMessages,
                    currentSchema: schema,
                    model: model
                })
            });

            if (!response.ok || !response.body) {
                throw new Error("Errore durante la richiesta o stream non disponibile");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            let lastParsedMessage = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                const repairedText = repairPartialJSON(accumulatedText);
                try {
                    const parsed = JSON.parse(repairedText);
                    
                    if (parsed.message !== undefined && parsed.message !== lastParsedMessage) {
                        lastParsedMessage = parsed.message;
                        setMessages(prev => {
                            const newHist = [...prev];
                            if (newHist.length > 0 && newHist[newHist.length - 1].role === "assistant") {
                                newHist[newHist.length - 1] = { role: "assistant", content: parsed.message || "" };
                            }
                            return newHist;
                        });
                    }

                    if (parsed.schema && Array.isArray(parsed.schema)) {
                        const positionedSchema = positionNodes(parsed.schema, 100, 100);
                        setSchema(positionedSchema);
                    }
                } catch (e) {
                    // Skip frames with incomplete/un-repairable JSON
                }
            }

        } catch (error) {
            console.error("Errore Schema Builder:", error);
            setMessages(prev => {
                const newHist = [...prev];
                if (newHist.length > 0 && newHist[newHist.length - 1].role === "assistant" && !newHist[newHist.length - 1].content) {
                    newHist[newHist.length - 1] = { role: "assistant", content: "Errore durante l'elaborazione." };
                } else {
                    newHist.push({ role: "assistant", content: "Errore durante l'elaborazione." });
                }
                return newHist;
            });
        } finally {
            setLoading(false);
        }
    }, [messages, schema, session]);

    const expandNodeWithAI = useCallback(async (nodeId: string, nodeTitle: string, model: string = "deepseek/deepseek-v4-flash") => {
        setLoading(true);
        const promptText = `Per favore espandi il nodo "${nodeTitle}" (ID: ${nodeId}) aggiungendo esattamente 3 sotto-nodi (nodi figli) correlati nello schema. Per ogni sotto-nodo fornisci un titolo chiaro ed una descrizione esplicativa nel rispettivo campo description. Mantieni intatto tutto il resto dello schema attuale.`;
        
        const newMessages: ChatMessage[] = [...messages, { role: "user", content: `Espandi con AI il nodo: "${nodeTitle}"` }];
        setMessages([...newMessages, { role: "assistant", content: "" }]);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/artifacts/schema-tree`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    messages: [...messages, { role: "user", content: promptText }],
                    currentSchema: schema,
                    model: model
                })
            });

            if (!response.ok || !response.body) {
                throw new Error("Errore durante la richiesta o stream non disponibile");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            let lastParsedMessage = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                const repairedText = repairPartialJSON(accumulatedText);
                try {
                    const parsed = JSON.parse(repairedText);
                    
                    if (parsed.message !== undefined && parsed.message !== lastParsedMessage) {
                        lastParsedMessage = parsed.message;
                        setMessages(prev => {
                            const newHist = [...prev];
                            if (newHist.length > 0 && newHist[newHist.length - 1].role === "assistant") {
                                newHist[newHist.length - 1] = { role: "assistant", content: parsed.message || "" };
                            }
                            return newHist;
                        });
                    }

                    if (parsed.schema && Array.isArray(parsed.schema)) {
                        const positionedSchema = positionNodes(parsed.schema, 100, 100);
                        setSchema(positionedSchema);
                    }
                } catch (e) {
                    // Skip frames with incomplete/un-repairable JSON
                }
            }

        } catch (error) {
            console.error("Errore AI Node Expansion:", error);
            setMessages(prev => {
                const newHist = [...prev];
                if (newHist.length > 0 && newHist[newHist.length - 1].role === "assistant" && !newHist[newHist.length - 1].content) {
                    newHist[newHist.length - 1] = { role: "assistant", content: "Errore durante l'espansione del nodo con AI." };
                } else {
                    newHist.push({ role: "assistant", content: "Errore durante l'espansione del nodo con AI." });
                }
                return newHist;
            });
        } finally {
            setLoading(false);
        }
    }, [messages, schema, session]);

    const contextValue = useMemo(() => ({
        schema,
        setSchema,
        messages,
        loading,
        orientation,
        setOrientation,
        sendMessage,
        expandNodeWithAI,
        clearMessages
    }), [schema, messages, loading, orientation, sendMessage, expandNodeWithAI, clearMessages]);

    return (
        <SchemaContext.Provider value={contextValue}>
            {children}
        </SchemaContext.Provider>
    );
};

export const useSchema = () => {
    const context = useContext(SchemaContext);
    if (!context) throw new Error("useSchema must be used within a SchemaProvider");
    return context;
};
