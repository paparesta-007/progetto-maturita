import React, { createContext, useContext, useState, ReactNode } from "react";
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

    const clearMessages = () => {
        setMessages([]);
    };

    const sendMessage = async (text: string, model: string) => {
        if (!text.trim()) return;

        const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
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

            if (!response.ok) {
                throw new Error("Errore durante la richiesta");
            }

            const data = await response.json();

            setMessages(prev => [...prev, { role: "assistant", content: data.message || "Schema aggiornato." }]);

            if (data.schema && Array.isArray(data.schema)) {
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

    const expandNodeWithAI = async (nodeId: string, nodeTitle: string, model: string = "deepseek/deepseek-v4-flash") => {
        setLoading(true);
        const promptText = `Per favore espandi il nodo "${nodeTitle}" (ID: ${nodeId}) aggiungendo esattamente 3 sotto-nodi (nodi figli) correlati nello schema. Per ogni sotto-nodo fornisci un titolo chiaro ed una descrizione esplicativa nel rispettivo campo description. Mantieni intatto tutto il resto dello schema attuale.`;
        
        const newMessages: ChatMessage[] = [...messages, { role: "user", content: `Espandi con AI il nodo: "${nodeTitle}"` }];
        setMessages(newMessages);

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

            if (!response.ok) {
                throw new Error("Errore durante la richiesta");
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.message || `Il nodo "${nodeTitle}" è stato espanso con successo.` }]);

            if (data.schema && Array.isArray(data.schema)) {
                const positionedSchema = positionNodes(data.schema, 100, 100);
                setSchema(positionedSchema);
            }
        } catch (error) {
            console.error("Errore AI Node Expansion:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Errore durante l'espansione del nodo con AI." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SchemaContext.Provider value={{ schema, setSchema, messages, loading, orientation, setOrientation, sendMessage, expandNodeWithAI, clearMessages }}>
            {children}
        </SchemaContext.Provider>
    );
};

export const useSchema = () => {
    const context = useContext(SchemaContext);
    if (!context) throw new Error("useSchema must be used within a SchemaProvider");
    return context;
};
