
import Textbar from "../components/Textbar";
import { ChatProvider, useChat } from "../context/ChatContext";
import BotMessage from "../components/other/BotMessage";
import UserMessage from "../components/other/UserMessage";
import { convertLatexInMarkdown } from "../library/latextToMarkdown";
import { marked } from "marked";
import DOMPurify from "dompurify";
import BotLoading from "../components/other/BotLoading";
import PromptStarter from "../components/PromptStarter";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react"
// 1. Crea un componente "interno" che gestisce l'UI
// Questo componente sarà FIGLIO del Provider, quindi può usare useChat
const ChatContent = () => {
    const { user } = useAuth();
    const { conversationId } = useParams();
    const navigate = useNavigate(); // <--- Hook per il redirect
    const {
        messageHistory,
        loadConversation,
        userOwnsConversation,
        loading,
        setMessageHistory,
        areConversationsLoaded // <--- Prendiamo questo valore dal context
    } = useChat();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messageHistory, loading]);
    useEffect(() => {
        // 1. Se non abbiamo un ID conversazione, non facciamo nulla
        if (!conversationId) return;

        // 2. Se le conversazioni non sono ancora state caricate, ASPETTIAMO (return)
        // Questo evita il falso negativo iniziale
        if (!areConversationsLoaded) return;

        // 3. Ora che siamo sicuri che la lista è caricata, facciamo il controllo
        const isOwner = userOwnsConversation(conversationId);

        if (isOwner) {
            console.log("Caricamento conversazione:", conversationId);
            loadConversation(conversationId);
        } else {
            console.warn("Accesso negato. Redirect alla home.");
            // 4. Redirect effettivo
            navigate('/app'); // O dove vuoi tu, es: '/chat/new'
        }

    }, [conversationId, areConversationsLoaded, user?.id]); // Aggiunto areConversationsLoaded alle dipendenze

    const MarkdownRenderer = ({ text }: { text: string }) => {
        const safe = text || "";
        const withLatex = convertLatexInMarkdown(safe);
        const rawHtml = marked.parse(withLatex) as string;
        // SANITIZZAZIONE
        const cleanHtml = DOMPurify.sanitize(rawHtml);

        return (
            <div
                className="renderChat"
                dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
        );
    };
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">

            {messageHistory.length !== 0 ? (
                <main className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold mb-4">Chat</h1>
                        <div className="space-y-4">
                            {messageHistory.map((msg, index) => {
                                if (msg.role === 'user') {
                                    return <UserMessage key={index} i={index} htmlContent={msg.content}></UserMessage>;
                                } else {
                                    return <BotMessage key={index} i={index} usage={msg.usage}><MarkdownRenderer text={msg.content} /></BotMessage>;
                                }
                            })}
                            {loading && (
                                <BotLoading />
                            )}
                            <div ref={messagesEndRef} /> {/* Ancorina per lo scroll automatico */}
                        </div>
                    </div>

                </main>) : (
                <PromptStarter />
            )}
            <button className="fixed bottom-4 right-4  text-neutral-700 border border-neutral-300 px-4 py-2 rounded"
            onClick={() => {setMessageHistory([]); }}> {/* Pulsante per resettare le conversazioni e tornare alla home */}
                Home
            </button>
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
        <ChatContent />
    );
};

export default ChatPage;