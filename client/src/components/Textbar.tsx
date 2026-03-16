import { Paperclip, PaperPlaneTilt, XIcon, GlobeIcon, StopIcon } from "@phosphor-icons/react";
import React, { useState, useEffect, useRef } from "react";
import Tooltip from "./other/Tooltip";
import { useChat } from "../context/ChatContext";
import { useDocument } from "../context/DocumentContext"; // Importa il DocumentContext
import { useAuth } from "../context/AuthContext";
import OptionsPopup from "./other/OptionsPopup";
import SelectPopup, { type SelectOption } from "./other/SelectPopup";
import { AnimatePresence, motion } from "framer-motion";


interface FileWithPreview {
    originalFile: File;
    name: string;
    previewUrl: string | null;
}

const FUNCTIONALITIES: SelectOption<string>[] = [
    { label: "Default", value: "default", description: "" },
    { label: "Canvas", value: "canvas", description: "live code preview" },
    { label: "Web search", value: "web_search", description: "Search across internet" },
    { label: "Crea immagini", value: "", description: "coming soon" },

];
const REASONING: SelectOption<string>[] = [
    { label: "Veloce", value: "fast", description: "" },
    { label: "Standard", value: "standard", description: "" },
    { label: "Accurato", value: "accurate", description: "" },
];

