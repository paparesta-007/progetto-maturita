import React from "react";
import { Command, Keyboard, ArrowElbowDownLeft, Globe, Plus, Trash } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const SHORTCUTS = [
    { action: "Nuova Chat", keys: ["⌘", "N"], icon: <Plus size={14} /> },
    { action: "Invia Messaggio", keys: ["Enter"], icon: <ArrowElbowDownLeft size={14} /> },
    { action: "Cambia Lingua", keys: ["⌘", "L"], icon: <Globe size={14} /> },
    { action: "Elimina Conversazione", keys: ["⌘", "⌫"], icon: <Trash size={14} /> },
    { action: "Apri Scorciatoie", keys: ["?"], icon: <Keyboard size={14} /> },
];

const ShortcutSetting = () => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    const s = {
        container: `flex flex-col h-full w-full bg-transparent`,
        header: `px-8 pt-8 pb-6 shrink-0`,
        title: `text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-sm mt-1 ${isDark ? "text-neutral-500" : "text-neutral-600"}`,
        
        tableWrapper: `px-8 pb-10`,
        gridRow: `grid grid-cols-2 py-4 items-center border-b ${
            isDark ? "border-white/[0.06]" : "border-black/[0.04]"
        }`,
        
        actionLabel: `flex items-center gap-3 text-sm font-medium ${isDark ? "text-neutral-300" : "text-neutral-700"}`,
        iconBox: `p-2 rounded-lg ${isDark ? "bg-white/[0.03] text-neutral-500" : "bg-black/[0.03] text-neutral-600"}`,
        
        keycap: `inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md border text-[11px] font-bold shadow-sm ${
            isDark 
            ? "bg-neutral-800 border-neutral-700 text-neutral-200" 
            : "bg-white border-neutral-200 text-neutral-600"
        }`
    };

    return (
        <div className={s.container}>
            {/* ─── HEADER ─── */}
            <div className={s.header}>
                <h2 className={s.title}>Scorciatoie</h2>
                <p className={s.subtitle}>Velocizza il tuo lavoro con i comandi rapidi da tastiera.</p>
            </div>

            {/* ─── GRID TABLE ─── */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={s.tableWrapper}
            >
                <div className="flex flex-col">
                    {SHORTCUTS.map((item, idx) => (
                        <div key={idx} className={s.gridRow}>
                            {/* Action Name */}
                            <div className={s.actionLabel}>
                                <div className={s.iconBox}>
                                    {item.icon}
                                </div>
                                {item.action}
                            </div>

                            {/* Shortcut Keys */}
                            <div className="flex justify-end gap-1.5">
                                {item.keys.map((key, kIdx) => (
                                    <React.Fragment key={kIdx}>
                                        <kbd className={s.keycap}>{key}</kbd>
                                        {kIdx < item.keys.length - 1 && (
                                            <span className="text-neutral-500 self-center">+</span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Tip */}
                <div className={`mt-8 p-4 rounded-xl border text-center ${
                    isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-neutral-50 border-black/[0.03]"
                }`}>
                    <p className={`text-xs ${isDark ? "text-neutral-500" : "text-neutral-600"}`}>
                        <Command size={12} className="inline mr-1 mb-0.5" />
                        Usa il tasto <strong>Ctrl</strong> al posto di <strong>⌘</strong> su Windows o Linux.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default ShortcutSetting;