import React, { useState, useEffect, useRef } from "react";
import { NavLink, redirect, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Assumo esista
import { AnimatePresence, motion } from "framer-motion";
import {
    MessageSquare,
    FileText,
    Calendar,
    Settings,
    Plus,
    Search,
    BrainCircuit,
    LogOut,
    User,

} from 'lucide-react';
import { DotsThreeIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import supabase from "../library/supabaseclient";
import selectUserDetails from "../services/supabase/User/SelectuserDetails";
import { useChat } from "../context/ChatContext";

const Sidebar = () => {
    // Mock user per evitare crash se il context non è pronto
    const { user } = useAuth() || { user: { displayName: "Matteo Rossi", photoURL: null } };
    const { conversations, setMessageHistory } = useChat();
    const [userDetails, setUserDetails] = useState<{ full_name: string | null, birthday: string | null } | null>(null);
    const [searchFocused, setSearchFocused] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const fetchUserDetails = async () => {
            const data = await selectUserDetails(user.id);
            setUserDetails(data);
            console.log("Fetched user details:", data);
        };
        fetchUserDetails();
        console.log("Conversazioni nel contesto:", conversations);
    }, [])
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isUserMenuOpen]);
    const menuItems = [
        { path: "/app/chat", label: "Chatbot AI", icon: <MessageSquare size={18} /> },
        { path: "/app/documents", label: "Knowledge Base", icon: <FileText size={18} /> },
        { path: "/app/calendar", label: "Agenda", icon: <Calendar size={18} /> },
    ];


    const handleLogOut = async () => {
        try {
            await supabase.auth.signOut();
            navigate("/login");
        } catch (error) {
            alert("Errore durante il logout. Riprova.");
        }
    }
    return (
        <nav className="w-[280px] h-screen bg-neutral-50 flex flex-col border-r border-neutral-200 font-sans text-sm">

            {/* --- Header & Brand --- */}
            <div className="p-3 pb-2">
                <div className="flex items-center gap-2 mb-6 text-neutral-900 flex items-center gap-2 justify-between">
                    <div className="w-8 h-8 bg-neutral-900 rounded-md flex items-center justify-center text-white cursor-pointer"
                    onClick={()=>{navigate("/")}}>
                        <BrainCircuit size={16} />
                    </div>
                    <div className="w-6 h-6 text-neutral-500 rounded-md flex items-center justify-center ">

                        <SidebarSimpleIcon size={24} />
                    </div>
                </div>

                {/* New Chat Button */}
                <button className="w-full group relative flex items-center justify-between px-4 py-2.5 bg-white text-neutral-900
                 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm rounded-lg transition-all duration-200 
                  "
                    onClick={() => {
                        setMessageHistory([]); // Resetta la cronologia dei messaggi
                        navigate('/app/chat/'); // Naviga alla pagina di nuova chat
                    }
                    }>
                    <div className="flex items-center gap-2 font-medium"
                    >
                        <Plus size={16} className="text-neutral-900" />
                        <span>Nuova Chat</span>
                    </div>
                    <span className="text-[10px] text-neutral-700 border border-neutral-200 px-1.5 py-0.5 rounded 
                    bg-neutral-200/50 transition-colors">⌘K</span>
                </button>
            </div>


            {/* --- Main Navigation --- */}
            <div className="px-2 py-4">
                <p className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Workspace</p>
                <div className="flex flex-col gap-0.5">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                relative flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group
                                ${isActive ? "text-neutral-900 font-medium" : "text-neutral-500 hover:text-neutral-900"}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 bg-neutral-200/50 rounded-md"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-3">
                                        {React.cloneElement(item.icon as React.ReactElement, {
                                            size: 18,
                                            className: isActive ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-600 transition-colors"
                                        })}
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* --- History Section (Scrollable) --- */}
            <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent hover:scrollbar-thumb-neutral-300">
                <p className="px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3 sticky top-0 bg-neutral-50 z-10 py-1">
                    Cronologia
                </p>
                <div className="flex flex-col gap-4">
                    <ul className="flex flex-col gap-1">
                        {conversations.map((conv: any) => (
                            <li key={conv.id}>
                                <NavLink
                                    to={`/app/chat/${conv.id}`}
                                    className={({ isActive }) => `
                                                flex items-center justify-between group gap-2 px-3 py-2 rounded-md transition-colors text-sm
                                                ${isActive ? "bg-neutral-200/50 text-neutral-900 font-medium" : "text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900"}
                                            `}
                                >
                                    <span className="truncate">{conv.title || "Chat senza titolo"}</span>
                                    <DotsThreeIcon size={20} className="opacity-0 group-hover:opacity-100 hover:text-neutral-900 text-neutral-500 float-right" />
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="p-2 border-t border-neutral-200 bg-neutral-50 relative">

                {/* Menu Popover */}
                <AnimatePresence>
                    {isUserMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute bottom-full left-0 w-[calc(100%-16px)] mx-2 mb-2 z-50 origin-bottom"
                        >
                            <div className="bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden ring-1 ring-black/5">
                                <div className="p-1 flex flex-col gap-0.5">
                                    <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors text-left">
                                        <Settings size={16} className="text-neutral-500" />
                                        <span>Impostazioni</span>
                                    </button>
                                    <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors text-left">
                                        <User size={16} className="text-neutral-500" />
                                        <span>Il mio account</span>
                                    </button>
                                </div>

                                <div className="h-px bg-neutral-100 my-0.5 mx-2" />

                                <div className="p-1">
                                    <button
                                        onClick={handleLogOut}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                    >
                                        <LogOut size={16} />
                                        <span>Esci</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* User Button */}
                <button
                    className={`w-full flex items-center justify-between p-2 select-none rounded-lg transition-all duration-200 group text-left
        ${isUserMenuOpen ? "bg-white shadow-sm ring-1 ring-neutral-200" : "hover:bg-neutral-200/50"}`}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img
                            src={userDetails?.avatar_url || `https://ui-avatars.com/api/?name=${userDetails?.full_name || 'User'}&background=random`}
                            alt="Profile"
                            className="w-8 h-8 rounded-full border border-neutral-200 object-cover"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-neutral-900 truncate">
                                {userDetails?.full_name || "Utente"}
                            </span>
                            <span className="text-xs text-neutral-500 font-medium truncate">
                                Pro Plan
                            </span>
                        </div>
                    </div>
                    <Settings
                        size={16}
                        className={`text-neutral-400 transition-transform duration-200 
            ${isUserMenuOpen ? "rotate-90 text-neutral-600" : "group-hover:text-neutral-700"}`}
                    />
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;