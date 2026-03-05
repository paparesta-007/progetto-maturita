import React, { useEffect, useState } from "react";
import { User, Copy as CopyIcon, Check as CheckIcon, PencilSimple } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import Tooltip from "./Tooltip";
import selectUserDetails from "../../services/supabase/User/SelectuserDetails";

const UserMessage = ({ i, htmlContent, tokens = 0 }: { i: number; htmlContent: string; tokens?: number }) => {
    const { user, theme } = useAuth() || { user: { id: null }, theme: 'light' };
    const [userDetails, setUserDetails] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
    const [copied, setCopied] = useState(false);
    
    const isDark = theme === 'dark';

    useEffect(() => {
        const fetchDetails = async () => {
            if (user?.id) {
                const data = await selectUserDetails(user.id);
                setUserDetails(data);
            }
        };
        fetchDetails();
    }, [user]);

    const handleCopy = async () => {
        try {
            // Strip HTML tags for copying text
            const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
            const text = doc.body.textContent || "";
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    // ─── Premium Style Tokens ───
    const s = {
        wrapper: `relative group w-full flex flex-row-reverse gap-3.5 items-start justify-start my-2`,
        
        // Avatar
        avatar: `relative flex-shrink-0`,
        avatarInner: `w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isDark 
                ? "bg-neutral-800 text-neutral-200 ring-1 ring-white/[0.04]" 
                : "bg-neutral-200 text-neutral-600 ring-1 ring-black/[0.03]"
        }`,
        avatarGlow: `absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
            isDark ? "bg-indigo-500/20" : "bg-indigo-500/10"
        }`,

        // Message Bubble
        bubble: `relative max-w-[85%] rounded-2xl rounded-tr-sm p-4 text-sm leading-relaxed transition-all duration-300 ${
            isDark
                ? "text-neutral-100 bg-neutral-800/50 ring-1 ring-white/[0.06]"
                : "text-neutral-800 bg-neutral-50 ring-1 ring-black/[0.04] shadow-sm shadow-black/[0.02]"
        }`,

        // Action Bar
        actionBar: `flex items-center gap-2 mt-1.5 mr-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300`,
        actionBtn: `p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
            isDark
                ? "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.06]"
                : "text-neutral-400 hover:text-neutral-600 hover:bg-black/[0.04]"
        }`,
        
        // Token Badge
        tokenBadge: `text-[10px] font-medium px-1.5 py-0.5 rounded ml-2 select-none ${
            isDark ? "text-neutral-600 bg-white/[0.02]" : "text-neutral-400 bg-black/[0.02]"
        }`
    };

    return (
        <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={s.wrapper}
        >
            {/* ─── Avatar (Right) ─── */}
            <div className={s.avatar}>
                <div className={s.avatarGlow} />
                <div className={s.avatarInner}>
                    {userDetails?.avatar_url ? (
                        <img 
                            src={userDetails.avatar_url} 
                            alt="User" 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <span className="text-xs font-bold">
                            {userDetails?.full_name 
                                ? userDetails.full_name.charAt(0).toUpperCase() 
                                : <User size={14} weight="bold" />
                            }
                        </span>
                    )}
                </div>
            </div>

            {/* ─── Content Column ─── */}
            <div className="flex flex-col items-end min-w-0">
                
                {/* Message Bubble */}
                <div 
                    className={s.bubble}
                    // Apply a specific class for typography handling if you use the global CSS from BotMessage
                    // or rely on Tailwind's prose/text utilities.
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                />

                {/* Action Bar (Copy, Edit, Tokens) */}
                <div className={s.actionBar}>
                    {/* Token Count */}
                    <span className={s.tokenBadge}>
                        {tokens > 0 ? tokens : 13} tokens
                    </span>

                    {/* Copy Button */}
                    <Tooltip content={copied ? "Copiato!" : "Copia testo"}>
                        <button onClick={handleCopy} className={s.actionBtn}>
                            <AnimatePresence mode="wait" initial={false}>
                                {copied ? (
                                    <motion.div
                                        key="check"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <CheckIcon size={14} weight="bold" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="copy"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <CopyIcon size={14} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </Tooltip>

                    {/* Optional Edit Button Placeholder */}
                    <Tooltip content="Modifica">
                        <button className={s.actionBtn}>
                            <PencilSimple size={14} />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </motion.div>
    );
};

export default UserMessage;