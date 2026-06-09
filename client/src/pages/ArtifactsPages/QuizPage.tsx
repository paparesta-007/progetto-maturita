import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LightningIcon, PaperPlaneRight, Sparkle, Info, Books, Flask, X, Minus } from "@phosphor-icons/react";
import type { SelectOption } from "../../components/other/SelectPopup";
import { BrainIcon, CheckCircle2, ChevronLeft, ChevronRight, GaugeIcon, RotateCcw, XCircle, HelpCircle } from "lucide-react";
import SelectPopup from "../../components/other/SelectPopup";
import { SendQuizMessage, fetchQuizExplanation, type QuizQuestion } from "../../library/sendMessage";
import MarkdownRender from "../../library/markdownRender";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENTE: QuizTextbar ---
const QuizTextbar = ({
    onSubmit,
    isDark
}: {
    onSubmit: (text: string, mode: string, model: string) => void,
    isDark: boolean
}) => {
    const [text, setText] = useState("");
    const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b:nitro");

    const MODELS: SelectOption<string>[] = [
        { label: "DeepSeek v4 Flash", value: "deepseek/deepseek-v4-flash", icon: <LightningIcon size={16} />, description: "Ultra veloce" },
        { label: "GPT-5 Nano", value: "openai/gpt-5-nano", icon: <BrainIcon size={16} />, description: "Intelligenza pura" },
        { label: "Gemini 3.1 Flash Lite", value: "google/gemini-3.1-flash-lite", icon: <GaugeIcon size={16} />, description: "Versatile" },
        { label: "GPT OSS 120B", value: "openai/gpt-oss-120b:nitro", icon: <Sparkle size={16} />, description: "Potente & Libero" },
    ];

    
    const handleSubmit = () => {
        if (!text.trim()) return;
        onSubmit(text, "standard", selectedModel);
        setText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={`sm:max-w-2xl w-full flex flex-col rounded-3xl border p-4 shadow-2xl transition-all duration-300 relative overflow-hidden ${
            isDark ? "bg-[#0d0d12] border-white/10 focus-within:border-orange-500/30" : "bg-white border-neutral-200 focus-within:border-orange-500/30"
        }`}>
            {isDark && (
                <>
                    <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-orange-600/5 blur-2xl pointer-events-none" />
                </>
            )}

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Argomento del quiz (es. Rivoluzione Francese, React Hooks...)"
                className={`w-full resize-none bg-transparent outline-none text-sm max-h-24 min-h-[60px] py-1 ${
                    isDark ? "text-[#f4f1ea] placeholder-neutral-600" : "text-neutral-800 placeholder-neutral-400"
                } custom-scrollbar`}
            />

            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDark ? "border-white/5" : "border-neutral-100"}`}>
                <div className="flex items-center gap-3">
                    <SelectPopup options={MODELS} value={selectedModel} onChange={setSelectedModel} />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    className={`p-2 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        text.trim()
                        ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95"
                        : isDark ? "bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-50" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    }`}
                >
                    <PaperPlaneRight size={18} weight="fill" />
                </button>
            </div>
        </div>
    );
};

// --- PAGINA PRINCIPALE: QuizPage ---
const QuizPage = () => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
    const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b:nitro");

    // Floating Explanation State
    const [focusData, setFocusData] = useState<{ type: string, content: string } | null>(null);
    const [isFocusLoading, setIsFocusLoading] = useState(false);
    const [isFocusMinimized, setIsFocusMinimized] = useState(false);

    const handleSend = async (promptText: string, selectedMode: string, model: string) => {
        setIsLoading(true);
        setError(null);
        setSubmitted(false);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setFocusData(null);
        setSelectedModel(model);

        try {
            const response = await SendQuizMessage(promptText, selectedMode, 0.5, model);
            if (response.success) {
                setQuiz(response.data);
            } else {
                setError(response.error || "Errore nella generazione del quiz.");
            }
        } catch (err) {
            setError("Errore di connessione al server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchExplanation = async (index: number) => {
        setIsFocusLoading(true);
        setFocusData({ type: 'explanation', content: "" });
        setIsFocusMinimized(false);

        await fetchQuizExplanation(
            quiz[index],
            answers[index] || "Nessuna risposta",
            selectedModel,
            (chunk) => {
                setFocusData(prev => ({
                    ...prev!,
                    content: prev!.content + chunk
                }));
            }
        );
        setIsFocusLoading(false);
    };

    const handleSelect = (option: "A" | "B" | "C" | "D") => {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: option }));
    };

    const handleSubmitAnswers = () => {
        if (Object.keys(answers).length !== quiz.length) {
            setError("Completa tutte le domande prima di inviare!");
            return;
        }
        setError(null);
        setSubmitted(true);
    };

    const handleResetQuiz = () => {
        setQuiz([]);
        setAnswers({});
        setSubmitted(false);
        setCurrentQuestionIndex(0);
        setError(null);
        setFocusData(null);
    };

    const score = quiz.reduce((acc, q, idx) => (answers[idx] === q.rispostaCorretta ? acc + 1 : acc), 0);
    const currentQuestion = quiz[currentQuestionIndex];
    const optionKeys: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

    return (
        <div className={`flex flex-col h-screen w-full overflow-hidden relative transition-all duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea]" : "bg-white text-neutral-900"}`}>
            {/* Background Decorations */}
            {isDark && (
                <>
                    <div className="absolute inset-0 opacity-[0.15] pointer-events-none gridline" />
                    <div className="absolute -top-24 -left-24 h-[400px] w-[400px] rounded-full bg-orange-500/[0.08] blur-[80px] pointer-events-none" />
                </>
            )}

            <main className="flex-1 flex flex-col items-center overflow-y-auto p-6 custom-scrollbar relative z-10">
                <div className="w-full max-w-2xl mt-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-300 bg-clip-text text-transparent tracking-tighter">Interactive Quiz</h2>
                        <p className={`text-xs font-medium ${isDark ? "opacity-40" : "text-neutral-500"}`}>Sfida la tua mente con l'IA di nuova generazione.</p>
                    </div>

                    {/* Input View */}
                    {quiz.length === 0 && !isLoading && (
                        <div className="flex justify-center animate-in fade-in zoom-in duration-500">
                            <QuizTextbar onSubmit={handleSend} isDark={isDark} />
                        </div>
                    )}

                    {/* Loading View */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center mt-12 space-y-6">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                                <Sparkle size={20} weight="fill" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500 animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-1">Generazione in corso</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className={`mt-5 text-xs rounded-[1.25rem] border px-5 py-3 flex items-center gap-3 ${isDark ? "border-red-900/50 bg-red-950/20 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
                            <XCircle size={18} className="flex-shrink-0" />
                            <p className="font-semibold">{error}</p>
                        </div>
                    )}

                    {/* Quiz View */}
                    {quiz.length > 0 && currentQuestion && (
                        <div className="mt-4 space-y-5 pb-24 animate-in slide-in-from-bottom-8 duration-700">
                            {/* Question Navigation */}
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {quiz.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`w-9 h-9 rounded-xl font-black text-[11px] transition-all border flex items-center justify-center ${
                                            currentQuestionIndex === idx 
                                                ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110" 
                                                : (answers[idx] 
                                                    ? (isDark ? "bg-white/10 border-white/20 text-white" : "bg-neutral-200 border-neutral-300 text-neutral-900")
                                                    : (isDark ? "bg-white/[0.03] border-white/5 text-white/30" : "bg-neutral-50 border-neutral-100 text-neutral-400 hover:bg-neutral-100")
                                                  )
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>

                            {/* Card Domanda */}
                            <div className={`p-8 rounded-[2rem] border shadow-2xl transition-all relative overflow-hidden ${
                                isDark 
                                    ? "bg-[#0d0d12] border-white/[0.08] shadow-black/50" 
                                    : "bg-white border-neutral-200 shadow-neutral-200/40"
                            }`}>
                                {isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />}
                                
                                <div className="flex justify-between items-start gap-4 mb-8">
                                    <h3 className="text-lg font-black leading-[1.3] tracking-tight">{currentQuestion.domanda}</h3>
                                    <button 
                                        onClick={() => handleFetchExplanation(currentQuestionIndex)}
                                        className={`p-2 rounded-xl transition-all flex-shrink-0 ${isDark ? "bg-white/5 hover:bg-white/10 text-orange-400" : "bg-orange-50 hover:bg-orange-100 text-orange-600"}`}
                                        title="Approfondisci con l'IA"
                                    >
                                        <Sparkle size={18} weight="fill" />
                                    </button>
                                </div>
                                
                                <div className="grid gap-3">
                                    {optionKeys.map((key) => {
                                        const isSelected = answers[currentQuestionIndex] === key;
                                        const isCorrect = currentQuestion.rispostaCorretta === key;
                                        
                                        let btnStyle = isDark ? "bg-white/[0.02] border-white/[0.05] hover:border-white/20 hover:bg-white/[0.03]" : "bg-neutral-50 border-neutral-100 hover:bg-neutral-100 hover:border-neutral-200";
                                        
                                        if (submitted) {
                                            if (isCorrect) btnStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-500";
                                            else if (isSelected) btnStyle = "bg-red-500/10 border-red-500/30 text-red-500";
                                            else btnStyle = "opacity-30 grayscale cursor-not-allowed border-transparent bg-transparent";
                                        } else if (isSelected) {
                                            btnStyle = "border-orange-500/50 bg-orange-500/10 text-orange-500 ring-4 ring-orange-500/5";
                                        }

                                        return (
                                            <button
                                                key={key}
                                                disabled={submitted}
                                                onClick={() => handleSelect(key)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all duration-300 group ${btnStyle} ${!submitted && isSelected ? 'scale-[1.01]' : 'active:scale-95'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 text-[10px] font-black transition-all ${
                                                        isSelected ? "bg-orange-500 border-none text-white shadow-lg shadow-orange-500/30" : "border-current opacity-20 group-hover:opacity-100"
                                                    }`}>{key}</span>
                                                    <span className="leading-tight">{currentQuestion.opzioni[key]}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {submitted && isCorrect && <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={16} /></div>}
                                                    {submitted && isSelected && !isCorrect && <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center"><XCircle size={16} /></div>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Navigazione */}
                            <div className="flex gap-4">
                                <button 
                                    disabled={currentQuestionIndex === 0}
                                    onClick={() => setCurrentQuestionIndex(i => i - 1)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900"
                                    } disabled:opacity-20 active:scale-95`}
                                >
                                    <ChevronLeft size={16} /> Indietro
                                </button>
                                <button 
                                    disabled={currentQuestionIndex === quiz.length - 1}
                                    onClick={() => setCurrentQuestionIndex(i => i + 1)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900"
                                    } disabled:opacity-20 active:scale-95`}
                                >
                                    Avanti <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Risultato o Conferma */}
                            {!submitted ? (
                                <button 
                                    onClick={handleSubmitAnswers}
                                    className="w-full py-5 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-400 hover:from-orange-500 hover:to-orange-300 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-orange-500/30 transition-all active:scale-95 hover:-translate-y-0.5"
                                >
                                    Conferma Challenge
                                </button>
                            ) : (
                                <div className="space-y-4 pt-4">
                                    <div className={`p-6 rounded-[2rem] border flex items-center justify-between relative overflow-hidden ${isDark ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-200"}`}>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Punteggio</p>
                                            <p className="text-4xl font-black tracking-tighter">{score} <span className="text-lg opacity-30">/ {quiz.length}</span></p>
                                        </div>
                                        <div className="relative z-10 flex flex-col items-end gap-1.5">
                                            <div className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                {Math.round((score/quiz.length)*100)}% SUCCESS
                                            </div>
                                        </div>
                                        {isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full translate-x-1/2" />}
                                    </div>
                                    <button 
                                        onClick={handleResetQuiz}
                                        className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2.5 transition-all active:scale-95 ${
                                            isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
                                        }`}
                                    >
                                        <RotateCcw size={16} weight="bold" /> Nuova Sfida
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
                                className={`w-[400px] p-8 rounded-[2.5rem] border shadow-2xl backdrop-blur-3xl pointer-events-auto transition-colors duration-500 ${
                                    isDark ? "bg-[#0d0d12]/90 border-white/10 shadow-black/60" : "bg-white/95 border-neutral-200 shadow-neutral-200/50"
                                }`}
                            >
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                                                {isFocusLoading && !focusData?.content ? <Sparkle size={20} className="animate-pulse" /> : <Info size={20} weight="duotone" />}
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                                                    Spiegazione AI
                                                </h3>
                                                <p className="text-xs font-semibold opacity-80 truncate max-w-[200px]">Domanda {currentQuestionIndex + 1}</p>
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
                                                onClick={() => setFocusData(null)}
                                                className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/10 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"}`}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className={`text-sm leading-relaxed max-h-[350px] overflow-y-auto pr-4 custom-scrollbar ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                                            {isFocusLoading && !focusData?.content ? (
                                                <div className="space-y-3">
                                                    <div className="h-4 bg-current opacity-10 rounded w-full animate-pulse" />
                                                    <div className="h-4 bg-current opacity-10 rounded w-5/6 animate-pulse" />
                                                    <div className="h-4 bg-current opacity-10 rounded w-4/6 animate-pulse" />
                                                </div>
                                            ) : (
                                                focusData?.content && <MarkdownRender text={focusData.content} isStreaming={isFocusLoading} />
                                            )}
                                        </div>
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
                                <Sparkle size={24} weight="fill" className="group-hover:rotate-12 transition-transform text-orange-500" />
                            </motion.button>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuizPage;