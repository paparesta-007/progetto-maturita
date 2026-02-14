import React, { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import { getHighlighter } from "./shikiHighlighter";

const MarkdownRender = ({ text, isStreaming }: { text: string; isStreaming?: boolean }) => {
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const processingRef = useRef(false);
    const pendingTextRef = useRef<string | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pipeline di rendering estratta in una funzione riusabile
    const renderMarkdown = useCallback(async (rawText: string) => {
        const latexMap = new Map<string, string>();
        let latexCounter = 0;

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
        const tokens = marked.lexer(safeText);

        const walkTokens = async (tokenList: any[]) => {
            for (const token of tokenList) {
                if (token.type === 'code') {
                    const rawLang = token.lang || 'text';
                    const lang = highlighter.getLoadedLanguages().includes(rawLang) ? rawLang : 'text';
                    token.type = 'html';
                    token.text = `<div class="code-block-wrapper">${highlighter.codeToHtml(token.text, { lang, theme: 'github-light' })}</div>`;
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
            ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'td', 'th', 'math', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mtext', 'annotation', 'annotation-xml', 'svg', 'path', 'g'],
            ADD_ATTR: ['style', 'class', 'viewBox', 'd', 'fill', 'xmlns', 'width', 'height']
        });
    }, []);

    useEffect(() => {
        const rawText = text || "";
        if (!rawText) return;

        // DEBOUNCE DURANTE LO STREAMING
        // Invece di ri-renderizzare ad ogni singolo chunk (ogni ~10-50ms),
        // aspettiamo che si accumulino più chunk prima di fare il render pesante.
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Se è in corso un rendering, salva il testo più recente per dopo
        if (processingRef.current) {
            pendingTextRef.current = rawText;
            return;
        }

        const delay = isStreaming ? 120 : 0; // 120ms di debounce durante streaming, 0 quando finito

        debounceTimerRef.current = setTimeout(async () => {
            processingRef.current = true;
            try {
                const cleanHtml = await renderMarkdown(rawText);
                setHtmlContent(cleanHtml);
                setIsLoading(false);
            } catch (error) {
                console.error("Errore rendering:", error);
                setHtmlContent(DOMPurify.sanitize(rawText));
            } finally {
                processingRef.current = false;
                // Se è arrivato nuovo testo mentre renderizzavamo, ri-renderizza
                if (pendingTextRef.current && pendingTextRef.current !== rawText) {
                    const pending = pendingTextRef.current;
                    pendingTextRef.current = null;
                    // Trigger un nuovo render con il testo più aggiornato
                    const cleanHtml = await renderMarkdown(pending);
                    setHtmlContent(cleanHtml);
                }
            }
        }, delay);

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [text, isStreaming, renderMarkdown]);

    if (isLoading && !htmlContent) {
        return <div className="flex items-center justify-center h-24">
            <div className="animate-pulse text-gray-500">Caricamento...</div>
        </div>;
    }

    return (
        <div
            className="renderChat prose max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};
export default MarkdownRender;