import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendar } from "../../context/CalendarContext";
import { useAuth } from "../../context/AuthContext";
import SelectPopup from "../../components/other/SelectPopup";
import { useChat } from "../../context/ChatContext";
import { PaperPlaneTilt, CaretDown, Minus, PencilSimple, MagicWand, Sparkle, Calendar, Clock, Notebook, Bell, BellSlash } from "@phosphor-icons/react";
import GenerativeUIRenderer from "../../components/generativeUI/GenerativeUIRenderer";

type ReasoningStep = { type: string; content: string };
type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    reasoning?: ReasoningStep[];
};

const FloatingChat = () => {
    const { setIsFloatingChat, fetchEvents, chatPosition, setChatPosition, sidebarWidth, setSidebarWidth } = useCalendar();
    const [isExiting, setIsExiting] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sendNotifications, setSendNotifications] = useState(true);
    const { theme, session } = useAuth();
    const { model, setModel } = useChat();
    const isDark = theme === 'dark';
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Resizable sidebar logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) {
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [setSidebarWidth]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => { setIsFloatingChat(false); }, 150);
    };

    const MODEL_OPTIONS = [
        { label: "Deepseek V4 Flash", value: "deepseek/deepseek-v4-flash", description: "" },
        { label: "Xiaomi Mimo V2 Flash", value: "xiaomi/mimo-v2-flash", description: "" },
        { label: "Qwen3.6 Flash", value: "qwen/qwen3.6-flash", description: "" },
        { label: "Gpt-5-nano", value: "openai/gpt-5-nano", description: "" },
    ];

    const currentModelId = typeof model === 'object' && model !== null ? model.name_id : model;

    const handleModelChange = (newVal: string) => {
        const option = MODEL_OPTIONS.find(o => o.value === newVal);
        if (option) {
            setModel({
                name: option.label,
                name_id: option.value,
                provider: option.label.includes("Gemini") ? "Google" : option.label.includes("Mistral") ? "Mistral AI" : (option.label.includes("Deepseek") ? "Deepseek" : "OpenAI")
            });
        }
    };

    async function handleSend(overrideValue?: string) {
        const textToSend = overrideValue || inputValue;
        if (!textToSend.trim() || isLoading) return;

        const userMsg = textToSend.trim();
        const historyForServer = messages.map(m => ({ role: m.role, content: m.content }));

        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
        setMessages([...newMessages, { role: 'assistant', content: "" }]); // Placeholder for assistant
        if (!overrideValue) setInputValue("");
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/calendar/action`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    text: userMsg,
                    modelName: currentModelId,
                    messages: historyForServer,
                    googleToken: session?.provider_token,
                    temperature: 0.5,
                    sendNotifications,
                    stream: true,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });

            if (!response.ok) throw new Error("Errore durante la chiamata al calendario");

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            let accumulatedReasoning: ReasoningStep[] = [];
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // Keep the last partial line in buffer

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.type === "text") {
                            accumulatedText += data.content;
                        } else if (data.type === "reasoning") {
                            accumulatedReasoning.push({ type: data.reasoningType || 'info', content: data.content });
                        }

                        setMessages(prev => {
                            const next = [...prev];
                            const last = next[next.length - 1];
                            if (last && last.role === 'assistant') {
                                last.content = accumulatedText;
                                last.reasoning = [...accumulatedReasoning];
                            }
                            return next;
                        });
                    } catch (e) {
                        console.error("Failed to parse JSON line:", line, e);
                    }
                }
            }

            try { await fetchEvents(); } catch (e) { console.warn('fetchEvents failed', e); }

        } catch (error) {
            console.error("Errore invio chat calendario:", error);
            setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === 'assistant') {
                    last.content = "Spiacente, si è verificato un errore durante la comunicazione con l'assistente.";
                }
                return next;
            });
        } finally {
            setIsLoading(false);
        }
    }

    const styles = useMemo(() => ({
        container: `flex flex-col p-5 z-50 border transition-all font-['Manrope'] overflow-hidden
            ${isDark 
                ? 'bg-[#0a0a0c] border-white/10 text-[#f4f1ea] shadow-2xl backdrop-blur-xl' 
                : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'}`,
        header: `flex justify-between items-center mb-5 shrink-0 relative z-10`,
        headerTitle: `flex items-center gap-2 text-xs font-bold tracking-tight ${isDark ? 'text-white/90' : 'text-neutral-800'}`,
        messagesArea: `flex-1 overflow-y-auto mb-4 space-y-4 custom-scrollbar pr-1 px-1 relative z-10`,
        inputWrapper: `relative rounded-2xl p-2.5 flex flex-col gap-1 transition-all shrink-0 border relative z-10
            ${isDark 
                ? 'bg-white/5 border-white/10 shadow-sm' 
                : 'bg-neutral-50 border-neutral-200 shadow-sm'}`,
        textarea: `w-full bg-transparent resize-none outline-none text-[17px] h-10 placeholder-white/20 
            ${isDark ? 'text-white' : 'text-neutral-900 placeholder-neutral-400'}`,
        sendBtn: `p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center
            ${isDark ? 'bg-[#f97316] text-black hover:bg-[#fb923c]' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`,
        assistantBubble: `max-w-full text-[17px] leading-relaxed relative
            ${isDark ? 'text-[#f4f1ea]/80' : 'text-neutral-800'}`,
        userBubble: `max-w-[90%] p-3.5 rounded-2xl text-[17px] font-medium
            ${isDark ? 'bg-[#f97316] text-black prose-invert' : 'bg-[#f0ebe4] text-[#2c2825]'}`
    }), [isDark]);

    return (
        <>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .floating-chat-markdown .renderChat { font-size: 17px; line-height: 1.6; }
                .floating-chat-markdown .renderChat p { margin-bottom: 0.5rem; }
                .floating-chat-markdown .renderChat p:last-child { margin-bottom: 0; }
            `}</style>

            <motion.div
                initial={chatPosition === 'sidebar-right' ? { opacity: 0, x: 200 } : { opacity: 0, y: 20 }}
                animate={isExiting ? (chatPosition === 'sidebar-right' ? { opacity: 0, x: 200 } : { opacity: 0, y: 20 }) : (chatPosition === 'sidebar-right' ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 })}
                transition={{ duration: 0.18, ease: "linear" }}
                style={
                    chatPosition === 'sidebar-right'
                        ? { '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties
                        : {}
                }
                className={`${styles.container} ${
                    chatPosition === 'sidebar-right' 
                        ? 'fixed top-0 right-0 h-full w-full md:w-[var(--sidebar-width)] rounded-none md:rounded-l-2xl' 
                        : 'fixed bottom-4 right-4 md:bottom-6 md:right-6 rounded-[1.5rem] w-[calc(100vw-2rem)] md:w-[380px] h-[calc(100vh-6rem)] md:h-[520px] max-h-[520px]'
                }`}
            >
                {/* Resize handle */}
                {chatPosition === 'sidebar-right' && (
                    <div 
                        onMouseDown={() => {
                            isResizing.current = true;
                            document.body.style.cursor = 'ew-resize';
                        }}
                        className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-orange-500/20 transition-colors z-50"
                    />
                )}

                {/* Header */}
                <div className={styles.header}>
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-orange-500/10 text-[#f97316]' : 'bg-neutral-100 text-neutral-600'}`}>
                            <Calendar size={18} weight="fill" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={styles.headerTitle}>Assistant</span>
                                <span className="px-1 py-0.5 rounded-md bg-white/5 text-white/30 text-[7px] font-bold uppercase">v2</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setChatPosition(chatPosition === 'floating' ? 'sidebar-right' : 'floating')}
                            title={chatPosition === 'floating' ? 'Apri come sidebar' : 'Mostra come floating'}
                            className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-white/20 hover:bg-white/5 hover:text-white' : 'text-neutral-400 hover:bg-neutral-100'}`}
                        >
                            {chatPosition === 'floating' ? <CaretDown size={16} /> : <Calendar size={16} />}
                        </button>
                        <button
                            onClick={() => setMessages([])}
                            title="Clear chat"
                            className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-white/20 hover:bg-white/5 hover:text-white' : 'text-neutral-400 hover:bg-neutral-100'}`}
                        >
                            <PencilSimple size={16} weight="bold" />
                        </button>
                        <button
                            onClick={handleClose}
                            className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-white/20 hover:bg-white/5 hover:text-white' : 'text-neutral-400 hover:bg-neutral-100'}`}
                        >
                            <Minus size={16} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className={styles.messagesArea}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl 
                                ${isDark ? 'bg-white/5 text-[#f97316]' : 'bg-neutral-50 text-neutral-400'}`}>
                                <MagicWand weight="duotone" />
                            </div>
                            <h2 className={`text-sm font-bold mb-1 ${isDark ? 'text-white/90' : 'text-neutral-900'}`}>Magic awaits.</h2>
                            <p className={`text-[11px] mb-6 opacity-40 ${isDark ? 'text-white' : 'text-neutral-500'}`}>Optimize your schedule with AI</p>
                            
                            <div className="grid grid-cols-1 gap-1.5 w-full">
                                <ActionItem icon={<Clock size={14} />} text="Upcoming events" isDark={isDark} onClick={() => setInputValue("Mostrami i prossimi eventi")} />
                                <ActionItem icon={<Sparkle size={14} />} text="Find free slot" isDark={isDark} onClick={() => setInputValue("Trova uno spazio libero per domani")} />
                                <ActionItem icon={<Notebook size={14} />} text="Improve routine" isDark={isDark} onClick={() => setInputValue("Come posso migliorare la mia routine?")} />
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((m, i) => (
                                <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {m.role === 'assistant' && m.reasoning && m.reasoning.length > 0 && (
                                        <>
                                            <FriendlyReasoning reasoning={m.reasoning} isDark={isDark} />
                                            <ReasoningBlock reasoning={m.reasoning} isDark={isDark} />
                                        </>
                                    )}
                                    <div className={`${m.role === 'user' ? styles.userBubble : styles.assistantBubble} floating-chat-markdown w-full`}>
                                        <GenerativeUIRenderer text={m.content} isStreaming={isLoading && i === messages.length - 1 && m.role === 'assistant'} isDark={isDark} />
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className={styles.inputWrapper}>
                    <textarea
                        placeholder="Schedule a meeting, find free time..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                        }}
                        disabled={isLoading}
                        className={styles.textarea}
                    />
                    <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-2">
                            <SelectPopup
                                options={MODEL_OPTIONS}
                                value={currentModelId}
                                onChange={handleModelChange}
                                placeholder={typeof model === 'object' && model !== null ? model.name : "Model"}
                            />
                            <button
                                onClick={() => setSendNotifications(!sendNotifications)}
                                title={sendNotifications ? "Notifiche attive" : "Notifiche disattivate"}
                                className={`p-2 rounded-xl transition-all border ${
                                    sendNotifications 
                                        ? (isDark ? 'bg-orange-500/10 border-orange-500/20 text-[#f97316]' : 'bg-[#f0ebe4] border-[#e2ddd5] text-[#2c2825]')
                                        : (isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-neutral-100 border-neutral-200 text-neutral-400')
                                }`}
                            >
                                {sendNotifications ? <Bell size={16} weight="fill" /> : <BellSlash size={16} weight="bold" />}
                            </button>
                        </div>
                        <button
                            className={`${styles.sendBtn} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => handleSend()}
                            disabled={isLoading}
                        >
                            <PaperPlaneTilt size={20} weight="fill" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

