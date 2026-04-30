import React, { useMemo } from "react";
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

    const s = useMemo(() => ({
        container: `flex flex-col h-full relative transition-all duration-500 font-['Manrope'] ${isDark ? "bg-transparent text-[#f4f1ea]" : "bg-white"}`,
        header: `px-8 pt-8 pb-4 shrink-0 relative z-10`,
        title: `text-2xl font-black tracking-tighter ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-xs font-medium opacity-40 mt-1`,
        
        tableWrapper: `flex-1 overflow-y-auto px-8 py-4 relative z-10 custom-scrollbar`,
        gridRow: `grid grid-cols-2 py-5 items-center border-b ${
            isDark ? "border-white/[0.04]" : "border-neutral-100"
        }`,
        
        actionLabel: `flex items-center gap-4 text-[13px] font-bold tracking-tight ${isDark ? "text-white/90" : "text-neutral-700"}`,
        iconBox: `w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-white/[0.03] text-orange-500 border border-white/5" : "bg-neutral-100 text-neutral-600"}`,
        
        keycap: `inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg border text-[10px] font-black font-mono shadow-sm transition-all ${
            isDark 
            ? "bg-white/[0.03] border-white/10 text-white/70 shadow-[0_2px_10px_rgba(0,0,0,0.3)]" 
            : "bg-white border-neutral-200 text-neutral-600"
        }`
    }), [isDark]);

    return (
        <div className={s.container}>
            {isDark && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px]" />
                </div>
            )}

            {/* HEADER */}
            <div className={s.header}>
                <h2 className={s.title}>Scorciatoie</h2>
                <p className={s.subtitle}>Velocizza il tuo workflow con i comandi rapidi da tastiera.</p>
            </div>

            {/* GRID TABLE */}
            <div className={s.tableWrapper}>
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col"
                >
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
                            <div className="flex justify-end gap-2">
                                {item.keys.map((key, kIdx) => (
                                    <React.Fragment key={kIdx}>
                                        <kbd className={s.keycap}>{key}</kbd>
                                        {kIdx < item.keys.length - 1 && (
                                            <span className="text-white/20 self-center font-mono text-[10px]">+</span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Footer Tip */}
                <div className={`mt-12 p-6 rounded-[1.5rem] border transition-all ${
                    isDark ? "bg-white/[0.01] border-white/5" : "bg-neutral-50 border-neutral-100"
                }`}>
                    <div className="flex gap-4 items-start">
                        <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-white text-neutral-400 shadow-sm"}`}>
                            <Command size={16} weight="bold" />
                        </div>
                        <div>
                            <p className={`text-[11px] font-bold ${isDark ? "text-white/90" : "text-neutral-700"}`}>Compatibilità Sistema</p>
                            <p className={`text-[11px] font-medium opacity-40 leading-relaxed mt-0.5`}>
                                Su Windows o Linux, utilizza il tasto <span className="font-mono bg-white/5 px-1 rounded">Ctrl</span> al posto del simbolo <span className="font-mono bg-white/5 px-1 rounded">⌘</span> (Command).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShortcutSetting;