import React, { useMemo, useState, useEffect } from 'react';

interface SandboxProps {
    data: {
        html?: string;
        script?: string;
        css?: string;
        libraries?: string[];
    };
    isStreaming?: boolean;
    isDark?: boolean;
}

/**
 * Sandbox.tsx
 * 
 * Safely renders model-generated HTML, JS, and CSS inside a sandboxed iframe.
 * Allows for interactive visualizations like Chart.js, D3, or custom widgets
 * without compromising the main application's security or styling.
 */
const Sandbox: React.FC<SandboxProps> = ({ data, isStreaming, isDark = false }) => {
    const { html = '', script = '', css = '', libraries = [] } = data;
    const [height, setHeight] = useState(300);
    const [errors, setErrors] = useState<string[]>([]);

    const srcDoc = useMemo(() => {
        // Don't generate srcDoc while streaming to prevent iframe flickering/reloads
        if (isStreaming) return '';

        const libs = (libraries || []).map(lib => `<script src="${lib}"></script>`).join('\n');
        const themeModeClass = isDark ? 'dark' : 'light';
        
        return `
            <!DOCTYPE html>
            <html class="${themeModeClass}">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <script src="https://cdn.tailwindcss.com"></script>
                    
                    <script>
                        tailwind.config = {
                            darkMode: 'class',
                            theme: {
                                extend: {
                                    colors: {
                                        canvas: 'var(--theme-bg)',
                                        surface: 'var(--theme-surface)',
                                        'theme-border': 'var(--theme-line)',
                                        accent: 'var(--theme-accent)',
                                        accent2: 'var(--theme-accent2)',
                                        muted: 'var(--theme-muted)',
                                    }
                                }
                            }
                        }
                    </script>

                    <!-- Core Charting & Utils (Auto-injected) -->
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                    <script src="https://cdn.jsdelivr.net/npm/luxon"></script>
                    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-luxon"></script>
                    <script src="https://cdn.jsdelivr.net/npm/chartjs-chart-financial"></script>
                    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>

                    ${libs}
                    <style>
                        :root {
                            --theme-bg: ${isDark ? '#07070a' : '#faf9f6'};
                            --theme-surface: ${isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'};
                            --theme-line: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
                            --theme-accent: #f97316;
                            --theme-accent2: #fb923c;
                            --theme-muted: ${isDark ? 'rgba(244,241,234,0.68)' : 'rgba(0,0,0,0.6)'};
                        }

                        body { 
                            margin: 0; 
                            padding: 0.75rem; 
                            background: transparent; 
                            color: ${isDark ? '#f4f1ea' : '#171717'};
                            font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            overflow: hidden;
                        }

                        /* Constrain chart containers to prevent infinite resize loops */
                        .chart-container {
                            position: relative;
                            width: 100%;
                            height: 260px;
                            max-height: 400px;
                        }
                        canvas {
                            max-height: 400px;
                        }

                        ${css}
                        /* Hide scrollbars but allow scrolling if needed */
                        ::-webkit-scrollbar { display: none; }
                    </style>
                </head>
                <body>
                    <div id="root" class="w-full h-auto flex flex-col gap-3">${html}</div>
                    <script>
                        (function() {
                            // Error handling to capture and report to parent
                            window.onerror = function(msg, url, line) {
                                window.parent.postMessage({ type: 'sandbox-error', message: msg + " (line " + line + ")" }, '*');
                                console.error("Sandbox Error: " + msg + " at " + line);
                            };

                            // Capture console errors too
                            const oldConsoleError = console.error;
                            console.error = function(...args) {
                                window.parent.postMessage({ type: 'sandbox-error', message: args.join(' ') }, '*');
                                oldConsoleError.apply(console, args);
                            };

                            // Use getBoundingClientRect on #root instead of documentElement.scrollHeight
                            // to prevent infinite resize loops with responsive charts
                            function sendHeight() {
                                try {
                                    const root = document.getElementById('root');
                                    if (!root) return;
                                    const rect = root.getBoundingClientRect();
                                    const height = Math.ceil(rect.height) + 24;
                                    window.parent.postMessage({ type: 'resize-sandbox', height: height }, '*');
                                } catch (e) {}
                            }

                            let rafId;
                            let lastSentHeight = 0;
                            function handleResize() {
                                if (rafId) cancelAnimationFrame(rafId);
                                rafId = requestAnimationFrame(() => {
                                    const root = document.getElementById('root');
                                    if (!root) return;
                                    const newHeight = Math.ceil(root.getBoundingClientRect().height) + 24;
                                    // Only send if height changed significantly (>5px) to avoid feedback loops
                                    if (Math.abs(newHeight - lastSentHeight) > 5) {
                                        lastSentHeight = newHeight;
                                        window.parent.postMessage({ type: 'resize-sandbox', height: newHeight }, '*');
                                    }
                                });
                            }

                            document.addEventListener('DOMContentLoaded', () => {
                                try {
                                    ${script}
                                } catch (e) {
                                    window.parent.postMessage({ type: 'sandbox-error', message: e.message || e.toString() }, '*');
                                    console.error("Execution Error:", e);
                                }
                                setTimeout(sendHeight, 150);
                            });

                            window.addEventListener('load', () => setTimeout(sendHeight, 200));
                            const resizeObserver = new ResizeObserver(() => {
                                handleResize();
                            });
                            resizeObserver.observe(document.getElementById('root') || document.documentElement);
                        })();
                    </script>
                </body>
            </html>
        `;
    }, [html, script, css, libraries, isStreaming, isDark]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'resize-sandbox' && typeof event.data.height === 'number') {
                // Limit range to prevent weird jumps
                const newHeight = Math.max(100, Math.min(event.data.height + 40, 2000));
                setHeight(newHeight);
            }
            if (event.data.type === 'sandbox-error') {
                setErrors(prev => Array.from(new Set([...prev, event.data.message])));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className="w-full my-4 flex flex-col gap-2">
            <div className={`w-full overflow-hidden bg-transparent transition-all ${isStreaming ? 'opacity-50 grayscale' : 'opacity-100 grayscale-0'}`}>
                {isStreaming ? (
                    <div className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex gap-1 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"></span>
                        </div>
                        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">Generando Sandbox...</span>
                    </div>
                ) : (
                    <iframe
                        title="GenUI Sandbox"
                        srcDoc={srcDoc}
                        className="w-full border-none block"
                        style={{ height: `${height}px` }}
                        sandbox="allow-scripts"
                    />
                )}
            </div>
            
            {!isStreaming && errors.length > 0 && (
                <div className="mx-1 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase tracking-wider mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Sandbox Execution Errors
                    </div>
                    <ul className="space-y-1">
                        {errors.map((err, i) => (
                            <li key={i} className="text-[11px] font-mono text-rose-700 dark:text-rose-300 break-all bg-rose-100/50 dark:bg-rose-900/40 px-2 py-1 rounded">
                                {err}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default React.memo(Sandbox);
