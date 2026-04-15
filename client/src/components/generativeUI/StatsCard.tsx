/**
 * StatsCard.tsx
 *
 * Renders a grid of statistics with optional trend indicators.
 * Great for dashboards, summaries, quick metrics.
 *
 * Example JSON:
 * {
 *   "title": "Project Metrics",
 *   "stats": [
 *     { "label": "Total Users",   "value": "12,400", "trend": "+12%", "trendUp": true },
 *     { "label": "Revenue",       "value": "$84K",   "trend": "+5%",  "trendUp": true },
 *     { "label": "Bounce Rate",   "value": "24%",    "trend": "-3%",  "trendUp": false },
 *     { "label": "Avg. Session",  "value": "4m 12s", "trend": "+8%",  "trendUp": true }
 *   ]
 * }
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatItem {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
}

interface StatsCardData {
    title?: string;
    stats: StatItem[];
}

const StatsCard: React.FC<{ data: StatsCardData }> = ({ data }) => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    const cols = data.stats.length <= 2 ? 2 : data.stats.length === 3 ? 3 : 2;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-xl border overflow-hidden my-3 backdrop-blur-sm transition-colors duration-300 ${
                isDark ? 'bg-neutral-900/50 border-neutral-700/40' : 'bg-white/80 border-neutral-200/70'
            }`}
        >
            {data.title && (
                <div className={`px-4 pt-3 pb-2 border-b ${isDark ? 'border-neutral-800/60' : 'border-neutral-100'}`}>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                        {data.title}
                    </h3>
                </div>
            )}

            <div className={`grid gap-px ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'} ${isDark ? 'bg-neutral-800/30' : 'bg-neutral-100/50'}`}>
                {data.stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.06, duration: 0.3 }}
                        className={`px-4 py-3 ${isDark ? 'bg-neutral-900/80' : 'bg-white/90'}`}
                    >
                        <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                            {stat.label}
                        </p>
                        <div className="flex items-end gap-2">
                            <span className={`text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {stat.value}
                            </span>
                            {stat.trend && (
                                <span className={`flex items-center gap-0.5 text-[11px] font-semibold mb-0.5 ${
                                    stat.trendUp
                                        ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                                        : (isDark ? 'text-red-400' : 'text-red-500')
                                }`}>
                                    {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {stat.trend}
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default StatsCard;
