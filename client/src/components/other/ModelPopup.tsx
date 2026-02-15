import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDown, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import getModels from "../../services/openRouter/getModels";
const ModelPopup = React.forwardRef<HTMLDivElement>((_, modalRef) => {
    const { model, setModel } = useChat();
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    const [filteredModels, setFilteredModels] = useState<any[]>([]);
    const [isSelectPopupOpen, setIsSelectPopupOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [models, setModels] = useState<any[]>([]);
    const provider = [
        { name: "Google", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/960px-Google-gemini-icon.svg.png" },
        { name: "OpenAI", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS3PwERLLNB9XKFpeMgAMPxl5VvN3HRJnXQQ&s" },
        { name: "Anthropic", img: "https://images.yourstory.com/cs/images/companies/anthropicresearchlogo-1699260041449.jpg?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=1920&q=75" },
        { name: "Mistral AI", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9tjl3-up4Vemom1ZYPTnWkg5dXOXFtPQDBw&s" },
        { name: "NVIDIA", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvkRmsL7mAkXKS19fL0lQAMsck4AjD1WZy4Q&s" },
        { name: "Qwen", img: "https://opencv.org/wp-content/uploads/2025/01/MIhJKlK5yVR3axxgE7_gHL-rsKjliShJKd3asUqg5KDdEsdOGut-9mCW4Ti1x7i2y8zCkxeZHQFR00sQg6BfYA.png" },
    ]
    const groupedModels = filteredModels.reduce((acc: Record<string, any[]>, model) => {
        const providerName = model.provider || "Unknown";
        if (!acc[providerName]) acc[providerName] = [];
        acc[providerName].push(model);
        return acc;
    }, {});
    useEffect(() => {
        const fetchModels = async () => {
            const fetchedModels = await getModels();

            setModels(fetchedModels);
            setFilteredModels(fetchedModels);

        };
        fetchModels();

    }, []);
    
    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = (modalRef as React.MutableRefObject<HTMLDivElement>) || internalRef;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Se il popup è aperto e clicco fuori dal container del popup
            if (isSelectPopupOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsSelectPopupOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSelectPopupOpen]);
    return (
        <>
            {/* Selezione Modello Styled */}
            <div className="relative" ref={modalRef}>
                <div
                    className={`flex items-center hover:bg-neutral-100 p-1.5 gap-1 select-none rounded cursor-pointer ${
                        isDark ? "hover:bg-neutral-800" : ""
                    }`}
                    onClick={() => setIsSelectPopupOpen((prev) => !prev)}
                >
                    <span className="text-neutral-500 flex items-center">{model ? model.name : "Select a model"}</span>
                    <motion.div
                        animate={{ rotate: isSelectPopupOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CaretDown size={12} />
                    </motion.div>
                </div>

                {/* MENU POPUP ANIMATO */}
                <AnimatePresence>
                    {isSelectPopupOpen && (
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: -4, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className={`absolute bottom-full left-0 mb-2 w-100 h-100 px-2 overflow-auto ${
                                isDark ? "bg-neutral-900 border-neutral-800 shadow-md" : "bg-white border border-neutral-200 shadow-xl"
                            } rounded-xl z-50`}
                        >
                            <div className={`sticky top-0 ${
                                isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-b border-neutral-200"
                            } px-3 py-2`}>
                                <div className="flex items-center gap-2 text-neutral-400 rounded-md px-0 py-2">
                                    <label htmlFor="model-search"> <MagnifyingGlassIcon size={18} /></label>
                                    <input
                                        type="text"
                                        id="model-search"
                                        placeholder="Search models..."
                                        className="flex-1 bg-transparent text-neutral-400 focus:outline-none placeholder-neutral-400 text-sm"
                                        onChange={(e) => {
                                            const query = e.target.value.toLowerCase();
                                            setFilteredModels(models.filter(model =>
                                                model.name.toLowerCase().includes(query) ||
                                                model.provider.toLowerCase().includes(query)
                                            ));
                                            setSearchQuery(e.target.value);
                                        }}
                                        value={searchQuery}
                                    />
                                </div>
                            </div>
                            <div className="p-1 grid
                                     ">

                                {models.length === 0 ? (
                                    <div className="px-1 py-2 rounded text-sm text-neutral-500">
                                        No models available
                                    </div>
                                ) : (
                                    /* Contenitore principale: una colonna singola per i provider */
                                    <div className="flex flex-col gap-6">
                                        {Object.entries(groupedModels).map(([providerName, modelsInGroup]) => (
                                            <div key={providerName} className="w-full">
                                                {/* Header del Provider: occupa tutta la riga */}
                                                <div className={`flex items-center gap-2 mb-3 border-b justify-between ${
                                                    isDark ? "border-neutral-800" : "border-neutral-100"
                                                } pb-1`}>
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                                                        {providerName}
                                                    </span>
                                                    <span className="text-sm text-neutral-500 font-normal">
                                                        ({modelsInGroup.length} models)
                                                    </span>
                                                </div>

                                                {/* Grid dei Modelli: qui decidi quante colonne vuoi (es. 2 o 3) */}
                                                <div className="grid grid-cols-1 gap-2">
                                                    {modelsInGroup.map((model, index) => (
                                                        <div
                                                            key={model.model_id || index}
                                                            className={`group px-3 py-2 flex gap-3 rounded-md border border-transparent   hover:shadow-sm cursor-pointer transition-all items-center ${
                                                                isDark ? "hover:bg-neutral-800 hover:border-neutral-700" : "hover:bg-white hover:border-neutral-200"
                                                            }`}
                                                            onClick={() => {
                                                                setModel(model);
                                                                setIsSelectPopupOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex flex-row justify-between flex-1 overflow-hidden">

                                                                <span className={`text-sm font-semibold truncate  transition-colors ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                                                                    <img
                                                                        src={provider.find(p => p.name === model.provider)?.img ?? "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwNS1wLnBuZw.png"}
                                                                        className="w-4 h-4 inline mr-1"
                                                                        alt=""
                                                                    />
                                                                    {model.name.length > 30 ? model.name.substring(0, 30) + '...' : model.name}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`text-[13px] font-mono ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                                                                        {(Number(model.cost_per_input_token) + Number(model.cost_per_output_token)).toFixed(2)}$/1M
                                                                    </p>

                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </>
    )
});
export default ModelPopup;