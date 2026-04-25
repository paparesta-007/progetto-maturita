import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface SchemaNodeData {
    id: string;
    title: string;
    description: string;
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
        { id: generateId(), title: "", description: "", children: [] }
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
                setSchema(data.schema);
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
