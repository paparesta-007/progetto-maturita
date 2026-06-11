import { Paperclip, PaperPlaneTilt, XIcon, GlobeIcon, StopIcon, LightningIcon, GaugeIcon, BrainIcon } from "@phosphor-icons/react";
import React, { useState, useEffect, useRef, useMemo,useCallback } from "react";
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

const REASONING: SelectOption<string>[] = [
    { label: "Veloce", value: "fast", icon: <LightningIcon size={16} />, description: "Risposte rapide" },
    { label: "Standard", value: "standard", icon: <GaugeIcon size={16} />, description: "Bilanciato" },
    { label: "Accurato", value: "accurate", icon: <BrainIcon size={16} />, description: "Più preciso" },
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

    const isDocPage = path.includes('/app/document');
    const docIdFromPath = isDocPage ? path.split('/').pop() : null;
    const isDocLoading = !!(isDocPage && docIdFromPath && docIdFromPath !== 'documents' && 
        (!docCtx.currentDocument || (docCtx.currentDocument[0]?.document_id !== docIdFromPath && docCtx.currentDocument?.document_id !== docIdFromPath)));

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
    const [showSearchConfirm, setShowSearchConfirm] = useState(false);

    useEffect(() => {
        if (!isChatPage) return;
        setInputValue(chatCtx.draftMessage || "");
    }, [isChatPage, chatCtx.draftMessage]);

    const handleSearchClick = useCallback(() => {
        if (functionality === "web_search") {
            setFunctionality("default");
        } else {
            setShowSearchConfirm(true);
        }
    }, [functionality]);

    const confirmSearch = useCallback(() => {
        setFunctionality("web_search");
        setShowSearchConfirm(false);
    }, []);

    const cancelSearch = useCallback(() => {
        setShowSearchConfirm(false);
        // Se eravamo già su web_search (difficile via UI ma per sicurezza) 
        // o se stavamo provando ad attivarlo, torniamo a default
        if (functionality !== "web_search") {
            setFunctionality("default");
        }
    }, [functionality]);

    // Stili dinamici per la barra
    const styles = useMemo(() => ({
        container: `w-full max-w-2xl rounded-[1.5rem] p-3 flex flex-col gap-2 transition-all duration-300 ${isDark
            ? "glass border-white/10 shadow-2xl"
            : "bg-[#faf9f6] border border-[#e8e2d9] shadow-[0_2px_24px_0_rgba(0,0,0,0.08)]"
            }`,
        input: ` flex-1 p-2 focus:outline-none bg-transparent resize-none
                ${isDark
                ? "text-white placeholder-white/40"
                : "text-[#2c2825] placeholder-[#b5a99a] bg-transparent"}
                w-full min-w-[200px]
                py-2
                max-h-[15rem] overflow-y-auto`,
        sendBtn: `p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${isDark ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`,
        iconBtn: `transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-neutral-600 hover:text-neutral-800"}`,
        fileItem: `relative group flex items-center gap-2 border rounded-lg p-1.5 pr-8 ${isDark ? "bg-white/5 border-white/10" : "bg-white border-neutral-200"
            }`
    }), [isDark]);

    const resetTextarea = useCallback(() => {
        setInputValue("");
        if (isChatPage) {
            chatCtx.setDraftMessage("");
        }
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    }, [isChatPage, chatCtx]);

    const handleSendMessage = useCallback(async () => {
        try {
            const filePromises = files.map(file => {
                return new Promise<{ type: string, url: string }>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file.originalFile);
                    reader.onload = () => resolve({
                        type: file.originalFile.type.startsWith('image/') ? 'image_url' : 'file_url',
                        url: reader.result as string
                    });
                    reader.onerror = error => reject(error);
                });
            });
            const attachedFiles = await Promise.all(filePromises);
            sendMessage(inputValue, functionality, reasoning, attachedFiles);
            resetTextarea();
            setFiles([]);
        } catch (error) {
            console.error("Errore conversione file:", error);
        }
    }, [files, inputValue, functionality, reasoning, sendMessage, resetTextarea]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim()) {
                handleSendMessage();
            }
        }
    }, [inputValue, handleSendMessage]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
    }, []);

    const removeFile = useCallback((indexToRemove: number) => {
        setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    }, []);

    const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
        const el = e.currentTarget;
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const maxLines = 10;
        const maxHeight = lineHeight * maxLines;

        const val = e.currentTarget.value;
        setInputValue(val);
        if (isChatPage) {
            chatCtx.setDraftMessage(val);
        }
        if (!val.trim()) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    }, [isChatPage, chatCtx]);
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
                    placeholder={isChatPage ? `Chat with ${model?.name || "AI"}` : (isDocLoading ? "Caricamento documento..." : "Ask your document...")} // Placeholder dinamico
                    onChange={handleInput}
                    disabled={isDocLoading || loading}
                    value={inputValue}
                    onKeyDown={handleKeyPress}
                    className={`${styles.input} ${(isDocLoading || loading) ? "opacity-50 cursor-not-allowed" : ""}`}
                />

                <button
                    className={`${styles.sendBtn} ${(isDocLoading || (!loading && !inputValue.trim())) ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isDocLoading || (!loading && !inputValue.trim())}
                    onClick={() => { 
                        if (loading) {
                            if (isChatPage && chatCtx.abortRequest) {
                                chatCtx.abortRequest();
                            } else if (!isChatPage && docCtx.abortRequest) {
                                docCtx.abortRequest();
                            }
                        } else if (inputValue.trim()) { 
                            handleSendMessage(); 
                        } 
                    }}
                >
                    {loading ? <StopIcon size={20} weight="fill" /> : <PaperPlaneTilt size={20} weight="fill" />}
                </button>
            </div>

            {/* STRUMENTI INFERIORI */}
            <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-3">
                    <button 
                        className={`${styles.iconBtn} ${isDocLoading ? "opacity-30 cursor-not-allowed" : ""}`} 
                        disabled={isDocLoading}
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        <Paperclip size={22} weight="bold" />
                    </button>
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} ref={fileInputRef} multiple />

                    <OptionsPopup />

                    {isChatPage && (
                        <button 
                            onClick={handleSearchClick}
                            className={`p-2 rounded-xl transition-all active:scale-95 flex items-center ${
                                functionality === "web_search"
                                    ? (isDark ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-orange-100 text-orange-600 border border-orange-200")
                                    : (isDark ? "text-white/40 hover:text-white" : "text-neutral-500 hover:text-neutral-800")
                            }`}
                            title="Search documentation or internet"
                        >
                            <GlobeIcon size={20} weight={functionality === "web_search" ? "fill" : "bold"} />
                        </button>
                    )}


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

            {/* Confirmation Modal for Web Search */}
            <AnimatePresence>
                {showSearchConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={cancelSearch}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl border ${
                                isDark ? "bg-[#0d0e14] border-white/10 text-white" : "bg-white border-neutral-200 text-neutral-900"
                            }`}
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className={`p-4 rounded-full ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                                    <GlobeIcon size={32} weight="fill" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Attivare Ricerca Web?</h3>
                                    <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                                        La ricerca web permette all'IA di consultare internet e documentazioni esterne (come OpenRouter). 
                                        <br /><br />
                                        <span className="font-bold text-orange-500">Nota sui costi:</span> Questa funzione richiede l'uso di crediti aggiuntivi per ogni ricerca effettuata. Sei sicuro di voler procedere?
                                    </p>
                                </div>
                                <div className="flex flex-col w-full gap-2 mt-2">
                                    <button 
                                        onClick={confirmSearch}
                                        className={`w-full py-3 rounded-2xl font-bold transition-all active:scale-95 ${
                                            isDark ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-black text-white hover:bg-neutral-800"
                                        }`}
                                    >
                                        Sì, attiva ricerca web
                                    </button>
                                    <button 
                                        onClick={cancelSearch}
                                        className={`w-full py-3 rounded-2xl font-bold transition-all ${
                                            isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                        }`}
                                    >
                                        Annulla
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(Textbar);