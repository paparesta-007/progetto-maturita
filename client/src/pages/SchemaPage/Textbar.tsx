import React, { useState, useRef, useCallback } from "react";
import { LightningIcon, PaperPlaneTilt, StopIcon, Sparkle } from "@phosphor-icons/react";
import { BrainIcon, GaugeIcon } from "lucide-react";
import { useSchema } from "../../context/SchemaContext";
import { useAuth } from "../../context/AuthContext";
import SelectPopup, { type SelectOption } from "../../components/other/SelectPopup";

const SchemaTextbar = () => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    const { sendMessage, loading } = useSchema();

    const [inputValue, setInputValue] = useState("");
    const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const MODELS: SelectOption<string>[] = [
        { label: "DeepSeek v4 Flash", value: "deepseek/deepseek-v4-flash", icon: <LightningIcon size={16} />, description: "Ultra veloce" },
        { label: "GPT-5 Nano", value: "openai/gpt-5-nano", icon: <BrainIcon size={16} />, description: "Intelligenza pura" },
        { label: "Gemini 3.1 Flash Lite", value: "google/gemini-3.1-flash-lite", icon: <GaugeIcon size={16} />, description: "Versatile" },
        { label: "GPT OSS 120B", value: "openai/gpt-oss-120b", icon: <Sparkle size={16} />, description: "Potente & Libero" },
    ];

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim() || loading) return;
        const text = inputValue;
        setInputValue("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        await sendMessage(text, selectedModel);
    }, [inputValue, loading, sendMessage, selectedModel]);

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

    const containerStyle = `w-full rounded-[1.5rem] p-3 flex flex-col gap-2 transition-all duration-300 border relative ${
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
            {/* Toolbar Top */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <SelectPopup options={MODELS} value={selectedModel} onChange={setSelectedModel} />
            </div>

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
        </div>
    );
};

export default React.memo(SchemaTextbar);
