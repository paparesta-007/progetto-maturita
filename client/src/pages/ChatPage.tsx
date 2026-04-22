import Textbar from "../components/Textbar";
import { useChat } from "../context/ChatContext";
import BotMessage from "../components/other/BotMessage";
import UserMessage from "../components/other/UserMessage";
import BotLoading from "../components/other/BotLoading";
import PromptStarter from "../components/PromptStarter";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import MarkdownRender from "../library/markdownRender";
import GenerativeUIRenderer from "../components/generativeUI/GenerativeUIRenderer";
import "katex/dist/katex.min.css";
import katex from "katex";
import { GhostIcon ,ChartBarIcon} from "@phosphor-icons/react";
import DOMPurify from "dompurify";
import UsageConversation from "../components/usageConversation";

/* -------------------------------------------------------
   System Styles (Shared from LandingPage)
------------------------------------------------------- */
const ChatStyles = ({ isDark }: { isDark: boolean }) => {
  if (!isDark) return null;
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

      :root {
        --bg: #07070a;
        --bg2: #0d0e14;
        --panel: rgba(255,255,255,.04);
        --panel2: rgba(255,255,255,.06);
        --fg: #f4f1ea;
        --muted: rgba(244,241,234,.68);
        --line: rgba(255,255,255,.10);
        --line2: rgba(255,255,255,.16);
        --accent: #f97316;
        --accent2: #fb923c;
        --good: #22c55e;
        --shadow: 0 20px 80px rgba(0,0,0,.42);
      }

      .font-mono { font-family: 'IBM Plex Mono', monospace; }

      .glass {
        background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
        backdrop-filter: blur(18px);
      }

      .glass-soft {
        background: rgba(255,255,255,.035);
        border: 1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(12px);
      }

      .gridline {
        background-image:
          linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
        background-size: 42px 42px;
      }

      .noise::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: .03;
        background-image:
          linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: linear-gradient(180deg, black, transparent 80%);
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.2);
      }

      ::selection {
        background: rgba(249, 115, 22, 0.3);
        color: #fff;
      }
    `}</style>
  );
};

const extractRenderableHtml = (content: string): string | null => {
    if (!content) return null;

    const trimmed = content.trim();
    if (!trimmed || trimmed.startsWith("```") || trimmed.startsWith("&lt;")) return null;

    const htmlStart = trimmed.search(/<\s*[a-z][\w:-]*(\s[^>]*)?>/i);
    if (htmlStart < 0) return null;

    const candidate = trimmed.slice(htmlStart).trim();
    const hasHtmlShape = /<\s*[a-z][\w:-]*(\s[^>]*)?>[\s\S]*<\s*\/\s*[a-z][\w:-]*\s*>/i.test(candidate);
    return hasHtmlShape ? candidate : null;
};

