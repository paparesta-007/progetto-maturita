import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
    TreeStructureIcon,
    QuestionIcon,
    ChartBarIcon,
    NotebookIcon,
    TranslateIcon,
    ArrowRightIcon,
    ArrowsSplitIcon,
} from "@phosphor-icons/react";

/* ─── Mini Preview Components ─── */
const TAGS = [
    "Studio", "Produttività", "Analisi", "Report", "Relazioni", "Appunti", "Testi", "Lavoro"
]
const SchemaPreview = ({ isDark }: { isDark: boolean }) => {
    const c = isDark
        ? { bg: "#0d261a", line: "#34d399", node: "#10b981", text: "#a7f3d0", muted: "#065f46" }
        : { bg: "#ecfdf5", line: "#6ee7b7", node: "#10b981", text: "#065f46", muted: "#d1fae5" };
    return (
        <svg viewBox="0 0 240 120" fill="none" className="w-full h-full">
            <rect width="240" height="120" rx="8" fill={c.bg} />
            {/* Central node */}
            <rect x="85" y="10" width="70" height="22" rx="6" fill={c.node} />
            <text x="120" y="25" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">Concetto</text>
            {/* Lines */}
            <line x1="100" y1="32" x2="50" y2="55" stroke={c.line} strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="120" y1="32" x2="120" y2="55" stroke={c.line} strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="140" y1="32" x2="190" y2="55" stroke={c.line} strokeWidth="1.5" strokeDasharray="3 2" />
            {/* Sub-nodes */}
            <rect x="20" y="55" width="60" height="18" rx="5" fill={c.muted} />
            <text x="50" y="67" textAnchor="middle" fontSize="7" fill={c.text}>Sezione A</text>
            <rect x="90" y="55" width="60" height="18" rx="5" fill={c.muted} />
            <text x="120" y="67" textAnchor="middle" fontSize="7" fill={c.text}>Sezione B</text>
            <rect x="160" y="55" width="60" height="18" rx="5" fill={c.muted} />
            <text x="190" y="67" textAnchor="middle" fontSize="7" fill={c.text}>Sezione C</text>
            {/* Bottom leaves */}
            <line x1="50" y1="73" x2="35" y2="90" stroke={c.line} strokeWidth="1" />
            <line x1="50" y1="73" x2="65" y2="90" stroke={c.line} strokeWidth="1" />
            <circle cx="35" cy="93" r="5" fill={c.node} opacity="0.5" />
            <circle cx="65" cy="93" r="5" fill={c.node} opacity="0.5" />
            <line x1="120" y1="73" x2="120" y2="90" stroke={c.line} strokeWidth="1" />
            <circle cx="120" cy="93" r="5" fill={c.node} opacity="0.5" />
        </svg>
    );
};

const QuizPreview = ({ isDark }: { isDark: boolean }) => {
    const c = isDark
        ? { bg: "#0c1629", card: "#1e293b", border: "#334155", text: "#94a3b8", accent: "#3b82f6", check: "#22c55e", accentBg: "#1e3a5f" }
        : { bg: "#eff6ff", card: "#ffffff", border: "#bfdbfe", text: "#475569", accent: "#3b82f6", check: "#22c55e", accentBg: "#dbeafe" };
    return (
        <svg viewBox="0 0 240 120" fill="none" className="w-full h-full">
            <rect width="240" height="120" rx="8" fill={c.bg} />
            {/* Question */}
            <text x="20" y="22" fontSize="8" fontWeight="700" fill={c.accent}>Domanda 1/10</text>
            <rect x="16" y="28" width="130" height="6" rx="3" fill={c.border} />
            {/* Options */}
            <rect x="16" y="44" width="208" height="16" rx="5" fill={c.card} stroke={c.check} strokeWidth="1.5" />
            <circle cx="28" cy="52" r="4" fill={c.check} />
            <text x="36" y="55" fontSize="7" fill={c.text}>Risposta corretta ✓</text>
            <rect x="16" y="66" width="208" height="16" rx="5" fill={c.card} stroke={c.border} strokeWidth="1" />
            <circle cx="28" cy="74" r="4" fill={c.border} />
            <text x="36" y="77" fontSize="7" fill={c.text}>Opzione B</text>
            <rect x="16" y="88" width="208" height="16" rx="5" fill={c.card} stroke={c.border} strokeWidth="1" />
            <circle cx="28" cy="96" r="4" fill={c.border} />
            <text x="36" y="99" fontSize="7" fill={c.text}>Opzione C</text>
        </svg>
    );
};

