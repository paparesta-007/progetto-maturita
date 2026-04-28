import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendar } from "../../context/CalendarContext";
import { useAuth } from "../../context/AuthContext";
import SelectPopup from "../../components/other/SelectPopup";
import { useChat } from "../../context/ChatContext";

type ReasoningStep = { type: string; content: string };
type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    reasoning?: ReasoningStep[];
};

const FloatingChat = () => {
    const { setIsFloatingChat } = useCalendar();
    const [isExiting, setIsExiting] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { theme, session } = useAuth();
    const { model, setModel } = useChat();
    const isDark = theme === 'dark';
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => { setIsFloatingChat(false); }, 300);
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

    async function handleSend() {
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue.trim();
        // Prepara la history da mandare al server (solo user/assistant content, senza reasoning)
        const historyForServer = messages.map(m => ({ role: m.role, content: m.content }));

        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:3000/api/calendar/action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    text: userMsg,
                    modelName: currentModelId,
                    messages: historyForServer,
                    googleToken: session?.provider_token
                })
            });

            if (!response.ok) throw new Error("Errore durante la chiamata al calendario");

            const data = await response.json();

            if (data.success && data.message) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.message,
                    reasoning: data.reasoning || []
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.error || "Non sono riuscito a elaborare questa richiesta."
                }]);
            }
        } catch (error) {
            console.error("Errore invio chat calendario:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Spiacente, si è verificato un errore durante la comunicazione con l'assistente."
            }]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 10, y: 70, scale: 0.95 }}
            animate={isExiting ? { opacity: 0, x: 10, y: 70, scale: 0.95 } : { opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed bottom-6 right-6 w-[420px] h-[520px] flex flex-col p-5 rounded-2xl shadow-2xl z-50 border
                ${isDark ? 'bg-[#1e1e1e] border-[#333] text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-1 cursor-pointer text-sm font-medium hover:opacity-80">
                    Calendar Assistant
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
                <button
                    onClick={handleClose}
                    className={`hover:opacity-70 transition-opacity ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    title="Minimize"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-1">
                {messages.length === 0 ? (
                    <div className="py-4 text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl mx-auto ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>🪄</div>
                        <h2 className="text-xl font-bold mb-4">What magic shall we make happen?</h2>
                        <div className="flex flex-col gap-1 text-sm text-left">
                            <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} text="Tell me upcoming events" isDark={isDark} />
                            <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} text="Find a free slot on Saturday" isDark={isDark} />
                            <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} text="How can I improve my routine" isDark={isDark} />
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {/* Reasoning steps (solo per assistant e se presenti) */}
                                {m.role === 'assistant' && m.reasoning && m.reasoning.length > 0 && (
                                    <ReasoningBlock reasoning={m.reasoning} isDark={isDark} />
                                )}
                                {/* Messaggio principale */}
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                                    m.role === 'user'
                                    ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                    : (isDark ? 'bg-[#2a2a2a] text-gray-200' : 'bg-gray-100 text-gray-800')
                                }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm flex items-center gap-2 ${isDark ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                    <span className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                    <span className="text-xs">Ragionando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className={`relative rounded-xl border-2 p-3 pb-2 transition-colors shrink-0
                ${isDark ? 'border-blue-500/60 bg-[#222]' : 'border-blue-400 bg-gray-50'}`}>
                <textarea
                    placeholder="Do anything with AI..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    disabled={isLoading}
                    className={`w-full bg-transparent resize-none outline-none text-sm h-12 mb-2 placeholder-gray-500 ${isLoading ? 'opacity-50' : ''}`}
                />
                <div className="flex justify-between items-center text-gray-500">
                    <div className="flex gap-3">
                        <button className="hover:text-gray-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <SelectPopup
                            options={MODEL_OPTIONS}
                            value={currentModelId}
                            onChange={handleModelChange}
                            placeholder={typeof model === 'object' && model !== null ? model.name : "Model"}
                        />
                        <button
                            className={`p-1.5 rounded-full transition-colors
                                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                ${isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            onClick={() => handleSend()}
                            disabled={isLoading}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- Componente per mostrare i ragionamenti dell'agente ---
const ReasoningBlock = ({ reasoning, isDark }: { reasoning: ReasoningStep[]; isDark: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Conta i tool calls per il badge
    const toolCalls = reasoning.filter(s => s.type === 'tool_call').length;
    const toolResults = reasoning.filter(s => s.type === 'tool_result').length;

    return (
        <div className={`w-full max-w-[90%] mb-1 rounded-xl text-xs overflow-hidden border
            ${isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors
                    ${isDark ? 'hover:bg-[#252525] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
                <div className="flex items-center gap-2">
                    <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    <span className="font-medium">Ragionamento</span>
                    {toolCalls > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                            {toolCalls} tool{toolCalls > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <span className="text-[10px] opacity-60">{reasoning.length} step</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className={`px-3 pb-2 space-y-1.5 border-t ${isDark ? 'border-[#333]' : 'border-gray-200'}`}>
                            {reasoning.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2 pt-1.5">
                                    <StepIcon type={step.type} isDark={isDark} />
                                    <span className={`leading-tight break-all ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {step.content.length > 150 ? step.content.substring(0, 150) + '...' : step.content}
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

// --- Icona per tipo di step ---
const StepIcon = ({ type, isDark }: { type: string; isDark: boolean }) => {
    const base = `w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-0.5`;

    switch (type) {
        case 'tool_call':
            return <span className={`${base} ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-600'}`}>⚡</span>;
        case 'tool_result':
            return <span className={`${base} ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-600'}`}>✓</span>;
        case 'text':
            return <span className={`${base} ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>💬</span>;
        case 'error':
            return <span className={`${base} ${isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-600'}`}>✕</span>;
        default:
            return <span className={`${base} ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>·</span>;
    }
};

// --- Action Item per empty state ---
const ActionItem = ({ icon, text, isDark }: { icon: React.ReactNode, text: string, isDark: boolean }) => (
    <div className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
        ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}>
        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{icon}</span>
        <span className="font-medium text-[14px]">{text}</span>
    </div>
);

export default FloatingChat;