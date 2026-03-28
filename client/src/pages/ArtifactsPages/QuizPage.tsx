import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LightningIcon, PaperPlaneRight } from "@phosphor-icons/react";
import type { SelectOption } from "../../components/other/SelectPopup";
import { BrainIcon, CheckCircle2, ChevronLeft, ChevronRight, GaugeIcon, RotateCcw, XCircle } from "lucide-react";
import SelectPopup from "../../components/other/SelectPopup";
import { SendQuizMessage, type QuizQuestion } from "../../library/sendMessage";

// --- NUOVO COMPONENTE: QuizTextbar ---
const QuizTextbar = ({
    onSubmit,
    isDark
}: {
    onSubmit: (text: string, mode: string) => void,
    isDark: boolean
}) => {
    const [text, setText] = useState("");
    const [mode, setMode] = useState("standard");

    const REASONING: SelectOption<string>[] = [
        { label: "Veloce", value: "fast", icon: <LightningIcon size={16} />, description: "Risposte rapide" },
        { label: "Standard", value: "standard", icon: <GaugeIcon size={16} />, description: "Bilanciato" },
        { label: "Accurato", value: "accurate", icon: <BrainIcon size={16} />, description: "Più preciso" },
    ];
    const handleSubmit = () => {
        if (!text.trim()) return;
        onSubmit(text, mode);
        setText(""); // Svuota la textarea dopo l'invio
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={`sm:max-w-3xl w-full flex flex-col rounded-2xl border p-3 shadow-sm transition-colors ${isDark
            ? "bg-neutral-900 border-neutral-700 focus-within:border-emerald-500/50"
            : "bg-white border-neutral-200 focus-within:border-emerald-500/50"
            }`}>
            {/* TEXTAREA */}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Argomento del quiz (es. Rivoluzione Francese, React Hooks...)"
                className={`w-full resize-none bg-transparent outline-none text-sm max-h-32 min-h-[60px] ${isDark ? "text-neutral-200 placeholder-neutral-500" : "text-neutral-800 placeholder-neutral-400"
                    } custom-scrollbar`}
            />

            {/* CONTROLLI INFERIORI (Mode + Bottone) */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-transparent">
                <div className="flex items-center gap-2">
                    <label className={`text-xs font-medium ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        Modalità:
                    </label>
                    <SelectPopup options={REASONING} value={mode} onChange={setMode} />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    className={`p-2 rounded-full flex items-center justify-center transition-all ${text.trim()
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer shadow-md"
                        : isDark
                            ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                            : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        }`}
                >
                    <PaperPlaneRight size={20} weight="fill" />
                </button>
            </div>
        </div>
    );
};

// --- PAGINA PRINCIPALE ---
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

        const response = await SendQuizMessage(promptText, selectedMode);
        if (response.success) {
            setQuiz(response.data);
        } else {
            setQuiz([]);
            setError(response.error || "Errore nella generazione del quiz.");
        }

        setIsLoading(false);
    };

    const optionKeys: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
    const currentQuestion = quiz[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;

    const handleSelect = (questionIndex: number, option: "A" | "B" | "C" | "D") => {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
    };

    const handleSubmitAnswers = () => {
        if (Object.keys(answers).length !== quiz.length) {
            setError("Seleziona una risposta per ogni domanda prima di confermare.");
            return;
        }
        setError(null);
        setSubmitted(true);
    };

    const score = quiz.reduce((acc, q, idx) => {
        if (answers[idx] === q.rispostaCorretta) return acc + 1;
        return acc;
    }, 0);

    const handleResetQuiz = () => {
        setQuiz([]);
        setAnswers({});
        setSubmitted(false);
        setCurrentQuestionIndex(0);
        setError(null);
    };

    const canGoPrev = currentQuestionIndex > 0;
    const canGoNext = currentQuestionIndex < quiz.length - 1;

    const styles = {
        wrapper: `flex flex-col h-screen w-full overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        main: `flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden relative w-full min-w-0 p-4`,
    };

    return (
        <div className={styles.wrapper}>
            <main className={styles.main}>
                <div className="w-full max-w-3xl mt-8">
                    <div className={`text-center mb-6 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                        <h2 className="text-2xl font-semibold mb-2 text-emerald-500">Generatore di Quiz</h2>
                        <p className="text-sm">Inserisci un testo o un argomento e genera un quiz a risposta multipla.</p>
                    </div>

                    {quiz.length === 0 && <QuizTextbar onSubmit={handleSend} isDark={isDark} />}

                    {isLoading && (
                        <div className={`mt-5 text-sm ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                            Generazione quiz in corso...
                        </div>
                    )}

                    {error && (
                        <div className={`mt-5 text-sm rounded-lg border px-3 py-2 ${isDark ? "border-red-900/50 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
                            {error}
                        </div>
                    )}

                    {quiz.length > 0 && currentQuestion && (
                        <div className="mt-6 space-y-4 pb-10">
                            <div className="flex items-center justify-between text-sm">
                                <p className={isDark ? "text-neutral-400" : "text-neutral-600"}>
                                    Domanda {currentQuestionIndex + 1} di {quiz.length}
                                </p>
                                <p className={isDark ? "text-neutral-400" : "text-neutral-600"}>
                                    Risposte date: {answeredCount}/{quiz.length}
                                </p>
                            </div>

                            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-neutral-800" : "bg-neutral-200"}`}>
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
                                />
                            </div>

                            <div className={`rounded-xl border p-4 ${isDark ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white"}`}>
                                <h3 className={`font-medium mb-3 ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                                    {currentQuestionIndex + 1}. {currentQuestion.domanda}
                                </h3>

                                <div className="space-y-2">
                                    {optionKeys.map((optionKey) => {
                                        const selected = answers[currentQuestionIndex] === optionKey;
                                        const isCorrect = currentQuestion.rispostaCorretta === optionKey;
                                        const showFeedback = submitted;

                                        // Classi fisse per tutti gli stati
                                        const commonStyle = "border-2 transition-colors";

                                        // 1. Determiniamo lo STILE DI BASE (quando l'opzione non è né selezionata né in fase di feedback)
                                        let dynamicStyle = isDark
                                            ? "border-neutral-700 hover:border-neutral-500 text-neutral-100 bg-neutral-900/50"
                                            : "border-neutral-300 hover:border-neutral-500 text-neutral-900 bg-white";

                                        // 2. Sovrascriviamo se è SELEZIONATA (ma non ancora confermata)
                                        if (!showFeedback && selected) {
                                            dynamicStyle = isDark
                                                ? "border-emerald-500 bg-emerald-500/20 text-emerald-100 ring-2 ring-emerald-500/50" // Ho regolato i colori per renderli più evidenti
                                                : "border-emerald-600 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500/50";
                                        }

                                        // 3. Sovrascriviamo se c'è il FEEDBACK (quiz confermato)
                                        if (showFeedback) {
                                            if (isCorrect) {
                                                // È la risposta giusta (indipendentemente da se l'abbiamo selezionata o no)
                                                dynamicStyle = isDark
                                                    ? "border-emerald-500 bg-emerald-500/40 text-white ring-2 ring-emerald-500/70"
                                                    : "border-emerald-600 bg-emerald-200 text-emerald-950 ring-2 ring-emerald-600/50";
                                            } else if (selected) {
                                                // L'abbiamo selezionata ed è sbagliata
                                                dynamicStyle = isDark
                                                    ? "border-red-500 bg-red-500/35 text-white ring-2 ring-red-500/70"
                                                    : "border-red-600 bg-red-200 text-red-950 ring-2 ring-red-600/50";
                                            } else {
                                                // Non selezionata e non corretta (rimane grigia/neutra, disabilitata visivamente)
                                                dynamicStyle = isDark
                                                    ? "border-neutral-800 text-neutral-500 bg-neutral-900/30 opacity-50"
                                                    : "border-neutral-200 text-neutral-400 bg-neutral-50 opacity-50";
                                            }
                                        }

                                        const stateBadge = showFeedback
                                            ? isCorrect
                                                ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-700 text-white"}`}>
                                                        <CheckCircle2 size={12} />
                                                        Corretta
                                                    </span>
                                                )
                                                : selected
                                                    ? (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isDark ? "bg-red-500/20 text-red-300" : "bg-red-700 text-white"}`}>
                                                            <XCircle size={12} />
                                                            Errata
                                                        </span>
                                                    )
                                                    : null
                                            : null;

                                        return (
                                            <button
                                                type="button"
                                                key={optionKey}
                                                disabled={showFeedback} // Disabilita il clic se il quiz è confermato
                                                onClick={() => handleSelect(currentQuestionIndex, optionKey)}
                                                className={`w-full text-left rounded-lg px-3 py-3 text-sm ${commonStyle} ${dynamicStyle}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="font-bold mr-2">{optionKey}.</span>
                                                        <span className="font-medium">{currentQuestion.opzioni[optionKey]}</span>
                                                    </div>
                                                    {stateBadge}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                                    disabled={!canGoPrev}
                                    className={`rounded-xl border py-2.5 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${canGoPrev
                                        ? isDark
                                            ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                                            : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                                        : isDark
                                            ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
                                            : "border-neutral-200 text-neutral-400 cursor-not-allowed"
                                        }`}
                                >
                                    <ChevronLeft size={16} />
                                    Precedente
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                                    disabled={!canGoNext}
                                    className={`rounded-xl border py-2.5 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${canGoNext
                                        ? isDark
                                            ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                                            : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                                        : isDark
                                            ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
                                            : "border-neutral-200 text-neutral-400 cursor-not-allowed"
                                        }`}
                                >
                                    Successiva
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {!submitted ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSubmitAnswers}
                                        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 transition-colors"
                                    >
                                        Conferma Quiz
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResetQuiz}
                                        className={`w-full rounded-xl border py-3 font-medium transition-colors flex items-center justify-center gap-2 ${isDark ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"}`}
                                    >
                                        <RotateCcw size={16} />
                                        Nuovo Quiz
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className={`rounded-xl border px-5 py-4 ${isDark ? "border-emerald-400/50 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-100" : "border-emerald-400 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900"}`}>
                                        <p className={`text-xs uppercase tracking-wide ${isDark ? "text-emerald-200/90" : "text-emerald-800"}`}>
                                            Risultato Finale
                                        </p>
                                        <p className="mt-1 text-2xl font-bold">
                                            {score} / {quiz.length}
                                        </p>
                                        <p className={`mt-1 text-sm ${isDark ? "text-emerald-100/90" : "text-emerald-900/80"}`}>
                                            {Math.round((score / quiz.length) * 100)}% corrette
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResetQuiz}
                                        className={`w-full rounded-xl border py-3 font-medium transition-colors flex items-center justify-center gap-2 ${isDark ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"}`}
                                    >
                                        <RotateCcw size={16} />
                                        Crea un Altro Quiz
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