import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LightningIcon, PaperPlaneRight } from "@phosphor-icons/react";
import type { SelectOption } from "../../components/other/SelectPopup";
import { BrainIcon, GaugeIcon } from "lucide-react";
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
    const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});

    const handleSend = async (promptText: string, selectedMode: string) => {
        setIsLoading(true);
        setError(null);
        setSubmitted(false);
        setAnswers({});

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

    const styles = {
        wrapper: `flex flex-col h-screen w-full overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        main: `flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden relative w-full min-w-0 p-4`,
        footer: `flex-shrink-0 w-full pt-0 pb-6 transition-colors duration-300 z-10 ${isDark ? "bg-neutral-950" : "bg-white"}`
    };

    return (
        <div className={styles.wrapper}>
            <main className={styles.main}>
                <div className="w-full max-w-3xl mt-8">
                    <div className={`text-center mb-6 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                        <h2 className="text-2xl font-semibold mb-2 text-emerald-500">Generatore di Quiz</h2>
                        <p className="text-sm">Inserisci un testo o un argomento e genera un quiz a risposta multipla.</p>
                    </div>

                    <QuizTextbar onSubmit={handleSend} isDark={isDark} />

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

                    {quiz.length > 0 && (
                        <div className="mt-6 space-y-4 pb-10">
                            {quiz.map((q, qIndex) => (
                                <div
                                    key={qIndex}
                                    className={`rounded-xl border p-4 ${isDark ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white"}`}
                                >
                                    <h3 className={`font-medium mb-3 ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                                        {qIndex + 1}. {q.domanda}
                                    </h3>

                                    <div className="space-y-2">
                                        {optionKeys.map((optionKey) => {
                                            const selected = answers[qIndex] === optionKey;
                                            const isCorrect = q.rispostaCorretta === optionKey;
                                            const showFeedback = submitted;

                                            const baseStyle = isDark
                                                ? "border-neutral-700 hover:border-neutral-500 text-neutral-200"
                                                : "border-neutral-200 hover:border-neutral-300 text-neutral-700";

                                            const selectedStyle = selected
                                                ? (isDark ? "border-emerald-500 bg-emerald-500/10" : "border-emerald-500 bg-emerald-50")
                                                : "";

                                            const feedbackStyle = showFeedback
                                                ? isCorrect
                                                    ? (isDark ? "border-emerald-500 bg-emerald-500/10" : "border-emerald-500 bg-emerald-50")
                                                    : selected
                                                        ? (isDark ? "border-red-500 bg-red-500/10" : "border-red-500 bg-red-50")
                                                        : ""
                                                : "";

                                            return (
                                                <button
                                                    type="button"
                                                    key={optionKey}
                                                    onClick={() => handleSelect(qIndex, optionKey)}
                                                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${baseStyle} ${selectedStyle} ${feedbackStyle}`}
                                                >
                                                    <span className="font-semibold mr-2">{optionKey}.</span>
                                                    {q.opzioni[optionKey]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {!submitted ? (
                                <button
                                    type="button"
                                    onClick={handleSubmitAnswers}
                                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 transition-colors"
                                >
                                    Conferma Risposte
                                </button>
                            ) : (
                                <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${isDark ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                                    Punteggio: {score}/{quiz.length}
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