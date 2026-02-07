import React, { createContext, useContext, useState } from "react";

interface ChatContextType {
    inputValue: string;
    setInputValue: (val: string) => void;
    clearInput: () => void;
}

// 1. Creazione del Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 2. Provider
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [inputValue, setInputValue] = useState("");

    const clearInput = () => setInputValue("");

    return (
        <ChatContext.Provider value={{ inputValue, setInputValue, clearInput }}>
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