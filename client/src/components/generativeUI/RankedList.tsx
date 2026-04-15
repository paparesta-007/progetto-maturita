/**
 * RankedList.tsx
 * 
 * A beautiful ranked/scored list rendered inline in the chat, similar to
 * the Claude screenshot with app ideas and viability scores.
 * 
 * Example JSON:
 * {
 *   "title": "Top Programming Languages 2024",
 *   "description": "Ranked by popularity and job demand.",
 *   "sortOptions": ["By Score", "A-Z"],
 *   "items": [
 *     { "name": "Python",     "subtitle": "Data science, ML, automation", "score": 95, "icon": "🐍", "tag": "Hot",     "details": { "Difficulty": "Easy",   "Jobs": "150k+" } },
 *     { "name": "TypeScript", "subtitle": "Full-stack web development",   "score": 90, "icon": "🔷", "tag": "Growing", "details": { "Difficulty": "Medium", "Jobs": "120k+" } }
 *   ]
 * }
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RankedItem {
    name: string;
    subtitle?: string;
    score: number;
    icon?: string;
    tag?: string;
    details?: Record<string, string>;
}

interface RankedListData {
    title?: string;
    description?: string;
    sortOptions?: string[];
    items: RankedItem[];
}

const getScoreColor = (score: number, isDark: boolean) => {
    if (score >= 80) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (score >= 60) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    if (score >= 40) return isDark ? 'text-orange-400' : 'text-orange-600';
    return isDark ? 'text-red-400' : 'text-red-500';
};

const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
};

const getTagStyle = (tag: string, isDark: boolean) => {
    const t = tag.toLowerCase();
    if (t.includes('hot') || t.includes('fuoco') || t.includes('fire'))
        return isDark ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200/60';
    if (t.includes('grow') || t.includes('crescita') || t.includes('rising'))
        return isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200/60';
    if (t.includes('forte') || t.includes('nicchia') || t.includes('strong'))
        return isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200/60';
    if (t.includes('pare') || t.includes('sembra') || t.includes('maybe'))
        return isDark ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-600 border-yellow-200/60';
    return isDark ? 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30' : 'bg-neutral-100 text-neutral-500 border-neutral-200';
};

const RankedList: React.FC<{ data: RankedListData }> = ({ data }) => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    const [activeSort, setActiveSort] = useState(0);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // Sort logic
    const sortedItems = [...data.items].sort((a, b) => {
        if (data.sortOptions && activeSort === 1) {
            return a.name.localeCompare(b.name);
        }
        return b.score - a.score; // default: by score desc
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-xl border overflow-hidden my-3 transition-colors duration-300 ${isDark ? 'bg-neutral-900/60 border-neutral-700/40' : 'bg-white/80 border-neutral-200/70'} backdrop-blur-sm`}
        >
            {/* Header */}
            {(data.title || data.sortOptions) && (
                <div className={`px-4 pt-3 pb-2 ${isDark ? 'border-b border-neutral-800/60' : 'border-b border-neutral-100'}`}>
                    {data.title && (
                        <h3 className={`text-sm font-semibold mb-0.5 ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                            {data.title}
                        </h3>
                    )}
                    {data.description && (
                        <p className={`text-[11px] mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                            {data.description}
                        </p>
                    )}

                    {/* Sort pills */}
                    {data.sortOptions && data.sortOptions.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5">
                            {data.sortOptions.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveSort(idx)}
                                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all duration-200 font-medium cursor-pointer ${
                                        activeSort === idx
                                            ? (isDark
                                                ? 'bg-white/10 border-white/15 text-white'
                                                : 'bg-neutral-800 border-neutral-800 text-white')
                                            : (isDark
                                                ? 'bg-transparent border-neutral-700/50 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600'
                                                : 'bg-transparent border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:border-neutral-300')
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Items */}
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                {sortedItems.map((item, idx) => (
                    <motion.div
                        key={item.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`px-4 py-3 transition-colors duration-150 ${
                            isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-neutral-50/80'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            {item.icon && (
                                <span className="text-lg flex-shrink-0">{item.icon}</span>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium truncate ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                                        {item.name}
                                    </span>
                                    {item.tag && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${getTagStyle(item.tag, isDark)}`}>
                                            {item.tag}
                                        </span>
                                    )}
                                </div>
                                {item.subtitle && (
                                    <p className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                        {item.subtitle}
                                    </p>
                                )}
                            </div>

                            {/* Score */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex flex-col items-end">
                                    <span className={`text-lg font-bold tabular-nums ${getScoreColor(item.score, isDark)}`}>
                                        {item.score}
                                    </span>
                                    {/* Score mini bar */}
                                    <div className={`w-12 h-1 rounded-full overflow-hidden mt-0.5 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.score}%` }}
                                            transition={{ duration: 0.6, delay: idx * 0.06, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${getScoreBarColor(item.score)}`}
                                        />
                                    </div>
                                </div>

                                {/* Expand button */}
                                {item.details && Object.keys(item.details).length > 0 && (
                                    <button
                                        onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                        className={`p-1 rounded-md transition-colors cursor-pointer ${isDark ? 'text-neutral-600 hover:text-neutral-400 hover:bg-white/5' : 'text-neutral-400 hover:text-neutral-600 hover:bg-black/5'}`}
                                    >
                                        {expandedIndex === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                            {expandedIndex === idx && item.details && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className={`mt-2.5 pt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t ${isDark ? 'border-neutral-800/60' : 'border-neutral-100'}`}>
                                        {Object.entries(item.details).map(([key, val]) => (
                                            <div key={key} className="text-[11px]">
                                                <span className={`font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                                    {key}
                                                </span>
                                                <span className={`ml-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    {val}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default RankedList;
