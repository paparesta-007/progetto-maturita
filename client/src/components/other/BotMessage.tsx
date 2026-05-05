import React, { useEffect, useRef, useState } from "react";
import Tooltip from "./Tooltip";
import { useAuth } from "../../context/AuthContext";
import { SpeakerHighIcon, CopyIcon, CheckIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Sparkles, ThumbsUp, ThumbsDown, RotateCcw, ChevronDown, ChevronRight, Activity } from "lucide-react";

/* ─── Premium Bot Logs Component ─── */
const BotLogsTimeline = ({ logs, isDark, isComplete }: { logs: string[], isDark: boolean, isComplete?: boolean }) => {
    const [isOpen, setIsOpen] = useState(!isComplete);

    // Riapri automaticamente se ci sono nuovi log e non è completo
    useEffect(() => {
        if (!isComplete) setIsOpen(true);
    }, [logs.length, isComplete]);

    if (!logs || logs.length === 0) return null;

    const filteredLogs = logs.filter(l => l.trim() !== "");

    return (
        <div className={`mb-4 w-full rounded-xl overflow-hidden border transition-colors duration-300 ${isDark ? 'glass-soft border-white/5' : 'bg-white/50 border-black/5'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${isDark ? 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5' : 'text-neutral-500 hover:text-neutral-700 hover:bg-black/5'}`}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Activity size={14} className={!isComplete ? "animate-pulse text-blue-500" : ""} />
                <span>{isComplete ? "Processo completato" : "Elaborazione in corso..."}</span>
                <span className="ml-auto text-[10px] opacity-60">{filteredLogs.length} passaggi</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-inherit overflow-hidden"
                    >
                        <div className="p-4 pl-6 relative">
                            <div className={`absolute left-[19px] top-6 bottom-4 w-[2px] rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />

                            <div className="flex flex-col gap-4">
                                {filteredLogs.map((log, index) => {
                                    const emojiMatch = log.match(/^([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/);
                                    let icon = <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-neutral-600' : 'bg-neutral-400'}`} />;
                                    let cleanedLog = log.trim();

                                    if (emojiMatch) {
                                        icon = <span className="text-[12px]">{emojiMatch[0]}</span>;
                                        cleanedLog = log.slice(emojiMatch[0].length).trim();
                                    }

                                    // Highlight metrics
                                    const isMetric = cleanedLog.includes("[METRICHE]");
                                    const isError = cleanedLog.includes("ERRORE");
                                    const isSuccess = cleanedLog.includes("[Successo]");

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 }}
                                            className="relative flex items-start text-xs group"
                                        >
                                            <div className={`absolute -left-[20.5px] my-0.5 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ${isDark ? 'bg-[#1e1e1e] ring-[#1e1e1e]' : 'bg-neutral-50 ring-neutral-50'}`}>
                                                {icon}
                                            </div>
                                            <div className={`flex-1 pl-2 ${isError ? 'text-red-400 font-medium' :
                                                    isSuccess ? (isDark ? 'text-emerald-400' : 'text-emerald-600') :
                                                        isMetric ? (isDark ? 'text-neutral-300 font-mono text-[10px]' : 'text-neutral-600 font-mono text-[10px]') :
                                                            (isDark ? 'text-neutral-400' : 'text-neutral-500')
                                                }`}>
                                                {cleanedLog}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Reasoning Roadmap Component ─── */
