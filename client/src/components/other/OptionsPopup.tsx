import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    CaretDownIcon,
    CaretRightIcon,
    ArrowLeftIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    ThermometerIcon,
    ShieldCheckIcon,
    CpuIcon,
    SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import getModels from "../../services/openRouter/getModels";

const PROVIDER_LOGOS: Record<string, string> = {
    Google: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/960px-Google-gemini-icon.svg.png",
    OpenAI: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS3PwERLLNB9XKFpeMgAMPxl5VvN3HRJnXQQ&s",
    Anthropic: "https://images.yourstory.com/cs/images/companies/anthropicresearchlogo-1699260041449.jpg?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=1920&q=75",
    "Mistral AI": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9tjl3-up4Vemom1ZYPTnWkg5dXOXFtPQDBw&s",
    NVIDIA: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvkRmsL7mAkXKS19fL0lQAMsck4AjD1WZy4Q&s",
    Qwen: "https://opencv.org/wp-content/uploads/2025/01/MIhJKlK5yVR3axxgE7_gHL-rsKjliShJKd3asUqg5KDdEsdOGut-9mCW4Ti1x7i2y8zCkxeZHQFR00sQg6BfYA.png",
    "Free Models": "https://t3.ftcdn.net/jpg/05/83/74/28/360_F_583742888_L0dIi5d23qJ2rteSlXMeMDGNsnLxbkjB.jpg",
};
const FALLBACK_LOGO =
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwNS1wLnBuZw.png";

type View = "main" | "model";

