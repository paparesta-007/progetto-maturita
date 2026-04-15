import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
    Sun,
    Moon,
    File,
    ChevronUp,
    Search,
    Keyboard,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { ClockCounterClockwiseIcon, DotsThreeIcon, PencilLineIcon, ShareNetworkIcon, SidebarSimpleIcon, SquaresFourIcon, TrashIcon, X as XIcon } from "@phosphor-icons/react";
import supabase from "../library/supabaseclient";
import selectUserDetails from "../services/supabase/User/SelectuserDetails";
import { useChat } from "../context/ChatContext";
import deleteConversation from "../services/supabase/Conversation/deleteConversation";
import { useApp } from "../context/AppContext";
import { useDocument } from "../context/DocumentContext";
import deleteCurrentDocument from "../services/supabase/documents/deleteCurrentDocument";
import updateConversationTitle from "../services/supabase/Conversation/updateConversationTitle";

/* ─── Premium Sidebar Styles ─── */
const SidebarStyles = () => (
    <style>{`
        @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes pulse-soft {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        @keyframes shimmer-badge {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }

        .sidebar-premium {
            position: relative;
        }
        .sidebar-premium::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 1px;
            height: 100%;
            background: linear-gradient(
                to bottom,
                transparent 0%,
                var(--border-color) 15%,
                var(--border-color) 85%,
                transparent 100%
            );
        }

        .premium-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .premium-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb {
            background: var(--scrollbar-color);
            border-radius: 999px;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb:hover {
            background: var(--scrollbar-hover-color);
        }

        .nav-item-glow::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 10px;
            opacity: 0;
            transition: opacity 0.3s ease;
            background: var(--glow-color);
            filter: blur(8px);
            z-index: -1;
        }
        .nav-item-glow:hover::before {
            opacity: 0.5;
        }

        .plan-badge {
            background: linear-gradient(90deg, #a855f7, #6366f1, #a855f7);
            background-size: 200% auto;
            animation: shimmer-badge 3s linear infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .premium-upgrade-btn {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            box-shadow: 0 4px 12px rgba(168, 85, 247, 0.25);
            transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .premium-upgrade-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(168, 85, 247, 0.35);
            filter: brightness(1.1);
        }
        .premium-upgrade-btn:active {
            transform: translateY(0);
        }
    `}</style>
);

