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
const SidebarStyles = () => (
    <style>{`
        .sidebar-cozy {
            background: #fcfbf9;
            border-right: 1px solid #e5e5e5;
        }

        .cozy-scrollbar::-webkit-scrollbar {
            width: 3px;
        }
        .cozy-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .cozy-scrollbar::-webkit-scrollbar-thumb {
            background: #e5e5e5;
            border-radius: 10px;
        }

        .nav-item-cozy {
            transition: all 0.2s ease;
            color: #737373;
        }
        .nav-item-cozy:hover {
            color: #171717;
            background: #f5f3f0;
        }
        .nav-item-cozy.active {
            color: #171717;
            background: #f0eee6;
            font-weight: 500;
        }

        .action-button {
            background: #f0eee6;
            color: #171717;
            border: 1px solid #e5e5e5;
            transition: all 0.2s ease;
        }
        .action-button:hover {
            background: #e8e6de;
            border-color: #d4d4d4;
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
    const { user, theme, setTheme } = useAuth() || { user: { displayName: "User", photoURL: null } };
    const { conversations, setMessageHistory, fetchConversations, setCurrentConversationId, setCurrentConversationName, areConversationsLoaded } = useChat();
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
        navigate("/app");
    };

    const handleDeleteDocument = async (id: string) => {
        if (!user?.id) return;
        await deleteCurrentDocument(user.id, id);
        setDocumentList(prev => prev.filter(d => d.document_id !== id));
        if (location.pathname.includes(id)) navigate("/app/documents");
    };

    const handleRename = async (id: string, title: string) => {
        await updateConversationTitle(id, title, user?.id || "");
        fetchConversations();
    };

    const mainNav = [
        { path: "/app/chat", label: "Assistant", icon: <MessageSquare size={18} /> },
        { path: "/app/documents", label: "Library", icon: <FileText size={18} /> },
        { path: "/app/calendar", label: "Schedule", icon: <Calendar size={18} /> },
        { path: "/app/artifacts", label: "Vault", icon: <SquaresFourIcon size={18} /> }
    ];

    return (
        <>
            <SidebarStyles />
            <AnimatePresence>
                {isRenamePopupOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-xl border border-[#e5e5e5]">
                            <h2 className="text-xl font-semibold mb-6 text-center text-[#171717]">Rename Conversation</h2>
                            <input
                                type="text"
                                value={renameTitle}
                                onChange={(e) => setRenameTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl mb-8 bg-[#f9f8f6] border border-[#e5e5e5] outline-none focus:border-[#b08968] transition-colors"
                                placeholder="Enter title..."
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setIsRenamePopupOpen(false)} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-[#737373] hover:bg-[#f5f3f0] transition-colors">Cancel</button>
                                <button onClick={() => { handleRename(renameConversationId!, renameTitle); setIsRenamePopupOpen(false); }} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-[#171717] text-white hover:bg-black transition-colors">Save</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <nav className={`sidebar-cozy h-screen flex flex-col transition-all duration-500 ease-in-out relative ${isMinimized ? 'w-[72px]' : 'w-[280px]'} ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden md:flex'}`}>
                
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    {!isMinimized && (
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                            <div className="h-8 w-8 rounded-lg bg-[#171717] text-white flex items-center justify-center">
                                <BrainCircuit size={18} />
                            </div>
                            <span className="font-semibold text-[#171717] tracking-tight">Smart AI</span>
                        </div>
                    )}
                    <button onClick={() => setIsMinimized(!isMinimized)} className={`p-1.5 rounded-lg hover:bg-[#f5f3f0] text-[#a3a3a3] transition-colors ${isMinimized ? 'mx-auto' : ''}`}>
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
                    {!isMinimized && <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-3">Workspace</p>}
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
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3]">{isDocumentsPage ? "Library" : "Recent"}</p>
                                <span className="text-[10px] font-medium text-[#a3a3a3] bg-[#f0eee6] px-1.5 py-0.5 rounded">{isDocumentsPage ? documentList.length : conversations.length}</span>
                            </div>
                        )}
                        
                        <ul className="space-y-1">
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
                                        <NavLink to={`/app/chat/${conv.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm nav-item-cozy truncate">
                                            <ClockCounterClockwiseIcon size={16} className="flex-shrink-0 opacity-40" />
                                            {!isMinimized && <span className="truncate">{conv.title || "Untitled Chat"}</span>}
                                        </NavLink>
                                        {!isMinimized && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-all">
                                                <button 
                                                    onClick={() => { setRenameConversationId(conv.id); setRenameTitle(conv.title); setIsRenamePopupOpen(true); }}
                                                    className="p-1 rounded-md hover:bg-[#e5e5e5] text-[#a3a3a3] transition-all"
                                                >
                                                    <DotsThreeIcon size={16} weight="bold" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteConversation(conv.id)}
                                                    className="p-1 rounded-md hover:bg-red-50 text-red-400 transition-all"
                                                >
                                                    <TrashIcon size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#e5e5e5]">
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#f5f3f0] transition-colors ${isMinimized ? 'justify-center' : ''}`}
                        >
                            <img src={userDetails?.avatar_url || `https://ui-avatars.com/api/?name=${userDetails?.full_name || 'U'}`} alt="User" className="h-8 w-8 rounded-lg bg-[#e5e5e5]" />
                            {!isMinimized && (
                                <div className="flex-1 text-left truncate">
                                    <p className="text-sm font-semibold text-[#171717] truncate">{userDetails?.full_name || "User"}</p>
                                    <p className="text-[10px] text-[#a3a3a3] font-medium uppercase tracking-tighter">Pro Subscriber ✦</p>
                                </div>
                            )}
                            {!isMinimized && <ChevronUp size={16} className={`text-[#a3a3a3] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />}
                        </button>

                        <AnimatePresence>
                            {isUserMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full left-0 w-full mb-2 p-2 bg-white rounded-2xl border border-[#e5e5e5] shadow-xl overflow-hidden"
                                >
                                    <button onClick={() => { setIsSettingOpen(true); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f9f8f6] text-sm text-[#737373] hover:text-[#171717] transition-all">
                                        <Settings size={16} /> Settings
                                    </button>
                                    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f9f8f6] text-sm text-[#737373] hover:text-[#171717] transition-all">
                                        {isDark ? <Sun size={16} /> : <Moon size={16} />} Theme
                                    </button>
                                    <div className="h-px bg-[#e5e5e5] my-1 mx-2" />
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