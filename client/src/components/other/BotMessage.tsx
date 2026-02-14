import React from "react";
import Tooltip from "./Tooltip";
import { useAuth } from "../../context/AuthContext"; // Assicurati che il percorso sia corretto

const BotMessage = ({ i, children, usage, model }: { i: number; children: React.ReactNode; usage?: any; model?: any }) => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    // Definiamo gli stili condizionali
    const styles = {
        avatar: `rounded-full border flex items-center justify-center w-8 h-8 overflow-hidden transition-colors ${
            isDark 
                ? "border-neutral-700 text-neutral-400 bg-neutral-900" 
                : "border-neutral-300 text-neutral-500 bg-white"
        }`,
        messageBubble: `shadow-sm rounded-lg p-4 flex-1 renderChat transition-all duration-300 ${
            isDark 
                ? "text-neutral-200" //text-neutral-200 bg-neutral-900 border border-neutral-800 
                : "text-[#404040] bg-[#fafafa] border border-transparent"
        }`,
        tokensLabel: `text-xs mt-1 transition-colors ${
            isDark ? "text-neutral-500 hover:text-neutral-400" : "text-neutral-400 hover:text-neutral-600"
        }`,
        tooltipContent: `text-left ${isDark ? "text-neutral-300" : "text-neutral-700"}`
    };

    return (
        <div key={i} className="p-4 flex flex-row gap-3 items-start justify-start my-4">
            {/* Avatar AI */}
            <div className="flex-shrink-0">
                <div className={styles.avatar}>
                    AI
                </div>
            </div>

            <div className="flex-1 min-w-0"> {/* min-w-0 evita che il markdown rompa il layout */}
                {/* Bolla del Messaggio */}
                <div className={styles.messageBubble}>
                    {children}
                </div>

                {/* Info sui Token / Modello */}
                <div className={styles.tokensLabel}>
                    <Tooltip content={
                        <div className={styles.tooltipContent}>
                            <span className={`${isDark ? "text-neutral-400" : "text-neutral-500"} font-normal`}>
                                Model: {model || "Unknown"}
                            </span>
                            <b className={`block mt-1 ${isDark ? "text-white" : "text-neutral-900"}`}>
                                Tokens used:
                            </b>
                            <div className="space-y-0.5 mt-1 font-normal opacity-80">
                                <span>Total: {usage?.totalTokens || 0}</span><br />
                                <span>Input: {usage?.inputTokens || 0}</span><br />
                                <span>Output: {usage?.outputTokens || 0}</span><br />
                                {usage?.reasoningTokens > 0 && (
                                    <span>Reasoning: {usage.reasoningTokens}</span>
                                )}
                            </div>
                        </div>
                    }>
                        <span className="cursor-help uppercase text-[10px] tracking-wider font-medium">
                            {usage ? `${usage.totalTokens} tokens` : "AI Response"}
                        </span>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default BotMessage;