const MindmapPreview = ({ isDark }: { isDark: boolean }) => {
    const c = isDark
        ? { bg: "#1a0d2e", node: "#8b5cf6", line: "#7c3aed", leaf: "#a78bfa", muted: "#2e1065", text: "#e9d5ff" }
        : { bg: "#f5f3ff", node: "#8b5cf6", line: "#c4b5fd", leaf: "#a78bfa", muted: "#ede9fe", text: "#5b21b6" };
    return (
        <svg viewBox="0 0 240 120" fill="none" className="w-full h-full">
            <rect width="240" height="120" rx="8" fill={c.bg} />
            {/* Center */}
            <circle cx="120" cy="60" r="18" fill={c.node} />
            <text x="120" y="63" textAnchor="middle" fontSize="7" fontWeight="700" fill="white">Tema</text>
            {/* Branches */}
            <line x1="102" y1="55" x2="45" y2="30" stroke={c.line} strokeWidth="2" />
            <line x1="138" y1="55" x2="195" y2="30" stroke={c.line} strokeWidth="2" />
            <line x1="102" y1="65" x2="45" y2="95" stroke={c.line} strokeWidth="2" />
            <line x1="138" y1="65" x2="195" y2="95" stroke={c.line} strokeWidth="2" />
            <line x1="120" y1="42" x2="120" y2="15" stroke={c.line} strokeWidth="2" />
            {/* Nodes */}
            <circle cx="45" cy="27" r="12" fill={c.muted} />
            <text x="45" y="30" textAnchor="middle" fontSize="6" fill={c.text}>Idea</text>
            <circle cx="195" cy="27" r="12" fill={c.muted} />
            <text x="195" y="30" textAnchor="middle" fontSize="6" fill={c.text}>Link</text>
            <circle cx="45" cy="97" r="12" fill={c.muted} />
            <text x="45" y="100" textAnchor="middle" fontSize="6" fill={c.text}>Note</text>
            <circle cx="195" cy="97" r="12" fill={c.muted} />
            <text x="195" y="100" textAnchor="middle" fontSize="6" fill={c.text}>Ref</text>
            <circle cx="120" cy="12" r="10" fill={c.muted} />
            <text x="120" y="15" textAnchor="middle" fontSize="6" fill={c.text}>?</text>
        </svg>
    );
};

const AnalysisPreview = ({ isDark }: { isDark: boolean }) => {
    const c = isDark
        ? { bg: "#1a1400", bar1: "#f59e0b", bar2: "#d97706", bar3: "#fbbf24", grid: "#292524", text: "#a3a3a3" }
        : { bg: "#fffbeb", bar1: "#f59e0b", bar2: "#d97706", bar3: "#fbbf24", grid: "#fde68a", text: "#78716c" };
    const bars = [38, 62, 50, 78, 45, 90, 55, 72];
    return (
        <svg viewBox="0 0 240 120" fill="none" className="w-full h-full">
            <rect width="240" height="120" rx="8" fill={c.bg} />
            {/* Grid lines */}
            {[30, 50, 70, 90].map(y => (
                <line key={y} x1="30" y1={y} x2="225" y2={y} stroke={c.grid} strokeWidth="0.5" />
            ))}
            {/* Bars */}
            {bars.map((h, i) => (
                <rect
                    key={i}
                    x={35 + i * 24}
                    y={105 - h}
                    width="16"
                    height={h}
                    rx="3"
                    fill={[c.bar1, c.bar2, c.bar3][i % 3]}
                    opacity={0.8 + (i % 3) * 0.1}
                />
            ))}
            {/* Axis labels */}
            <text x="30" y="115" fontSize="6" fill={c.text}>Gen</text>
            <text x="78" y="115" fontSize="6" fill={c.text}>Mar</text>
            <text x="126" y="115" fontSize="6" fill={c.text}>Mag</text>
            <text x="174" y="115" fontSize="6" fill={c.text}>Lug</text>
            {/* Y axis */}
            <text x="12" y="33" fontSize="5" fill={c.text}>100</text>
            <text x="16" y="73" fontSize="5" fill={c.text}>50</text>
        </svg>
    );
};

const FlashcardPreview = ({ isDark }: { isDark: boolean }) => {
    const c = isDark
        ? { bg: "#0d1117", card: "#1e293b", accent: "#6366f1", text: "#f8fafc", border: "#334155" }
        : { bg: "#f8fafc", card: "#ffffff", accent: "#4f46e5", text: "#1e293b", border: "#e2e8f0" };
    return (
        <svg viewBox="0 0 240 120" fill="none" className="w-full h-full">
            <rect width="240" height="120" rx="8" fill={c.bg} />
            {/* Main card */}
            <rect x="60" y="20" width="120" height="80" rx="12" fill={c.card} stroke={c.border} strokeWidth="1" />
            <rect x="80" y="45" width="80" height="4" rx="2" fill={c.accent} opacity="0.3" />
            <rect x="90" y="55" width="60" height="4" rx="2" fill={c.accent} opacity="0.3" />
            <circle cx="120" cy="85" r="4" fill={c.accent} />
        </svg>
    );
};

