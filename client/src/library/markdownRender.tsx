import React, { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import { getHighlighter } from "../library/shikiHighlighter";
import { useAuth } from "../context/AuthContext";
import { Check, Copy } from "lucide-react"; // Importa icone se vuoi usarle (opzionale)

const MarkdownRender = ({ text, isStreaming, themeOverride }: { text: string; isStreaming?: boolean; themeOverride?: 'light' | 'dark' }) => {
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(!text);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { theme: authTheme } = useAuth();
    const theme = themeOverride || authTheme;
    const containerRef = useRef<HTMLDivElement>(null); 
    const previousTextRef = useRef<string>("");

    // --- PIPELINE DI RENDERING ---
    const renderMarkdownSync = (rawText: string) => {
        // Versione sincrona e semplificata per streaming veloce
        try {
            let processedText = rawText;
            
            // Protezione e rendering LaTeX inline e block (veloce)
            processedText = processedText.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula) => {
                try {
                    return katex.renderToString(formula, { displayMode: true, throwOnError: false });
                } catch { return _match; }
            });
            processedText = processedText.replace(/\$([^$\n]+?)\$/g, (_match, formula) => {
                try {
                    return katex.renderToString(formula, { displayMode: false, throwOnError: false });
                } catch { return _match; }
            });

            const tokens = marked.lexer(processedText);
            const html = marked.parser(tokens);
            return DOMPurify.sanitize(html, {
                ADD_TAGS: ['math', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mtext', 'annotation', 'annotation-xml', 'svg', 'path', 'g', 'div', 'span', 'pre', 'code', 'button', 'rect'],
                ADD_ATTR: ['style', 'class', 'viewBox', 'd', 'fill', 'xmlns', 'width', 'height', 'data-language', 'data-code', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'x', 'y', 'rx', 'ry', 'aria-hidden']
            });
        } catch (e) {
            return rawText;
        }
    };

    const renderMarkdown = useCallback(async (rawText: string) => {
        const latexMap = new Map<string, string>();
        let latexCounter = 0;

        // 1. Protezione Code Block (evita che LaTeX tocchi il codice)
        const codeMap = new Map<string, string>();
        let codeCounter = 0;
        
        let safeText = rawText.replace(/```[\s\S]*?```/g, (match) => {
            const placeholder = `CODEBLOCK${codeCounter++}ENDCODE`;
            codeMap.set(placeholder, match);
            return placeholder;
        });
        
        safeText = safeText.replace(/`[^`\n]+`/g, (match) => {
            const placeholder = `INLINECODE${codeCounter++}ENDCODE`;
            codeMap.set(placeholder, match);
            return placeholder;
        });

        // 2. Protezione LaTeX
        const protectLatex = (str: string) => {
            let protectedStr = str.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula) => {
                const placeholder = `LATEXBLOCK${latexCounter++}ENDLATEX`;
                try {
                    latexMap.set(placeholder, katex.renderToString(formula, { displayMode: true, throwOnError: false }));
                } catch { latexMap.set(placeholder, _match); }
                return placeholder;
            });
            protectedStr = protectedStr.replace(/\$([^$\n]+?)\$/g, (_match, formula) => {
                const placeholder = `LATEXINLINE${latexCounter++}ENDLATEX`;
                try {
                    latexMap.set(placeholder, katex.renderToString(formula, { displayMode: false, throwOnError: false }));
                } catch { latexMap.set(placeholder, _match); }
                return placeholder;
            });
            return protectedStr;
        };

        safeText = protectLatex(safeText);

        // 3. Ripristino Code Block
        codeMap.forEach((match, placeholder) => {
            safeText = safeText.replace(new RegExp(placeholder, 'g'), match);
        });
        const highlighter = await getHighlighter();
        const shikiTheme = theme === 'dark' ? 'vitesse-dark' : 'github-light';

        const tokens = marked.lexer(safeText);

        const walkTokens = async (tokenList: any[]) => {
            for (const token of tokenList) {
                if (token.type === 'code') {
                    const rawLang = token.lang || 'text';
                    const langs = highlighter.getLoadedLanguages();
                    const lang = (rawLang && langs.includes(rawLang)) ? rawLang : 'text';
                    token.type = 'html';
                    
                    const codeContent = encodeURIComponent(token.text);

                    const copyButtonHtml = `
                        <button class="copy-btn flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors" data-code="${codeContent}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            <span>Copy</span>
                        </button>
                    `;

                    token.text = `
                    <div class="code-block-wrapper text-sm rounded-md overflow-hidden my-2 border ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}">
                        <div class="flex items-center justify-between px-3 py-1.5 bg-transparent ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'}">
                            <span class="text-xs font-mono font-bold">${lang}</span> 
                            ${copyButtonHtml}
                        </div>
                        ${highlighter.codeToHtml(token.text, { lang, theme: shikiTheme })}
                    </div>`;
                } else if (token.type === 'html' || token.type === 'text' || token.type === 'paragraph') {
                    // Evidenzia eventuali blocchi <pre><code class="language-..."> nel testo normale (Better View mode)
                    const htmlCodeRegex = /<pre><code\s+class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/gi;
                    if (htmlCodeRegex.test(token.text)) {
                        let match;
                        let newText = token.text;
                        // Reset regex lastIndex before looping
                        htmlCodeRegex.lastIndex = 0;
                        while ((match = htmlCodeRegex.exec(token.text)) !== null) {
                            const [fullMatch, rawLang, codeContent] = match;
                            const langs = highlighter.getLoadedLanguages();
                            const lang = (rawLang && langs.includes(rawLang)) ? rawLang : 'text';
                            
                            const unescapedCode = codeContent
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&')
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'");

                            const codeContentEncoded = encodeURIComponent(unescapedCode);
                            const copyButtonHtml = `
                                <button class="copy-btn flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors" data-code="${codeContentEncoded}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                    <span>Copy</span>
                                </button>
                            `;

                            const shikiHtml = highlighter.codeToHtml(unescapedCode, { lang, theme: shikiTheme });
                            const finalHtml = `
                            <div class="code-block-wrapper text-sm rounded-md overflow-hidden my-2 border ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}">
                                <div class="flex items-center justify-between px-3 py-1.5 bg-transparent ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'}">
                                    <span class="text-xs font-mono font-bold">${lang}</span> 
                                    ${copyButtonHtml}
                                </div>
                                ${shikiHtml}
                            </div>`;
                            
                            newText = newText.replace(fullMatch, finalHtml);
                        }
                        token.text = newText;
                    }
                }
                
                if (token.items) await walkTokens(token.items);
            }
        };

        await walkTokens(tokens);
        let rawHtml = marked.parser(tokens);

        latexMap.forEach((rendered, placeholder) => {
            rawHtml = rawHtml.replace(new RegExp(placeholder, 'g'), rendered);
        });

        return DOMPurify.sanitize(rawHtml, {
            ADD_TAGS: ['math', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mtext', 'annotation', 'annotation-xml', 'svg', 'path', 'g', 'div', 'span', 'pre', 'code', 'button', 'rect'],
            ADD_ATTR: ['style', 'class', 'viewBox', 'd', 'fill', 'xmlns', 'width', 'height', 'data-language', 'data-code', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'x', 'y', 'rx', 'ry', 'aria-hidden']
        });
    }, [theme]);

    useEffect(() => {
        let isCancelled = false;
        
        if (!text || text === previousTextRef.current) return;
        previousTextRef.current = text;

        if (isStreaming) {
            setHtmlContent(renderMarkdownSync(text));
            setIsLoading(false);
            return;
        }

        const executeRender = async () => {
            try {
                const html = await renderMarkdown(text);
                if (!isCancelled) {
                    setHtmlContent(html);
                    setIsLoading(false);
                }
            } catch (err) {
                if (!isCancelled) setHtmlContent(text);
            }
        };

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(executeRender, 0);

        return () => {
            isCancelled = true;
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [text, isStreaming, renderMarkdown]);


    // --- GESTIONE CLICK SU COPY ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleClick = async (e: MouseEvent) => {
            // Risaliamo l'albero DOM per vedere se abbiamo cliccato su un elemento con classe .copy-btn
            const target = (e.target as HTMLElement).closest('.copy-btn');
            
            if (target && target instanceof HTMLElement) {
                const encodedCode = target.getAttribute('data-code');
                if (encodedCode) {
                    try {
                        const code = decodeURIComponent(encodedCode);
                        await navigator.clipboard.writeText(code);
                        
                        // Feedback visivo temporaneo (cambia icona/testo)
                        const span = target.querySelector('span');
                        const icon = target.querySelector('svg');
                        
                        if (span) span.textContent = "Copied!";
                        if (icon) icon.style.color = "#10b981"; // Verde
                        
                        setTimeout(() => {
                            if (span) span.textContent = "Copy";
                            if (icon) icon.style.color = ""; // Ripristina
                        }, 2000);

                    } catch (err) {
                        console.error('Failed to copy!', err);
                    }
                }
            }
        };

        container.addEventListener('click', handleClick);

        return () => {
            container.removeEventListener('click', handleClick);
        };
    }, [htmlContent]); // Ri-attacca il listener se il contenuto cambia (anche se l'event delegation funziona sempre sul container stabile)

    if (isLoading && !htmlContent) {
        return <div className="animate-pulse text-gray-400 text-sm">Thinking...</div>;
    }

    return (
        <div
            ref={containerRef} // Colleghiamo il ref qui
            className={`renderChat prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''} ${isStreaming ? 'streaming-cursor' : ''}`}
        >
            <div dangerouslySetInnerHTML={{ __html: htmlContent || text }} />
            {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-blue-500/60 animate-pulse rounded-sm align-middle" />
            )}
        </div>
    );
};

export default React.memo(MarkdownRender);