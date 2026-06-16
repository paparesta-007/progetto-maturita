import Textbar from "../components/Textbar";
import { useChat } from "../context/ChatContext";
import BotMessage from "../components/other/BotMessage";
import UserMessage from "../components/other/UserMessage";
import BotLoading from "../components/other/BotLoading";
import PromptStarter from "../components/PromptStarter";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useRef, useState, useMemo } from "react";
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

    let trimmed = content.trim();
    if (!trimmed) return null;

    // Reject if content is wrapped in code fences (model violated instructions)
    if (trimmed.startsWith("```")) return null;
    // Reject HTML entities (escaped HTML, not real tags)
    if (trimmed.startsWith("&lt;")) return null;

    // Strip leading/trailing markdown code fences if the model wrapped HTML in them
    // e.g. ```html\n<div>...</div>\n```
    const fenceWrapped = trimmed.match(/^```(?:html)?\s*\n([\s\S]+?)\n\s*```$/i);
    if (fenceWrapped) {
        trimmed = fenceWrapped[1].trim();
    }

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
            // Catch arbitrary bg values like bg-[#f9f9f9], bg-[#fafafa], bg-[#fff], etc.
            .replace(/\bbg-\[#(?:f[0-9a-f]{5}|f{3,6}|e[0-9a-f]{5})\]/gi, 'bg-transparent')
            // Catch bg-neutral-50, bg-gray-50, bg-zinc-50, bg-slate-50 and their /opacity variants
            .replace(/\bbg-(neutral|gray|zinc|slate)-(50|100)(?:\/\d+)?\b/gi, 'bg-transparent')
            // Catch bg-white/XX opacity variants
            .replace(/\bbg-white\/\d+\b/gi, 'bg-transparent')
            // Neutralize common inline white/light backgrounds produced by model HTML snippets.
            .replace(/background-color\s*:\s*(#fff(?:fff)?|#f[0-9a-f]{5}|white|rgb\(255\s*,\s*255\s*,\s*255\)|rgb\(\s*2[45]\d\s*,\s*2[45]\d\s*,\s*2[45]\d\s*\))/gi, 'background-color: transparent')
            .replace(/background\s*:\s*(#fff(?:fff)?|#f[0-9a-f]{5}|white|rgb\(255\s*,\s*255\s*,\s*255\)|rgb\(\s*2[45]\d\s*,\s*2[45]\d\s*,\s*2[45]\d\s*\))/gi, 'background: transparent')
            // Neutralize dark text colors that become invisible on dark backgrounds
            .replace(/\btext-(neutral|gray|zinc|slate)-900\b/gi, 'text-neutral-100')
            .replace(/\btext-(neutral|gray|zinc|slate)-800\b/gi, 'text-neutral-200')
            .replace(/\btext-black\b/gi, 'text-neutral-100')
            .replace(/color\s*:\s*(#000(?:000)?|black|rgb\(0\s*,\s*0\s*,\s*0\))/gi, 'color: #f4f1ea')
            // Neutralize solid light borders that look harsh on dark mode
            .replace(/\bborder-(neutral|gray|zinc|slate)-(100|200)\b/gi, 'border-neutral-800');
    } else {
        // Light mode: neutralize dark backgrounds the model may emit
        normalized = normalized
            .replace(/\bbg-(neutral|gray|zinc|slate)-(800|900|950)\b/gi, 'bg-transparent')
            .replace(/\bbg-black\b/gi, 'bg-transparent')
            .replace(/\bbg-\[#(?:0[0-9a-f]{5}|1[0-9a-f]{5}|2[0-9a-f]{5})\]/gi, 'bg-transparent');
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

interface StructuredSection {
    type: 'markdown' | 'html';
    content: string;
}

interface SectionErrorBoundaryProps {
    children: React.ReactNode;
}

interface SectionErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class SectionErrorBoundary extends React.Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
    constructor(props: SectionErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("SectionErrorBoundary caught rendering error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-3 my-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                    <p className="font-bold mb-1">⚠️ Errore nel rendering della sezione</p>
                    <pre className="whitespace-pre-wrap font-mono text-[10px] opacity-80">
                        {this.state.error?.message || "Errore sconosciuto"}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const HtmlSection = React.memo(({ content, isDark }: { content: string; isDark: boolean }) => {
    if (/\<ui-component\s+type="[^"]+"/.test(content)) {
        return <GenerativeUIRenderer text={content} isDark={isDark} />;
    }
    const normalizedHtml = normalizeWrapperThemeClasses(content, isDark);
    const htmlWithLatex = renderLatexInHtml(normalizedHtml);
    const safeHtml = DOMPurify.sanitize(htmlWithLatex, {
        ADD_TAGS: ['svg', 'path', 'g', 'rect', 'circle', 'line', 'polyline', 'polygon', 'button', 'span', 'section', 'article', 'math', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mtext', 'annotation', 'annotation-xml'],
        ADD_ATTR: ['class', 'style', 'viewBox', 'd', 'fill', 'xmlns', 'width', 'height', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'x', 'y', 'rx', 'ry', 'cx', 'cy', 'r', 'encoding', 'aria-hidden']
    });
    return (
        <div 
            className="genui-html" 
            dangerouslySetInnerHTML={{ __html: safeHtml }} 
        />
    );
});

const StructuredSections = React.memo(({ sections, isDark }: { 
    sections: StructuredSection[], 
    isDark: boolean 
}) => {
    return (
        <div className="flex flex-col gap-3">
            {sections.map((section, idx) => {
                if (section.type === 'markdown') {
                    return (
                        <SectionErrorBoundary key={`md-${idx}`}>
                            <MarkdownRender text={section.content} />
                        </SectionErrorBoundary>
                    );
                }
                if (section.type === 'html') {
                    return (
                        <SectionErrorBoundary key={`html-${idx}`}>
                            <HtmlSection content={section.content} isDark={isDark} />
                        </SectionErrorBoundary>
                    );
                }
                return null;
            })}
        </div>
    );
});

const LivePreviewMock = () => {
    return (
        <></>
    );
};

const MessageItem = React.memo(({ msg, index, isDark, sendMessage }: { 
    msg: any, 
    index: number, 
    isDark: boolean, 
    sendMessage: (msg: string, f: string, r: string) => void 
}) => {
    const hasStructuredUI = useMemo(() => /<ui-component\s+type="[^"]+">/i.test(msg.content), [msg.content]);
    const renderMode = msg.renderMode || 'markdown';
    
    const safeHtml = useMemo(() => {
        const extractedHtml = extractRenderableHtml(msg.content);
        const canRenderHtml = Boolean((renderMode === 'html' || (!msg.renderMode && extractedHtml)) && extractedHtml);
        const actuallyRenderHtml = canRenderHtml && !hasStructuredUI;

        if (!actuallyRenderHtml) return null;

        const normalizedHtml = normalizeWrapperThemeClasses(extractedHtml || '', isDark);
        const htmlWithLatex = renderLatexInHtml(normalizedHtml);
        return DOMPurify.sanitize(htmlWithLatex, {
            ADD_TAGS: ['svg', 'path', 'g', 'rect', 'circle', 'line', 'polyline', 'polygon', 'button', 'span', 'section', 'article', 'math', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mtext', 'annotation', 'annotation-xml'],
            ADD_ATTR: ['class', 'style', 'viewBox', 'd', 'fill', 'xmlns', 'width', 'height', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'x', 'y', 'rx', 'ry', 'cx', 'cy', 'r', 'encoding', 'aria-hidden']
        });
    }, [msg.content, msg.renderMode, hasStructuredUI, isDark]);

    if (msg.role === 'user') {
        return <UserMessage i={index} htmlContent={msg.content} files={msg.files} />;
    }

    return (
        <BotMessage 
            i={index} 
            usage={msg.usage} 
            model={msg.model} 
            suggestedQuestions={msg.suggestedQuestions} 
            logs={msg.logs} 
            isComplete={msg.isComplete} 
            reasoning={msg.reasoning} 
            onSuggestedClick={(q) => sendMessage(q, "normal", "fast")}
        >
            {msg.content === "Elaborazione in corso..." || msg.content === "Avvio della richiesta..." 
                ? <p className="text-neutral-500 italic text-sm">{msg.content}</p> 
                : msg.renderMode === 'structured' && msg.sections
                    ? <StructuredSections sections={msg.sections} isDark={isDark} />
                    : hasStructuredUI
                        ? <GenerativeUIRenderer text={msg.content} isDark={isDark} />
                        : safeHtml
                            ? <div className="genui-html" dangerouslySetInnerHTML={{ __html: safeHtml }} />
                        : <MarkdownRender text={msg.content} isStreaming={msg.isStreaming} />
            }
        </BotMessage>
    );
});

const BETTERVIEW_PROMPTS = [
  "Spiegami come funziona l'interesse composto con una descrizione dettagliata ed illustrativa dei concetti teorici (capitale iniziale, contributi mensili, rendimento, orizzonte temporale). Includi poi un pianificatore finanziario interattivo (mini-simulatore) con slider per impostare tali parametri e un grafico ad area Chart.js che mostri la crescita del capitale in tempo reale.",
  "Spiegami i concetti fisici di gravità, rimbalzo (restituzione) e vento/attrito dell'aria. Associa alla spiegazione teorica un simulatore fisico bidimensionale interattivo in HTML5 Canvas, dove l'utente può cliccare per generare palline colorate che risentono dei parametri impostati tramite gli slider in tempo reale.",
  "Presenta una spiegazione interattiva su Dante Alighieri e la struttura della Divina Commedia, descrivendo l'Inferno, il Purgatorio e il Paradiso. Aggiungi poi un mini-quiz interattivo a risposta multipla (5 domande) con barra di avanzamento, feedback visivo immediato (verde/rosso), timer di 15 secondi per domanda e pannello riepilogativo dei risultati finale.",
  "Spiegami il funzionamento di CSS Flexbox, descrivendone i concetti cardine (asse principale, asse secondario, allineamento e distribuzione dello spazio). Integra una guida interattiva (playground) con controlli per modificare flex-direction, justify-content, align-items e gap, mostrando in tempo reale il comportamento di 4 box numerati con una spiegazione dell'effetto pratico di ogni valore.",
  "Spiegami come viene valutata la sicurezza di una password e cos'è l'entropia crittografica. Sotto la spiegazione concettuale, includi un mini-generatore interattivo con slider di lunghezza (8-32 caratteri), checkbox per Maiuscole, Numeri, Simboli e un valutatore di forza in tempo reale (barra colorata, bit di entropia e pulsante copia).",
  "Illustra il clima delle principali città italiane (Milano, Roma, Napoli, Palermo, Cagliari) spiegando le differenze geografiche e climatiche tra Nord, Centro, Sud e Isole. Aggiungi una mappa interattiva stilizzata (in SVG o griglia) in cui, cliccando su una città, viene visualizzata una scheda con i dettagli meteo correnti e un grafico Chart.js con le previsioni orarie per le successive 12 ore.",
  "Spiegami come funziona il suono dal punto di vista fisico (frequenze, ampiezza, tipi di onde sonore come Sine, Square, Triangle, Sawtooth). Sotto la spiegazione teorica, aggiungi un sintetizzatore virtuale interattivo a 8 tasti (un'ottava) che consenta di modificare il tipo di onda, regolare il volume e visualizzare l'oscillazione su un Canvas quando si suona.",
  "Spiegami la sintassi e la filosofia di Markdown e come viene convertito in HTML. Includi un editor Markdown interattivo in tempo reale con layout a due pannelli (input a sinistra, anteprima HTML renderizzata a destra) e un pulsante per caricare un testo di esempio.",
  "Presenta la ricetta del Tiramisù o delle Lasagne spiegandone l'origine e i passaggi fondamentali. Sotto la guida, aggiungi una scheda interattiva per scalare dinamicamente le porzioni (da 1 a 20 persone) aggiornando le dosi in tempo reale e una checklist degli ingredienti interattiva.",
  "Spiegami i criteri di accessibilità del contrasto colore WCAG 2.1 e perché sono fondamentali per le persone con disabilità visiva. Aggiungi poi un tester interattivo di contrasto HSL con slider per regolare Hue, Saturation e Lightness del background, calcolando in tempo reale il contrasto rispetto al testo bianco e nero con l'esito dei requisiti AA/AAA.",
  "Spiegami la crittografia classica e il funzionamento del Cifrario di Cesare e del Cifrario Atbash. Aggiungi una macchina cifrante interattiva con una textarea per il testo in chiaro, uno slider per la chiave di Cesare (1-25), opzioni radio per l'algoritmo, e il risultato cifrato in tempo reale insieme ad una rappresentazione visiva dell'alfabeto traslato.",
  "Spiegami la struttura logica e le relazioni delle tecnologie web (Frontend, Backend, Database). Rappresenta questa gerarchia attraverso una mappa concettuale interattiva ad albero usando D3.js, dove i nodi possono essere espansi o contratti al click e l'utente può inserire dinamicamente nuovi nodi tramite un form."
];

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
        abortRequest,
        conversations,
    } = useChat();
    const [isUsageOpen, setIsUsageOpen] = useState(false);
    const [isPromptsOpen, setIsPromptsOpen] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    
    // Riferimento per sapere se eravamo in fondo l'ultima volta
    const isUserScrolledUp = useRef(false);

    // --- LOGICA TEMA ---
    const isDark = theme === 'dark';

    // Stili CSS-in-JS (Tailwind)
    const styles = {
        wrapper: `flex flex-col h-screen w-full overflow-hidden relative transition-all duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea] font-['Manrope']" : "bg-[#faf9f6]"}`,
        headerText: `flex justify-between items-center w-full text-sm pl-16 pr-6 md:px-6 pt-4 font-semibold mb-2 transition-colors z-20 ${isDark ? "text-white/90" : "text-neutral-700"}`,
        main: `flex-1 flex overflow-hidden relative w-full min-w-0 z-10`,
        footer: `flex-shrink-0 w-full pt-0 pb-6 transition-colors duration-300 z-20 ${isDark ? "bg-transparent" : "bg-[#faf9f6]"}`,
        disclaimer: `text-center text-[10px] mt-3 opacity-40 ${isDark ? "text-white" : "text-neutral-500"}`
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
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
            if (currentConversationId || currentConversationName) {
                setMessageHistory([]);
                setCurrentConversationId(null);
                setCurrentConversationName(null);
            }
            return;
        }
        
        if (!areConversationsLoaded) return;

        // Sincronizza sempre il nome della conversazione corrente dall'elenco
        const activeConv = conversations.find(conv => conv.id === conversationId);
        if (activeConv) {
            setCurrentConversationName(activeConv.title || activeConv.name || "Chat");
        }
        
        // Evita di ricaricare i messaggi dal server se stiamo già visualizzando questa conversazione
        // (necessario quando navighiamo a un chat appena creata dalla schermata home del chat)
        if (currentConversationId === conversationId) return;

        // Se l'ID cercato non è ancora presente nella lista delle conversazioni (durante la creazione),
        // ma abbiamo dei messaggi locali in corso (messageHistory > 0), assumiamo che sia la conversazione
        // appena creata in questa sessione. Sincronizziamo lo stato e non ricarichiamo dal server.
        const isNewConversationTransition = !conversations.some(conv => conv.id === conversationId) && messageHistory.length > 0;
        if (isNewConversationTransition) {
            setCurrentConversationId(conversationId);
            return;
        }

        const isOwner = userOwnsConversation(conversationId);
        if (isOwner) {
            loadConversation(conversationId);
            setCurrentConversationId(conversationId);
        } else {
            navigate('/app');
        }

        return () => {
            // Se cambio conversazione o la component si smonta, blocco la richiesta in corso.
            abortRequest();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, areConversationsLoaded, user?.id, navigate, conversations]);

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
                <div className="w-full min-w-0 flex flex-col overflow-hidden">
                    {/* Container scrollabile per i messaggi */}
                    {/* min-w-0 previene che i figli flex espandano il genitore oltre la larghezza */}
                    <div 
                        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 min-w-0"
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                    >
                        {messageHistory.length !== 0 ? (
                            <div className="space-y-6 w-full max-w-3xl mx-auto">
                                {messageHistory.map((msg, index) => (
                                    <MessageItem 
                                        key={index} 
                                        msg={msg} 
                                        index={index} 
                                        isDark={isDark} 
                                        sendMessage={sendMessage} 
                                    />
                                ))}
                                {loading && <BotLoading />}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div className="w-full max-w-3xl mx-auto">
                                <PromptStarter />
                            </div>
                        )}
                    </div>
                </div>

            </main>
            {isUsageOpen && (<UsageConversation onClose={() => setIsUsageOpen(false)} />)}
            {/* FOOTER */}
            <footer className={styles.footer}>
                {/* Il container interno del footer matcha esattamente le classi di larghezza della Chat */}
                <div className="w-full px-4">
                    <div className="w-full flex items-center justify-center">
                        <Textbar />
                    </div>
                    <p className={styles.disclaimer}>
                        IA can make mistakes. Please verify the information provided.
                    </p>
                </div>
            </footer>

            {/* FLOATING PROMPTS VIEW */}
            {isPromptsOpen && (
                <div className={`fixed bottom-24 right-6 w-80 sm:w-96 max-h-[420px] rounded-xl shadow-2xl border flex flex-col z-50 overflow-hidden transition-all duration-300 ${
                    isDark 
                        ? "bg-[#0d0e14]/95 border-white/10 text-white backdrop-blur-md" 
                        : "bg-white/95 border-neutral-200 text-neutral-800 backdrop-blur-md"
                }`}>
                    {/* Header */}
                    <div className={`flex justify-between items-center p-3 border-b flex-shrink-0 ${
                        isDark ? "border-white/10" : "border-neutral-200"
                    }`}>
                        <span className="font-bold text-xs flex items-center gap-1.5">
                            <span>💡</span> Prompt di Test BetterView
                        </span>
                        <button 
                            onClick={() => setIsPromptsOpen(false)}
                            className={`p-1 rounded-lg transition-colors ${
                                isDark ? "hover:bg-white/10 text-neutral-400 hover:text-white" : "hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Prompts list */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                        {BETTERVIEW_PROMPTS.map((promptText, idx) => (
                            <div 
                                key={idx} 
                                className={`p-2.5 rounded-lg border text-[11px] relative flex justify-between gap-3.5 items-start transition-all ${
                                    isDark 
                                        ? "bg-white/[0.02] border-white/5 hover:border-orange-500/40" 
                                        : "bg-neutral-50/50 border-neutral-200 hover:border-orange-500/40"
                                }`}
                            >
                                <p className={`leading-relaxed flex-1 font-medium whitespace-pre-wrap ${
                                    isDark ? "text-neutral-50" : "text-neutral-900"
                                }`}>{promptText}</p>
                                <button 
                                    onClick={() => handleCopy(promptText, idx)}
                                    className={`flex-shrink-0 p-1.5 rounded-md transition-all ${
                                        copiedIndex === idx 
                                            ? "text-green-500 bg-green-500/10" 
                                            : isDark 
                                                ? "text-neutral-400 hover:text-orange-400 hover:bg-white/10" 
                                                : "text-neutral-500 hover:text-orange-600 hover:bg-black/[0.05]"
                                    }`}
                                    title="Copia negli appunti"
                                >
                                    {copiedIndex === idx ? (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FLOATING LIGHTBULB TRIGGER BUTTON */}
            <button
                onClick={() => setIsPromptsOpen(prev => !prev)}
                className={`fixed bottom-24 right-6 z-40 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border ${
                    isDark 
                        ? "bg-[#ebdcb9] border-[#dfd0aa] text-neutral-900 hover:bg-[#dfd0aa] shadow-black/40" 
                        : "bg-[#f4ebe1] border-[#e2d4c5] text-neutral-800 hover:bg-[#ebdccf] shadow-neutral-400/20"
                }`}
                title="Apri Prompt di Test BetterView"
            >
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </button>
        </div>
    );
};

const ChatPage = () => {
    return <ChatContent />;
};

export default ChatPage;