const TranslatePreview = ({ isDark }: { isDark: boolean }) => {
    const c = isDark
        ? { bg: "#0c1a29", left: "#1e293b", right: "#164e63", arrow: "#22d3ee", text1: "#94a3b8", text2: "#a5f3fc", border: "#334155" }
        : { bg: "#ecfeff", left: "#ffffff", right: "#e0f7fa", arrow: "#06b6d4", text1: "#475569", text2: "#0e7490", border: "#cffafe" };
    return (
        <svg viewBox="0 0 240 120" fill="none" className="w-full h-full">
            <rect width="240" height="120" rx="8" fill={c.bg} />
            {/* Left panel */}
            <rect x="12" y="12" width="100" height="96" rx="8" fill={c.left} stroke={c.border} strokeWidth="1" />
            <text x="22" y="28" fontSize="6" fontWeight="700" fill={c.text1}>🇮🇹 Italiano</text>
            <rect x="22" y="36" width="70" height="5" rx="2" fill={c.border} />
            <rect x="22" y="46" width="55" height="5" rx="2" fill={c.border} />
            <rect x="22" y="56" width="65" height="5" rx="2" fill={c.border} />
            <rect x="22" y="66" width="40" height="5" rx="2" fill={c.border} />
            {/* Arrow */}
            <polygon points="122,55 130,60 122,65" fill={c.arrow} />
            <line x1="118" y1="60" x2="130" y2="60" stroke={c.arrow} strokeWidth="2" />
            {/* Right panel */}
            <rect x="138" y="12" width="90" height="96" rx="8" fill={c.right} stroke={c.arrow} strokeWidth="1" opacity="0.6" />
            <text x="148" y="28" fontSize="6" fontWeight="700" fill={c.text2}>🇬🇧 English</text>
            <rect x="148" y="36" width="65" height="5" rx="2" fill={c.arrow} opacity="0.25" />
            <rect x="148" y="46" width="50" height="5" rx="2" fill={c.arrow} opacity="0.25" />
            <rect x="148" y="56" width="60" height="5" rx="2" fill={c.arrow} opacity="0.25" />
            <rect x="148" y="66" width="35" height="5" rx="2" fill={c.arrow} opacity="0.25" />
        </svg>
    );
};

/* ─── Data ─── */

interface ArtifactCard {
    icon: React.ReactNode;
    label: string;
    description: string;
    route: string;
    tags: string[];
    accentColor: string;
    Preview: React.FC<{ isDark: boolean }>;
}

const ARTIFACTS: ArtifactCard[] = [
    {
        icon: <TreeStructureIcon size={20} weight="duotone" />,
        label: "Schema Riassuntivo",
        description: "Genera uno schema visivo ad albero che sintetizza i concetti chiave in modo logico e strutturato. Ottimo per semplificare appunti complessi, evidenziare gerarchie tra gli argomenti e avere a colpo d'occhio tutta l'architettura informativa di un intero capitolo di studio o documento aziendale.",
        route: "/app/artifacts/schema",
        tags: ["Studio", "Sintesi", "Produttività", "Appunti"],
        accentColor: "text-emerald-500",
        Preview: SchemaPreview,
    },
    {
        icon: <QuestionIcon size={20} weight="duotone" />,
        label: "Quiz Interattivo",
        description: "Mettiti alla prova creando automaticamente un percorso di test a risposta multipla basato sui tuoi appunti. L'intelligenza artificiale formula domande bilanciate per difficoltà, proponendo trabocchetti e varianti per verificare la tua reale comprensione dell'argomento prima di un esame o di una presentazione.",
        route: "/app/artifacts/quiz",
        tags: ["Studio", "Ripasso", "Verifica", "Gamification"],
        accentColor: "text-blue-500",
        Preview: QuizPreview,
    },
    {
        icon: <ArrowsSplitIcon size={20} weight="duotone" />,
        label: "Mappa Concettuale",
        description: "Esplora come le idee si intrecciano tra loro tramite una mappa di nodi connessi. Permette di visualizzare le relazioni trasversali tra idee e concetti apparentemente distanti, stimolando il ragionamento creativo e garantendo una comprensione profonda della materia in tutte le sue sfaccettature.",
        route: "/app/artifacts/mindmap",
        tags: ["Creatività", "Brainstorming", "Sintesi", "Relazioni"],
        accentColor: "text-violet-500",
        Preview: MindmapPreview,
    },
    {
        icon: <ChartBarIcon size={20} weight="duotone" />,
        label: "Analisi Dati",
        description: "Rivoluziona il modo in cui leggi tabelle o resoconti numerici. Estrapola le metriche più importanti, individua i trend nascosti e ottieni grafici pronti all'uso, accompagnati da insight generati dall'AI che spiegano chiaramente il significato dietro a statistiche, andamenti aziendali o set di dati complessi.",
        route: "/app/artifacts/analysis",
        tags: ["Dati", "Azienda", "Statistica", "Report"],
        accentColor: "text-amber-500",
        Preview: AnalysisPreview,
    },
    {
        icon: <NotebookIcon size={20} weight="duotone" />,
        label: "Flashcard",
        description: "Trasforma interi blocchi di testo noioso in veloci e comode flashcard digitali pronte per essere sfogliate. La tecnica della ripetizione spaziata (Spaced Repetition) combinata al front/back delle card ti consentirà di fissare velocemente date, vocaboli, definizioni e formule senza inutili sforzi mnemonici.",
        route: "/app/artifacts/flashcards",
        tags: ["Studio", "Memorizzazione", "Ripasso", "Vocaboli"],
        accentColor: "text-indigo-500",
        Preview: FlashcardPreview,
    },
    {
        icon: <TranslateIcon size={20} weight="duotone" />,
        label: "Traduttore Contestuale",
        description: "Non una semplice traduzione letterale, ma un vero lavoro di mediazione linguistica. Oltre a preservare la correttezza grammaticale, questo strumento analizza la natura del testo di partenza per mantenere intatto il registro linguistico, il tono di voce originale e ogni sfumatura di contesto culturale essenziale.",
        route: "/app/artifacts/translate",
        tags: ["Lingue", "Testi", "Lavoro", "Bilingue"],
        accentColor: "text-cyan-500",
        Preview: TranslatePreview,
    },
];

