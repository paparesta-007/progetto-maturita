import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface SchemaNodeData {
    id: string;
    title: string;
    description: string;
    color?: string; // Soft color for text/border
    x: number;
    y: number;
    children: SchemaNodeData[];
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
    sendMessage: (text: string, model: string) => Promise<void>;
}

const SchemaContext = createContext<SchemaContextProps | undefined>(undefined);

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

    const sendMessage = async (text: string, model: string) => {
        if (!text.trim()) return;

        const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const response = await fetch("http://localhost:3000/api/artifacts/schema-tree", {
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

            if (!response.ok) {
                throw new Error("Errore durante la richiesta");
            }

            const data = await response.json();

            setMessages(prev => [...prev, { role: "assistant", content: data.message || "Schema aggiornato." }]);

            if (data.schema && Array.isArray(data.schema)) {
                // Layout ad albero avanzato: calcola l'altezza dei sotto-alberi per centrare i genitori
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

                // Inizia il posizionamento con un offset per centrare la radice
                const positionedSchema = positionNodes(data.schema, 100, 100);
                setSchema(positionedSchema);
            }

        } catch (error) {
            console.error("Errore Schema Builder:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Errore durante l'elaborazione." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SchemaContext.Provider value={{ schema, setSchema, messages, loading, sendMessage }}>
            {children}
        </SchemaContext.Provider>
    );
};

export const useSchema = () => {
    const context = useContext(SchemaContext);
    if (!context) throw new Error("useSchema must be used within a SchemaProvider");
    return context;
};
