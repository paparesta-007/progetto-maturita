import React from "react";
import Textbar from "../components/Textbar";
import { ChatProvider, useChat } from "../context/ChatContext";
import BotMessage from "../components/other/BotMessage";
import UserMessage from "../components/other/UserMessage";

// 1. Crea un componente "interno" che gestisce l'UI
// Questo componente sarà FIGLIO del Provider, quindi può usare useChat
const ChatContent = () => {
    const { inputValue, clearInput } = useChat();

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">

            {/* AREA MESSAGGI */}
            <main className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Chat</h1>
                    <div className="space-y-4">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <>
                                <UserMessage key={i} i={i} htmlContent={`<strong>Messaggio ${i + 1}:</strong> Questo è un messaggio di esempio con <em>HTML</em>.`} />
                                <BotMessage key={i} i={i} htmlContent={`<strong>Messaggio ${i + 1}:</strong> Questo è un messaggio di esempio con <em>HTML</em>.`} />
                            </>
                        ))}
                    </div>
                </div>

                {/* Popup flottante (spostato qui dentro) */}
                {inputValue && (
                    <div className="fixed bottom-32 right-8 bg-neutral-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-4">
                        <span>Scrivendo: {inputValue}</span>
                        <button onClick={clearInput} className="text-xs bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded transition-colors">
                            Clear
                        </button>
                    </div>
                )}
            </main>

            {/* FOOTER / TEXTBAR */}
            <footer className="flex-shrink-0 w-full bg-white pt-0 px-4 pb-4">
                {/* Contenitore centrato con larghezza massima */}
                <div className="max-w-3xl mx-auto mt-4 flex justify-center">
                    <div className="w-full flex items-center justify-center"> {/* Forza il componente a usare lo spazio del max-w-3xl */}
                        <Textbar />
                    </div>
                </div>

                <p className="text-center text-[10px] text-neutral-400 mt-2">
                    IA can make mistakes. Please verify the information provided.
                </p>
            </footer>
        </div>
    );
};

// 2. Il componente principale esportato serve SOLO a fornire il contesto
const ChatPage = () => {
    return (
        <ChatProvider>
            <ChatContent />
        </ChatProvider>
    );
};

export default ChatPage;