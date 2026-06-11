import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
    Translate as TranslateIcon, 
    Copy, 
    Check, 
    Lightning, 
    Sparkle, 
    Info, 
    Books, 
    Flask,
    X,
    CaretDown,
    Minus,
    GearSix,
    ChatTeardropText,
    Student,
    Briefcase,
    PaperPlaneTilt
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../../library/supabaseclient";
import MarkdownRender from "../../library/markdownRender";
import { marked } from "marked";

const LANGUAGES = [
    { code: 'auto', name: 'Rileva lingua', flag: '🔍' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const TranslatorPage = () => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    const [sourceLang, setSourceLang] = useState(LANGUAGES[0]);
    const [targetLang, setTargetLang] = useState(LANGUAGES[2]);
    const [sourceText, setSourceText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSourceFocused, setIsSourceFocused] = useState(false);

    // Settings Popup State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState({
        tone: 'Naturale',
        complexity: 'Bilanciato',
        context: 'Generale'
    });

    // Selection & Focus
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
    const [focusData, setFocusData] = useState<{ type: string, content: string } | null>(null);
    const [isFocusLoading, setIsFocusLoading] = useState(false);
    const [isFocusMinimized, setIsFocusMinimized] = useState(false);
    const [focusMessages, setFocusMessages] = useState<any[]>([]);
    const [focusInput, setFocusInput] = useState("");
    
    const outputRef = useRef<HTMLDivElement>(null);
    const focusScrollRef = useRef<HTMLDivElement>(null);

    // --- AUTO SCROLL LOGIC ---
    useEffect(() => {
        if (isLoading && outputRef.current) {
            outputRef.current.scrollTo({
                top: outputRef.current.scrollHeight,
                behavior: 'auto'
            });
        }
    }, [translatedText, isLoading]);

    useEffect(() => {
        if (isFocusLoading && focusScrollRef.current) {
            focusScrollRef.current.scrollTo({
                top: focusScrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [focusData?.content, focusMessages, isFocusLoading]);

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;
        setIsLoading(true);
        setTranslatedText(""); // Clear previous translation for a fresh start
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const fromLangStr = sourceLang.code === 'auto' ? "rilevando automaticamente la lingua di partenza" : `da ${sourceLang.name}`;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/artifacts/translate`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: `Traduci il seguente testo ${fromLangStr} a ${targetLang.name}. 
                    Tono richiesto: ${settings.tone}. 
                    Complessità: ${settings.complexity}. 
                    Contesto: ${settings.context}.
                    Testo: ${sourceText}`,
                    history: [],
                    temperature: 0.5
                }),
            });

            if (!response.ok || !response.body) throw new Error("Errore durante la traduzione");
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                setTranslatedText(prev => prev + chunk);
            }

        } catch (error) {
            console.error(error);
            setTranslatedText("Errore durante la traduzione. Riprova.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            const html = await marked.parse(translatedText);
            const plainText = translatedText;

            if (navigator.clipboard && window.ClipboardItem) {
                const blobHtml = new Blob([html], { type: 'text/html' });
                const blobText = new Blob([plainText], { type: 'text/plain' });
                const data = [new ClipboardItem({
                    'text/html': blobHtml,
                    'text/plain': blobText
                })];
                await navigator.clipboard.write(data);
            } else {
                await navigator.clipboard.writeText(plainText);
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Errore durante la copia:', err);
        }
    };

    const handleTextSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim() && outputRef.current?.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelection({
                text: sel.toString().trim(),
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
        } else {
            setSelection(null);
        }
    };

    const handleFocus = async (type: 'meaning' | 'usecases' | 'bestpractices') => {
        if (!selection) return;
        setIsFocusLoading(true);
        setFocusData({ type, content: "" });
        setIsFocusMinimized(false);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            let prompt = "";
            if (type === 'meaning') prompt = `Analizza il significato di: "${selection.text}" in un contesto di traduzione ${sourceLang.name} -> ${targetLang.name}.`;
            if (type === 'usecases') prompt = `Esempi d'uso per: "${selection.text}" sia in ${sourceLang.name} che in ${targetLang.name}.`;
            if (type === 'bestpractices') prompt = `Suggerimenti di traduzione e sfumature culturali per: "${selection.text}" tra ${sourceLang.name} e ${targetLang.name}.`;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/artifacts/translate`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: prompt,
                    history: [],
                    temperature: 0.5
                }),
            });

            if (!response.ok || !response.body) throw new Error("Errore durante l'analisi");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                setFocusData(prev => ({
                    ...prev!,
                    content: prev!.content + chunk
                }));
            }
        } catch (error) {
            console.error(error);
            setFocusData({ type, content: "Errore durante l'analisi. Riprova." });
        } finally {
            setIsFocusLoading(false);
            setSelection(null);
        }
    };

    const handleFocusChat = async () => {
        if (!focusInput.trim() || !focusData) return;
        
        const userMsg = { role: 'user', content: focusInput };
        setFocusMessages(prev => [...prev, userMsg]);
        setFocusInput("");
        setIsFocusLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/artifacts/translate`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: focusInput,
                    history: [
                        { role: 'system', content: `Stai analizzando un testo specifico: "${selection?.text || focusData.content}". Rispondi in modo conciso e utile.` },
                        ...focusMessages,
                        { role: 'user', content: focusInput }
                    ],
                    temperature: 0.7
                }),
            });

            if (!response.ok || !response.body) throw new Error("Errore durante la chat");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";
            
            setFocusMessages(prev => [...prev, { role: 'assistant', content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;
                setFocusMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { role: 'assistant', content: assistantContent };
                    return newMsgs;
                });
            }
        } catch (error) {
            console.error(error);
            setFocusMessages(prev => [...prev, { role: 'assistant', content: "Errore durante la comunicazione. Riprova." }]);
        } finally {
            setIsFocusLoading(false);
        }
    };

    return (
        <div className={`h-full w-full flex flex-col overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea]" : "bg-[#fdfcfb] text-neutral-900"}`}>
            {/* Header */}
            <header className={`px-8 py-4 border-b flex items-center justify-between relative z-[100] ${isDark ? "border-white/5 bg-[#07070a]" : "border-neutral-200 bg-[#fdfcfb]"}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-2xl ${isDark ? "bg-[#e8e2d8]/10 text-[#e8e2d8]" : "bg-[#2c2825]/10 text-[#2c2825]"}`}>
                        <TranslateIcon size={20} weight="duotone" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Traduttore Contestuale</h1>
                        <p className={`text-[10px] font-medium opacity-60 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Traduzione avanzata con analisi del contesto</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`p-2.5 rounded-2xl transition-all active:scale-90 ${isDark ? "bg-white/5 hover:bg-white/10 text-neutral-400" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"}`}
                >
                    <GearSix size={20} weight={isSettingsOpen ? "fill" : "regular"} className={isSettingsOpen ? (isDark ? "text-[#e8e2d8]" : "text-[#2c2825]") : ""} />
                </button>

                {/* New Settings Popup */}
                <AnimatePresence>
                    {isSettingsOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`absolute top-full right-8 mt-4 w-72 p-6 rounded-3xl border shadow-2xl backdrop-blur-3xl transition-colors duration-500 ${
                                isDark ? "bg-[#0f0f13]/90 border-white/10 shadow-black/40" : "bg-white/95 border-neutral-200 shadow-neutral-200/30"
                            }`}
                        >
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3">Tono di Voce</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Naturale', 'Formale', 'Creativo', 'Accademico'].map(t => (
                                            <button 
                                                key={t}
                                                onClick={() => setSettings(prev => ({ ...prev, tone: t }))}
                                                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                                                    settings.tone === t 
                                                        ? (isDark ? "bg-[#e8e2d8] text-[#2c2825]" : "bg-[#2c2825] text-[#e8e2d8]") 
                                                        : (isDark ? "bg-white/5 hover:bg-white/10 text-neutral-400" : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600")
                                                }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3">Complessità</h4>
                                    <div className="flex p-1 rounded-2xl bg-neutral-500/5 border border-white/5">
                                        {['Semplice', 'Bilanciato', 'Tecnico'].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setSettings(prev => ({ ...prev, complexity: c }))}
                                                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                                                    settings.complexity === c 
                                                        ? (isDark ? "bg-white/10 text-white" : "bg-white text-neutral-900 shadow-sm") 
                                                        : "text-neutral-500 hover:text-neutral-400"
                                                }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3">Contesto Preferito</h4>
                                    <div className="space-y-1.5">
                                        {[
                                            { id: 'Generale', icon: <ChatTeardropText size={14} />, label: 'Conversazione' },
                                            { id: 'Studio', icon: <Student size={14} />, label: 'Accademico' },
                                            { id: 'Business', icon: <Briefcase size={14} />, label: 'Lavoro' }
                                        ].map(ctx => (
                                            <button 
                                                key={ctx.id}
                                                onClick={() => setSettings(prev => ({ ...prev, context: ctx.id }))}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                                                    settings.context === ctx.id 
                                                        ? (isDark ? "bg-[#e8e2d8]/10 text-[#e8e2d8] border border-[#e8e2d8]/20" : "bg-[#2c2825]/5 text-[#2c2825] border border-[#2c2825]/10") 
                                                        : (isDark ? "hover:bg-white/5 text-neutral-400" : "hover:bg-neutral-50 text-neutral-500")
                                                }`}
                                            >
                                                {ctx.icon}
                                                {ctx.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden p-8 max-w-7xl mx-auto w-full">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                    
                    {/* Source Card */}
                    <div className={`flex flex-col rounded-3xl border shadow-sm overflow-hidden transition-all ${isDark ? "bg-[#0f0f13] border-white/10" : "bg-white border-neutral-200"}`}>
                        <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-white/5" : "border-neutral-100"}`}>
                            <div className="relative group">
                                <select 
                                    value={sourceLang.code} 
                                    onChange={(e) => setSourceLang(LANGUAGES.find(l => l.code === e.target.value)!)}
                                    className={`appearance-none bg-transparent pl-2 pr-8 py-1 text-sm font-semibold focus:outline-none cursor-pointer ${isDark ? "text-white" : "text-neutral-900"}`}
                                >
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                                </select>
                                <CaretDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Testo di partenza</span>
                        </div>
                        <div className="flex-1 overflow-y-auto relative">
                            {isSourceFocused || !sourceText ? (
                                <textarea
                                    value={sourceText}
                                    onChange={(e) => setSourceText(e.target.value)}
                                    onFocus={() => setIsSourceFocused(true)}
                                    onBlur={() => setIsSourceFocused(false)}
                                    autoFocus={isSourceFocused}
                                    placeholder="Inserisci il testo da tradurre..."
                                    className={`w-full h-full p-6 bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:opacity-30 ${isDark ? "text-white" : "text-neutral-800"}`}
                                />
                            ) : (
                                <div 
                                    onClick={() => setIsSourceFocused(true)}
                                    className={`w-full h-full p-6 cursor-text text-lg leading-relaxed ${isDark ? "text-white" : "text-neutral-800"}`}
                                >
                                    <MarkdownRender text={sourceText} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Target Card */}
                    <div className={`flex flex-col rounded-3xl border shadow-sm overflow-hidden transition-all relative ${isDark ? "bg-[#0f0f13] border-white/10" : "bg-white border-neutral-200"}`}>
                        <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-white/5" : "border-neutral-100"}`}>
                            <div className="relative group">
                                <select 
                                    value={targetLang.code} 
                                    onChange={(e) => setTargetLang(LANGUAGES.find(l => l.code === e.target.value)!)}
                                    className={`appearance-none bg-transparent pl-2 pr-8 py-1 text-sm font-semibold focus:outline-none cursor-pointer ${isDark ? "text-white" : "text-neutral-900"}`}
                                >
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                                </select>
                                <CaretDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleCopy}
                                    className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-neutral-100"}`}
                                    title="Copia traduzione"
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Traduzione</span>
                            </div>
                        </div>
                        <div 
                            ref={outputRef}
                            onMouseUp={handleTextSelection}
                            className={`flex-1 p-6 bg-transparent overflow-y-auto text-lg leading-relaxed ${isDark ? "text-white" : "text-neutral-800"} ${!translatedText && "opacity-30 italic text-base"}`}
                        >
                            {translatedText ? <MarkdownRender text={translatedText} isStreaming={isLoading} /> : "La traduzione apparirà qui..."}
                        </div>

                        {/* Focus Popup (Selection) */}
                        <AnimatePresence>
                            {selection && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                    className="fixed z-[100] flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-white/20 shadow-2xl backdrop-blur-md"
                                    style={{ left: selection.x, top: selection.y, transform: 'translateX(-50%)' }}
                                >
                                    <button 
                                        onClick={() => handleFocus('meaning')}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[11px] font-bold text-white transition-colors"
                                    >
                                        <Info size={14} weight="fill" className="text-blue-400" /> Focus
                                    </button>
                                    <div className="w-px h-4 bg-white/10" />
                                    <button 
                                        onClick={() => handleFocus('usecases')}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                                        title="Esempi d'uso"
                                    >
                                        <Books size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleFocus('bestpractices')}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                                        title="Best practices"
                                    >
                                        <Flask size={16} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Translate Button Container */}
                <div className="pt-8 pb-4 flex justify-center flex-shrink-0">
                    <button
                        onClick={handleTranslate}
                        disabled={isLoading || !sourceText.trim()}
                        className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-xl ${
                            isDark 
                                ? "bg-white text-black hover:bg-neutral-200" 
                                : "bg-neutral-900 text-white hover:bg-neutral-800"
                        }`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Lightning size={20} weight="fill" className="group-hover:text-yellow-500 transition-colors" />
                        )}
                        <span>Traduci con Mistral AI</span>
                        <div className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDark ? "bg-[#e8e2d8]" : "bg-[#2c2825]"}`}></span>
                            <span className={`relative inline-flex rounded-full h-4 w-4 ${isDark ? "bg-[#e8e2d8]" : "bg-[#2c2825]"}`}></span>
                        </div>
                    </button>
                </div>
            </main>

            {/* Floating Focus Result (Bottom Right) */}
            <AnimatePresence>
                {(focusData || isFocusLoading) && (
                    <div className="fixed right-8 bottom-8 z-[110] flex flex-col items-end gap-4 pointer-events-none">
                        {!isFocusMinimized ? (
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                className={`w-[450px] p-8 rounded-[2.5rem] border shadow-2xl backdrop-blur-3xl pointer-events-auto flex flex-col transition-colors duration-500 ${
                                    isDark ? "bg-[#0d0d12]/90 border-white/10 shadow-black/60" : "bg-white/95 border-neutral-200 shadow-neutral-200/50"
                                }`}
                            >
                                <div className="flex flex-col gap-6 h-full min-h-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${
                                                focusData?.type === 'meaning' ? 'bg-blue-500/10 text-blue-500' :
                                                focusData?.type === 'usecases' ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-violet-500/10 text-violet-500'
                                            }`}>
                                                {isFocusLoading && !focusData?.content ? <Sparkle size={20} className="animate-pulse" /> : 
                                                 focusData?.type === 'meaning' ? <Info size={20} weight="duotone" /> :
                                                 focusData?.type === 'usecases' ? <Books size={20} weight="duotone" /> :
                                                 <Flask size={20} weight="duotone" />
                                                }
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                                                    {isFocusLoading && !focusData?.content ? "Analisi in corso..." : 
                                                     focusData?.type === 'meaning' ? "Significato & Sfumature" :
                                                     focusData?.type === 'usecases' ? "Esempi d'uso" :
                                                     "Best Practices"
                                                    }
                                                </h3>
                                                {selection?.text && (
                                                    <p className="text-xs font-semibold opacity-80 truncate max-w-[200px]">"{selection.text}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={() => setIsFocusMinimized(true)}
                                                className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/10 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"}`}
                                                title="Minimizza"
                                            >
                                                <Minus size={18} />
                                            </button>
                                            <button 
                                                onClick={() => { setFocusData(null); setFocusMessages([]); }}
                                                className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/10 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"}`}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="relative flex-1 min-h-0">
                                        <div 
                                            ref={focusScrollRef}
                                            className={`text-base leading-relaxed max-h-[400px] overflow-y-auto pr-4 custom-scrollbar ${isDark ? "text-neutral-200" : "text-neutral-800"}`}
                                        >
                                            {isFocusLoading && !focusData?.content ? (
                                                <div className="space-y-3">
                                                    <div className="h-4 bg-current opacity-10 rounded w-full animate-pulse" />
                                                    <div className="h-4 bg-current opacity-10 rounded w-5/6 animate-pulse" />
                                                    <div className="h-4 bg-current opacity-10 rounded w-4/6 animate-pulse" />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-6 pb-4">
                                                    {focusData?.content && (
                                                        <div className="p-1">
                                                            <MarkdownRender text={focusData.content} isStreaming={isFocusLoading && focusMessages.length === 0} />
                                                        </div>
                                                    )}
                                                    
                                                    {focusMessages.map((m, idx) => (
                                                        <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                            <div className={`max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed ${
                                                                m.role === 'user' 
                                                                    ? (isDark ? "bg-[#2c2825] text-[#e8e2d8] font-bold" : "bg-[#e8e2d8] text-[#2c2825] font-bold")
                                                                    : (isDark ? "bg-white/5 border border-white/5" : "bg-neutral-50 border border-neutral-100 shadow-sm")
                                                            }`}>
                                                                <MarkdownRender 
                                                                    text={m.content} 
                                                                    isStreaming={isFocusLoading && idx === focusMessages.length - 1} 
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Focus Chat Input */}
                                    <div className={`mt-2 flex items-center gap-2 p-1.5 rounded-2xl border ${isDark ? "bg-white/5 border-white/10" : "bg-neutral-50 border-neutral-200"}`}>
                                        <input 
                                            type="text"
                                            value={focusInput}
                                            onChange={(e) => setFocusInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleFocusChat()}
                                            placeholder="Fai una domanda su questo testo..."
                                            disabled={isFocusLoading}
                                            className="flex-1 bg-transparent px-3 py-1.5 text-xs focus:outline-none placeholder:opacity-30"
                                        />
                                        <button
                                            onClick={handleFocusChat}
                                            disabled={isFocusLoading || !focusInput.trim()}
                                            className={`p-2 rounded-xl transition-all active:scale-90 ${
                                                isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
                                            } disabled:opacity-30`}
                                        >
                                            {isFocusLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <PaperPlaneTilt size={16} weight="fill" />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ scale: 0, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0, y: 50 }}
                                onClick={() => setIsFocusMinimized(false)}
                                className={`p-5 rounded-3xl shadow-2xl pointer-events-auto transition-transform hover:scale-110 active:scale-95 group relative ${
                                    isDark ? "bg-white text-black" : "bg-neutral-900 text-white"
                                }`}
                            >
                                <Sparkle size={28} weight="fill" className="group-hover:rotate-12 transition-transform" />
                                <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                                </div>
                            </motion.button>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TranslatorPage;