const ReasoningTimeline = ({ reasoning, isDark, isStreaming }: { reasoning: string, isDark: boolean, isStreaming?: boolean }) => {
    const [isOpen, setIsOpen] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll verso il basso quando arriva nuovo reasoning
    useEffect(() => {
        if (isOpen && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [reasoning, isOpen]);

    if (!reasoning || reasoning.trim().length === 0) return null;

    return (
        <div className={`mb-4 w-full rounded-xl overflow-hidden border transition-colors duration-300 ${isDark
                ? 'glass-soft border-orange-500/10'
                : 'bg-purple-50/50 border-purple-200/40'
            }`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${isDark
                        ? 'text-purple-300/70 hover:text-purple-200 hover:bg-purple-500/5'
                        : 'text-purple-600/70 hover:text-purple-700 hover:bg-purple-500/5'
                    }`}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <BrainCircuit size={14} className={`${isStreaming ? 'animate-pulse' : ''} ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                <span>{isStreaming ? "Ragionamento in corso..." : "Ragionamento del modello"}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-inherit overflow-hidden"
                    >
                        <div
                            ref={contentRef}
                            className={`p-4 max-h-[300px] overflow-y-auto custom-scrollbar text-xs leading-relaxed whitespace-pre-wrap ${isDark ? 'text-purple-200/50' : 'text-purple-700/50'
                                }`}
                        >
                            {reasoning}
                            {isStreaming && (
                                <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-purple-400/60 animate-pulse rounded-sm" />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Premium Bot Message Styles ─── */
const BotMessageStyles = () => (
    <style>{`
        @keyframes typing-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
        }
        .bot-message-premium .renderChat {
            line-height: 1.7;
            letter-spacing: -0.01em;
        }
        .bot-message-premium .renderChat p {
            margin-bottom: 0.75em;
        }
        .bot-message-premium .renderChat p:last-child {
            margin-bottom: 0;
        }
        .bot-message-premium .renderChat :not(pre) > code {
            font-size: 0.85em;
            padding: 0.15em 0.4em;
            border-radius: 6px;
            font-weight: 500;
        }
        .bot-message-premium .renderChat pre {
            border-radius: 12px;
            margin: 1em 0;
            overflow: hidden;
        }
        .bot-message-premium .renderChat .code-block-wrapper pre {
            border-radius: 0;
            margin: 0;
        }
        .bot-message-premium .renderChat ul,
        .bot-message-premium .renderChat ol {
            padding-left: 1.25em;
            margin: 0.5em 0;
        }
        .bot-message-premium .renderChat li {
            margin-bottom: 0.35em;
        }
        .bot-message-premium .renderChat strong {
            font-weight: 650;
        }
        .bot-message-premium .renderChat blockquote {
            border-left: 3px solid;
            padding-left: 1em;
            margin: 1em 0;
            font-style: italic;
            opacity: 0.85;
        }
        .action-btn-premium {
            position: relative;
            overflow: hidden;
        }
        .action-btn-premium::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            opacity: 0;
            transition: opacity 0.2s ease;
            background: radial-gradient(circle at center, currentColor 0%, transparent 70%);
        }
        .action-btn-premium:active::after {
            opacity: 0.06;
        }
     
    `}</style>
);

const BotMessage = React.memo(({
    i,
    children,
    usage,
    model,
    suggestedQuestions,
    logs,
    isComplete,
    reasoning,
    sources,
    onSuggestedClick,
    onSourceClick
}: {
    i: number;
    children: React.ReactNode;
    usage?: any;
    model?: any;
    suggestedQuestions?: string[];
    logs?: string[];
    isComplete?: boolean;
    reasoning?: string | null;
    sources?: any[];
    onSuggestedClick?: (question: string) => void;
    onSourceClick?: (source: any) => void;
}) => {
    // Aggiungi un fallback sicuro per useAuth nel caso il contesto sia vuoto
    const auth = useAuth();
    const theme = auth?.theme || 'light';
    const stylePreferences = auth?.stylePreferences || {};

    const isDark = theme === 'dark';
    const [copied, setCopied] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

    // FIX: Logica sicura per recuperare il font
    // Controlliamo se style è un array (come nel tuo JSON) o un oggetto
    const userStyle = Array.isArray(stylePreferences?.style)
        ? stylePreferences.style[0]
        : stylePreferences?.style;

    const fontFamily = userStyle?.fontFamily;

    const handleCopy = async () => {
        try {
            const messageEl = document.getElementById(`bot-msg-${i}`);
            const text = messageEl?.innerText || "";
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback silently
        }
    };

    useEffect(() => {
        // console.log("BotMessage rendered with usage:", usage);
    }, [usage]);

    // ─── Premium Style Tokens ───
    const s = {
        wrapper: `bot-message-premium relative group`,

        // Avatar
        avatar: `relative flex-shrink-0`,
        avatarInner: `w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isDark
            ? "bg-gradient-to-br from-orange-500/20 to-orange-300/10 text-orange-400 ring-1 ring-orange-500/20"
            : "bg-neutral-100 text-neutral-500 ring-1 ring-black/[0.03]"
            }`,
        avatarGlow: `absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDark ? "bg-orange-500/20" : "bg-black/[0.02]"
            }`,

        // Message Bubble
        bubble: `relative rounded-2xl rounded-tl-sm p-5 flex-1 renderChat transition-all duration-300 max-w-full md:max-w-[85%] lg:max-w-[90%] ${isDark
            ? "text-white/90 glass ring-1 ring-white/10"
            : "text-neutral-700"
            } 
            ${fontFamily === "domine" ? "f-domine" : fontFamily === "comic-neue" ? "f-comic" : fontFamily === "overlock" ? "f-overlock" : fontFamily === "poppins" ? "f-poppins" : ""}`,

        // Action Bar
        actionBar: `flex items-center gap-1 mt-2 transition-all duration-300`,
        actionBtn: `action-btn-premium p-1.5 rounded-lg transition-all  cursor-pointer ${isDark
            ? "text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.06]"
            : "text-neutral-500 hover:text-neutral-600 hover:bg-black/[0.04]"
            }`,
        actionBtnActive: `action-btn-premium p-1.5 rounded-lg transition-all  cursor-pointer ${isDark
            ? "text-emerald-400 bg-emerald-500/10"
            : "text-emerald-600 bg-emerald-50"
            }`,

        // Divider dot
        dot: `w-0.5 h-0.5 rounded-full mx-1 ${isDark ? "bg-neutral-700" : "bg-neutral-200"}`,

        // Model badge
        modelBadge: `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-default ${isDark
            ? "text-neutral-600 hover:text-neutral-600"
            : "text-neutral-300 hover:text-neutral-500"
            }`,

        // Token info tooltip
        tooltipContent: `text-left`,
        tooltipLabel: `text-[10px] uppercase tracking-wider font-bold ${isDark ? "text-neutral-500" : "text-neutral-600"}`,
        tooltipValue: `text-xs font-mono ${isDark ? "text-neutral-300" : "text-neutral-600"}`,
        tooltipDivider: `h-px my-2 ${isDark ? "bg-white/[0.06]" : "bg-neutral-100"}`,

        // Feedback
        feedbackUp: feedbackGiven === 'up'
            ? (isDark ? "!text-emerald-400 !bg-emerald-500/10" : "!text-emerald-600 !bg-emerald-50")
            : "",
        feedbackDown: feedbackGiven === 'down'
            ? (isDark ? "!text-red-400 !bg-red-500/10" : "!text-red-500 !bg-red-50")
            : "",
    };

    return (
        <>
            <BotMessageStyles />
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                className={s.wrapper}
            >
                <div className="px-4 py-3 flex flex-row gap-3.5 items-start justify-start">

                    {/* ─── AI Avatar ─── */}
                    <div className={s.avatar}>
                        <div className={s.avatarGlow} />
                        <div className={s.avatarInner}>
                            <Sparkles size={15} strokeWidth={2} />
                        </div>
                    </div>

                    {/* ─── Content Column ─── */}
                    <div className="flex-1 min-w-0">

                        {/* ─── Message Bubble ─── */}
                        <div id={`bot-msg-${i}`} className={s.bubble}>
                            {reasoning && (
                                <ReasoningTimeline reasoning={reasoning} isDark={isDark} isStreaming={!isComplete} />
                            )}
                            {logs && logs.length > 0 && (
                                <BotLogsTimeline logs={logs} isDark={isDark} isComplete={isComplete} />
                            )}

                            {children}

                            {/* ─── Sources ─── */}
                            {sources && sources.length > 0 && (() => {
                                // Raggruppa e ordina le fonti
                                const processedSources = sources.reduce((acc: any[], current) => {
                                    const page = current.page;
                                    const existing = acc.find(s => s.page === page);
                                    if (existing) {
                                        // Evita duplicati di contenuto identico
                                        if (!existing.contents.includes(current.content)) {
                                            existing.contents.push(current.content);
                                        }
                                    } else {
                                        acc.push({ ...current, contents: [current.content] });
                                    }
                                    return acc;
                                }, []).sort((a, b) => (a.page || 0) - (b.page || 0));

                                return (
                                    <div className={`mt-4 pt-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            Fonti del documento ({processedSources.length})
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {processedSources.map((source, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => onSourceClick?.({ ...source, content: source.contents.join("\n\n---\n\n") })}
                                                    className={`text-left p-2 rounded-lg border transition-all  group/source ${isDark
                                                            ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                            : 'bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-[11px] font-medium truncate ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                            {source.source}
                                                        </span>
                                                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                                                            }`}>
                                                            Pag. {source.page}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 space-y-1">
                                                        {source.contents.map((content: string, cIdx: number) => (
                                                            <p key={cIdx} className={`text-[10px] line-clamp-1 opacity-60 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                                {cIdx > 0 && <span className="mr-1 opacity-30">•</span>}
                                                                {content}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ─── Action Bar ─── */}
                        <div className={s.actionBar}>
                            {/* Copy */}
                            <Tooltip content={copied ? "Copiato!" : "Copia messaggio"}>
                                <button
                                    className={copied ? s.actionBtnActive : s.actionBtn}
                                    onClick={handleCopy}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        {copied ? (
                                            <motion.div
                                                key="check"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <CheckIcon size={15} weight="bold" />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="copy"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <CopyIcon size={15} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </Tooltip>

                            {/* Read Aloud */}
                            <Tooltip content="Leggi ad alta voce">
                                <button className={s.actionBtn}>
                                    <SpeakerHighIcon size={15} />
                                </button>
                            </Tooltip>

                            {/* Regenerate */}
                            <Tooltip content="Rigenera risposta">
                                <button className={s.actionBtn}>
                                    <RotateCcw size={14} strokeWidth={2} />
                                </button>
                            </Tooltip>

                            {/* Divider */}
                            <div className={`w-px h-3.5 mx-1 ${isDark ? "bg-white/[0.06]" : "bg-black/[0.06]"}`} />

                            {/* Feedback: Thumbs Up */}
                            <Tooltip content="Utile">
                                <button
                                    className={`${s.actionBtn} ${s.feedbackUp}`}
                                    onClick={() => setFeedbackGiven(feedbackGiven === 'up' ? null : 'up')}
                                >
                                    <ThumbsUp size={14} strokeWidth={2} />
                                </button>
                            </Tooltip>

                            {/* Feedback: Thumbs Down */}
                            <Tooltip content="Non utile">
                                <button
                                    className={`${s.actionBtn} ${s.feedbackDown}`}
                                    onClick={() => setFeedbackGiven(feedbackGiven === 'down' ? null : 'down')}
                                >
                                    <ThumbsDown size={14} strokeWidth={2} />
                                </button>
                            </Tooltip>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Model & Token Badge */}
                            {usage && (
                                <Tooltip
                                    content={
                                        <div className={s.tooltipContent}>
                                            <p className={s.tooltipLabel}>Modello</p>
                                            <p className={`${s.tooltipValue} mt-0.5`}>{model || "Unknown"}</p>

                                            <div className={s.tooltipDivider} />

                                            <p className={s.tooltipLabel}>Utilizzo Token</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5">
                                                <span className={`text-[11px] ${isDark ? "text-neutral-500" : "text-neutral-600"}`}>Input</span>
                                                <span className={`${s.tooltipValue} text-right`}>{usage?.prompt_tokens || usage?.inputTokens || 0}</span>

                                                <span className={`text-[11px] ${isDark ? "text-neutral-500" : "text-neutral-600"}`}>Output</span>
                                                <span className={`${s.tooltipValue} text-right`}>{usage?.completion_tokens || usage?.outputTokens || 0}</span>

                                                {(usage?.completion_tokens_details?.reasoning_tokens || usage?.reasoningTokens || 0) > 0 && (
                                                    <>
                                                        <span className={`text-[11px] ${isDark ? "text-neutral-500" : "text-neutral-600"}`}>Reasoning</span>
                                                        <span className={`${s.tooltipValue} text-right`}>{usage?.completion_tokens_details?.reasoning_tokens || usage?.reasoningTokens}</span>
                                                    </>
                                                )}

                                                <div className={`col-span-2 ${s.tooltipDivider}`} />

                                                <span className={`text-[11px] font-semibold ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>Totale</span>
                                                <span className={`${s.tooltipValue} text-right font-bold ${isDark ? "text-neutral-500" : "text-neutral-900"}`}>{usage?.total_tokens || usage?.totalTokens || 0}</span>
                                                <span className={`text-[11px] font-semibold ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>Costo</span>
                                                <span className={`${s.tooltipValue} text-right  ${isDark ? "text-white" : "text-neutral-900"}`}>${usage?.cost?.toFixed(4) || usage?.raw?.cost?.toFixed(4) || "0.0000"}</span>
                                            </div>

                                        </div>
                                    }
                                >
                                    <span className={s.modelBadge}>
                                        <BrainCircuit size={10} />
                                        {usage?.total_tokens || usage?.totalTokens || 0} tokens
                                    </span>
                                </Tooltip>
                            )}
                        </div>

                        {/* ─── Suggested Questions ─── */}
                        {suggestedQuestions && suggestedQuestions.length > 0 && onSuggestedClick && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="mt-3 flex flex-wrap gap-2"
                            >
                                {suggestedQuestions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onSuggestedClick(q)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-all  cursor-pointer text-left ${isDark
                                            ? "border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:border-white/[0.15] hover:bg-white/[0.04]"
                                            : "border-black/[0.06] text-neutral-500 hover:text-neutral-700 hover:border-black/[0.12] hover:bg-black/[0.02]"
                                            }`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
});

export default BotMessage;