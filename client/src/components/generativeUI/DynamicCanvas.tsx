import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import * as PhosphorIcons from '@phosphor-icons/react';

/**
 * DynamicCanvas.tsx
 * 
 * A high-flexibility component that allows the AI to compose unique layouts
 * on the fly using a set of design-system-aligned primitives.
 */

// --- Types ---

export type SemanticColor = 'primary' | 'accent' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' | 'neutral';

export interface UIElement {
    type: 'container' | 'text' | 'metric' | 'progress' | 'icon' | 'divider' | 'label' | 'sparkline';
    props?: any;
    children?: UIElement[];
}

export interface DynamicCanvasProps {
    data: {
        root: UIElement;
    };
    isStreaming?: boolean;
}

// --- Helpers ---

const MAPPING: Record<SemanticColor, { text: string; bg: string; border: string }> = {
    primary: { text: 'text-neutral-900 dark:text-white', bg: 'bg-neutral-100 dark:bg-neutral-800', border: 'border-neutral-200 dark:border-neutral-700' },
    accent:  { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/50' },
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/50' },
    amber:   { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/50' },
    rose:    { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800/50' },
    violet:  { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800/50' },
    cyan:    { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800/50' },
    neutral: { text: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-50 dark:bg-neutral-800/40', border: 'border-neutral-200 dark:border-neutral-800' },
};

const getColorClasses = (color?: SemanticColor, variant: 'text' | 'bg' | 'border' = 'text') => {
    return MAPPING[color || 'primary'][variant];
};

// --- Primitive Components ---

const ElementRenderer = React.memo(({ element, index, isStreaming }: { element: UIElement; index: number; isStreaming?: boolean }) => {
    const { type, props = {}, children = [] } = element;

    const animation = useMemo(() => ({
        initial: isStreaming ? false : { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: Math.min(index * 0.05, 0.5), duration: 0.3 }
    }), [index, isStreaming]);

    switch (type) {
        case 'container': {
            const { 
                direction = 'col', 
                gap = 4, 
                padding = 4, 
                rounded = 'xl', 
                glass = false,
                border = false,
                align = 'start',
                justify = 'start'
            } = props;

            const isRootContainer = index === 0;
            const effectiveDirection = isRootContainer ? 'col' : direction;
            const effectiveBorder = isRootContainer ? false : border;
            
            const classes = [
                'flex',
                effectiveDirection === 'row' ? 'flex-row' : 'flex-col',
                `gap-${gap}`,
                `p-${padding}`,
                `rounded-${rounded}`,
                align === 'center' ? 'items-center' : align === 'end' ? 'items-end' : 'items-start',
                justify === 'center' ? 'justify-center' : justify === 'between' ? 'justify-between' : 'justify-start',
                glass ? 'bg-transparent backdrop-blur-md' : '',
                effectiveBorder ? 'border border-neutral-200 dark:border-neutral-800' : '',
                props.className || ''
            ].join(' ');

            return (
                <motion.div {...animation} className={classes}>
                    {children.map((child, i) => (
                        <ElementRenderer key={i} element={child} index={i} isStreaming={isStreaming} />
                    ))}
                </motion.div>
            );
        }

        case 'text': {
            const { 
                content, 
                size = 'base', 
                weight = 'normal', 
                color = 'primary', 
                font = 'default' 
            } = props;
            
            const sizeClasses: Record<string, string> = {
                xs: 'text-[10px]', sm: 'text-xs', base: 'text-sm', lg: 'text-base', xl: 'text-lg', '2xl': 'text-xl'
            };
            
            const fontClass = font === 'serif' ? 'f-domine' : 'f-poppins';
            const colorClass = getColorClasses(color, 'text');
            
            return (
                <motion.span 
                    {...animation} 
                    className={`${sizeClasses[size]} font-${weight} ${colorClass} ${fontClass} leading-tight`}
                >
                    {content}
                </motion.span>
            );
        }

        case 'metric': {
            const { value, label, trend, color = 'primary' } = props;
            const colorClass = getColorClasses(color, 'text');
            const bgClass = getColorClasses(color, 'bg');

            return (
                <motion.div {...animation} className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold tracking-tight dark:text-white`}>
                            {value}
                        </span>
                        {trend && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${bgClass} ${colorClass}`}>
                                {trend}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                        {label}
                    </span>
                </motion.div>
            );
        }

        case 'progress': {
            const { value, max = 100, color = 'accent', label, showValue = true } = props;
            const percentage = Math.min(100, Math.max(0, (value / max) * 100));

            return (
                <motion.div {...animation} className="w-full flex flex-col gap-1.5">
                    {(label || showValue) && (
                        <div className="flex justify-between items-center text-[10px] font-medium text-neutral-500 uppercase">
                            <span>{label}</span>
                            {showValue && <span>{value}/{max}</span>}
                        </div>
                    )}
                    <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${color === 'accent' ? 'bg-blue-500' : 
                                       color === 'emerald' ? 'bg-emerald-500' :
                                       color === 'amber' ? 'bg-amber-500' :
                                       color === 'rose' ? 'bg-rose-500' : 'bg-neutral-500'}`}
                        />
                    </div>
                </motion.div>
            );
        }

        case 'icon': {
            const { name, size = 20, color = 'primary', weight = 'duotone' } = props;
            const IconComponent = (PhosphorIcons as any)[name] || PhosphorIcons.Star;
            const colorClass = getColorClasses(color, 'text');

            return (
                <motion.div {...animation} className={colorClass}>
                    <IconComponent size={size} weight={weight} />
                </motion.div>
            );
        }

        case 'divider': {
            return (
                <motion.hr 
                    {...animation} 
                    className="w-full border-neutral-200 dark:border-neutral-800 my-1" 
                />
            );
        }

        case 'label': {
            const { content, tone = 'neutral' } = props;
            const toneMap: Record<string, string> = {
                neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
                accent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            };

            return (
                <motion.span
                    {...animation}
                    className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${toneMap[tone] || toneMap.neutral}`}
                >
                    {content}
                </motion.span>
            );
        }

        default:
            return null;
    }
});

const DynamicCanvas: React.FC<DynamicCanvasProps> = ({ data, isStreaming }) => {
    if (!data || !data.root) return null;

    return (
        <div className="w-full overflow-hidden">
            <ElementRenderer element={data.root} index={0} isStreaming={isStreaming} />
        </div>
    );
};

export default React.memo(DynamicCanvas);