const Sidebar = ({
    isMinimized,
    setIsMinimized,
    isLockedMinimized = false,
    isMobileOpen = false,
    setIsMobileOpen
}: {
    isMinimized: boolean;
    setIsMinimized: (val: boolean) => void;
    isLockedMinimized?: boolean;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (val: boolean) => void;
}) => {
    // --- Context & State ---
    const { user, theme, setTheme } = useAuth() || { user: { displayName: "Matteo Rossi", photoURL: null } };
    const { conversations, setMessageHistory, fetchConversations, setCurrentConversationId, setCurrentConversationName, areConversationsLoaded } = useChat();
    const [userDetails, setUserDetails] = useState<{ full_name: string | null, birthday: string | null, avatar_url?: string } | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const { documentList, fetchUserDocuments, setDocumentList } = useDocument();

    const navigate = useNavigate();
    const location = useLocation();
    const [convMenuOpen, setConvMenuOpen] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const convMenuRef = useRef<HTMLUListElement>(null);
    const [docMenuOpen, setDocMenuOpen] = useState<string | null>(null);
    const { setIsSettingOpen } = useApp();

    const [isRenamePopupOpen, setIsRenamePopupOpen] = useState(false);
    const [renameConversationId, setRenameConversationId] = useState<string | null>(null);
    const [renameTitle, setRenameTitle] = useState("");

    const isDocumentsPage = location.pathname.includes('/app/documents');
    const isDark = theme === 'dark';

    // ─── Premium Style System ───
    const style = {
        sidebar: `sidebar-premium h-screen flex flex-col font-sans text-sm transition-all duration-500 ease-in-out relative ${isDark ? "bg-[#0a0a0a]" : ""} ${isMobileOpen ? 'fixed inset-0 z-50 w-full' : 'hidden md:flex'} ${isMinimized ? 'md:w-[72px] min-w-[72px]' : 'md:w-[280px] min-w-[280px]'}`,

        textPrimary: isDark ? "text-neutral-100" : "text-neutral-900",
        textSecondary: isDark ? "text-neutral-500" : "text-neutral-600",
        textMuted: isDark ? "text-neutral-600" : "text-neutral-300",

        iconBase: isDark ? "text-neutral-500 group-hover:text-neutral-300" : "text-neutral-600 group-hover:text-neutral-700 ",
        iconActive: isDark ? "text-white" : "text-neutral-900",

        itemHover: isDark ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.03]",
        itemActive: isDark ? "bg-white/[0.06] text-white font-medium" : "bg-black/[0.04] text-neutral-900 font-medium",

        newChatBtn: `w-full group relative flex items-center justify-between px-2 py-2.5 rounded-xl transition-all duration-300 ${isDark
            ? "bg-white/[0.04] hover:bg-white/[0.07] text-white border border-white/[0.06] hover:border-white/[0.1]"
            : " text-neutral-900 "
            }`,

        shortcutBadge: `text-[11px] px-1.5 py-0.5 rounded-md font-mono transition-colors ${isDark
            ? "bg-white/[0.06] text-neutral-500 border border-white/[0.04]"
            : "bg-neutral-100 text-neutral-600 border border-neutral-200/60"
            }`,

        popoverBg: isDark
            ? "bg-[#141414] border-white/[0.08] shadow-2xl shadow-black/40"
            : "bg-white border-neutral-200/80 shadow-xl shadow-black/[0.08]",

        popoverItem: `flex items-center gap-2.5 w-full px-3 py-2 text-[13px] rounded-lg transition-all duration-200 text-left ${isDark
            ? "text-neutral-300 hover:bg-white/[0.06] hover:text-white"
            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            }`,

        divider: `h-px my-1 ${isDark ? "bg-white/[0.06]" : "bg-neutral-100"}`,

        scrollbar: `flex-1 overflow-y-auto px-3 premium-scrollbar`,

        footer: `p-2 relative ${isDark ? "" : ""}`,

        userBtn: `w-full flex items-center justify-between p-2.5 select-none rounded-xl transition-all duration-300 group text-left ${isUserMenuOpen
            ? (isDark ? "bg-white/[0.06] ring-1 ring-white/[0.08]" : "bg-white ring-1 ring-neutral-200/80 shadow-sm")
            : (isDark ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.03]")
            }`,

        sectionLabel: `px-4 text-[10px] font-bold uppercase tracking-[0.15em] mb-2 flex justify-between items-center ${isDark ? "text-neutral-600" : "text-neutral-300"}`,

        contextDot: `absolute right-2 p-1 cursor-pointer rounded-lg transition-all duration-200`,
    };

    // CSS Variables for dynamic theming
    const cssVars = {
        '--border-color': isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        '--scrollbar-color': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        '--scrollbar-hover-color': isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
        '--glow-color': isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    } as React.CSSProperties;

    // --- Effects ---
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (user?.id) {
                const data = await selectUserDetails(user.id);
                setUserDetails(data);
            }
        };
        if (user?.id) {
            fetchUserDetails();
            fetchUserDocuments(user.id);
        }
    }, [user, fetchUserDocuments]);

    useEffect(() => {
        const currentPathId = location.pathname.split("/").pop();
        const activeConv = conversations.find((c: any) => c.id === currentPathId);
        if (activeConv) setCurrentConversationName(activeConv.title || "Chat senza titolo");
        else if (location.pathname === "/app/chat/") setCurrentConversationName(null);
    }, [conversations, location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
            if (convMenuRef.current && !convMenuRef.current.contains(event.target as Node)) {
                setConvMenuOpen(null);
                setDocMenuOpen(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isUserMenuOpen, convMenuOpen, docMenuOpen]);

    const menuItems = [
        { path: "/app/chat", label: "Chatbot AI", icon: <MessageSquare size={17} /> },
        { path: "/app/documents", label: "Knowledge Base", icon: <FileText size={17} /> },
        { path: "/app/calendar", label: "Agenda", icon: <Calendar size={17} /> },
        { path: "/app/artifacts", label: "Artefatti", icon: <SquaresFourIcon size={17} /> }
    ];

    // --- Handlers ---
    const handleLogOut = async (conversationId: string | null) => {
        try {
            await supabase.auth.signOut();
            if (conversationId && user?.id) await deleteConversation(user.id, conversationId);
            fetchConversations();
            navigate("/login");
        } catch (error) { alert("Errore logout"); }
    };

    async function handleDeleteConversation(conversationId: string | null): Promise<void> {
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

    async function handleDeleteDocument(documentId: string) {
        try {
            if (!user?.id) throw new Error("User ID mancante");
            await deleteCurrentDocument(user.id, documentId);
            setDocumentList((prevList) => prevList.filter((doc) => doc.document_id !== documentId));
            setDocMenuOpen(null);
            if (location.pathname.includes(documentId)) {
                navigate("/app/documents");
            }
        } catch (error) {
            console.error("Errore eliminazione:", error);
            alert("Impossibile eliminare il documento");
        }
    }
    const handleRename = async (conversationId: string, newTitle: string) => {
        await updateConversationTitle(conversationId, newTitle, user?.id || "");
        fetchConversations();
    }
    // --- Premium Context Menu Component ---
    const ContextMenu = ({
        isOpen,
        onShare,
        onRename,
        onDelete,
    }: {
        isOpen: boolean;
        onShare: () => void;
        onRename: () => void;
        onDelete: () => void;
    }) => (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className={`absolute right-0 top-full mt-1.5 w-48 rounded-xl z-[100] p-1.5 border backdrop-blur-xl ${style.popoverBg}`}
                >
                    <button className={style.popoverItem} onClick={onShare}>
                        <ShareNetworkIcon size={15} className="opacity-60" /> Condividi
                    </button>
                    <button className={style.popoverItem} onClick={onRename}>
                        <PencilLineIcon size={15} className="opacity-60" /> Rinomina
                    </button>
                    <div className={style.divider} />
                    <button
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-[13px] rounded-lg transition-all duration-200 text-left ${isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}
                        onClick={onDelete}
                    >
                        <TrashIcon size={15} /> Elimina
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // --- RENDER ---
    return (
        <>
            <AnimatePresence>
                {isRenamePopupOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`p-6 rounded-2xl w-[90%] max-w-sm shadow-2xl ${isDark ? "bg-[#141414] border border-white/[0.08]" : "bg-white border border-neutral-200"}`}
                        >
                            <h2 className="text-lg font-semibold mb-4 text-center">Rinomina questa chat</h2>
                            <input
                                type="text"
                                value={renameTitle}
                                onChange={(e) => setRenameTitle(e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl mb-6 outline-none transition-all ${
                                    isDark 
                                        ? "bg-white/[0.06] text-white border border-white/[0.08] focus:border-white/[0.2]" 
                                        : "bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-neutral-400"
                                }`}
                                placeholder="Nuovo titolo..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setIsRenamePopupOpen(false);
                                        setRenameConversationId(null);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        isDark ? "hover:bg-white/[0.06] text-neutral-300" : "hover:bg-neutral-100 text-neutral-600"
                                    }`}
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={() => {
                                        handleRename(renameConversationId!, renameTitle);
                                        setIsRenamePopupOpen(false);
                                        setRenameConversationId(null);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"
                                    }`}
                                >
                                    Modifica
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SidebarStyles />
            <nav className={style.sidebar} style={cssVars}>

                {/* ─── HEADER ─── */}
                <div className={`p-3 pb-0 ${isMinimized ? 'items-center' : ''}`}>
                    <div className={`flex items-center ${isMinimized ? 'justify-center' : 'justify-between'} gap-2 mb-5`}>
                        {/* Logo */}
                        {!isMinimized && (
                            <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isDark
                                    ? "bg-white text-neutral-900 shadow-sm shadow-white/10"
                                    : "bg-neutral-900 text-white shadow-md shadow-neutral-900/20"
                                    }`}
                                onClick={() => navigate("/")}
                            >
                                <BrainCircuit size={17} />
                            </div>
                        )}

                        {/* Sidebar Toggle & Mobile Close */}
                        <div className="flex items-center gap-1">
                            {isMobileOpen && setIsMobileOpen && (
                              <button
                                onClick={() => setIsMobileOpen(false)}
                                className={`md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isDark ? "text-neutral-600 hover:text-neutral-400 hover:bg-white/[0.04]" : "text-neutral-400 hover:text-neutral-600 hover:bg-black/[0.03]"}`}
                              >
                                <XIcon size={20} />
                              </button>
                            )}
                            <button
                                type="button"
                                disabled={isLockedMinimized}
                                onClick={() => {
                                    if (isLockedMinimized) return;
                                    setIsMinimized(!isMinimized);
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isDark ? "text-neutral-600 hover:text-neutral-600 hover:bg-white/[0.04]" : "text-neutral-300 hover:text-neutral-500 hover:bg-black/[0.03]"} ${isLockedMinimized ? "opacity-40 cursor-not-allowed" : ""} ${isMobileOpen ? 'hidden md:flex' : ''}`}
                            >
                                <SidebarSimpleIcon size={20} />
                            </button>
                        </div>
                    </div>

                    {/* ─── Search Bar (Premium Touch) ─── */}
                    {!isMinimized && (
                        <button className={`nav-item-glow relative f-poppins w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-300 group ${style.textSecondary} ${style.itemHover}`}>
                            <Search size={17} strokeWidth={1.5} className={`transition-colors duration-200 ${style.iconBase}`} />
                            <span className="text-[13px] flex-1 font-medium text-left">Cerca…</span>
                            <span className={style.shortcutBadge}>⌘K</span>
                        </button>
                    )}

                    {/* ─── New Chat / Upload Button ─── */}
                    <button
                        className={`nav-item-glow relative f-poppins w-full flex items-center ${isMinimized ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl transition-all duration-300 group ${style.textSecondary} ${style.itemHover}`}
                        onClick={() => {
                            if (isDocumentsPage) {
                                console.log("Apri modal upload");
                            } else {
                                setMessageHistory([]);
                                setCurrentConversationId(null);
                                setCurrentConversationName(null);
                                navigate('/app/chat/');
                            }
                        }}
                    >
                        <div className={`flex items-center ${!isMinimized ? 'gap-3' : ''}`}>
                            <Plus size={17} strokeWidth={1.5} className={`transition-colors duration-200 ${style.iconBase} `} />
                            {!isMinimized && <span className="text-[13px] font-medium">{isDocumentsPage ? "Carica File" : "Nuova Chat"}</span>}
                        </div>
                        {!isDocumentsPage && !isMinimized && (
                            <span className={style.shortcutBadge}>⌘I</span>
                        )}
                    </button>
                </div>

                {/* ─── NAVIGATION ─── */}
                <div className="px-3 pt-6 pb-2">
                    {!isMinimized && <p className={style.sectionLabel}>Workspace</p>}
                    <div className="flex flex-col gap-0.5">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item-glow relative f-poppins flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${isActive || location.pathname.startsWith(item.path)
                                        ? style.textPrimary + " font-medium"
                                        : style.textSecondary + " " + style.itemHover
                                    }`
                                }
                            >
                                {({ isActive }) => {
                                    const active = isActive || location.pathname.startsWith(item.path);
                                    return (
                                        <>
                                            {active && (
                                                <motion.div
                                                    layoutId="activeNav"
                                                    className={`absolute inset-0 rounded-xl ${isDark ? "bg-white/[0.06] ring-1 ring-white/[0.04]" : "bg-black/[0.04] ring-1 ring-black/[0.02]"}`}
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center gap-3">
                                                {React.cloneElement(item.icon as React.ReactElement<any>, {
                                                    size: 17,
                                                    strokeWidth: active ? 2 : 1.5,
                                                    className: `transition-colors duration-200 ${active ? style.iconActive : style.iconBase}`
                                                })}
                                                {!isMinimized && <span className="text-[13px]">{item.label}</span>}
                                            </span>

                                            {/* Active Indicator Dot */}
                                            {active && (
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full ${isDark ? "bg-white" : "bg-neutral-900"}`}
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                        </>
                                    );
                                }}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* ─── Section Header ─── */}
                {!isMinimized && (
                    <div className="px-3 pt-4 pb-1">
                        <p className={style.sectionLabel}>
                            {isDocumentsPage ? "I tuoi documenti" : "Cronologia"}
                            <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-md ${isDark ? "bg-white/[0.04] text-neutral-600" : "bg-neutral-100 text-neutral-600"}`}>
                                {isDocumentsPage ? documentList.length : conversations.length}
                            </span>
                        </p>
                    </div>
                )}

                {/* ─── DYNAMIC LIST ─── */}
                {!isMinimized && <div className={style.scrollbar}>
                    <div className="flex flex-col gap-0.5">
                        <ul className="flex flex-col gap-0.5 relative" ref={convMenuRef}>
                            {!areConversationsLoaded ? (
                                // --- LOADING STATE ---
                                <div className="space-y-2 px-1">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className={`h-9 w-full rounded-xl animate-pulse ${isDark ? "bg-white/[0.04]" : "bg-black/[0.03]"}`} />
                                    ))}
                                </div>
                            ) : isDocumentsPage ? (
                                // --- DOCUMENTS VIEW ---
                                documentList.length > 0 ? (
                                    documentList.map((doc, index) => (
                                        <motion.div
                                            key={doc.document_id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            className={`relative group flex items-center rounded-xl transition-all duration-200 ${style.itemHover}`}
                                        >
                                            <NavLink
                                                onClick={() => {
                                                    setMessageHistory([]);
                                                    navigate(`/app/documents/${doc.document_id}`);
                                                }}
                                                to={`/app/documents/${doc.document_id}`}
                                                className={({ isActive }) =>
                                                    `flex-1 flex items-center f-poppins px-3 py-2 rounded-xl text-[13px] truncate transition-all duration-200 ${isActive
                                                        ? (isDark ? "bg-white/[0.08] text-white font-medium ring-1 ring-white/[0.04]" : "bg-black/[0.04] text-neutral-900 font-medium ring-1 ring-black/[0.02]")
                                                        : style.textSecondary
                                                    }`
                                                }
                                            >
                                                <div className={`flex items-center justify-center mr-2 flex-shrink-0 `}>
                                                    <File size={15} className="opacity-50" />
                                                </div>
                                                <span className="truncate pr-8">{doc.title}</span>
                                            </NavLink>

                                            <button
                                                className={`${style.contextDot} ${docMenuOpen === doc.document_id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${isDark ? "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.06]" : "text-neutral-600 hover:text-neutral-600 hover:bg-black/[0.04]"}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setDocMenuOpen(docMenuOpen === doc.document_id ? null : doc.document_id);

                                                }}
                                            >
                                                <DotsThreeIcon size={18} weight="bold" />
                                            </button>

                                            <ContextMenu
                                                isOpen={docMenuOpen === doc.document_id}
                                                onShare={() => console.log("Condividi:", doc.document_id)}
                                                onRename={() => console.log("Rinomina:", doc.document_id)}
                                                onDelete={() => handleDeleteDocument(doc.document_id)}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${style.textMuted}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isDark ? "bg-white/[0.06]" : "bg-neutral-100"}`}>
                                            <FileText size={18} className="opacity-40" />
                                        </div>
                                        <p className="text-xs font-medium mb-1">Nessun documento</p>
                                        <p className="text-[11px] opacity-60">Carica il tuo primo file</p>
                                    </div>
                                )
                            ) : (
                                // --- CHAT VIEW ---
                                conversations.length > 0 ? (
                                    conversations.map((conv: any, index: number) => (
                                        <motion.div
                                            key={conv.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            className={`relative group flex items-center rounded-xl transition-all duration-200 ${style.itemHover}`}
                                        >
                                            <NavLink
                                                to={`/app/chat/${conv.id}`}
                                                className={({ isActive }) =>
                                                    `flex-1 flex items-center f-poppins px-3 py-2 rounded-xl text-[13px] truncate transition-all duration-200 ${isActive
                                                        ? (isDark ? "bg-white/[0.06] text-white font-medium ring-1 ring-white/[0.04]" : "bg-black/[0.04] text-neutral-900 font-medium ring-1 ring-black/[0.02]")
                                                        : style.textSecondary
                                                    }`
                                                }
                                            >
                                                <div className={`mr-2 rounded-lg flex items-center justify-center`}>
                                                    <ClockCounterClockwiseIcon size={15} className="opacity-50" />
                                                </div>
                                                <span className="truncate pr-8">{conv.title || "Chat senza titolo"}</span>
                                            </NavLink>

                                            <button
                                                className={`${style.contextDot} ${convMenuOpen === conv.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${isDark ? "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.06]" : "text-neutral-600 hover:text-neutral-600 hover:bg-black/[0.04]"}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setConvMenuOpen(convMenuOpen === conv.id ? null : conv.id);
                                                }}
                                            >
                                                <DotsThreeIcon size={18} weight="bold" />
                                            </button>

                                            <ContextMenu
                                                isOpen={convMenuOpen === conv.id}
                                                onShare={() => console.log("Condividi:", conv.id)}
                                                onRename={() => {
                                                    setRenameConversationId(conv.id);
                                                    setRenameTitle(conv.title || "Chat senza titolo");
                                                    setIsRenamePopupOpen(true);
                                                    setConvMenuOpen(null);
                                                }}
                                                onDelete={() => handleDeleteConversation(conv.id)}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${style.textMuted}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isDark ? "bg-white/[0.04]" : "bg-neutral-100"}`}>
                                            <MessageSquare size={18} className="opacity-40" />
                                        </div>
                                        <p className="text-xs font-medium mb-1">Nessuna conversazione</p>
                                        <p className="text-[11px] opacity-60">Inizia una nuova chat</p>
                                    </div>
                                )
                            )}
                        </ul>
                    </div>
                </div>}

                {/* ─── FOOTER ─── */}
                <div className={style.footer}>
                    {/* Subtle top gradient border */}
                    <div className={`absolute top-0 left-3 right-3 h-px ${isDark ? "bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" : "bg-gradient-to-r from-transparent via-black/[0.06] to-transparent"}`} />

                    <AnimatePresence>
                        {isUserMenuOpen && (
                            <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute bottom-full left-0 w-[calc(100%-16px)] mx-2 mb-2 z-50 origin-bottom"
                            >
                                <div className={`rounded-xl border overflow-hidden backdrop-blur-xl ${style.popoverBg}`}>
                                    <div className="p-1 px-1.5 pb-0">
                                        <button className={`${style.popoverItem} group/pro !text-indigo-500 hover:!bg-indigo-500/10`}>
                                            <div className="flex items-center gap-2.5">
                                                <Sparkles size={15} className="text-indigo-500 group-hover/pro:scale-110 transition-transform" />
                                                <span className="font-semibold">Upgrade to Pro</span>
                                            </div>
                                            <ChevronRight size={13} className="ml-auto opacity-0 group-hover/pro:opacity-100 transition-all translate-x-[-4px] group-hover/pro:translate-x-0" />
                                        </button>
                                    </div>

                                    <div className={style.divider} />

                                    <div className="p-1.5 flex flex-col gap-0.5 w-full">
                                        <button
                                            className={`${style.popoverItem} justify-between`}
                                            onClick={() => { setIsSettingOpen(true); setIsUserMenuOpen(false); }}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Settings size={15} className="opacity-50" />
                                                <span>Impostazioni</span>
                                            </div>
                                            <kbd className={style.shortcutBadge}>⌘I</kbd>
                                        </button>

                                        {/* Theme Toggle */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTheme(isDark ? "light" : "dark"); }}
                                            className={`${style.popoverItem} justify-between`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {isDark
                                                    ? <Moon size={15} className="opacity-50" />
                                                    : <Sun size={15} className="opacity-50" />
                                                }
                                                <span>Tema: {isDark ? "Scuro" : "Chiaro"}</span>
                                            </div>
                                            {/* Mini Toggle Visual */}
                                            <div className={`w-8 h-[18px] rounded-full p-[2px] transition-colors ${isDark ? "bg-white/10" : "bg-neutral-200"}`}>
                                                <motion.div
                                                    className={`w-[14px] h-[14px] rounded-full ${isDark ? "bg-white" : "bg-neutral-900"}`}
                                                    animate={{ x: isDark ? 14 : 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            </div>
                                        </button>

                                        {/* Keyboard Shortcuts */}
                                        <button className={style.popoverItem}>
                                            <Keyboard size={15} className="opacity-50" />
                                            <span>Scorciatoie</span>
                                        </button>

                                        <div className={style.divider} />

                                        <div className="p-1">
                                            <button
                                                onClick={() => handleLogOut(convMenuOpen)}
                                                className={`flex items-center gap-2.5 w-full px-3 py-2 text-[13px] rounded-lg transition-all duration-200 text-left ${isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}
                                            >
                                                <LogOut size={15} />
                                                <span>Esci</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* User Button */}
                    <button className={style.userBtn} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                        <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-3'} overflow-hidden`}>
                            {/* Avatar with online indicator */}
                            <div className="relative flex-shrink-0">
                                <img
                                    src={userDetails?.avatar_url || `https://ui-avatars.com/api/?name=${userDetails?.full_name || 'User'}&background=random&bold=true&format=svg`}
                                    alt="Profile"
                                    className={`w-8 h-8 rounded-lg object-cover transition-all duration-300 ${isDark ? "ring-1 ring-white/[0.08]" : "ring-1 ring-black/[0.06]"}`}
                                />
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-emerald-500 ${isDark ? "border-[#0a0a0a]" : "border-[#f0eee6]"}`} />
                            </div>

                            {!isMinimized && (
                                <>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-[13px] font-semibold truncate ${style.textPrimary}`}>
                                            {userDetails?.full_name || "Utente"}
                                        </span>
                                        <span className="text-[11px] font-bold plan-badge">
                                            Early access ✦
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {!isMinimized && (
                            <motion.div
                                animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronUp
                                    size={15}
                                    className={`transition-colors duration-200 ${isUserMenuOpen ? style.iconActive : (isDark ? "text-neutral-600" : "text-neutral-300")}`}
                                />
                            </motion.div>
                        )}
                    </button>
                </div>
            </nav>
        </>
    );
};

export default Sidebar;