const Textbar = () => {
    const path = window.location.pathname;
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    // --- 1. RILEVAMENTO DEL PERCORSO ---
    // Controlla se siamo nella chat (adatta la stringa '/app/chat' al tuo routing esatto)
    const isChatPage = path.includes('/app/chat');

    // --- 2. RECUPERO DEI CONTESTI ---
    const chatCtx = useChat();
    const docCtx = useDocument();

    // --- 3. LOGICA DI SWITCHING ---
    let sendMessage = docCtx.sendMessage;
    let loading = docCtx.loading;
    let model = docCtx.model;

    switch (true) {
        case path.includes('/app/chat'):
            sendMessage = chatCtx.sendMessage;
            loading = chatCtx.loading;
            model = chatCtx.model;
            break;
        case path.includes('/app/document'):
            sendMessage = docCtx.sendMessage;
            loading = docCtx.loading;
            model = docCtx.model;
            break;
    }

    // --- STATI LOCALI ---
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isGroundingActive, setIsGroundingActive] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedTone, setSelectedTone] = useState("default");
    const [selectedLanguage, setSelectedLanguage] = useState("auto");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [functionality, setFunctionality] = useState<string>("default");
    const [reasoning, setReasoning] = useState<string>("fast");

    // Stili dinamici per la barra
    const styles = {
        container: `w-full max-w-2xl border rounded-2xl p-2 flex flex-col gap-2 transition-all duration-300 ${isDark
            ? "bg-neutral-900 border-neutral-800 shadow-[0_0_20px_0_rgba(0,0,0,0.4)]"
            : "bg-white/80 border-neutral-300/80 shadow-[0_2px_24px_0_rgba(0,0,0,0.10)]"
            }`,
        input: ` flex-1 p-3 focus:outline-none bg-transparent resize-none
                ${isDark
                ? "text-white placeholder-neutral-500 bg-neutral-900"
                : "text-neutral-900 placeholder-neutral-400 bg-[#f7f6f2]"}
                w-full min-w-[200px]
                py-2
                max-h-[15rem] overflow-y-auto`,
        sendBtn: `p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${isDark ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`,
        iconBtn: `transition-colors ${isDark ? "text-neutral-500 hover:text-neutral-200" : "text-neutral-600 hover:text-neutral-800"}`,
        fileItem: `relative group flex items-center gap-2 border rounded-lg p-1.5 pr-8 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
            }`
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim()) {
                // Chiama la funzione corretta in base al contesto
                handleSendMessage();
            }
        }
    };


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles) {
            const newFiles = Array.from(selectedFiles).map(file => ({
                originalFile: file,
                name: file.name,
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
            }));
            setFiles((prev) => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (indexToRemove: number) => {
        setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    };
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {

        const el = e.currentTarget;

        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const maxLines = 10;
        const maxHeight = lineHeight * maxLines;

        setInputValue(e.currentTarget.value);
        if (!e.currentTarget.value.trim()) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    };

    const resetTextarea = () => {
        setInputValue("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };
    const handleSendMessage = () => {
        sendMessage(inputValue, functionality, reasoning);
        resetTextarea();
        setFiles([]);
    }
    return (
        <div className={styles.container} ref={menuRef}>

            {/* ALLEGATI */}
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                    {files.map((file, index) => (
                        <div key={index} className={styles.fileItem}>
                            {file.previewUrl ? (
                                <img src={file.previewUrl} alt="preview" className="w-8 h-8 object-cover rounded-md bg-neutral-100" />
                            ) : (
                                <div className={`w-8 h-8 flex items-center justify-center rounded-md ${isDark ? "bg-neutral-700" : "bg-neutral-100"}`}>
                                    <Paperclip size={16} className={isDark ? "text-neutral-300" : "text-neutral-500"} />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className={`text-xs font-medium max-w-[120px] truncate ${isDark ? "text-neutral-200" : "text-neutral-700"}`}>{file.name}</span>
                                <span className="text-[10px] text-neutral-600">{(file.originalFile.size / 1024).toFixed(0)} KB</span>
                            </div>
                            <button onClick={() => removeFile(index)} className="absolute top-1 right-1 text-neutral-600 hover:text-red-500 transition-colors">
                                <XIcon size={14} weight="bold" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* INPUT E INVIO */}
            <div className="flex items-center gap-2">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={isChatPage ? `Chat with ${model?.name || "AI"}` : "Ask your document..."} // Placeholder dinamico
                    onChange={(e) => setInputValue(e.target.value)}
                    onInput={handleInput}
                    value={inputValue}
                    onKeyDown={handleKeyPress}
                    className={styles.input}
                />

                <button
                    className={styles.sendBtn}
                    onClick={() => { if (inputValue.trim()) { handleSendMessage(); } }}
                >
                    {loading ? <StopIcon size={20} weight="fill" /> : <PaperPlaneTilt size={20} weight="fill" />}
                </button>
            </div>

            {/* STRUMENTI INFERIORI */}
            <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-3">
                    <button className={styles.iconBtn} onClick={() => document.getElementById("file-upload")?.click()}>
                        <Paperclip size={22} weight="bold" />
                    </button>
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} ref={fileInputRef} multiple />

                    <OptionsPopup />

                    <SelectPopup
                        options={FUNCTIONALITIES}
                        value={functionality} // Rimosso il plurale e il fallback superfluo
                        onChange={(value) => {
                            setFunctionality(value); // Usa il setter corretto
                        }}
                    />


                </div>

                <div className="flex items-center gap-4">
                    <SelectPopup options={REASONING} value={reasoning} onChange={(value) => setReasoning(value)} />
                    <Tooltip
                        background={isDark ? "dark" : "light"}
                        position="right"
                        content={
                            <div className="text-left">
                                <b className={isDark ? "text-white" : "text-neutral-900"}>Model:</b>
                                <p className={`text-[11px] font-mono ${isDark ? "text-neutral-600" : "text-neutral-500"}`}>
                                    {model?.name}
                                </p>
                                <div className="text-[11px] text-neutral-500 mt-1">
                                    In: {model?.cost_per_input_token}$ / 1M<br />
                                    Out: {model?.cost_per_output_token}$ / 1M
                                </div>
                            </div>
                        }
                    >
                        <span className="text-[13px] font-mono text-neutral-500" >
                            {(Number(model?.cost_per_input_token || 0) + Number(model?.cost_per_output_token || 0)).toFixed(2)}$/1M
                        </span>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Textbar);