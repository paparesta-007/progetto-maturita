import { Paperclip, PaperPlaneTilt, XIcon, GlobeIcon, StopIcon } from "@phosphor-icons/react";
import React, { useState, useEffect, useRef } from "react";
import Tooltip from "./other/Tooltip";
import { useChat } from "../context/ChatContext";
import { useDocument } from "../context/DocumentContext"; // Importa il DocumentContext
import { useAuth } from "../context/AuthContext";
import ModelPopup from "./other/ModelPopup";
import { AnimatePresence, motion } from "framer-motion";

interface FileWithPreview {
    originalFile: File;
    name: string;
    previewUrl: string | null;
}

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
    // Se siamo in ChatPage usa chatCtx, altrimenti docCtx
    const sendMessage = isChatPage ? chatCtx.sendMessage : docCtx.sendMessage;
    const loading = isChatPage ? chatCtx.loading : docCtx.loading;
    const model = isChatPage ? chatCtx.model : docCtx.model;
    
    // Stream: Se il DocumentContext non ha lo stream, usiamo quello della chat o disabilitiamo
    // Assumiamo che solo la chat abbia lo stream abilitabile per ora
    const isStreamTextEnabled = isChatPage ? chatCtx.isStreamTextEnabled : false; 
    const setIsStreamTextEnabled = isChatPage ? chatCtx.setIsStreamTextEnabled : () => {};


    // --- STATI LOCALI ---
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isGroundingActive, setIsGroundingActive] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Stili dinamici per la barra
    const styles = {
        container: `w-full max-w-2xl border rounded-2xl p-2 flex flex-col gap-2 transition-all duration-300 ${isDark
            ? "bg-neutral-900 border-neutral-800 shadow-[0_0_20px_0_rgba(0,0,0,0.4)]"
            : "bg-white border-neutral-200 shadow-[0_0_15px_0_rgba(0,0,0,0.15)]"
            }`,
        input: ` flex-1 p-3 focus:outline-none bg-transparent resize-none
                ${isDark
                ? "text-white placeholder-neutral-500 bg-neutral-900"
                : "text-neutral-900 placeholder-neutral-400 bg-neutral-100"}
                w-full min-w-[200px]
                py-2
                max-h-[15rem] overflow-y-auto`,
        sendBtn: `p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${isDark ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`,
        iconBtn: `transition-colors ${isDark ? "text-neutral-500 hover:text-neutral-200" : "text-neutral-400 hover:text-neutral-800"}`,
        fileItem: `relative group flex items-center gap-2 border rounded-lg p-1.5 pr-8 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
            }`
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim()) {
                // Chiama la funzione corretta in base al contesto
                sendMessage(inputValue);
                resetTextarea();
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
                                <span className="text-[10px] text-neutral-400">{(file.originalFile.size / 1024).toFixed(0)} KB</span>
                            </div>
                            <button onClick={() => removeFile(index)} className="absolute top-1 right-1 text-neutral-400 hover:text-red-500 transition-colors">
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
                    placeholder={isChatPage ? "Chat with AI..." : "Ask your document..."} // Placeholder dinamico
                    onChange={(e) => setInputValue(e.target.value)}
                    onInput={handleInput}
                    value={inputValue}
                    onKeyDown={handleKeyPress}
                    className={styles.input}
                />

                <button
                    className={styles.sendBtn}
                    onClick={() => { if (inputValue.trim()) { sendMessage(inputValue); setInputValue("") } }}
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

                    <ModelPopup />

                    {/* Mostra Web Grounding solo se siamo nella Chat (opzionale, rimuovi il controllo se lo vuoi anche nei doc) */}
                    {isChatPage && (
                        <button
                            className={`transition-all relative flex items-center gap-0 px-2 py-1 rounded-full ${isGroundingActive ? 'bg-blue-500/10 text-blue-500' : styles.iconBtn
                                }`}
                            onClick={() => setIsGroundingActive(!isGroundingActive)}
                        >
                            <GlobeIcon size={22} weight={isGroundingActive ? "fill" : "regular"} />
                            <AnimatePresence>
                                {isGroundingActive && (
                                    <motion.span
                                        initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                                        className="ml-1 text-xs font-bold overflow-hidden whitespace-nowrap"
                                    >
                                        Web
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Stream Toggle: Mostrato solo se siamo in Chat Page */}
                    {isChatPage && (
                        <div className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox" id="stream-toggle" className="cursor-pointer accent-neutral-800"
                                checked={isStreamTextEnabled} onChange={(e) => setIsStreamTextEnabled(e.target.checked)}
                            />
                            <label htmlFor="stream-toggle" className="text-xs font-medium text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 cursor-pointer select-none">
                                Stream
                            </label>
                        </div>
                    )}

                    <Tooltip
                        background={isDark ? "dark" : "light"}
                        position="right"
                        content={
                            <div className="text-left">
                                <b className={isDark ? "text-white" : "text-neutral-900"}>Model Pricing</b>
                                <div className="text-[11px] text-neutral-500 mt-1">
                                    In: {model?.cost_per_input_token}$ / 1M<br />
                                    Out: {model?.cost_per_output_token}$ / 1M
                                </div>
                            </div>
                        }
                    >
                        <span className="text-[10px] font-mono text-neutral-500">
                            {(Number(model?.cost_per_input_token || 0) + Number(model?.cost_per_output_token || 0)).toFixed(2)}$/1M
                        </span>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Textbar);