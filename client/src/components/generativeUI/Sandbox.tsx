import React, { useMemo, useState, useEffect } from 'react';

interface SandboxProps {
    data: {
        html?: string;
        script?: string;
        css?: string;
        libraries?: string[];
    };
}

/**
 * Sandbox.tsx
 * 
 * Safely renders model-generated HTML, JS, and CSS inside a sandboxed iframe.
 * Allows for interactive visualizations like Chart.js, D3, or custom widgets
 * without compromising the main application's security or styling.
 */
const Sandbox: React.FC<SandboxProps> = ({ data }) => {
    const { html = '', script = '', css = '', libraries = [] } = data;
    const [height, setHeight] = useState(300);
    const [errors, setErrors] = useState<string[]>([]);

    const srcDoc = useMemo(() => {
        const libs = (libraries || []).map(lib => `<script src="${lib}"></script>`).join('\n');
        
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <script src="https://cdn.tailwindcss.com"></script>
                    ${libs}
                    <style>
                        body { 
                            margin: 0; 
                            padding: 1rem; 
                            background: transparent; 
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            overflow: hidden;
                        }
                        ${css}
                        /* Hide scrollbars but allow scrolling if needed */
                        ::-webkit-scrollbar { display: none; }
                    </style>
                </head>
                <body>
                    <div id="root">${html}</div>
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

                            function sendHeight() {
                                try {
                                    const height = document.documentElement.scrollHeight;
                                    window.parent.postMessage({ type: 'resize-sandbox', height: height }, '*');
                                } catch (e) {}
                            }

                            let rafId;
                            function handleResize() {
                                if (rafId) cancelAnimationFrame(rafId);
                                rafId = requestAnimationFrame(sendHeight);
                            }

                            document.addEventListener('DOMContentLoaded', () => {
                                try {
                                    ${script}
                                } catch (e) {
                                    window.parent.postMessage({ type: 'sandbox-error', message: e.message || e.toString() }, '*');
                                    console.error("Execution Error:", e);
                                }
                                setTimeout(sendHeight, 100);
                            });

                            window.addEventListener('load', sendHeight);
                            const resizeObserver = new ResizeObserver(() => {
                                handleResize();
                            });
                            resizeObserver.observe(document.documentElement);
                        })();
                    </script>
                </body>
            </html>
        `;
    }, [html, script, css, libraries]);

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
            <div className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900/50 shadow-sm transition-all">
                <iframe
                    title="GenUI Sandbox"
                    srcDoc={srcDoc}
                    className="w-full border-none block"
                    style={{ height: `${height}px` }}
                    sandbox="allow-scripts"
                />
            </div>
            
            {errors.length > 0 && (
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
