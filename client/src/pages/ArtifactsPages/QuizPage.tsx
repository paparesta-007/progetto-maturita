import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LightningIcon, PaperPlaneRight } from "@phosphor-icons/react";
import type { SelectOption } from "../../components/other/SelectPopup";
import { BrainIcon, CheckCircle2, ChevronLeft, ChevronRight, GaugeIcon, RotateCcw, XCircle } from "lucide-react";
import SelectPopup from "../../components/other/SelectPopup";
import { SendQuizMessage, type QuizQuestion } from "../../library/sendMessage";

// --- COMPONENTE: QuizTextbar ---
const QuizTextbar = ({
    onSubmit,
    isDark
}: {
    onSubmit: (text: string, mode: string) => void,
    isDark: boolean
}) => {
    const [text, setText] = useState("");

    const handleSubmit = () => {
        if (!text.trim()) return;
        onSubmit(text, "standard");
        setText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={`sm:max-w-3xl w-full flex flex-col rounded-3xl border p-4 shadow-2xl transition-all duration-300 relative overflow-hidden ${
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
                className={`w-full resize-none bg-transparent outline-none text-sm max-h-32 min-h-[80px] py-1 ${
                    isDark ? "text-[#f4f1ea] placeholder-neutral-600" : "text-neutral-800 placeholder-neutral-400"
                } custom-scrollbar`}
            />

            <div className={`flex items-center justify-end mt-3 pt-3 border-t ${isDark ? "border-white/5" : "border-neutral-100"}`}>
                <button
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    className={`p-2.5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        text.trim()
                        ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95"
                        : isDark ? "bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-50" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    }`}
                >
                    <PaperPlaneRight size={20} weight="fill" />
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

    const handleSend = async (promptText: string, selectedMode: string) => {
        setIsLoading(true);
        setError(null);
        setSubmitted(false);
        setAnswers({});
        setCurrentQuestionIndex(0);

        try {
            const response = await SendQuizMessage(promptText, selectedMode, 0.5);
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
                <div className="w-full max-w-3xl mt-12">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">Interactive Quiz</h2>
                        <p className={`text-sm ${isDark ? "opacity-50" : "text-neutral-500"}`}>Sfida la tua mente con quiz generati dall'AI.</p>
                    </div>

                    {/* Input View */}
                    {quiz.length === 0 && !isLoading && (
                        <div className="flex justify-center animate-in fade-in zoom-in duration-500">
                            <QuizTextbar onSubmit={handleSend} isDark={isDark} />
                        </div>
                    )}

                    {/* Loading View */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center mt-12 space-y-4">
                            <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Generazione in corso...</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className={`mt-5 text-sm rounded-xl border px-4 py-3 ${isDark ? "border-red-900/50 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
                            {error}
                        </div>
                    )}

                    {/* Quiz View */}
                    {quiz.length > 0 && currentQuestion && (
                        <div className="mt-6 space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Progress */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest opacity-60">
                                    <span>Domanda {currentQuestionIndex + 1} di {quiz.length}</span>
                                    <span>{Math.round(((currentQuestionIndex + 1) / quiz.length) * 100)}%</span>
                                </div>
                                <div className={`h-1.5 w-full rounded-full ${isDark ? "bg-white/5" : "bg-neutral-100"}`}>
                                    <div 
                                        className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Card Domanda */}
                            <div className={`p-8 rounded-[2rem] border shadow-2xl transition-all ${isDark ? "bg-[#0d0d12] border-white/10" : "bg-white border-neutral-200"}`}>
                                <h3 className="text-xl font-bold mb-8 leading-tight">{currentQuestion.domanda}</h3>
                                
                                <div className="grid gap-3">
                                    {optionKeys.map((key) => {
                                        const isSelected = answers[currentQuestionIndex] === key;
                                        const isCorrect = currentQuestion.rispostaCorretta === key;
                                        
                                        let btnStyle = isDark ? "bg-white/[0.02] border-white/5" : "bg-neutral-50 border-neutral-100";
                                        
                                        if (submitted) {
                                            if (isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-500";
                                            else if (isSelected) btnStyle = "bg-red-500/20 border-red-500/50 text-red-500";
                                            else btnStyle = "opacity-40 cursor-not-allowed border-transparent";
                                        } else if (isSelected) {
                                            btnStyle = "border-orange-500 bg-orange-500/10 text-orange-500 translate-x-1";
                                        }

                                        return (
                                            <button
                                                key={key}
                                                disabled={submitted}
                                                onClick={() => handleSelect(key)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all  ${btnStyle}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[10px] ${
                                                        isSelected ? "bg-orange-500 border-none text-white" : "border-current opacity-50"
                                                    }`}>{key}</span>
                                                    {currentQuestion.opzioni[key]}
                                                </div>
                                                {submitted && isCorrect && <CheckCircle2 size={18} />}
                                                {submitted && isSelected && !isCorrect && <XCircle size={18} />}
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
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-neutral-500/10 disabled:opacity-20 font-bold text-xs uppercase"
                                >
                                    <ChevronLeft size={16} /> Indietro
                                </button>
                                <button 
                                    disabled={currentQuestionIndex === quiz.length - 1}
                                    onClick={() => setCurrentQuestionIndex(i => i + 1)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-neutral-500/10 disabled:opacity-20 font-bold text-xs uppercase"
                                >
                                    Avanti <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Risultato o Conferma */}
                            {!submitted ? (
                                <button 
                                    onClick={handleSubmitAnswers}
                                    className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                                >
                                    Conferma Challenge
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`p-6 rounded-3xl border flex items-center justify-between ${isDark ? "bg-orange-500/5 border-orange-500/20" : "bg-orange-50 border-orange-200"}`}>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Punteggio Finale</p>
                                            <p className="text-3xl font-black">{score} / {quiz.length}</p>
                                        </div>
                                        <div className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold">
                                            {Math.round((score/quiz.length)*100)}% SUCCESS
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleResetQuiz}
                                        className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={18} /> Nuova Sfida
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default QuizPage;