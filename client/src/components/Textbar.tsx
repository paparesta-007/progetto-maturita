import { Paperclip, PaperPlaneTilt, CaretDown, XIcon, GlobeIcon, CaretDownIcon, MagnifyingGlass, MagnifyingGlassIcon } from "@phosphor-icons/react";
import React, { useState, useEffect, useRef } from "react";
import Tooltip from "./other/Tooltip";
import { useChat } from "../context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import getModels from "../services/openRouter/getModels";
import { img } from "framer-motion/client";
interface FileWithPreview {
    originalFile: File;
    name: string;
    previewUrl: string | null;
}

const Textbar = () => {
    const { inputValue, setInputValue, clearInput, sendMessage, model, setModel } = useChat();
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isGroundingActive, setIsGroundingActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [models, setModels] = useState<any[]>([]);
    const [filteredModels, setFilteredModels] = useState<any[]>([]);
    const [isSelectPopupOpen, setIsSelectPopupOpen] = useState(false);
    const provider = [
        { name: "Google", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/960px-Google-gemini-icon.svg.png" },
        { name: "OpenAI", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS3PwERLLNB9XKFpeMgAMPxl5VvN3HRJnXQQ&s" },
        { name: "Anthropic", img: "https://images.yourstory.com/cs/images/companies/anthropicresearchlogo-1699260041449.jpg?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=1920&q=75" },
        { name: "Mistral AI", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9tjl3-up4Vemom1ZYPTnWkg5dXOXFtPQDBw&s" },
        { name: "NVIDIA", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvkRmsL7mAkXKS19fL0lQAMsck4AjD1WZy4Q&s" },
    ]
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
            setInputValue("");
        }
    };

    const menuRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsSelectPopupOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);
    useEffect(() => {
        const fetchModels = async () => {
            const fetchedModels = await getModels();

            setModels(fetchedModels);
            setFilteredModels(fetchedModels);

        };
        fetchModels();

    }, []);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;

        if (selectedFiles && selectedFiles.length > 0) {
            // Convertiamo FileList (che non è un array) in un Array vero
            const newFiles = Array.from(selectedFiles).map(file => ({
                originalFile: file, // Questo è il Blob vero e proprio
                name: file.name,
                // 2. Creiamo un URL temporaneo per il Blob (utile per le anteprime)
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
            }));

            // Aggiungiamo i nuovi file a quelli esistenti
            setFiles((prev) => [...prev, ...newFiles]);
        }

        // Reset dell'input per permettere di ricaricare lo stesso file se lo cancelli e lo rimetti
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
    const removeFile = (indexToRemove: number) => {
        setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    };
    return (
        <div className="w-full max-w-2xl border border-neutral-200 shadow-[0_0_15px_0_rgba(0,0,0,0.15)] rounded-2xl bg-white p-2 flex flex-col gap-2" ref={menuRef}>

            {/* SEZIONE SUPERIORE: Eventuali allegati*/}
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 ">
                    {files.map((file, index) => (
                        <div key={index} className="relative group flex items-center gap-2 bg-white border border-neutral-200 rounded-lg p-1.5 pr-8 ">

                            {/* Se è un'immagine, mostra l'anteprima dal Blob URL, altrimenti icona */}
                            {file.previewUrl ? (
                                <img
                                    src={file.previewUrl}
                                    alt="preview"
                                    className="w-8 h-8 object-cover rounded-md bg-neutral-100"
                                />
                            ) : (
                                <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-md">
                                    <Paperclip size={16} className="text-neutral-500" />
                                </div>
                            )}

                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-neutral-700 max-w-[120px] truncate">{file.name}</span>
                                <span className="text-[10px] text-neutral-400">
                                    {(file.originalFile.size / 1024).toFixed(0)} KB
                                </span>
                            </div>

                            {/* Tasto Rimuovi */}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                            >
                                <XIcon size={14} weight="bold" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* SEZIONE SUPERIORE: Input e Invio */}
            <div className="flex items-center gap-2">

                <input
                    type="text"
                    placeholder="Type your message here..."
                    onChange={

                        (e) => setInputValue(e.target.value)
                    }
                    value={inputValue}
                    onKeyDown={handleKeyPress}
                    className="flex-1 p-3 text-neutral-900 focus:outline-none bg-transparent"
                />
                <button className="bg-neutral-900 hover:bg-neutral-800 text-white p-2.5 rounded-xl transition-all 
                active:scale-95 flex items-center justify-center"
                    onClick={() => {
                        sendMessage(inputValue);
                        setInputValue("");
                    }}

                >
                    <PaperPlaneTilt size={20} weight="fill" />
                </button>
            </div>


            {/* SEZIONE INFERIORE: Strumenti e Selezione Modello */}
            <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-3">
                    {/* Allegato */}
                    <button className="text-neutral-400 hover:text-neutral-800 transition-colors"
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        <Paperclip size={22} weight="bold" />
                    </button>
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        multiple
                    />

                    {/* Selezione Modello Styled */}
                    <div className="relative">
                        <div
                            className="flex items-center hover:bg-neutral-100 p-1.5 gap-1 select-none rounded cursor-pointer"
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
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: -4, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute bottom-full left-0 mb-2 w-100 h-100 px-2 overflow-auto bg-white border border-neutral-200 shadow-xl rounded-xl z-50"
                                >
                                    <div className="sticky top-0 bg-white border-b border-neutral-200 px-3 py-2">
                                        <div className="flex items-center gap-2 text-neutral-400 rounded-lg px-0 py-2">
                                            <MagnifyingGlassIcon size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search models..."
                                                className="flex-1 bg-transparent text-neutral-900 focus:outline-none placeholder-neutral-400 text-sm"
                                                onChange={(e) => {
                                                    const query = e.target.value.toLowerCase();
                                                    setFilteredModels(models.filter(model =>
                                                        model.name.toLowerCase().includes(query) ||
                                                        model.provider.toLowerCase().includes(query)
                                                    ));
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-1 grid
                                    sm:grid-cols-2 lg:grid-cols-2 grid-cols-1 ">

                                        {models.length === 0 ? (
                                            <div className="px-1 py-2 rounded text-sm text-neutral-500">
                                                No models available
                                            </div>
                                        ) : (
                                            filteredModels.map((model, index) => (
                                                <div key={index} className="px-1 py-2 flex gap-1 rounded hover:bg-neutral-100 cursor-pointer text-neutral-700"
                                                    onClick={() => {
                                                        setModel(model);
                                                        setIsSelectPopupOpen(false);
                                                    }}
                                                >
                                                    <img src={provider.find(p => p.name === model.provider)?.img ?? "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwNS1wLnBuZw.png"} alt={model.provider} className="w-4 h-4 object-contain" />
                                                    <div className="flex flex-col items-start gap-0.5">
                                                        <span className="text-sm">{model.name}</span>
                                                        <p className="text-xs text-neutral-400">{model.cost_per_input_token + model.cost_per_output_token}$/1M</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button className={`transition-colors relative flex items-center justify-between gap-0 px-2 py-1 rounded-full ${isGroundingActive ? 'bg-blue-50 text-blue-500' : 'text-neutral-400 '}`}
                        onClick={() => setIsGroundingActive((prev) => !prev)}
                    >
                        <GlobeIcon size={22} weight="regular" />
                        <span
                            className={`
                            flex items-center mr-4 text-blue-500 overflow-hidden transition-all duration-200 ease-in-out text-blue-500${isGroundingActive ? 'w-10 opacity-100 ml-1' : 'w-0 opacity-0'}`}>
                            <span className="whitespace-nowrap">
                                Web
                            </span>
                            <div className="ml-1 absolute right-1 top-0.5"
                                onClick={(e) => { e.stopPropagation(); setIsGroundingActive(false) }}
                            ><XIcon size={16} weight="regular" className="cursor-pointer" /></div>
                        </span>
                    </button>
                </div>
                <div>
                    <Tooltip
                        background="light"
                        position="right"
                        content={
                            <div className="text-left">
                                <b className="block text-neutral-900">Price for 1 million tokens</b>
                                <span className="text-neutral-500 font-normal">Input: {model.cost_per_input_token}$ / 1M</span>
                                <br />
                                <span className="text-neutral-500 font-normal">Output: {model.cost_per_output_token}$ / 1M</span>
                                <br />
                            </div>
                        }
                    >
                        <button className="text-sm text-neutral-400 ">
                            {model.cost_per_input_token + model.cost_per_output_token}$/1M
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default Textbar;