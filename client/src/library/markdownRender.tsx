import React, { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import { getHighlighter } from "../library/shikiHighlighter";
import { useAuth } from "../context/AuthContext";
import { Check, Copy } from "lucide-react"; // Importa icone se vuoi usarle (opzionale)

const MarkdownRender = ({ text, isStreaming }: { text: string; isStreaming?: boolean }) => {
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { theme } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null); // Riferimento al contenitore principale

    // --- PIPELINE DI RENDERING ---
    const renderMarkdown = useCallback(async (rawText: string) => {
        const latexMap = new Map<string, string>();
        let latexCounter = 0;

        // 1. Protezione LaTeX
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

        const safeText = protectLatex(rawText);
        const highlighter = await getHighlighter();
        const shikiTheme = theme === 'dark' ? 'vitesse-dark' : 'github-light';

        const tokens = marked.lexer(safeText);

        const walkTokens = async (tokenList: any[]) => {
            for (const token of tokenList) {
                if (token.type === 'code') {
                    const rawLang = token.lang || 'text';
                    const lang = highlighter.getLoadedLanguages().includes(rawLang) ? rawLang : 'text';
                    token.type = 'html';
                    
                    // Codifichiamo il testo per l'attributo data-code
                    // encodeURIComponent è sicuro per mettere stringhe arbitrarie in attributi HTML
                    const codeContent = encodeURIComponent(token.text);

                    // Generiamo l'HTML del bottone. Nota la classe 'copy-btn' e l'attributo 'data-code'
                    const copyButtonHtml = `
                        <button class="copy-btn flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors" data-code="${codeContent}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            <span>Copy</span>
                        </button>
                    `;

                    token.text = `
                    <div class="code-block-wrapper text-sm rounded-md overflow-hidden my-2 border ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}">
                        <div class="flex items-center justify-between px-3 py-1.5 bg-opacity-10 ${theme === 'dark' ? 'bg-white/5 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}">
                            <span class="text-xs font-mono font-bold">${lang}</span> 
                            ${copyButtonHtml}
                        </div>
                        ${highlighter.codeToHtml(token.text, { lang, theme: shikiTheme })}
                    </div>`;
                }
                if (token.items) await walkTokens(token.items);
            }
        };

        await walkTokens(tokens);
        let rawHtml = marked.parser(tokens);

        latexMap.forEach((rendered, placeholder) => {
            rawHtml = rawHtml.replace(new RegExp(placeholder, 'g'), rendered);
        });

        // IMPORTANTE: Aggiungi 'button' e 'svg', 'rect', 'path' ai tag permessi da DOMPurify
        // e 'data-code' agli attributi permessi.
        return DOMPurify.sanitize(rawHtml, {
            ADD_TAGS: ['math', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mtext', 'annotation', 'annotation-xml', 'svg', 'path', 'g', 'div', 'span', 'pre', 'code', 'button', 'rect'],
            ADD_ATTR: ['style', 'class', 'viewBox', 'd', 'fill', 'xmlns', 'width', 'height', 'data-language', 'data-code', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'x', 'y', 'rx', 'ry']
        });
    }, [theme]);

    useEffect(() => {
        let isCancelled = false;
        const executeRender = async () => {
            if (!text) return;
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
        const delay = isStreaming ? 50 : 0; 
        debounceTimerRef.current = setTimeout(executeRender, delay);
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
            className={`renderChat prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

export default React.memo(MarkdownRender);