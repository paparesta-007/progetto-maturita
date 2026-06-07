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
    Sparkles,
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

/* ─── Classic & Cozy Sidebar Styles ─── */
const SidebarStyles = ({ isDark }: { isDark: boolean }) => (
    <style>{`
        .sidebar-cozy {
            background: ${isDark ? '#07070a' : '#fcfbf9'};
            border-right: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'};
        }

        .cozy-scrollbar::-webkit-scrollbar {
            width: 3px;
        }
        .cozy-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .cozy-scrollbar::-webkit-scrollbar-thumb {
            background: ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'};
            border-radius: 10px;
        }

        .nav-item-cozy {
            transition: all 0.2s ease;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#737373'};
        }
        .nav-item-cozy:hover {
            color: ${isDark ? '#ffffff' : '#171717'};
            background: ${isDark ? 'rgba(255,255,255,0.05)' : '#f5f3f0'};
        }
        .nav-item-cozy.active {
            color: ${isDark ? '#ffffff' : '#171717'};
            background: ${isDark ? 'rgba(255,255,255,0.1)' : '#f0eee6'};
            font-weight: 500;
        }

        .action-button {
            background: ${isDark ? 'rgba(255,255,255,0.05)' : '#f0eee6'};
            color: ${isDark ? '#ffffff' : '#171717'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'};
            transition: all 0.2s ease;
        }
        .action-button:hover {
            background: ${isDark ? 'rgba(255,255,255,0.1)' : '#e8e6de'};
            border-color: ${isDark ? 'rgba(255,255,255,0.2)' : '#d4d4d4'};
        }

        .sidebar-text-muted {
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#a3a3a3'};
        }
        .sidebar-text-primary {
            color: ${isDark ? '#ffffff' : '#171717'};
        }
        .sidebar-border {
            border-color: ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'};
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
    const { user, session, theme, setTheme } = useAuth() || { user: { displayName: "User", photoURL: null }, session: null };
    const { 
        conversations, 
        setMessageHistory, 
        fetchConversations, 
        currentConversationId, 
        setCurrentConversationId, 
        currentConversationName, 
        setCurrentConversationName, 
        areConversationsLoaded 
    } = useChat();
    const [userDetails, setUserDetails] = useState<{ full_name: string | null, avatar_url?: string } | null>(null);
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
    const [editingId, setEditingId] = useState<string | null>(null);

    const isDocumentsPage = location.pathname.includes('/app/documents');
    const isDark = theme === 'dark';

    useEffect(() => {
        const fetchDetails = async () => {
            if (user?.id) {
                const data = await selectUserDetails(user.id);
                setUserDetails(data);
            }
        };
        if (user?.id) {
            fetchDetails();
            fetchUserDocuments(user.id);
        }
    }, [user, fetchUserDocuments]);

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

    const handleLogOut = async () => {
        try {
            await supabase.auth.signOut();
            navigate("/login");
        } catch (error) { alert("Logout error"); }
    };

    const handleDeleteConversation = async (id: string) => {
        if (!user?.id) return;
        await deleteConversation(user.id, id);
        fetchConversations();
        if (location.pathname.includes(id)) navigate("/app/chat");
    };

    const handleDeleteDocument = async (id: string) => {
        if (!user?.id) return;
        await deleteCurrentDocument(user.id, id);
        setDocumentList(prev => prev.filter(d => d.document_id !== id));
        if (location.pathname.includes(id)) navigate("/app/documents");
    };

    const handleRename = async (id: string, title: string) => {
        if (!title.trim()) {
            setEditingId(null);
            return;
        }
        await updateConversationTitle(id, title, user?.id || "", session?.access_token || "");
        if (id === currentConversationId) {
            setCurrentConversationName(title);
        }
        setEditingId(null);
        await fetchConversations();
    };

    const mainNav = [
        { path: "/app/chat", label: "Assistant", icon: <MessageSquare size={18} /> },
        { path: "/app/documents", label: "Library", icon: <FileText size={18} /> },
        { path: "/app/calendar", label: "Schedule", icon: <Calendar size={18} /> },
        { path: "/app/artifacts", label: "Vault", icon: <SquaresFourIcon size={18} /> }
    ];

    return (
        <>
            <SidebarStyles isDark={isDark} />

            <nav className={`sidebar-cozy h-screen flex flex-col transition-all duration-500 ease-in-out relative ${isMinimized ? 'w-[72px]' : 'w-[280px]'} ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden md:flex'}`}>
                
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    {!isMinimized && (
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                            <div className="h-8 w-8 rounded-lg bg-[#171717] text-white flex items-center justify-center">
                                <BrainCircuit size={18} />
                            </div>
                            <span className="font-semibold sidebar-text-primary tracking-tight">Smart AI</span>
                        </div>
                    )}
                    <button onClick={() => setIsMinimized(!isMinimized)} className={`p-1.5 rounded-lg hover:bg-[#f5f3f0] ${isDark ? 'hover:bg-white/5' : ''} text-[#a3a3a3] transition-colors ${isMinimized ? 'mx-auto' : ''}`}>
                        <SidebarSimpleIcon size={20} />
                    </button>
                </div>

                {/* Main Action */}
                <div className="px-4 mb-8">
                    <button 
                        onClick={() => { setMessageHistory([]); setCurrentConversationId(null); navigate('/app/chat/'); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl action-button ${isMinimized ? 'justify-center' : ''}`}
                    >
                        <Plus size={18} />
                        {!isMinimized && <span className="text-sm font-medium">New Project</span>}
                    </button>
                </div>

                {/* Navigation */}
                <div className="px-3 space-y-1 flex-1 overflow-y-auto cozy-scrollbar">
                    {!isMinimized && <p className="px-3 text-[10px] font-bold uppercase tracking-widest sidebar-text-muted mb-3">Workspace</p>}
                    {mainNav.map(item => (
                        <NavLink 
                            key={item.path} 
                            to={item.path} 
                            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl nav-item-cozy ${isActive ? 'active' : ''} ${isMinimized ? 'justify-center' : ''}`}
                        >
                            {React.cloneElement(item.icon as React.ReactElement, { className: 'flex-shrink-0' })}
                            {!isMinimized && <span className="text-sm">{item.label}</span>}
                        </NavLink>
                    ))}

                    <div className="pt-8">
                        {!isMinimized && (
                            <div className="px-3 flex items-center justify-between mb-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest sidebar-text-muted">{isDocumentsPage ? "Library" : "Recent"}</p>
                                <span className={`text-[10px] font-medium sidebar-text-muted ${isDark ? 'bg-white/10' : 'bg-[#f0eee6]'} px-1.5 py-0.5 rounded`}>{isDocumentsPage ? documentList.length : conversations.length}</span>
                            </div>
                        )}
                        
                        <ul className="space-y-1" ref={convMenuRef}>
                            {isDocumentsPage ? (
                                documentList.map(doc => (
                                    <li key={doc.document_id} className="relative group">
                                        <NavLink to={`/app/documents/${doc.document_id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm nav-item-cozy truncate">
                                            <File size={16} className="flex-shrink-0 opacity-40" />
                                            {!isMinimized && <span className="truncate">{doc.title}</span>}
                                        </NavLink>
                                    </li>
                                ))
                            ) : (
                                conversations.map((conv: any) => (
                                    <li key={conv.id} className="relative group">
                                        {editingId === conv.id ? (
                                            <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm bg-[#f0eee6] dark:bg-white/5 border border-[#b08968]/30">
                                                <ClockCounterClockwiseIcon size={16} className="flex-shrink-0 opacity-40" />
                                                <input
                                                    autoFocus
                                                    className={`bg-transparent border-none outline-none w-full text-sm ${isDark ? 'text-white' : 'text-[#171717]'}`}
                                                    value={renameTitle}
                                                    onChange={(e) => setRenameTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRename(conv.id, renameTitle);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    onBlur={() => handleRename(conv.id, renameTitle)}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <NavLink to={`/app/chat/${conv.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm nav-item-cozy truncate group-hover:pr-10">
                                                    <ClockCounterClockwiseIcon size={16} className="flex-shrink-0 opacity-40" />
                                                    {!isMinimized && <span className="truncate">{conv.title || "Untitled Chat"}</span>}
                                                </NavLink>
                                                {!isMinimized && (
                                                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 transition-all z-20 ${convMenuOpen === conv.id ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                                                        <div className="relative">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setConvMenuOpen(convMenuOpen === conv.id ? null : conv.id);
                                                                }}
                                                                className={`p-1 rounded-md transition-all ${convMenuOpen === conv.id ? 'bg-[#e5e5e5] text-[#171717]' : 'hover:bg-[#e5e5e5] text-[#a3a3a3]'}`}
                                                            >
                                                                <DotsThreeIcon size={18} weight="bold" />
                                                            </button>

                                                            <AnimatePresence>
                                                                {convMenuOpen === conv.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                                        className={`absolute right-0 top-full mt-1 w-36 p-1 rounded-xl border shadow-2xl z-[60] overflow-hidden ${isDark ? 'bg-[#0d0e14] border-white/10' : 'bg-white border-[#e5e5e5]'}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingId(conv.id);
                                                                                setRenameTitle(conv.title);
                                                                                setConvMenuOpen(null);
                                                                            }}
                                                                            className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs transition-all ${
                                                                                isDark 
                                                                                    ? 'hover:bg-white/5 text-[#737373] hover:text-white' 
                                                                                    : 'hover:bg-[#f9f8f6] text-[#737373] hover:text-[#171717]'
                                                                            }`}
                                                                        >
                                                                            <PencilLineIcon size={14} /> Rename
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteConversation(conv.id);
                                                                            }}
                                                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-xs text-red-500 transition-all"
                                                                        >
                                                                            <TrashIcon size={14} /> Delete
                                                                        </button>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t sidebar-border">
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#f5f3f0] ${isDark ? 'hover:bg-white/5' : ''} transition-colors ${isMinimized ? 'justify-center' : ''}`}
                        >
                            <img src={userDetails?.avatar_url || `https://ui-avatars.com/api/?name=${userDetails?.full_name || 'U'}`} alt="User" className="h-8 w-8 rounded-lg sidebar-border bg-[#e5e5e5]" />
                            {!isMinimized && (
                                <div className="flex-1 text-left truncate">
                                    <p className="text-sm font-semibold sidebar-text-primary truncate">{userDetails?.full_name || "User"}</p>
                                    <p className="text-[10px] sidebar-text-muted font-medium uppercase tracking-tighter">Pro Subscriber ✦</p>
                                </div>
                            )}
                            {!isMinimized && <ChevronUp size={16} className={`text-[#a3a3a3] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />}
                        </button>

                        <AnimatePresence>
                            {isUserMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className={`absolute bottom-full left-0 w-full mb-2 p-2 rounded-2xl border shadow-xl overflow-hidden ${isDark ? 'bg-[#12121a] border-white/10' : 'bg-white border-[#e5e5e5]'}`}
                                >
                                    <button onClick={() => { setIsSettingOpen(true); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f9f8f6] text-sm text-[#737373] hover:text-[#171717] transition-all">
                                        <Settings size={16} /> Settings
                                    </button>
                                    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f9f8f6] text-sm text-[#737373] hover:text-[#171717] transition-all">
                                        {isDark ? <Sun size={16} /> : <Moon size={16} />} Theme
                                    </button>
                                    <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-[#e5e5e5]'} my-1 mx-2`} />
                                    <button onClick={handleLogOut} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-50 text-sm text-red-500 transition-all">
                                        <LogOut size={16} /> Sign out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Sidebar;