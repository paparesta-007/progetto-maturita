import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
    Cards as CardsIcon,
    Plus,
    Lightning,
    CaretLeft,
    CaretRight,
    ArrowCounterClockwise,
    Info,
    X,
    Sparkle,
    Brain,
    Keyboard,
    SpeakerHigh,
    Eye,
    EyeSlash
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../../library/supabaseclient";
import MarkdownRender from "../../library/markdownRender";

interface Flashcard {
    front: string;
    back: string;
    hint?: string;
    details?: string;
}

const FlashcardPage = () => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    const [inputText, setInputText] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const detailsContainerRef = useRef<HTMLDivElement>(null);

    // --- AUTO SCROLL LOGIC ---
    useEffect(() => {
        if (isDeepDiveLoading && detailsContainerRef.current) {
            detailsContainerRef.current.scrollTo({
                top: detailsContainerRef.current.scrollHeight,
                behavior: 'auto'
            });
        }
    }, [cards, isDeepDiveLoading]);

    const handleGenerate = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setCards([]);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowHint(false);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/artifacts/flashcards/generate`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text: inputText, difficulty, temperature: 0.5 }),
            });

            if (!response.ok) throw new Error("Errore durante la generazione");
            const data = await response.json();
            setCards(data.cards);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeepDive = async () => {
        if (cards[currentIndex].details) {
            setShowDetails(true);
            return;
        }
        
        setIsDeepDiveLoading(true);
        setShowDetails(true);
        
        // Initialize empty details for streaming
        setCards(prev => {
            const newCards = [...prev];
            newCards[currentIndex].details = "";
            return newCards;
        });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/artifacts/flashcards/deep-dive`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    card: cards[currentIndex],
                    contextText: inputText.substring(0, 1000),
                    temperature: 0.5
                }),
            });

            if (!response.ok || !response.body) throw new Error("Errore approfondimento");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                setCards(prev => {
                    const newCards = [...prev];
                    newCards[currentIndex].details = (newCards[currentIndex].details || "") + chunk;
                    return newCards;
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeepDiveLoading(false);
        }
    };

    const nextCard = useCallback(() => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setShowDetails(false);
            setShowHint(false);
        }
    }, [currentIndex, cards.length]);

    const prevCard = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
            setShowDetails(false);
            setShowHint(false);
        }
    }, [currentIndex]);

    const toggleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (cards.length === 0) return;
            if (e.code === "Space") {
                e.preventDefault();
                toggleFlip();
            } else if (e.code === "ArrowRight") {
                nextCard();
            } else if (e.code === "ArrowLeft") {
                prevCard();
            } else if (e.code === "KeyD" && isFlipped) {
                handleDeepDive();
            } else if (e.code === "KeyH" && !isFlipped) {
                setShowHint(prev => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cards.length, toggleFlip, nextCard, prevCard, isFlipped]);

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className={`h-full w-full flex flex-col overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea]" : "bg-[#fdfcfb] text-neutral-900"}`}>
            {/* Header */}
            <header className={`px-8 py-4 border-b ${isDark ? "border-white/5" : "border-neutral-200"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500">
                            <CardsIcon size={20} weight="duotone" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Flashcard AI</h1>
                            <p className={`text-[10px] font-medium opacity-60 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Metodo di studio avanzato</p>
                        </div>
                    </div>
                    {cards.length > 0 && (
                        <div className={`flex items-center gap-4 px-4 py-2 rounded-2xl border ${isDark ? "bg-white/5 border-white/5" : "bg-neutral-50 border-neutral-100"}`}>
                            <div className="flex items-center gap-1.5 opacity-40">
                                <Keyboard size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Space to Flip • Arrows to Nav • D for Details • H for Hint</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-hidden p-8 max-w-6xl mx-auto w-full flex flex-col">
                {cards.length === 0 && !isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-8">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={`w-full p-10 rounded-[3rem] border shadow-2xl ${isDark ? "bg-[#0f0f13] border-white/10" : "bg-white border-neutral-200"}`}
                        >
                            <h2 className="text-2xl font-bold mb-2 text-center">Inizia una nuova sessione</h2>
                            <p className="text-sm opacity-50 text-center mb-8">Trasforma i tuoi documenti in flashcard interattive in pochi secondi.</p>
                            
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Incolla qui il tuo testo o i tuoi appunti..."
                                className={`w-full h-64 p-6 bg-transparent resize-none focus:outline-none text-lg leading-relaxed border-2 rounded-[2rem] mb-8 transition-all ${isDark ? "border-white/5 focus:border-indigo-500/30 bg-white/[0.02]" : "border-neutral-100 focus:border-indigo-500/20 bg-neutral-50/50"}`}
                            />
                            
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-1 p-1 rounded-2xl bg-neutral-500/5 border border-white/5">
                                    {["Easy", "Medium", "Hard"].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                difficulty === level 
                                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                                    : (isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900")
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={handleGenerate}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-indigo-500 text-white rounded-[1.5rem] font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                                >
                                    <Lightning weight="fill" /> Genera Sessione
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-10 py-4">
                        {/* Progress */}
                        <div className="w-full max-sm:px-4 max-w-sm">
                            <div className="flex justify-between items-center mb-3 px-1">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">Progresso Studio</span>
                                <span className="text-[10px] font-bold text-indigo-500">{currentIndex + 1} / {cards.length}</span>
                            </div>
                            <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-neutral-100"}`}>
                                <motion.div 
                                    className="h-full bg-indigo-500" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                                    transition={{ type: "spring", stiffness: 50 }}
                                />
                            </div>
                        </div>

                        {/* Card Container */}
                        <div className="relative w-full max-w-2xl h-[450px] perspective-2000">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center"
                                    >
                                        <div className="relative">
                                            <div className="w-24 h-24 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                                            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={32} weight="duotone" />
                                        </div>
                                        <p className="mt-8 font-bold tracking-[0.3em] uppercase text-[9px] opacity-30 animate-pulse">Analisi neurale in corso</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={currentIndex}
                                        initial={{ x: 100, opacity: 0, rotateY: 10 }}
                                        animate={{ x: 0, opacity: 1, rotateY: 0 }}
                                        exit={{ x: -100, opacity: 0, rotateY: -10 }}
                                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                        className="w-full h-full"
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        <motion.div
                                            className="relative w-full h-full cursor-pointer"
                                            onClick={toggleFlip}
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                            style={{ transformStyle: 'preserve-3d' }}
                                        >
                                            {/* Front */}
                                            <div className={`absolute inset-0 p-16 flex flex-col items-center justify-center text-center rounded-[4rem] border-2 shadow-2xl backface-hidden transition-colors ${
                                                isDark ? "bg-[#0f0f13] border-white/10" : "bg-white border-neutral-100 shadow-indigo-500/5"
                                            }`}>
                                                <div className="absolute top-10 flex items-center gap-2 opacity-20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Questio</span>
                                                </div>
                                                
                                                <h3 className="text-3xl font-bold leading-tight tracking-tight max-w-md">{cards[currentIndex]?.front}</h3>
                                                
                                                <div className="absolute bottom-10 flex flex-col items-center gap-4">
                                                    {cards[currentIndex]?.hint && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}
                                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all ${showHint ? (isDark ? "bg-amber-500/20 text-amber-500" : "bg-amber-50 text-amber-600") : (isDark ? "bg-white/5 text-neutral-400" : "bg-neutral-50 text-neutral-500")}`}
                                                        >
                                                            {showHint ? <EyeSlash weight="fill" /> : <Eye weight="fill" />}
                                                            {showHint ? `Hint: ${cards[currentIndex].hint}` : "Show Hint"}
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); speak(cards[currentIndex].front); }}
                                                        className={`p-3 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-neutral-500" : "hover:bg-neutral-100 text-neutral-400"}`}
                                                    >
                                                        <SpeakerHigh size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Back */}
                                            <div className={`absolute inset-0 p-10 flex flex-col items-center rounded-[4rem] border-2 shadow-2xl backface-hidden ${
                                                isDark 
                                                    ? "bg-[#111118] border-white/10 shadow-black/40" 
                                                    : "bg-[#fcfbf9] border-neutral-200 shadow-neutral-200/20"
                                            }`} style={{ transform: 'rotateY(180deg)' }}>
                                                <div className={`absolute top-8 flex items-center gap-2 ${isDark ? "text-white/20" : "text-neutral-300"}`}>
                                                    <div className={`w-1 h-1 rounded-full ${isDark ? "bg-white" : "bg-neutral-400"}`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Solutio</span>
                                                </div>
                                                
                                                <div className="flex-1 flex flex-col items-center justify-center w-full mt-6 mb-4 overflow-hidden">
                                                    <h3 className={`text-2xl font-bold leading-tight tracking-tight max-w-md overflow-y-auto max-h-full custom-scrollbar px-4 ${isDark ? "text-white" : "text-neutral-800"}`}>
                                                        {cards[currentIndex]?.back}
                                                    </h3>
                                                </div>
                                                
                                                <div className="flex flex-col items-center gap-4 shrink-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeepDive();
                                                        }}
                                                        disabled={isDeepDiveLoading}
                                                        className={`group flex items-center gap-2.5 px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg ${
                                                            isDark 
                                                                ? "bg-white text-black hover:bg-neutral-200" 
                                                                : "bg-neutral-900 text-white hover:bg-neutral-800"
                                                        } ${isDeepDiveLoading ? "opacity-50" : ""}`}
                                                    >
                                                        {isDeepDiveLoading ? (
                                                            <div className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${isDark ? "border-black/30 border-t-black" : "border-white/30 border-t-white"}`} />
                                                        ) : (
                                                            <Info weight="fill" className="group-hover:rotate-12 transition-transform" />
                                                        )}
                                                        Deep Dive
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); speak(cards[currentIndex].back); }}
                                                        className={`p-3 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-neutral-500" : "hover:bg-neutral-100 text-neutral-400"}`}
                                                    >
                                                        <SpeakerHigh size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-8">
                            <button 
                                onClick={prevCard}
                                disabled={currentIndex === 0 || isLoading}
                                className={`p-5 rounded-3xl border transition-all active:scale-90 disabled:opacity-20 ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10 text-neutral-400" : "bg-white border-neutral-100 hover:bg-neutral-50 text-neutral-500"}`}
                            >
                                <CaretLeft size={24} weight="bold" />
                            </button>
                            
                            <button 
                                onClick={toggleFlip}
                                className={`flex items-center gap-3 px-12 py-5 rounded-[2rem] font-bold transition-all active:scale-95 shadow-2xl ${isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"}`}
                            >
                                <ArrowCounterClockwise size={20} weight="bold" className={`${isFlipped ? "rotate-180" : ""} transition-transform duration-500`} />
                                Reveal
                            </button>

                            <button 
                                onClick={nextCard}
                                disabled={currentIndex === cards.length - 1 || isLoading}
                                className={`p-5 rounded-3xl border transition-all active:scale-90 disabled:opacity-20 ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10 text-neutral-400" : "bg-white border-neutral-100 hover:bg-neutral-50 text-neutral-500"}`}
                            >
                                <CaretRight size={24} weight="bold" />
                            </button>
                        </div>

                        <div className="flex items-center gap-8 opacity-40 hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => { setCards([]); setInputText(""); }}
                                className="flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em]"
                            >
                                <Plus size={12} weight="bold" /> Reset Session
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Deep Dive Panel */}
            <AnimatePresence>
                {showDetails && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-end p-6 pointer-events-none">
                        <motion.div 
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                            className={`w-full max-w-xl h-full rounded-[4rem] border shadow-3xl backdrop-blur-3xl pointer-events-auto flex flex-col overflow-hidden ${
                                isDark ? "bg-[#0d0d12]/95 border-white/10 shadow-black/80" : "bg-[#fcfbf9]/98 border-neutral-200 shadow-indigo-500/10"
                            }`}
                        >
                            <div className="p-10 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                        <Brain size={24} weight="duotone" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 mb-1">Deep Intelligence</h3>
                                        <p className="text-sm font-bold truncate max-w-[300px]">{cards[currentIndex]?.front}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowDetails(false)}
                                    className={`p-3 rounded-2xl transition-all hover:scale-110 active:scale-90 ${isDark ? "hover:bg-white/10 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"}`}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar" ref={detailsContainerRef}>
                                <div className="max-w-none">
                                    {cards[currentIndex]?.details ? (
                                        <MarkdownRender 
                                            text={cards[currentIndex].details || ""} 
                                            isStreaming={isDeepDiveLoading} 
                                        />
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div className="h-4 bg-current opacity-5 rounded w-full animate-pulse" />
                                            <div className="h-4 bg-current opacity-5 rounded w-5/6 animate-pulse" />
                                            <div className="h-4 bg-current opacity-5 rounded w-4/6 animate-pulse" />
                                            <div className="h-4 bg-current opacity-5 rounded w-full animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-black/5 flex justify-center">
                                <p className="text-[9px] font-medium uppercase tracking-[0.2em] opacity-30 text-center">
                                    Analysis generated by Mistral Small 24B • AI can make mistakes
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .perspective-2000 {
                    perspective: 2000px;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    transform-style: preserve-3d;
                }
            `}</style>
        </div>
    );
};

export default React.memo(FlashcardPage);