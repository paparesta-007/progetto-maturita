import { Paperclip, PaperPlaneTilt, CaretDown, XIcon, GlobeIcon } from "@phosphor-icons/react";
import React, { useState, useEffect, useRef } from "react";
import Tooltip from "./other/Tooltip";
import { useChat } from "../context/ChatContext";

interface FileWithPreview {
    originalFile: File;
    name: string;
    previewUrl: string | null;
}

const Textbar = () => {
    const { inputValue, setInputValue, clearInput } = useChat();
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isGroundingActive, setIsGroundingActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        <div className="w-full max-w-2xl border border-neutral-200 shadow-[0_0_15px_0_rgba(0,0,0,0.15)] rounded-2xl bg-white p-2 flex flex-col gap-2">

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
                    className="flex-1 p-3 text-neutral-900 focus:outline-none bg-transparent"
                />
                <button className="bg-neutral-900 hover:bg-neutral-800 text-white p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center">
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
                    <div className="relative flex items-center">
                        <select className="appearance-none border-neutral-200 border text-xs font-medium text-neutral-600 py-1.5 pl-3 pr-8 rounded-full  focus:ring-neutral-300 cursor-pointer outline-none">
                            <option value="doc1">Gemini 2.5 flash</option>
                            <option value="doc2">Gemini 2.5 Pro</option>
                            <option value="doc3">Gemini 3 Pro</option>
                        </select>
                        <CaretDown size={12} className="absolute right-3 pointer-events-none text-neutral-500" />
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
                                <span className="text-neutral-500 font-normal">Input: 0.12$ / 1M</span>
                                <br />
                                <span className="text-neutral-500 font-normal">Output: 0.57$ / 1M</span>
                                <br />
                                <span className="text-neutral-500 font-normal">Cached: 0.61$ / 1M</span>
                            </div>
                        }
                    >
                        <button className="text-sm text-neutral-400 ">
                            0.56$/1M
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default Textbar;