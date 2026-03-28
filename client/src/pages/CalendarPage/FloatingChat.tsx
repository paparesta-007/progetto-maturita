import React, { useState } from "react";
import { motion } from "framer-motion";
import { useCalendar } from "../../context/CalendarContext";
import { useAuth } from "../../context/AuthContext";
import SelectPopup from "../../components/other/SelectPopup";
import { useChat } from "../../context/ChatContext";
import { executeToolCall } from "../../library/calendarTools";
const FloatingChat = () => {
    const { setIsFloatingChat } = useCalendar();
    const [isExiting, setIsExiting] = useState(false);
    const { theme, session } = useAuth();
    const {model,setModel}=useChat()
    const isDark = theme === 'dark';

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsFloatingChat(false);
        }, 300);
    };
    const MODEL_OPTIONS = [
        { label: "Gemini 2.5 Flash Lite", value: "google/gemini-2.5-flash-lite", description: "" },
        { label: "Mistral 8b", value: "mistralai/ministral-8b-2512", description: "" },
        { label: "Gpt-5-nano", value: "openai/gpt-5-nano", description: "" },
    ];
    
    // Recupera l'ID del modello attualmente selezionato (sia se è oggetto sia se è stringa, fallback sicuro)
    const currentModelId = typeof model === 'object' && model !== null ? model.name_id : model;

    const handleModelChange = (newVal: string) => {
        const option = MODEL_OPTIONS.find(o => o.value === newVal);
        if (option) {
            setModel({
                name: option.label,
                name_id: option.value,
                provider: option.label.includes("Gemini") ? "Google" : option.label.includes("Mistral") ? "Mistral AI" : "OpenAI"
            });
        }
    };

    function handleSend() {
        // Esempio di chiamata a uno strumento (puoi adattarlo in base alla tua logica)
        const exampleArgs = { start_date: "2026-03-24", keywords: ["Riunione"] };
        const providerToken = session?.provider_token;
        
        if (!providerToken) {
            console.error("Token di Google non trovato. Effettua il login.");
            return;
        }

        executeToolCall('searchEvents', exampleArgs, providerToken)
            .then(response => {
                console.log("Risposta dallo strumento:", response);
            })
            .catch(error => {
                console.error("Errore durante l'esecuzione dello strumento:", error);
            });
    }

    return (
        <motion.div
            // Aggiunto un leggero effetto di scale per rendere l'entrata più "morbida"
            initial={{ opacity: 0, x: 10, y: 70, scale: 0.95 }}
            animate={isExiting ? { opacity: 0, x: 10, y: 70, scale: 0.95 } : { opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            // Dimensioni aumentate, bordi più arrotondati (2xl) e colori adattati
            className={`fixed bottom-6 right-6 w-[360px] p-5 rounded-2xl shadow-2xl z-50 border 
                ${isDark ? 'bg-[#1e1e1e] border-[#333] text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}
        >
            {/* Header: Titolo e pulsanti finestra */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-1 cursor-pointer text-sm font-medium hover:opacity-80">
                    New AI chat
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleClose} 
                        className={`hover:opacity-70 transition-opacity ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        title="Minimize"
                    >
                        {/* Icona "Meno" per simulare la minimizzazione/chiusura dello screen */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                    </button>
                </div>
            </div>

            {/* Corpo principale (Hero & Opzioni) */}
            <div className="mb-6">
                {/* Logo/Icona segnaposto */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl
                    ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                    🪄
                </div>
                
                <h2 className="text-xl font-bold mb-4">What magic shall we make happen?</h2>
                
                {/* Lista azioni rapide */}
                <div className="flex flex-col gap-1 text-sm">
                    <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>} text="Tell me upcoming events" isDark={isDark} />
                    <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} text="Find a free slot on Saturday" isDark={isDark} />
                    <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>} text="How can I improve my routine" isDark={isDark} />
                    <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} text="Create a task tracker" isDark={isDark} />
                </div>
            </div>

            {/* Area di Input */}
            <div className={`relative rounded-xl border-2 p-3 pb-2 transition-colors
                ${isDark ? 'border-blue-500/60 bg-[#222]' : 'border-blue-400 bg-gray-50'}`}>
                <textarea 
                    placeholder="Do anything with AI..."
                    className="w-full bg-transparent resize-none outline-none text-sm h-12 mb-2 placeholder-gray-500"
                />
                
                <div className="flex justify-between items-center text-gray-500">
                    {/* Pulsanti sinistra input */}
                    <div className="flex gap-3">
                        <button className="hover:text-gray-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                        <button className="hover:text-gray-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                        </button>
                    </div>
                    
                    {/* Pulsanti destra input */}
                    <div className="flex items-center gap-2">
                        <SelectPopup 
                            options={MODEL_OPTIONS} 
                            value={currentModelId} 
                            onChange={handleModelChange} 
                            placeholder={typeof model === 'object' && model !== null ? model.name : "Model"} 
                        />
                        <button className={`p-1.5 rounded-full transition-colors 
                            ${isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            onClick={() => {handleSend()}}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Componente di supporto per renderizzare la lista in modo pulito
const ActionItem = ({ icon, text, isDark }: { icon: React.ReactNode, text: string, isDark: boolean }) => (
    <div className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
        ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}>
        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{icon}</span>
        <span className="font-medium text-[14px]">{text}</span>
    </div>
);

export default FloatingChat;