const normalizeWrapperThemeClasses = (html: string, isDark: boolean): string => {
    if (!html) return html;

    let normalized = html
        // Remove common wrapper theme combos that conflict with custom theme translators.
        .replace(/\bbg-white\s+dark:bg-[^\s"']+/gi, 'bg-transparent')
        .replace(/\bdark:bg-[^\s"']+\s+bg-white\b/gi, 'bg-transparent')
        .replace(/\bbg-black\s+dark:bg-[^\s"']+/gi, 'bg-transparent')
        .replace(/\bdark:bg-[^\s"']+\s+bg-black\b/gi, 'bg-transparent');

    if (isDark) {
        normalized = normalized
            .replace(/\bbg-white\b/gi, 'bg-transparent')
            .replace(/\bbg-(neutral|gray|zinc)-(50|100)\b/gi, 'bg-transparent')
            // Neutralize common inline white backgrounds produced by model HTML snippets.
            .replace(/background-color\s*:\s*(#fff(?:fff)?|white|rgb\(255\s*,\s*255\s*,\s*255\))/gi, 'background-color: transparent')
            .replace(/background\s*:\s*(#fff(?:fff)?|white|rgb\(255\s*,\s*255\s*,\s*255\))/gi, 'background: transparent');
    }

    return normalized;
};

const renderLatexInHtml = (html: string): string => {
    if (!html) return html;

    const renderFormula = (formula: string, displayMode: boolean) => {
        try {
            return katex.renderToString(formula.trim(), {
                displayMode,
                throwOnError: false,
            });
        } catch {
            return displayMode ? `$$${formula}$$` : `$${formula}$`;
        }
    };

    // Block math first, then inline math.
    let output = html.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula) => renderFormula(formula, true));
    output = output.replace(/\$([^$\n]+?)\$/g, (_match, formula) => renderFormula(formula, false));

    return output;
};
const LivePreviewMock = () => {
    return (
        <></>
    );
};

const ChatContent = () => {
    const { user, theme } = useAuth();
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { isLivePreview, setIsLivePreview } = useApp();
    const { isTemporaryConversation, setIsTemporaryConversation } = useChat();
    const {
        messageHistory,
        loadConversation,
        userOwnsConversation,
        loading,
        areConversationsLoaded,
        currentConversationId,
        setCurrentConversationId,
        currentConversationName,
        setCurrentConversationName,
        setMessageHistory,
        sendMessage,
    } = useChat();
    const [isUsageOpen, setIsUsageOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    
    // Riferimento per sapere se eravamo in fondo l'ultima volta
    const isUserScrolledUp = useRef(false);

    // --- LOGICA TEMA ---
    const isDark = theme === 'dark';

    // Stili CSS-in-JS (Tailwind)
    const styles = {
        wrapper: `flex flex-col h-screen w-full overflow-hidden relative transition-all duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea] font-['Manrope']" : "bg-white"}`,
        headerText: `flex justify-between items-center w-full text-sm px-6 pt-4 font-semibold mb-2 transition-colors z-20 ${isDark ? "text-white/90" : "text-neutral-700"}`,
        main: `flex-1 flex overflow-hidden relative w-full min-w-0 z-10`,
        footer: `flex-shrink-0 w-full pt-0 pb-6 transition-colors duration-300 z-20 ${isDark ? "bg-transparent" : "bg-white"}`,
        disclaimer: `text-center text-[10px] mt-3 opacity-40 ${isDark ? "text-white" : "text-neutral-500"}`
    };

    const scrollToBottom = (force = false) => {
        if (force) {
            isUserScrolledUp.current = false;
        }

        if (messagesEndRef.current && !isUserScrolledUp.current) {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
            });
        }
    };

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        // consider user scrolled up if they are more than 100px from the bottom
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        isUserScrolledUp.current = distanceToBottom > 100;
    };

    // Scrolla sempre quando c'è un nuovo item nella history se non abbiamo scrollato su
    useEffect(() => {
        scrollToBottom();
    }, [messageHistory, loading]);

    // Quando si cambia conversazione o la si apre per la prima volta, si forza lo scroll
    useEffect(() => {
        if (currentConversationId || conversationId) {
            // Un piccolo delay per assicurarsi che il DOM sia renderizzato
            setTimeout(() => scrollToBottom(true), 100);
        }
    }, [currentConversationId, conversationId]);

    useEffect(() => {
        setIsLivePreview(false); // Disattiva Live Preview quando entri nella chat
        
        if (!conversationId) {
            // Solo se non siamo più sincronizzati con la URL (es. tasto indietro da una chat esistente)
            if (currentConversationId) {
                setMessageHistory([]);
                setCurrentConversationId(null);
                setCurrentConversationName(null);
            }
            return;
        }
        
        if (!areConversationsLoaded) return;
        
        // Evita di ricaricare i messaggi dal server se stiamo già visualizzando questa conversazione
        // (necessario quando navighiamo a un chat appena creata dalla schermata home del chat)
        if (currentConversationId === conversationId) return;

        const isOwner = userOwnsConversation(conversationId);
        if (isOwner) {
            loadConversation(conversationId);
            setCurrentConversationId(conversationId);
        } else {
            navigate('/app');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, areConversationsLoaded, user?.id, navigate]);

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
        <div className={`${styles.wrapper} flex flex-col min-w-0`}>
            <ChatStyles isDark={isDark} />
            
            {isDark && (
                <>
                    <div className="absolute inset-0 gridline opacity-[0.15] pointer-events-none" />
                    <div className="absolute -top-24 -left-24 h-[400px] w-[400px] rounded-full bg-orange-500/[0.08] blur-[80px] pointer-events-none" />
                    <div className="absolute top-1/4 -right-24 h-[300px] w-[300px] rounded-full bg-orange-600/[0.04] blur-[70px] pointer-events-none" />
                    <div className="absolute bottom-1/4 left-1/3 h-[250px] w-[250px] rounded-full bg-orange-500/[0.04] blur-[80px] pointer-events-none" />
                    <div className="absolute top-1/2 right-1/4 h-48 w-48 rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />
                </>
            )}

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
                <div className="flex items-center gap-2">
                     <button onClick={() => {    
                    if (!isTemporaryConversation) {
                        navigate('/app/chat');
                    }
                    setIsTemporaryConversation(!isTemporaryConversation);
                    setCurrentConversationId(null);
                    setCurrentConversationName(null);
                    setMessageHistory([]);
                }}>
                    <GhostIcon
                        size={24} 
                        weight={`${isTemporaryConversation ? "fill" : "regular"}`}
                        className={`transition-all duration-300 ${isTemporaryConversation ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
                    />
                </button>

                {currentConversationId && (
                    <button onClick={() => {    
                        setIsUsageOpen(prev => !prev);
                }}>
                    <ChartBarIcon

                            size={24} 
                            weight={`${isTemporaryConversation ? "fill" : "regular"}`}
                            className={`transition-all duration-300 ${isTemporaryConversation ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
                        />
                    </button>
                )}
                </div>
            </h2>
             
            {/* MAIN CONTENT */}
            <main className={styles.main}>

                {/* 1. CHAT SECTION */}
                <div className={chatColumnClass}>
                    {/* Container scrollabile per i messaggi */}
                    {/* min-w-0 previene che i figli flex espandano il genitore oltre la larghezza */}
                    <div 
                        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 min-w-0"
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                    >
                        {messageHistory.length !== 0 ? (
                            <div className={`space-y-6 ${chatContentClass}`}>
                                {messageHistory.map((msg, index) => {
                                    const hasStructuredUI = /<ui-component\s+type="[^"]+">/i.test(msg.content);
                                    const renderMode = msg.renderMode || 'markdown';
                                    const extractedHtml = extractRenderableHtml(msg.content);
                                    const canRenderHtml = Boolean((renderMode === 'html' || (!msg.renderMode && extractedHtml)) && extractedHtml);
                                    
                                    // Se abbiamo Structured UI, diamo priorità a quella ignorando eventuali fallback HTML
                                    const actuallyRenderHtml = canRenderHtml && !hasStructuredUI;

                                    const normalizedHtml = actuallyRenderHtml ? normalizeWrapperThemeClasses(extractedHtml || '', isDark) : '';
                                    const htmlWithLatex = actuallyRenderHtml ? renderLatexInHtml(normalizedHtml) : '';
                                    const safeHtml = actuallyRenderHtml
                                        ? DOMPurify.sanitize(htmlWithLatex, {
                                            ADD_TAGS: ['svg', 'path', 'g', 'rect', 'circle', 'line', 'polyline', 'polygon', 'button', 'span', 'section', 'article', 'math', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mtext', 'annotation', 'annotation-xml'],
                                            ADD_ATTR: ['class', 'style', 'viewBox', 'd', 'fill', 'xmlns', 'width', 'height', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'x', 'y', 'rx', 'ry', 'cx', 'cy', 'r', 'encoding', 'aria-hidden']
                                        })
                                        : '';
                                    
                                    return (
                                        msg.role === 'user' ? (
                                            <UserMessage key={index} i={index} htmlContent={msg.content} />
                                        ) : (
                                            <BotMessage key={index} i={index} usage={msg.usage} model={msg.model} suggestedQuestions={msg.suggestedQuestions} logs={msg.logs} isComplete={msg.isComplete} reasoning={msg.reasoning} onSuggestedClick={(q) => sendMessage(q, "normal", "fast")}>
                                                {msg.content === "Elaborazione in corso..." || msg.content === "Avvio della richiesta..." 
                                                    ? <p className="text-neutral-500 italic text-sm">{msg.content}</p> 
                                                    : hasStructuredUI
                                                        ? <GenerativeUIRenderer text={msg.content} />
                                                        : actuallyRenderHtml
                                                            ? <div className="genui-html" dangerouslySetInnerHTML={{ __html: safeHtml }} />
                                                        : <MarkdownRender text={msg.content} />
                                                }
                                            </BotMessage>
                                        )
                                    );
                                })}
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
                        <LivePreviewMock />
                    </section>
                )}


            </main>
            {isUsageOpen && (<UsageConversation onClose={() => setIsUsageOpen(false)} />)}
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