/* ─── Page ─── */

const ArtifactsPage: React.FC = () => {
    const { theme } = useAuth();
    const navigate = useNavigate();
    const isDark = theme === "dark";

    return (
        <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`}>
            {/* Header */}
            <div className="px-8 pt-8 pb-2 shrink-0">
                <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}>
                    Artefatti
                </h1>
                <p className={`mt-1 text-sm ${isDark ? "text-neutral-500" : "text-neutral-500"}`}>
                    Strumenti AI per generare contenuti strutturati a partire da testi e dati.
                </p>
                <div className="flex gap-2 mt-2">
                    {TAGS.map((tag, i) => (
                        <span key={i} className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${isDark ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-neutral-100 text-neutral-600 border border-neutral-200"}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                <div className="flex flex-col gap-6 w-full max-w-[1400px]">
                    {ARTIFACTS.map((artifact, i) => {
                        const Preview = artifact.Preview;

                        return (
                            <motion.button
                                key={artifact.route}
                                onClick={() => navigate(artifact.route)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
                                className={`group relative flex flex-col sm:flex-row rounded-2xl border cursor-pointer transition-all  overflow-hidden text-left ${isDark
                                    ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80"
                                    : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50"
                                    }`}
                            >
                                {/* Left Side: Preview area */}
                                <div className={`relative w-full sm:w-80 lg:w-96 min-h-[160px] flex-shrink-0 overflow-hidden border-b sm:border-b-0 sm:border-r ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"}`}>
                                    <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
                                        <Preview isDark={isDark} />
                                    </div>
                                    <div className={`absolute inset-x-0 bottom-0 h-8 sm:w-10 sm:h-full sm:right-0 sm:bottom-auto bg-gradient-to-t sm:bg-gradient-to-r ${isDark ? "from-neutral-900/90 sm:from-neutral-800/80" : "from-white/80 sm:from-white/60"} pointer-events-none`} />
                                </div>

                                {/* Right Side: Info area */}
                                <div className="flex flex-col p-5 w-full">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${isDark
                                            ? "bg-neutral-800 text-neutral-400 group-hover:text-white"
                                            : "bg-neutral-100 text-neutral-500 group-hover:text-neutral-900"
                                            }`}>
                                            {artifact.icon}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8 relative">
                                            <span className={`text-base font-semibold block ${isDark ? "text-white" : "text-neutral-900"}`}>
                                                {artifact.label}
                                            </span>
                                            <p className={`text-sm leading-relaxed mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                                                {artifact.description}
                                            </p>

                                            <ArrowRightIcon
                                                size={16}
                                                weight="bold"
                                                className={`absolute right-0 top-1 flex-shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Bottom Tag Row */}
                                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                                        {artifact.tags.map(tag => (
                                            <span key={tag} className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors ${isDark
                                                ? "bg-neutral-800/50 border-neutral-700 text-neutral-300 group-hover:bg-neutral-800"
                                                : "bg-neutral-50 border-neutral-200 text-neutral-600 group-hover:bg-neutral-100 group-hover:border-neutral-300"
                                                }`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ArtifactsPage; 