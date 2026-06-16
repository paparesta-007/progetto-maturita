import React, { useEffect, useState } from "react";
import { User, Copy as CopyIcon, Check as CheckIcon, PencilSimple, FilePdf, FileDoc, FileXls, FileCode, FileImage, File } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import Tooltip from "./Tooltip";
import selectUserDetails from "../../services/supabase/User/SelectuserDetails";

const getFileIcon = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf':
            return <FilePdf size={20} weight="bold" className="text-red-400" />;
        case 'doc':
        case 'docx':
        case 'odt':
            return <FileDoc size={20} weight="bold" className="text-blue-400" />;
        case 'xls':
        case 'xlsx':
        case 'ods':
        case 'csv':
            return <FileXls size={20} weight="bold" className="text-green-400" />;
        case 'js':
        case 'ts':
        case 'tsx':
        case 'jsx':
        case 'py':
        case 'html':
        case 'css':
        case 'json':
            return <FileCode size={20} weight="bold" className="text-yellow-400" />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'webp':
        case 'svg':
            return <FileImage size={20} weight="bold" className="text-purple-400" />;
        default:
            return <File size={20} weight="bold" />;
    }
};

const UserMessage = React.memo(({ i, htmlContent, tokens = 0, files }: { i: number; htmlContent: string; tokens?: number; files?: any[] }) => {
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
        wrapper: `relative group w-full flex flex-row-reverse gap-2 sm:gap-3.5 items-start justify-start my-2`,

        // Avatar
        avatar: `relative flex-shrink-0`,
        avatarInner: `w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${isDark
                ? "bg-white/10 text-white ring-1 ring-white/10 shadow-lg"
                : "bg-neutral-200 text-neutral-600 ring-1 ring-black/[0.03]"
            }`,
        avatarGlow: `absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDark ? "bg-indigo-500/20" : "bg-indigo-500/10"
            }`,

        // Message Bubble
        bubble: `relative max-w-full md:max-w-[85%] lg:max-w-[90%] rounded-2xl rounded-tr-sm p-3 sm:p-4 text-sm leading-relaxed transition-all duration-300 ${isDark
                ? "text-white/90 glass-soft ring-1 ring-white/5"
                : "text-[#2c2825] bg-[#f0ebe4]"
            }`,

        // Action Bar
        actionBar: `flex items-center gap-2 mt-1.5 mr-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300`,
        actionBtn: `p-1.5 rounded-lg transition-all  cursor-pointer ${isDark
                ? "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.06]"
                : "text-neutral-600 hover:text-neutral-600 hover:bg-black/[0.04]"
            }`,

        // Token Badge
        tokenBadge: `text-[10px] font-medium px-1.5 py-0.5 rounded ml-2 select-none ${isDark ? "text-neutral-600 bg-white/[0.02]" : "text-neutral-600 bg-black/[0.02]"
            }`,

        // File Card
        fileCard: `flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 max-w-sm w-full ${isDark
                ? "bg-black/30 border-white/5 text-neutral-200 hover:bg-black/45"
                : "bg-white/60 border-[#dcd5c9] text-[#2c2825] hover:bg-white/80 shadow-sm"
            }`,
        fileIconContainer: `w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 ${isDark
                ? "bg-white/5 text-neutral-400"
                : "bg-[#e8e2d9]/60 text-neutral-600"
            }`,
        fileName: `text-xs font-semibold truncate max-w-[180px] ${isDark
                ? "text-neutral-200"
                : "text-[#2c2825]"
            }`,
        fileSize: `text-[10px] ${isDark
                ? "text-neutral-500"
                : "text-[#8c8278]"
            }`,
        fileDivider: `border-b my-2.5 w-full ${isDark
                ? "border-white/5"
                : "border-black/[0.06]"
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
                <div className={s.bubble}>
                    {files && files.length > 0 && (
                        <div className="flex flex-col gap-2 mb-3 w-full">
                            {files.map((file, idx) => {
                                const isImage = file.type === "image_url" || (file.url && file.url.startsWith("data:image/"));
                                return (
                                    <div key={idx} className={s.fileCard}>
                                        {isImage && file.url ? (
                                            <img src={file.url} alt="attached file" className="w-10 h-10 object-cover rounded-lg bg-neutral-100 flex-shrink-0 ring-1 ring-black/5" />
                                        ) : (
                                            <div className={s.fileIconContainer}>
                                                {getFileIcon(file.name)}
                                            </div>
                                        )}
                                        <div className="flex flex-col overflow-hidden text-left">
                                            <span className={s.fileName}>{file.name || "File"}</span>
                                            {file.size && <span className={s.fileSize}>{(file.size / 1024).toFixed(0)} KB</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            <div className={s.fileDivider} />
                        </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>

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
});

export default UserMessage;