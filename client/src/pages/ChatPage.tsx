import Textbar from "../components/Textbar";
import { useChat } from "../context/ChatContext";
import BotMessage from "../components/other/BotMessage";
import UserMessage from "../components/other/UserMessage";
import BotLoading from "../components/other/BotLoading";
import PromptStarter from "../components/PromptStarter";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import MarkdownRender from "../library/markdownRender";
import "katex/dist/katex.min.css";

const ChatContent = () => {
    const { user, theme } = useAuth(); // Assumo che theme sia nel tuo AuthContext o simile
    const { conversationId } = useParams();
    const navigate = useNavigate();
    
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

    const styles = {
        wrapper: `flex flex-col h-screen overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        headerText: `text-md px-4 pt-4 font-medium mb-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`,
        main: `flex-1 overflow-y-auto p-4 custom-scrollbar relative`,
        footer: `flex-shrink-0 w-full pt-0 px-4 pb-4 transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        disclaimer: `text-center text-[10px] mt-2 ${isDark ? "text-neutral-600" : "text-neutral-400"}`
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messageHistory, loading]);

    useEffect(() => {
        if (!conversationId || !areConversationsLoaded) return;

        const isOwner = userOwnsConversation(conversationId);
        if (isOwner) {
            loadConversation(conversationId);
            setCurrentConversationId(conversationId);
        } else {
            navigate('/app');
        }
    }, [conversationId, areConversationsLoaded, user?.id]);
      useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          // Ctrl+Shift+L → event.code === 'KeyL'
          if (event.ctrlKey && event.key=='i') {
            console.log("Nuova chat shortcut triggered");
            event.preventDefault(); // blocca eventuali default del browser
            navigate('/app/chat');
            setMessageHistory([]);
            setCurrentConversationId(null);
            setCurrentConversationName(null);
            
          }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [navigate, setMessageHistory, setCurrentConversationId]);
    return (
        <div className={styles.wrapper}>
            {/* Header dinamico */}
            <h2 className={styles.headerText}>
                {currentConversationName || (isDark ? "Nuova Chat" : "Chat")}
            </h2>

            {messageHistory.length !== 0 ? (
                <main className={styles.main}>
                    <div className="max-w-3xl mx-auto">
                        <div className="space-y-4">
                            {messageHistory.map((msg, index) => {
                                if (msg.role === 'user') {
                                    return <UserMessage key={index} i={index} htmlContent={msg.content} />;
                                } else {
                                    return (
                                        <BotMessage key={index} i={index} usage={msg.usage} model={msg.model}>
                                            <MarkdownRender text={msg.content} />
                                        </BotMessage>
                                    );
                                }
                            })}
                            {loading && <BotLoading />}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </main>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <PromptStarter />
                </div>
            )}

            {/* FOOTER PASSANDO IL TEMA SE NECESSARIO */}
            <footer className={styles.footer}>
                <div className="max-w-3xl mx-auto mt-4 flex justify-center">
                    <div className="w-full flex items-center justify-center">
                        <Textbar />
                    </div>
                </div>
                <p className={styles.disclaimer}>
                    IA can make mistakes. Please verify the information provided.
                </p>
            </footer>
        </div>
    );
};

const ChatPage = () => {
    return <ChatContent />;
};

export default ChatPage;