import React, { useEffect, useState } from "react";
import Tooltip from "./Tooltip";
import { useAuth } from "../../context/AuthContext";
import { SpeakerHighIcon, CopyIcon, CheckIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Sparkles, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";

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
        .bot-message-premium .renderChat code {
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

const BotMessage = ({ i, children, usage, model }: { i: number; children: React.ReactNode; usage?: any; model?: any }) => {
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
            ? "bg-white/[0.06] text-neutral-600 ring-1 ring-white/[0.04]"
            : "bg-neutral-100 text-neutral-500 ring-1 ring-black/[0.03]"
            }`,
        avatarGlow: `absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"
            }`,

        // Message Bubble
        bubble: `relative rounded-2xl rounded-tl-lg p-5 flex-1 renderChat transition-all duration-300 max-w-full md:max-w-[85%] lg:max-w-[90%] ${isDark
            ? "text-neutral-200 bg-white/[0.03] ring-1 ring-white/[0.04]"
            : "text-neutral-700 bg-white ring-1 ring-black/[0.04] shadow-sm shadow-black/[0.02]"
            } 
            ${fontFamily === "domine" ? "f-domine" : fontFamily === "comic-neue" ? "f-comic" : fontFamily === "overlock" ? "f-overlock" : fontFamily==="poppins" ? "f-poppins" : ""}`, // FIX: Usa la variabile calcolata in modo sicuro

        // Action Bar
        actionBar: `flex items-center gap-1 mt-2 transition-all duration-300`,
        actionBtn: `action-btn-premium p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isDark
            ? "text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.06]"
            : "text-neutral-500 hover:text-neutral-600 hover:bg-black/[0.04]"
            }`,
        actionBtnActive: `action-btn-premium p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isDark
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
                            {children}
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
                                                <span className={`${s.tooltipValue} text-right`}>{usage?.inputTokens || 0}</span>

                                                <span className={`text-[11px] ${isDark ? "text-neutral-500" : "text-neutral-600"}`}>Output</span>
                                                <span className={`${s.tooltipValue} text-right`}>{usage?.outputTokens || 0}</span>

                                                {(usage?.reasoningTokens || 0) > 0 && (
                                                    <>
                                                        <span className={`text-[11px] ${isDark ? "text-neutral-500" : "text-neutral-600"}`}>Reasoning</span>
                                                        <span className={`${s.tooltipValue} text-right`}>{usage?.reasoningTokens}</span>
                                                    </>
                                                )}

                                                <div className={`col-span-2 ${s.tooltipDivider}`} />

                                                <span className={`text-[11px] font-semibold ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>Totale</span>
                                                <span className={`${s.tooltipValue} text-right font-bold ${isDark ? "text-neutral-500" : "text-neutral-900"}`}>{usage?.totalTokens || 0}</span>
                                                <span className={`text-[11px] font-semibold ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>Costo</span>
                                                <span className={`${s.tooltipValue} text-right  ${isDark ? "text-white" : "text-neutral-900"}`}>${usage?.raw?.cost?.toFixed(4) || "0.0000"}</span>
                                            </div>

                                        </div>
                                    }
                                >
                                    <span className={s.modelBadge}>
                                        <BrainCircuit size={10} />
                                        {usage?.totalTokens || 0} tokens
                                    </span>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default BotMessage;