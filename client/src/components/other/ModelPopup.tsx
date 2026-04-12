import React, { useEffect, useRef, useState , useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDownIcon, CheckIcon, MagnifyingGlassIcon, ThermometerIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import getModels from "../../services/openRouter/getModels";

const PROVIDER_LOGOS: Record<string, string> = {
    "Google": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/960px-Google-gemini-icon.svg.png",
    "OpenAI": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS3PwERLLNB9XKFpeMgAMPxl5VvN3HRJnXQQ&s",
    "Anthropic": "https://images.yourstory.com/cs/images/companies/anthropicresearchlogo-1699260041449.jpg?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=1920&q=75",
    "Mistral AI": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9tjl3-up4Vemom1ZYPTnWkg5dXOXFtPQDBw&s",
    "NVIDIA": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvkRmsL7mAkXKS19fL0lQAMsck4AjD1WZy4Q&s",
    "Qwen": "https://opencv.org/wp-content/uploads/2025/01/MIhJKlK5yVR3axxgE7_gHL-rsKjliShJKd3asUqg5KDdEsdOGut-9mCW4Ti1x7i2y8zCkxeZHQFR00sQg6BfYA.png",
    "Free Models": "https://t3.ftcdn.net/jpg/05/83/74/28/360_F_583742888_L0dIi5d23qJ2rteSlXMeMDGNsnLxbkjB.jpg",
};

const FALLBACK_LOGO = "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwNS1wLnBuZw.png";

const ModelPopup = React.forwardRef<HTMLDivElement>((_, modalRef) => {
    const { model, setModel } = useChat();
    const { theme } = useAuth();
    const isDark = theme === "dark";

    const [filteredModels, setFilteredModels] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [models, setModels] = useState<any[]>([]);
    const [temperature, setTemperature] = useState(1.0);
    const [safetyEnabled, setSafetyEnabled] = useState(true);

    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = (modalRef as React.MutableRefObject<HTMLDivElement>) ?? internalRef;

    // ⚡ Bolt Optimization: Memoize the grouping of models to avoid expensive reduction
    // on every render, especially useful since the model list can be large.
    const groupedModels = useMemo(() => {
        return filteredModels.reduce((acc: Record<string, any[]>, m) => {
            const p = m.provider || "Unknown";
            if (!acc[p]) acc[p] = [];
            acc[p].push(m);
            return acc;
        }, {});
    }, [filteredModels]);

    useEffect(() => {
        getModels().then((data) => {
            setModels(data);
            setFilteredModels(data);
        });
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger — same style as SelectPopup */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors select-none ${
                    isDark
                        ? "text-neutral-600 hover:bg-neutral-800 hover:text-neutral-200"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                }`}
            >
                <span>{model ? model.name : "Select a model"}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <CaretDownIcon size={12} />
                </motion.span>
            </button>

            {/* Popup — slide up, same container style as SelectPopup */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute bottom-full left-0 mb-2 w-80 max-h-96 flex flex-col rounded-xl border shadow-xl z-50 ${
                            isDark
                                ? "bg-neutral-900 border-neutral-800 shadow-black/40"
                                : "bg-white border-neutral-200 shadow-black/10"
                        }`}
                    >
                        {/* Search */}
                        <div className={`flex items-center gap-2 px-3 py-2 border-b ${
                            isDark ? "border-neutral-800" : "border-neutral-100"
                        }`}>
                            <MagnifyingGlassIcon size={16} className="text-neutral-600 flex-shrink-0" />
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

                        {/* List */}
                        <div className="overflow-y-auto flex-1 p-1.5" style={{ maxHeight: "260px" }}>
                            {models.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-neutral-500">No models available</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {Object.entries(groupedModels).map(([providerName, group]) => (
                                        <div key={providerName}>
                                            {/* Provider header */}
                                            <div className={`flex items-center justify-between px-1 pb-1 mb-1 border-b ${
                                                isDark ? "border-neutral-800" : "border-neutral-100"
                                            }`}>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                    {providerName}
                                                </span>
                                                <span className="text-[10px] text-neutral-600">
                                                    {group.length}
                                                </span>
                                            </div>

                                            {/* Models — 1 per row */}
                                            <div className="flex flex-col gap-0.5">
                                                {group.map((m: any, idx: number) => {
                                                    const isSelected = model?.name_id === m.name_id;
                                                    return (
                                                        <button
                                                            key={m.model_id ?? idx}
                                                            type="button"
                                                            onClick={() => { setModel(m); setIsOpen(false); }}
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
                                                                    {m.name.length > 32 ? m.name.slice(0, 32) + "…" : m.name}
                                                                </span>
                                                            </span>
                                                            <span className="flex items-center gap-1.5 flex-shrink-0">
                                                                <span className={`text-[11px] font-mono ${isDark ? "text-neutral-500" : "text-neutral-600"}`}>
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

                        {/* Settings footer */}
                        <div className={`border-t px-3 py-2.5 flex flex-col gap-1 ${
                            isDark ? "border-neutral-800" : "border-neutral-100"
                        }`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Parameters</span>

                            {/* Temperature */}
                            <div className="flex items-center gap-3">
                                <ThermometerIcon size={14} className="text-neutral-600 flex-shrink-0" />
                                <span className={`text-sm flex-1 ${
                                    isDark ? "text-neutral-300" : "text-neutral-700"
                                }`}>Temperature</span>
                                <span className={`text-xs font-mono w-8 text-right ${
                                    isDark ? "text-neutral-600" : "text-neutral-500"
                                }`}>{temperature.toFixed(1)}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    value={temperature}
                                    onChange={(e) => setTemperature(Number(e.target.value))}
                                    className="w-24 accent-neutral-500 cursor-pointer"
                                />
                            </div>

                            {/* Safety filter — click row, checkmark on right */}
                            <button
                                type="button"
                                onClick={() => setSafetyEnabled((prev) => !prev)}
                                className={`flex items-center gap-3 w-full px-0 py-1.5 text-sm rounded-lg text-left transition-colors ${
                                    isDark ? "text-neutral-300 hover:text-white" : "text-neutral-700 hover:text-neutral-900"
                                }`}
                            >
                                <ShieldCheckIcon size={14} className="text-neutral-600 flex-shrink-0" />
                                <span className="flex-1">Safety filter</span>
                                <span className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                                    safetyEnabled
                                        ? isDark ? "bg-neutral-200 border-neutral-200" : "bg-neutral-900 border-neutral-900"
                                        : isDark ? "border-neutral-700" : "border-neutral-300"
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default ModelPopup;
