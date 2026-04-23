import React, { useState, useRef, useCallback } from "react";
import { PaperPlaneTilt, StopIcon, LightningIcon, GaugeIcon, BrainIcon } from "@phosphor-icons/react";
import { useSchema } from "../../context/SchemaContext";
import { useAuth } from "../../context/AuthContext";
import SelectPopup, { type SelectOption } from "../../components/other/SelectPopup";

const REASONING_MODELS: SelectOption<string>[] = [
    { label: "Fast", value: "fast", icon: <LightningIcon size={16} />, description: "openai/gpt-oss-120b" },
    { label: "Balanced", value: "balanced", icon: <GaugeIcon size={16} />, description: "google/gemma-4-31b-it" },
    { label: "Pro", value: "pro", icon: <BrainIcon size={16} />, description: "xiaomi/mimo-v2.5" },
];

const SchemaTextbar = () => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    const { sendMessage, loading } = useSchema();

    const [inputValue, setInputValue] = useState("");
    const [reasoning, setReasoning] = useState<string>("fast");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim() || loading) return;
        const text = inputValue;
        setInputValue("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        await sendMessage(text, reasoning);
    }, [inputValue, loading, reasoning, sendMessage]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
        const el = e.currentTarget;
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
        const maxLines = 10;
        const maxHeight = lineHeight * maxLines;

        setInputValue(e.currentTarget.value);
        if (!e.currentTarget.value.trim()) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    }, []);

    const containerStyle = `w-full rounded-[1.5rem] p-3 flex flex-col gap-2 transition-all duration-300 border ${
        isDark ? "bg-[#18181b] border-white/20 shadow-2xl" : "bg-white border-neutral-300 shadow-md"
    }`;

    const inputStyle = `flex-1 p-2 focus:outline-none bg-transparent resize-none ${
        isDark ? "text-white placeholder-white/40" : "text-neutral-900 placeholder-neutral-400 bg-[#f7f6f2]"
    } w-full min-w-[200px] py-2 max-h-[15rem] overflow-y-auto`;

    const sendBtnStyle = `p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${
        isDark ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-neutral-900 text-white hover:bg-neutral-800"
    }`;

    return (
        <div className={containerStyle}>
            {/* INPUT E INVIO */}
            <div className="flex items-center gap-2">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Ask AI to update the schema..."
                    onChange={handleInput}
                    value={inputValue}
                    onKeyDown={handleKeyPress}
                    className={inputStyle}
                />

                <button
                    className={sendBtnStyle}
                    onClick={handleSendMessage}
                    disabled={loading}
                >
                    {loading ? <StopIcon size={20} weight="fill" /> : <PaperPlaneTilt size={20} weight="fill" />}
                </button>
            </div>

            {/* STRUMENTI INFERIORI */}
            <div className="flex items-center justify-end px-2 pb-1">
                <div className="flex items-center gap-4">
                    <SelectPopup 
                        options={REASONING_MODELS} 
                        value={reasoning} 
                        onChange={(value) => setReasoning(value)} 
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(SchemaTextbar);