const slideVariants = {
    enterFromRight: { x: 40, opacity: 0 },
    enterFromLeft: { x: -40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToLeft: { x: -40, opacity: 0 },
    exitToRight: { x: 40, opacity: 0 },
};

const OptionsPopup: React.FC = () => {
    const { model, setModel, isStreamTextEnabled, setIsStreamTextEnabled } = useChat();
    const { theme } = useAuth();
    const isDark = theme === "dark";

    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<View>("main");
    const [temperature, setTemperature] = useState(1.0);
    const [tempExpanded, setTempExpanded] = useState(false);
    const [safetyEnabled, setSafetyEnabled] = useState(true);

    // Model list state
    const [models, setModels] = useState<any[]>([]);
    const [filteredModels, setFilteredModels] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);

    const groupedModels = filteredModels.reduce((acc: Record<string, any[]>, m) => {
        const p = m.provider || "Unknown";
        if (!acc[p]) acc[p] = [];
        acc[p].push(m);
        return acc;
    }, {});

    useEffect(() => {
        getModels().then((data) => {
            setModels(data);
            setFilteredModels(data);
        });
    }, []);

    useEffect(() => {
        if (!isOpen) {
            // reset to main when closed
            setTimeout(() => setView("main"), 200);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const rowBase = `flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
        isDark ? "text-neutral-300 hover:bg-neutral-800 hover:text-white" : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
    }`;

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen((p) => !p)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors select-none ${
                    isDark
                        ? "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                }`}
            >
                <SlidersHorizontalIcon size={15} />
                <span>Options</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <CaretDownIcon size={12} />
                </motion.span>
            </button>

            {/* Popup */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute bottom-full left-0 mb-2 w-72 rounded-xl border shadow-xl z-50 overflow-hidden ${
                            isDark
                                ? "bg-neutral-900 border-neutral-800 shadow-black/40"
                                : "bg-white border-neutral-200 shadow-black/10"
                        }`}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {/* ── MAIN VIEW ── */}
                            {view === "main" && (
                                <motion.div
                                    key="main"
                                    variants={slideVariants}
                                    initial="enterFromLeft"
                                    animate="center"
                                    exit="exitToLeft"
                                    transition={{ duration: 0.18, ease: "easeInOut" }}
                                    className="p-1.5 flex flex-col gap-0.5"
                                >
                                    {/* Section label */}
                                    <span className={`px-3 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                        isDark ? "text-neutral-500" : "text-neutral-400"
                                    }`}>
                                        Options
                                    </span>

                                    {/* --- Model row --- */}
                                    <button
                                        type="button"
                                        className={rowBase}
                                        onClick={() => setView("model")}
                                    >
                                        <CpuIcon size={14} className="text-neutral-400 flex-shrink-0" />
                                        <span className="flex-1">Model</span>
                                        <span className={`text-xs truncate max-w-[100px] text-right mr-1 ${
                                            isDark ? "text-neutral-500" : "text-neutral-400"
                                        }`}>
                                            {model?.name ?? "None"}
                                        </span>
                                        <CaretRightIcon size={12} className="text-neutral-400 flex-shrink-0" />
                                    </button>

                                    {/* Divider */}
                                    <div className={`mx-2 my-1 h-px ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`} />

                                    {/* --- Temperature row --- */}
                                    <button
                                        type="button"
                                        className={rowBase}
                                        onClick={() => setTempExpanded((p) => !p)}
                                    >
                                        <ThermometerIcon size={14} className="text-neutral-400 flex-shrink-0" />
                                        <span className="flex-1">Temperature</span>
                                        <span className={`text-xs font-mono mr-1 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                                            {temperature.toFixed(1)}
                                        </span>
                                        <motion.span
                                            animate={{ rotate: tempExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <CaretRightIcon size={12} className="text-neutral-400" />
                                        </motion.span>
                                    </button>

                                    <AnimatePresence>
                                        {tempExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="overflow-hidden px-3 pb-1"
                                            >
                                                <div className="flex items-center gap-2 pt-1">
                                                    <span className={`text-[11px] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>0</span>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={2}
                                                        step={0.1}
                                                        value={temperature}
                                                        onChange={(e) => setTemperature(Number(e.target.value))}
                                                        className={`flex-1 h-1 cursor-pointer accent-neutral-500`}
                                                    />
                                                    <span className={`text-[11px] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>2</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* --- Safety row --- */}
                                    <button
                                        type="button"
                                        className={rowBase}
                                        onClick={() => setSafetyEnabled((p) => !p)}
                                    >
                                        <ShieldCheckIcon size={14} className="text-neutral-400 flex-shrink-0" />
                                        <span className="flex-1">Safety filter</span>
                                        <span className={`w-4 h-4 flex items-center justify-center rounded border transition-colors flex-shrink-0 ${
                                            safetyEnabled
                                                ? isDark
                                                    ? "bg-neutral-100 border-neutral-100"
                                                    : "bg-neutral-900 border-neutral-900"
                                                : isDark
                                                    ? "border-neutral-600"
                                                    : "border-neutral-300"
                                        }`}>
                                            {safetyEnabled && (
                                                <CheckIcon
                                                    size={10}
                                                    weight="bold"
                                                    className={isDark ? "text-neutral-900" : "text-white"}
                                                />
                                            )}
                                        </span>
                                    </button>

                                    {/* --- Stream text row --- */}
                                    <button
                                        type="button"
                                        className={rowBase}
                                        onClick={() => setIsStreamTextEnabled((p) => !p)}
                                    >
                                        <CpuIcon size={14} className="text-neutral-400 flex-shrink-0" />
                                        <span className="flex-1">Stream text</span>
                                        <span className={`w-4 h-4 flex items-center justify-center rounded border transition-colors flex-shrink-0 ${
                                            isStreamTextEnabled
                                                ? isDark
                                                    ? "bg-neutral-100 border-neutral-100"
                                                    : "bg-neutral-900 border-neutral-900"
                                                : isDark
                                                    ? "border-neutral-600"
                                                    : "border-neutral-300"
                                        }`}>
                                            {isStreamTextEnabled && (
                                                <CheckIcon
                                                    size={10}
                                                    weight="bold"
                                                    className={isDark ? "text-neutral-900" : "text-white"}
                                                />
                                            )}
                                        </span>
                                    </button>

                                    <div className="pb-1" />
                                </motion.div>
                            )}

                            {/* ── MODEL VIEW ── */}
                            {view === "model" && (
                                <motion.div
                                    key="model"
                                    variants={slideVariants}
                                    initial="enterFromRight"
                                    animate="center"
                                    exit="exitToRight"
                                    transition={{ duration: 0.18, ease: "easeInOut" }}
                                    className="flex flex-col"
                                    style={{ maxHeight: "380px" }}
                                >
                                    {/* Header */}
                                    <div className={`flex items-center gap-2 px-2 py-2 border-b ${
                                        isDark ? "border-neutral-800" : "border-neutral-100"
                                    }`}>
                                        <button
                                            type="button"
                                            onClick={() => setView("main")}
                                            className={`p-1 rounded-lg transition-colors ${
                                                isDark ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                                            }`}
                                        >
                                            <ArrowLeftIcon size={14} />
                                        </button>
                                        <MagnifyingGlassIcon size={15} className="text-neutral-400 flex-shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Search models..."
                                            autoFocus
                                            className={`flex-1 bg-transparent text-sm focus:outline-none placeholder-neutral-400 ${
                                                isDark ? "text-neutral-200" : "text-neutral-800"
                                            }`}
                                            value={searchQuery}
                                            onChange={(e) => {
                                                const q = e.target.value.toLowerCase();
                                                setFilteredModels(
                                                    models.filter(
                                                        (m) =>
                                                            m.name.toLowerCase().includes(q) ||
                                                            m.provider.toLowerCase().includes(q)
                                                    )
                                                );
                                                setSearchQuery(e.target.value);
                                            }}
                                        />
                                    </div>

                                    {/* Model list */}
                                    <div className="overflow-y-auto flex-1 p-1.5">
                                        {models.length === 0 ? (
                                            <p className="px-3 py-2 text-sm text-neutral-500">No models available</p>
                                        ) : (
                                            <div className="flex flex-col gap-4">
                                                {Object.entries(groupedModels).map(([providerName, group]) => (
                                                    <div key={providerName}>
                                                        <div className={`flex items-center justify-between px-1 pb-1 mb-1 border-b ${
                                                            isDark ? "border-neutral-800" : "border-neutral-100"
                                                        }`}>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                                {providerName}
                                                            </span>
                                                            <span className="text-[10px] text-neutral-400">{group.length}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            {group.map((m: any, idx: number) => {
                                                                const isSelected = model?.name_id === m.name_id;
                                                                return (
                                                                    <button
                                                                        key={m.model_id ?? idx}
                                                                        type="button"
                                                                        onClick={() => { setModel(m); setView("main"); setIsOpen(false); }}
                                                                        className={`flex items-center justify-between gap-3 w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                                                                            isSelected
                                                                                ? isDark ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-900"
                                                                                : isDark ? "text-neutral-300 hover:bg-neutral-800 hover:text-white" : "text-neutral-700 hover:bg-neutral-100"
                                                                        }`}
                                                                    >
                                                                        <span className="flex items-center gap-2 truncate font-medium leading-snug">
                                                                            <img
                                                                                src={PROVIDER_LOGOS[m.provider] ?? FALLBACK_LOGO}
                                                                                className="w-4 h-4 flex-shrink-0 rounded-sm object-cover"
                                                                                alt=""
                                                                            />
                                                                            <span className="truncate">
                                                                                {m.name.length > 30 ? m.name.slice(0, 30) + "…" : m.name}
                                                                            </span>
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5 flex-shrink-0">
                                                                            <span className={`text-[11px] font-mono ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                                                                                {(Number(m.cost_per_input_token) + Number(m.cost_per_output_token)).toFixed(2)}$
                                                                            </span>
                                                                            {isSelected && (
                                                                                <CheckIcon size={13} weight="bold" className={isDark ? "text-white" : "text-neutral-900"} />
                                                                            )}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OptionsPopup;