// --- Componente per mostrare i ragionamenti dell'agente in modo amichevole ---
const FriendlyReasoning = ({ reasoning, isDark }: { reasoning: ReasoningStep[]; isDark: boolean }) => {
    const getFriendlyMessage = (step: ReasoningStep) => {
        const content = step.content;
        if (step.type === 'tool_call') {
            if (content.includes('list_events')) return "Sto consultando il tuo calendario...";
            if (content.includes('create_event')) return "Aggiungo l'impegno ai tuoi eventi...";
            if (content.includes('delete_event')) return "Sto rimuovendo l'evento...";
        }
        if (step.type === 'tool_result') {
            if (content.includes('list_events')) return "Ho trovato le informazioni che cercavi.";
            if (content.includes('create_event')) return "Perfetto, evento creato con successo!";
            if (content.includes('delete_event')) return "Fatto, l'evento è stato rimosso.";
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-1.5 mb-1 px-1 w-full">
            {reasoning.map((step, idx) => {
                const msg = getFriendlyMessage(step);
                if (!msg) return null;

                const isAction = step.content.includes('create_event') || step.content.includes('delete_event');
                const isResult = step.type === 'tool_result';
                
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-2.5 text-[12px] leading-tight py-1 px-2 rounded-lg transition-colors
                            ${isResult && isAction 
                                ? (isDark ? 'text-orange-400 bg-orange-500/5 font-bold' : 'text-orange-600 bg-orange-50 font-bold') 
                                : (isDark ? 'text-white/50' : 'text-neutral-500')}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isResult ? (isAction ? 'bg-orange-500' : 'bg-emerald-500') : 'bg-blue-500 animate-pulse'}`} />
                        {msg}
                    </motion.div>
                );
            })}
        </div>
    );
};

// --- Componente per mostrare i ragionamenti dell'agente ---
const ReasoningBlock = ({ reasoning, isDark }: { reasoning: ReasoningStep[]; isDark: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toolCalls = reasoning.filter(s => s.type === 'tool_call').length;

    return (
        <div className={`w-full max-w-[90%] mb-1 rounded-2xl text-[11px] overflow-hidden border font-mono
            ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-neutral-200 bg-neutral-50'}`}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-all
                    ${isDark ? 'hover:bg-white/5 text-white/40' : 'hover:bg-neutral-100 text-neutral-500'}`}
            >
                <div className="flex items-center gap-2">
                    <CaretDown size={12} weight="bold" className={`transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`} />
                    <span className="font-bold uppercase tracking-wider text-[9px]">Execution Log</span>
                    {toolCalls > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isDark ? 'bg-orange-500/20 text-[#f97316]' : 'bg-neutral-200 text-neutral-600'}`}>
                            {toolCalls} CALLS
                        </span>
                    )}
                </div>
                <span className="text-[9px] opacity-30">{reasoning.length} STEPS</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                    >
                        <div className={`px-4 pb-3 space-y-2 border-t ${isDark ? 'border-white/5' : 'border-neutral-200'} pt-3`}>
                            {reasoning.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <StepIcon type={step.type} isDark={isDark} />
                                    <span className={`leading-relaxed break-all opacity-70 ${isDark ? 'text-white' : 'text-neutral-700'}`}>
                                        {step.content.length > 200 ? step.content.substring(0, 200) + '...' : step.content}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StepIcon = ({ type, isDark }: { type: string; isDark: boolean }) => {
    const base = `w-4 h-4 rounded-full flex items-center justify-center text-[8px] shrink-0 mt-0.5 font-bold`;

    switch (type) {
        case 'tool_call':
            return <span className={`${base} ${isDark ? 'bg-orange-500/20 text-[#f97316]' : 'bg-neutral-200 text-neutral-600'}`}>⚡</span>;
        case 'tool_result':
            return <span className={`${base} ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>✓</span>;
        case 'error':
            return <span className={`${base} ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>✕</span>;
        default:
            return <span className={`${base} ${isDark ? 'bg-white/10 text-white/40' : 'bg-neutral-200 text-neutral-400'}`}>●</span>;
    }
};

const ActionItem = ({ icon, text, isDark, onClick }: { icon: React.ReactNode, text: string, isDark: boolean, onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border
        ${isDark 
            ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white/70' 
            : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-600'}`}>
        <span className={isDark ? 'text-[#f97316]' : 'text-neutral-400'}>{icon}</span>
        <span className="font-semibold text-xs tracking-tight">{text}</span>
    </div>
);

export default FloatingChat;
