import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom"; // Aggiunto useLocation
import { useAuth } from "../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import {
    MessageSquare,
    FileText,
    Calendar,
    Settings,
    Plus,
    BrainCircuit,
    LogOut,
    User,
    Sun,
    Moon,
    File // Icona generica file
} from 'lucide-react';
import { ArrowFatUpIcon, ClockCounterClockwiseIcon, CommandIcon, DotsThreeIcon, PencilLineIcon, ShareNetworkIcon, SidebarSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import supabase from "../library/supabaseclient";
import selectUserDetails from "../services/supabase/User/SelectuserDetails";
import { useChat } from "../context/ChatContext";
import deleteConversation from "../services/supabase/Conversation/deleteConversation";
import { useApp } from "../context/AppContext";
import getAllDocuments from "../services/supabase/documents/getAllDocuments";
import getDocumentsMetadata from "../services/supabase/documents/getAllDocuments";

const Sidebar = () => {
    // --- Context & State ---
    const { user, theme, setTheme } = useAuth() || { user: { displayName: "Matteo Rossi", photoURL: null } };
    const { conversations, setMessageHistory, fetchConversations, setCurrentConversationId, setCurrentConversationName } = useChat();
    const [userDetails, setUserDetails] = useState<{ full_name: string | null, birthday: string | null, avatar_url?: string } | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    
    // --- NUOVO STATO PER DOCUMENTI ---
    const [documents, setDocuments] = useState<any[]>([]); // Sostituisci any con la tua interfaccia Documento

    const navigate = useNavigate();
    const location = useLocation(); // Hook per sapere dove siamo
    const [convMenuOpen, setConvMenuOpen] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const convMenuRef = useRef<HTMLUListElement>(null);

    const { setIsSettingOpen } = useApp();

    // --- LOGICA DI NAVIGAZIONE ---
    // Controlliamo se siamo nella sezione documenti
    const isDocumentsPage = location.pathname.includes('/app/documents');

    // --- 1. SINGLE SOURCE OF TRUTH FOR THEME ---
    const isDark = theme === 'dark';

    // Definiamo la palette
    const style = {
        sidebar: `w-[280px] h-screen flex flex-col font-sans text-sm transition-colors duration-300 border-r ${isDark ? "bg-neutral-950 border-neutral-800" : "bg-neutral-50 border-neutral-200"}`,
        textPrimary: isDark ? "text-white" : "text-neutral-900",
        textSecondary: isDark ? "text-neutral-400" : "text-neutral-500",
        iconBase: isDark ? "text-neutral-400 group-hover:text-white" : "text-neutral-400 group-hover:text-neutral-600",
        iconActive: isDark ? "text-white" : "text-neutral-900",
        itemHover: isDark ? "hover:bg-neutral-900 hover:text-white" : "hover:bg-neutral-200/50 hover:text-neutral-900",
        itemActive: isDark ? "bg-neutral-800 text-white font-medium" : "bg-neutral-200/50 text-neutral-900 font-medium",
        newChatBtn: `w-full group relative flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all duration-200 hover:shadow-sm ${isDark ? "bg-neutral-900 border-neutral-800 text-white hover:border-neutral-700" : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300"}`,
        shortcutBadge: `text-[13px] px-1 py-0 rounded border transition-colors ${isDark ? "bg-neutral-800 border-neutral-700 text-neutral-400" : "bg-neutral-200/50 border-neutral-200 text-neutral-700"}`,
        popoverBg: isDark ? "bg-neutral-900 border-neutral-800 ring-white/5" : "bg-white border-neutral-200 ring-black/5",
        popoverItem: `flex items-center  gap-2 w-full px-3 py-2 w-full text-sm rounded-lg transition-colors text-left ${isDark ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"}`,
        divider: `h-px my-0.5 mx-2 ${isDark ? "text-neutral-700/50" : "text-neutral-200"}`,
        scrollbar: `flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-track-transparent ${isDark ? "scrollbar-thumb-neutral-800 hover:scrollbar-thumb-neutral-700" : "scrollbar-thumb-neutral-200 hover:scrollbar-thumb-neutral-300"}`,
        footer: `p-2 relative border-t ${isDark ? "border-neutral-800 " : "border-neutral-200 "}`,
        userBtn: `w-full flex items-center justify-between p-2 select-none rounded-lg transition-all duration-200 group text-left ${isUserMenuOpen ? (isDark ? "bg-neutral-900 shadow-sm ring-1 ring-neutral-800" : "bg-white shadow-sm ring-1 ring-neutral-200") : (isDark ? "hover:bg-neutral-900" : "hover:bg-neutral-200/50")}`
    };

    // --- LOGICA PERSISTENZA LOCALSTORAGE ---
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme && storedTheme !== theme) setTheme(storedTheme);
        else if (!storedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme("dark");
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        localStorage.setItem("theme", theme);
        if (theme === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }
    }, [theme]);

    // --- Fetch Dati Utente ---
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (user?.id) {
                const data = await selectUserDetails(user.id);
                setUserDetails(data);
            }
        };
        const fetchDocuments = async () => {
            if (user?.id) {
                // Sostituisci con la tua funzione reale per ottenere i documenti
                const data = await getDocumentsMetadata (user.id);
                setDocuments(data || []);
                console.log("Documenti caricati:", data);
            }
        }
        fetchUserDetails();
        fetchDocuments();

    }, [user]);


    // --- Gestione Path ---
    useEffect(() => {
        const currentPathId = location.pathname.split("/").pop();
        const activeConv = conversations.find((c: any) => c.id === currentPathId);
        if (activeConv) setCurrentConversationName(activeConv.title || "Chat senza titolo");
        else if (location.pathname === "/app/chat/") setCurrentConversationName(null);
    }, [conversations, location.pathname]);

    // --- Click Outside ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
            if (convMenuRef.current && !convMenuRef.current.contains(event.target as Node)) setConvMenuOpen(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isUserMenuOpen, convMenuOpen]);

    const menuItems = [
        { path: "/app/chat", label: "Chatbot AI", icon: <MessageSquare size={18} /> },
        { path: "/app/documents", label: "Knowledge Base", icon: <FileText size={18} /> },
        { path: "/app/calendar", label: "Agenda", icon: <Calendar size={18} /> },
    ];

    const handleLogOut = async (conversationId: string | null) => {
        try {
            await supabase.auth.signOut();
            if (conversationId) await deleteConversation(user.id, conversationId);
            fetchConversations();
            navigate("/login");
        } catch (error) { alert("Errore logout"); }
    }

    async function handleDeleteConversation(conversationId: string | null): Promise<void> {
        // Logica esistente...
        try {
            if (!user?.id) throw new Error("User ID mancante");
            await deleteConversation(user.id, conversationId!);
            fetchConversations();
            navigate("/app");
            setMessageHistory([]);
            setCurrentConversationId(null);
            setCurrentConversationName(null);
        } catch (error) { alert("Errore eliminazione"); }
    }

    // --- RENDER ---
    return (
        <nav className={style.sidebar}>

            {/* HEADER */}
            <div className="p-3 pb-2">
                <div className="flex items-center justify-between gap-2 mb-6">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center cursor-pointer ${isDark ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"}`}
                        onClick={() => navigate("/")}>
                        <BrainCircuit size={16} />
                    </div>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${style.textSecondary}`}>
                        <SidebarSimpleIcon size={24} />
                    </div>
                </div>

                {/* BOTTONE DINAMICO: Se documenti = Carica File, Se Chat = Nuova Chat */}
                <button className={style.newChatBtn}
                    onClick={() => {
                        if (isDocumentsPage) {
                            // Logica per caricare file o creare nuova nota
                            console.log("Apri modal upload");
                        } else {
                            setMessageHistory([]);
                            navigate('/app/chat/');
                            setCurrentConversationId(null);
                        }
                    }}>
                    <div className="flex items-center gap-2 font-medium">
                        <Plus size={16} className={style.textPrimary} />
                        <span>{isDocumentsPage ? "Carica File" : "Nuova Chat"}</span>
                    </div>
                    {!isDocumentsPage && <span className={style.shortcutBadge}>⌘ + i</span>}
                </button>
            </div>

            {/* NAVIGATION */}
            <div className="px-2 py-4">
                <p className={`px-3 text-[10px] font-bold uppercase tracking-wider mb-2 ${style.textSecondary}`}>Workspace</p>
                <div className="flex flex-col gap-0.5">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `relative flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${isActive || location.pathname.startsWith(item.path) ? style.textPrimary + " font-medium" : style.textSecondary + " hover:" + style.textPrimary}`}
                        >
                            {({ isActive }) => {
                                // Forziamo active anche se siamo in sottopagine
                                const active = isActive || location.pathname.startsWith(item.path);
                                return (
                                <>
                                    {active && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className={`absolute inset-0 rounded-md ${isDark ? "bg-neutral-800" : "bg-neutral-200/50"}`}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-3">
                                        {React.cloneElement(item.icon as React.ReactElement, {
                                            size: 18,
                                            className: active ? style.iconActive : style.iconBase
                                        })}
                                        {item.label}
                                    </span>
                                </>
                            )}}
                        </NavLink>
                    ))}
                </div>
            </div>
            
            {/* INTESTAZIONE SEZIONE DINAMICA */}
            <p className={`px-4 text-[10px] font-bold uppercase tracking-wider mb-3 z-10 py-1 flex justify-between items-center ${style.textSecondary}`}>
                {isDocumentsPage ? "I tuoi documenti" : "Cronologia"}
            </p>

            {/* LISTA DINAMICA */}
            <div className={style.scrollbar}>
                <div className="flex flex-col gap-4">
                    <ul className="flex flex-col gap-1 relative" ref={convMenuRef} >
                        
                        {/* --- BLOCCO RENDERING CONDIZIONALE --- */}
                        {isDocumentsPage ? (
                            // --- VISTA DOCUMENTI ---
                            documents.length > 0 ? (
                                documents.map((doc) => (
                                    <div key={doc.id} className={`relative group flex items-center rounded-md transition-colors ${style.itemHover}`}>
                                        <NavLink
                                            to={`/app/documents/${doc.id}`}
                                            className={({ isActive }) => `flex-1 flex items-center px-3 py-2 rounded-md text-sm truncate transition-colors ${isActive ? (isDark ? "bg-neutral-800 text-white font-medium" : "bg-neutral-200/50 text-neutral-900 font-medium") : (style.textSecondary)}`}
                                        >
                                            <File size={16} className="mr-2 opacity-70"/>
                                            <span className="truncate">{doc.title}</span>
                                        </NavLink>
                                        {/* Aggiungi qui eventuale menu contestuale per i documenti */}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs px-3 py-2 opacity-50">Nessun documento</p>
                            )
                        ) : (
                            // --- VISTA CHAT (ESISTENTE) ---
                            conversations.map((conv: any) => (
                                <div key={conv.id} className={`relative group flex items-center rounded-md transition-colors ${style.itemHover}`}>
                                    <NavLink
                                        to={`/app/chat/${conv.id}`}
                                        className={({ isActive }) => `flex-1 flex items-center px-3 py-2 rounded-md text-sm truncate transition-colors ${isActive ? (isDark ? "bg-neutral-800 text-white font-medium" : "bg-neutral-200/50 text-neutral-900 font-medium") : (style.textSecondary)}`}
                                    >   <ClockCounterClockwiseIcon size={16} className="mr-2 opacity-70"/>
                                        <span className="truncate pr-8">{conv.title || "Chat senza titolo"}</span>
                                    </NavLink>

                                    {/* Context Menu Chat */}
                                    <button
                                        className={`absolute right-2 p-1 cursor-pointer rounded-md transition-all ${convMenuOpen === conv.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${style.textSecondary} hover:${style.textPrimary}`}
                                        onClick={(e) => {
                                            e.preventDefault(); e.stopPropagation();
                                            setConvMenuOpen(convMenuOpen === conv.id ? null : conv.id);
                                        }}
                                    >
                                        <DotsThreeIcon size={20} weight="bold" />
                                    </button>

                                    {/* Dropdown Menu Chat */}
                                    <AnimatePresence>
                                        {convMenuOpen === conv.id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                transition={{ duration: 0.15 }}
                                                className={`absolute right-0 top-full mt-1 w-44 rounded-lg shadow-xl z-[100] p-1.5 border ${style.popoverBg}`}
                                            >
                                                {/* Contenuto menu... omesso per brevità ma uguale a prima */}
                                                <button className={style.popoverItem}><ShareNetworkIcon size={14} /> Condividi</button>
                                                <button className={style.popoverItem}><PencilLineIcon size={14} /> Rinomina</button>
                                                <hr className={style.divider} />
                                                <button className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left ${isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"}`} onClick={() => handleDeleteConversation(conv.id)}>
                                                    <TrashIcon size={14} /> Elimina
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* FOOTER (Invariato) */}
            <div className={style.footer}>
                {/* ... resto del codice del footer invariato ... */}
                 <AnimatePresence>
                    {isUserMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="absolute bottom-full left-0 w-[calc(100%-16px)] mx-2 mb-2 z-50 origin-bottom"
                        >
                           <div className={`rounded-xl shadow-xl border overflow-hidden ring-1 ${style.popoverBg}`}>
                                <div className="p-1 flex flex-col gap-0.5 w-full">
                                    <button
                                        className={`${style.popoverItem} justify-between`}
                                        onClick={() => { setIsSettingOpen(true); setIsUserMenuOpen(false); }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Settings size={16} className={style.textSecondary} />
                                            <span>Impostazioni</span>
                                        </div>
                                         <kbd className={`text-[12px] flex px-1 py-0.5 rounded border items-center gap-1 ${isDark ? "bg-neutral-800 border-neutral-700 text-neutral-400" : "bg-neutral-200/50 border-neutral-200 text-neutral-700"}`}>
                                            <CommandIcon size={14} /> + I
                                        </kbd>
                                    </button>
                                    
                                     {/* TEMA TOGGLE */}
                                    <button onClick={(e) => { e.stopPropagation(); setTheme(isDark ? "light" : "dark"); }}
                                        className={`${style.popoverItem} justify-between`}>
                                        <div className="flex items-center gap-2 w-full">
                                            {isDark ? <Moon size={16} className={style.textSecondary} /> : <Sun size={16} className={style.textSecondary} />}
                                            <div className="flex items-center gap-2 justify-between w-full">
                                                <span>Tema: {isDark ? "Scuro" : "Chiaro"}</span>
                                            </div>
                                        </div>
                                    </button>

                                    <div className={style.divider} />
                                    <div className="p-1">
                                        <button onClick={() => handleLogOut(convMenuOpen)}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left ${isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"}`}>
                                            <LogOut size={16} />
                                            <span>Esci</span>
                                        </button>
                                    </div>
                                </div>
                           </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button className={style.userBtn} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img src={userDetails?.avatar_url || `https://ui-avatars.com/api/?name=${userDetails?.full_name || 'User'}&background=random`} alt="Profile" className={`w-8 h-8 rounded-full border object-cover ${isDark ? "border-neutral-700" : "border-neutral-200"}`} />
                        <div className="flex flex-col min-w-0">
                            <span className={`text-sm font-semibold truncate ${style.textPrimary}`}>{userDetails?.full_name || "Utente"}</span>
                            <span className={`text-xs font-medium truncate ${style.textSecondary}`}>Pro Plan</span>
                        </div>
                    </div>
                    <Settings size={16} className={`transition-transform duration-200 ${isUserMenuOpen ? "rotate-90 " + style.iconActive : style.iconBase}`} />
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;