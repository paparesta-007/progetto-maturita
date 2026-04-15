/**
 * ComparisonTable.tsx
 *
 * A beautifully styled comparison table for side-by-side comparison of items.
 * Great for "X vs Y" style questions.
 *
 * Example JSON:
 * {
 *   "title": "React vs Vue",
 *   "columns": ["Feature", "React", "Vue"],
 *   "rows": [
 *     ["Learning Curve",  "Moderate", "Easy"],
 *     ["Ecosystem",       "Massive",  "Growing"],
 *     ["Performance",     "Excellent","Excellent"],
 *     ["State Management","Redux/Zustand","Pinia/Vuex"]
 *   ],
 *   "highlights": { "1": 1, "2": 2 }
 * }
 * 
 * highlights (optional): { rowIndex: columnIndex } — highlights that cell green as "winner"
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface ComparisonTableData {
    title?: string;
    columns: string[];
    rows: string[][];
    highlights?: Record<string, number>; // rowIndex → winning colIndex
}

const ComparisonTable: React.FC<{ data: ComparisonTableData }> = ({ data }) => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';

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

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className={isDark ? 'bg-white/[0.03]' : 'bg-neutral-50/80'}>
                            {data.columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={`px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-[10px] ${
                                        i === 0
                                            ? (isDark ? 'text-neutral-500' : 'text-neutral-500')
                                            : (isDark ? 'text-neutral-300' : 'text-neutral-700')
                                    }`}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-neutral-800/40' : 'divide-neutral-100'}`}>
                        {data.rows.map((row, rIdx) => {
                            const winnerCol = data.highlights?.[String(rIdx)];
                            return (
                                <motion.tr
                                    key={rIdx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: rIdx * 0.04 }}
                                    className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-neutral-50/60'}`}
                                >
                                    {row.map((cell, cIdx) => {
                                        const isWinner = winnerCol !== undefined && cIdx === winnerCol && cIdx > 0;
                                        return (
                                            <td
                                                key={cIdx}
                                                className={`px-3 py-2.5 ${
                                                    cIdx === 0
                                                        ? `font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`
                                                        : isWinner
                                                            ? `font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`
                                                            : (isDark ? 'text-neutral-300' : 'text-neutral-700')
                                                }`}
                                            >
                                                {isWinner && <span className="mr-1">✓</span>}
                                                {cell}
                                            </td>
                                        );
                                    })}
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default ComparisonTable;
