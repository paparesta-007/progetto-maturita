import React from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

interface MessageUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost?: number;
    completion_tokens_details?: {
        reasoning_tokens?: number;
    };
}

interface UsageLog {
    model: string;
    usage: MessageUsage;
}

interface UsageConversationProps {
    onClose?: () => void;
}

const UsageConversation: React.FC<UsageConversationProps> = ({ onClose }) => {
    const { messageHistory } = useChat();
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    const stats = messageHistory.reduce(
        (acc, msg) => {
            if (msg.role === "bot" && msg.usage) {
                const promptTokens = msg.usage.prompt_tokens || 0;
                const completionTokens = msg.usage.completion_tokens || 0;
                const reasoningTokens = msg.usage.completion_tokens_details?.reasoning_tokens || 0;
                const totalTokens = msg.usage.total_tokens || promptTokens + completionTokens;
                const cost = msg.usage.cost || 0;

                acc.promptTokens += promptTokens;
                acc.completionTokens += completionTokens;
                acc.reasoningTokens += reasoningTokens;
                acc.totalTokens += totalTokens;
                acc.totalPrice += cost;

                acc.logs.push({
                    model: msg.model || "Unknown",
                    usage: { 
                        prompt_tokens: promptTokens, 
                        completion_tokens: completionTokens, 
                        total_tokens: totalTokens,
                        cost: cost,
                        completion_tokens_details: { reasoning_tokens: reasoningTokens }
                    }
                });
            }
            return acc;
        },
        {
            promptTokens: 0,
            completionTokens: 0,
            reasoningTokens: 0,
            totalTokens: 0,
            totalPrice: 0,
            logs: [] as UsageLog[],
        }
    );

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose?.();
        }
    };

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center z-[100] transition-colors duration-300 ${isDark ? 'bg-black/60 backdrop-blur-md' : 'bg-black/10 backdrop-blur-[2px]'}`}
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white dark:bg-[#0d0d12] p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-neutral-200 dark:border-white/10 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative gradients for dark theme match */}
                <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-orange-500/10 dark:bg-orange-500/10 blur-[60px] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-orange-600/5 dark:bg-orange-600/5 blur-[60px] pointer-events-none" />

                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                        Statistiche Conversazione
                    </h2>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl transition-all  text-neutral-500 dark:text-neutral-400"
                            aria-label="Chiudi statistiche"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="space-y-6 relative z-10">
                    {/* Totals Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-neutral-50 dark:bg-white/[0.03] rounded-2xl border border-neutral-200 dark:border-white/5">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-bold mb-1">Input</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats.promptTokens}</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-white/[0.03] rounded-2xl border border-neutral-200 dark:border-white/5">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-bold mb-1">Reasoning</p>
                            <p className="text-xl font-bold text-orange-500">{stats.reasoningTokens}</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-white/[0.03] rounded-2xl border border-neutral-200 dark:border-white/5">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-bold mb-1">Output</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats.completionTokens}</p>
                        </div>
                        <div className="p-4 bg-orange-500/10 dark:bg-orange-500/20 rounded-2xl border border-orange-500/20">
                            <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase tracking-wider font-bold mb-1">Costo</p>
                            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">${stats.totalPrice.toFixed(4)}</p>
                        </div>
                    </div>

                    {/* Usage Table */}
                    <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-neutral-200 dark:border-white/5 overflow-hidden">
                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/5 sticky top-0 bg-neutral-50 dark:bg-[#16161d] z-20">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">Modello</th>
                                        <th className="px-4 py-3 font-bold text-right">Input</th>
                                        <th className="px-4 py-3 font-bold text-right text-orange-500/80">Reason</th>
                                        <th className="px-4 py-3 font-bold text-right">Output</th>
                                        <th className="px-4 py-3 font-bold text-right">Costo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                                    {stats.logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-neutral-500 italic">
                                                Nessun dato di utilizzo disponibile
                                            </td>
                                        </tr>
                                    ) : (
                                        stats.logs.map((log, i) => (
                                            <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-white/[0.04] transition-colors">
                                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-200 truncate max-w-[150px]">
                                                    {log.model}
                                                </td>
                                                <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                                                    {log.usage.prompt_tokens}
                                                </td>
                                                <td className="px-4 py-3 text-right text-orange-500/70 font-mono">
                                                    {log.usage.completion_tokens_details?.reasoning_tokens || 0}
                                                </td>
                                                <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                                                    {log.usage.completion_tokens}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-orange-600/80 dark:text-orange-400/80">
                                                    ${(log.usage.cost || 0).toFixed(6)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-white/5 flex justify-between items-center text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-bold">
                    <span>Totale Tokens: {stats.totalTokens}</span>
                    <span className="text-orange-500/60 dark:text-orange-400/40">OpenRouter Billing System</span>
                </div>
            </div>
        </div>
    );
};

export default UsageConversation;