/**
 * InfoCard.tsx
 * 
 * A beautiful, glassmorphism-styled info card rendered inline in chat.
 * The AI provides JSON with: title, description, items (optional), icon (optional), color (optional).
 * 
 * Example JSON:
 * {
 *   "title": "React Hooks Overview",
 *   "description": "The most commonly used hooks in React.",
 *   "icon": "⚛️",
 *   "color": "blue",
 *   "items": [
 *     { "label": "useState", "value": "Local component state" },
 *     { "label": "useEffect", "value": "Side effects & lifecycle" }
 *   ]
 * }
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface InfoCardItem {
    label: string;
    value: string;
}

interface InfoCardData {
    title: string;
    description?: string;
    icon?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink';
    items?: InfoCardItem[];
}

const colorMap: Record<string, { bg: string; bgDark: string; border: string; borderDark: string; accent: string; accentDark: string }> = {
    blue:   { bg: 'bg-blue-50/60',   bgDark: 'bg-blue-950/20',   border: 'border-blue-200/50',   borderDark: 'border-blue-500/15',   accent: 'text-blue-600',   accentDark: 'text-blue-400' },
    green:  { bg: 'bg-emerald-50/60', bgDark: 'bg-emerald-950/20', border: 'border-emerald-200/50', borderDark: 'border-emerald-500/15', accent: 'text-emerald-600', accentDark: 'text-emerald-400' },
    purple: { bg: 'bg-purple-50/60',  bgDark: 'bg-purple-950/20',  border: 'border-purple-200/50',  borderDark: 'border-purple-500/15',  accent: 'text-purple-600',  accentDark: 'text-purple-400' },
    orange: { bg: 'bg-orange-50/60',  bgDark: 'bg-orange-950/20',  border: 'border-orange-200/50',  borderDark: 'border-orange-500/15',  accent: 'text-orange-600',  accentDark: 'text-orange-400' },
    red:    { bg: 'bg-red-50/60',     bgDark: 'bg-red-950/20',     border: 'border-red-200/50',     borderDark: 'border-red-500/15',     accent: 'text-red-600',     accentDark: 'text-red-400' },
    cyan:   { bg: 'bg-cyan-50/60',    bgDark: 'bg-cyan-950/20',    border: 'border-cyan-200/50',    borderDark: 'border-cyan-500/15',    accent: 'text-cyan-600',    accentDark: 'text-cyan-400' },
    pink:   { bg: 'bg-pink-50/60',    bgDark: 'bg-pink-950/20',    border: 'border-pink-200/50',    borderDark: 'border-pink-500/15',    accent: 'text-pink-600',    accentDark: 'text-pink-400' },
};

const InfoCard: React.FC<{ data: InfoCardData }> = ({ data }) => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    const c = colorMap[data.color || 'blue'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-xl border p-4 my-3 backdrop-blur-sm transition-colors duration-300 ${
                isDark ? `${c.bgDark} ${c.borderDark}` : `${c.bg} ${c.border}`
            }`}
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
                {data.icon && <span className="text-xl">{data.icon}</span>}
                <h3 className={`text-sm font-semibold tracking-tight ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                    {data.title}
                </h3>
            </div>

            {/* Description */}
            {data.description && (
                <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {data.description}
                </p>
            )}

            {/* Items */}
            {data.items && data.items.length > 0 && (
                <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {data.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                            <span className={`font-semibold min-w-[80px] flex-shrink-0 ${isDark ? c.accentDark : c.accent}`}>
                                {item.label}
                            </span>
                            <span className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default InfoCard;
