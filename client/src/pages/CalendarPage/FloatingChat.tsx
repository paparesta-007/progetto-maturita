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
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const { theme, session } = useAuth();
    const { model, setModel } = useChat();
    const isDark = theme === 'dark';

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsFloatingChat(false);
        }, 300);
    };

    const MODEL_OPTIONS = [
        { label: "Deepseek V3", value: "deepseek/deepseek-chat", description: "" },
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
                provider: option.label.includes("Gemini") ? "Google" : option.label.includes("Mistral") ? "Mistral AI" : (option.label.includes("Deepseek") ? "Deepseek" : "OpenAI")
            });
        }
    };

    async function handleSend() {
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue("");

        try {
            const response = await fetch("http://localhost:3000/api/calendar/action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    text: userMsg,
                    modelName: "deepseek/deepseek-chat" // Come richiesto, forzato Deepseek per ora
                })
            });

            if (!response.ok) throw new Error("Errore durante la chiamata al calendario");

            const data = await response.json();
            
            let assistantMsg = "";
            if (data.parsedActions && data.parsedActions.length > 0) {
                const results = data.parsedActions.map((action: any) => {
                    switch(action.action) {
                        case "CREATE_EVENT":
                            return `Ho programmato l'evento: "${action.params.summary}" per ${action.params.start.date}.`;
                        case "LIST_EVENTS":
                            return `Controllo gli eventi a partire da ${action.params.timeMin}.`;
                        case "UPDATE_EVENT":
                            return `Aggiornato l'evento ${action.params.eventId}.`;
                        case "DELETE_EVENT":
                            return `Rimosso l'evento ${action.params.eventId}.`;
                        case "NO_ACTION":
                            return action.detail;
                        default:
                            return "Operazione non supportata.";
                    }
                });
                assistantMsg = results.join("\n");
            } else {
                assistantMsg = "Non ho individuato azioni specifiche per il calendario.";
            }

            setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
        } catch (error) {
            console.error("Errore invio chat calendario:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Spiacente, si è verificato un errore." }]);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 10, y: 70, scale: 0.95 }}
            animate={isExiting ? { opacity: 0, x: 10, y: 70, scale: 0.95 } : { opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            // FIX: Rimossi gli escape \ dai backtick e dal $
            className={`fixed bottom-6 right-6 w-[400px] h-[500px] flex flex-col p-5 rounded-2xl shadow-2xl z-50 border 
                ${isDark ? 'bg-[#1e1e1e] border-[#333] text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}
        >
            {/* Header: Titolo e pulsanti finestra */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-1 cursor-pointer text-sm font-medium hover:opacity-80">
                    Calendar Assistant
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleClose} 
                        // FIX: Rimossi gli escape \ dai backtick e dal $
                        className={`hover:opacity-70 transition-opacity ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        title="Minimize"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                    </button>
                </div>
            </div>

            {/* Area Messaggi (Storico) */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 custom-scrollbar pr-1">
                {messages.length === 0 ? (
                    <div className="py-4 text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl mx-auto
                            ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                            🪄
                        </div>
                        
                        <h2 className="text-xl font-bold mb-4">What magic shall we make happen?</h2>
                        
                        <div className="flex flex-col gap-1 text-sm text-left">
                            <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>} text="Tell me upcoming events" isDark={isDark} />
                            <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} text="Find a free slot on Saturday" isDark={isDark} />
                            <ActionItem icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>} text="How can I improve my routine" isDark={isDark} />
                        </div>
                    </div>
                ) : (
                    messages.map((m, i) => (
                        // FIX: Rimossi gli escape \ dai backtick e dal $
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                m.role === 'user' 
                                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                : (isDark ? 'bg-[#2a2a2a] text-gray-200' : 'bg-gray-100 text-gray-800')
                            }`}>
                                {m.content}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Area di Input */}
            {/* FIX: Rimossi gli escape \ dai backtick e dal $ */}
            <div className={`relative rounded-xl border-2 p-3 pb-2 transition-colors shrink-0
                ${isDark ? 'border-blue-500/60 bg-[#222]' : 'border-blue-400 bg-gray-50'}`}>
                <textarea 
                    placeholder="Do anything with AI..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    className="w-full bg-transparent resize-none outline-none text-sm h-12 mb-2 placeholder-gray-500"
                />
                
                <div className="flex justify-between items-center text-gray-500">
                    <div className="flex gap-3">
                        <button className="hover:text-gray-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <SelectPopup 
                            options={MODEL_OPTIONS} 
                            value={currentModelId} 
                            onChange={handleModelChange} 
                            placeholder={typeof model === 'object' && model !== null ? model.name : "Model"} 
                        />
                        {/* FIX: Rimossi gli escape \ dai backtick e dal $ */}
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

const ActionItem = ({ icon, text, isDark }: { icon: React.ReactNode, text: string, isDark: boolean }) => (
    <div className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
        ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}>
        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{icon}</span>
        <span className="font-medium text-[14px]">{text}</span>
    </div>
);

export default FloatingChat;