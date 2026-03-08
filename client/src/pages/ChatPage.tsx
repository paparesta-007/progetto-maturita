import Textbar from "../components/Textbar";
import { useChat } from "../context/ChatContext";
import BotMessage from "../components/other/BotMessage";
import UserMessage from "../components/other/UserMessage";
import BotLoading from "../components/other/BotLoading";
import PromptStarter from "../components/PromptStarter";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import MarkdownRender from "../library/markdownRender";
import { Rocket, ShieldCheck, Sparkles } from "lucide-react";
import "katex/dist/katex.min.css";

const LivePreviewMock = ({ isDark }: { isDark: boolean }) => {
    const shellBg = isDark ? "bg-neutral-900 border-neutral-700" : "bg-neutral-50 border-neutral-200";
    const cardBg = isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200";
    const softText = isDark ? "text-neutral-600" : "text-neutral-600";
    const titleText = isDark ? "text-white" : "text-neutral-900";

    return (
        <></>
    );
};

const ChatContent = () => {
    const { user, theme } = useAuth();
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { isLivePreview, setIsLivePreview } = useApp();

    const {
        messageHistory,
        loadConversation,
        userOwnsConversation,
        loading,
        areConversationsLoaded,
        setCurrentConversationId,
        currentConversationName,
        setCurrentConversationName,
        setMessageHistory,
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // --- LOGICA TEMA ---
    const isDark = theme === 'dark';

    // Stili CSS-in-JS (Tailwind)
    const styles = {
        // Aggiunto overflow-x-hidden per evitare scroll orizzontali indesiderati
        wrapper: `flex flex-col h-screen w-full overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        headerText: `text-md px-4 pt-4 font-medium mb-2 transition-colors flex-shrink-0 ${isDark ? "text-neutral-300" : "text-neutral-700"}`,

        // Main è un flex container orizzontale
        main: `flex-1 flex overflow-hidden overflow-x-hidden relative w-full min-w-0`,

        // Footer: fisso in basso, ma gestito con width dinamiche
        footer: `flex-shrink-0 w-full pt-0 pb-4 transition-colors duration-300 z-10 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        disclaimer: `text-center text-[10px] mt-2 ${isDark ? "text-neutral-600" : "text-neutral-600"}`
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messageHistory, loading]);

    useEffect(() => {
        if (!conversationId) {
            setMessageHistory([]);
            setCurrentConversationId(null);
            setCurrentConversationName(null);
            return;
        }
        if (!areConversationsLoaded) return;
        
        const isOwner = userOwnsConversation(conversationId);
        if (isOwner) {
            loadConversation(conversationId);
            setCurrentConversationId(conversationId);
        } else {
            navigate('/app');
        }
    }, [conversationId, areConversationsLoaded, user?.id, setMessageHistory, setCurrentConversationId, setCurrentConversationName, loadConversation, userOwnsConversation, navigate]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'i') {
                event.preventDefault();
                navigate('/app/chat');
                setMessageHistory([]);
                setCurrentConversationId(null);
                setCurrentConversationName(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, setMessageHistory, setCurrentConversationId]);

    // Definisci le classi di larghezza dinamicamente per pulizia
    // In LivePreview: w-1/3 (o min-w per schermi piccoli). NO max-w-3xl.
    // Normal Mode: w-full e max-w-3xl centrato.
    const chatColumnClass = isLivePreview
        ? `w-1/3 min-w-0 flex flex-col border-r overflow-hidden ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`
        : `w-full min-w-0 flex flex-col overflow-hidden`;

    const chatContentClass = isLivePreview
        ? `w-full`
        : `w-full max-w-3xl mx-auto`;

    const footerInnerClass = isLivePreview
        ? `w-1/3 min-w-0 px-4` // Allineato a sinistra, larghezza identica alla chat
        : `w-full px-4`; // Scrollbar resta sul bordo destro del contenitore

    return (
        <div className={styles.wrapper}>
            {/* Toggle Switch */}
            <input type="checkbox" id="live-preview-toggle" className="hidden" checked={isLivePreview} onChange={() => setIsLivePreview(!isLivePreview)} />
            <label
                htmlFor="live-preview-toggle"
                className={`fixed bottom-24 right-8 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all shadow-lg border ${isLivePreview
                        ? (isDark ? "bg-emerald-600 border-emerald-500 text-white" : "bg-emerald-500 border-emerald-400 text-white")
                        : (isDark ? "bg-neutral-800 border-neutral-700 text-neutral-600 hover:text-white" : "bg-white border-neutral-200 text-neutral-600 hover:text-black")
                    }`}
            >
                <span className={isLivePreview ? "animate-pulse" : ""}>●</span>
                <span>{isLivePreview ? "Live Mode On" : "Code View"}</span>
            </label>

            <h2 className={styles.headerText}>
                {currentConversationName || (isDark ? "Nuova Chat" : "Chat")}
            </h2>

            {/* MAIN CONTENT */}
            <main className={styles.main}>

                {/* 1. CHAT SECTION */}
                <div className={chatColumnClass}>
                    {/* Container scrollabile per i messaggi */}
                    {/* min-w-0 previene che i figli flex espandano il genitore oltre la larghezza */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 min-w-0">
                        {messageHistory.length !== 0 ? (
                            <div className={`space-y-6 ${chatContentClass}`}>
                                {messageHistory.map((msg, index) => (
                                    msg.role === 'user' ?
                                        <UserMessage key={index} i={index} htmlContent={msg.content} /> :
                                        <BotMessage key={index} i={index} usage={msg.usage} model={msg.model}>
                                            <MarkdownRender text={msg.content} />
                                        </BotMessage>
                                ))}
                                {loading && <BotLoading />}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div className={chatContentClass}>
                                <PromptStarter />
                            </div>
                        )}
                    </div>
                </div>

                {isLivePreview && (
                    <section className={`w-2/3 min-w-0 h-full p-4 overflow-x-hidden overflow-y-auto ${isDark ? "bg-neutral-900" : "bg-neutral-50"}`}>
                        <LivePreviewMock isDark={isDark} />
                    </section>
                )}


            </main>

            {/* FOOTER */}
            <footer className={styles.footer}>
                {/* Il container interno del footer matcha esattamente le classi di larghezza della Chat */}
                <div className={footerInnerClass}>
                    <div className="w-full flex items-center justify-center">
                        <Textbar />
                    </div>
                    {!isLivePreview && (
                        <p className={styles.disclaimer}>
                            IA can make mistakes. Please verify the information provided.
                        </p>
                    )}
                </div>
            </footer>
        </div>
    );
};

const ChatPage = () => {
    return <ChatContent />;
};

export default ChatPage;