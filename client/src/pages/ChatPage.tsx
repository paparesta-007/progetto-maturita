
import Textbar from "../components/Textbar";
import { ChatProvider, useChat } from "../context/ChatContext";
import BotMessage from "../components/other/BotMessage";
import UserMessage from "../components/other/UserMessage";
import { convertLatexInMarkdown } from "../library/latextToMarkdown";
import { marked } from "marked";
import DOMPurify from "dompurify";
import BotLoading from "../components/other/BotLoading";
import PromptStarter from "../components/PromptStarter";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react"
import { getHighlighter } from "../library/shikiHighlighter";
import katex from "katex";
import "katex/dist/katex.min.css"; //
// 1. Crea un componente "interno" che gestisce l'UI
// Questo componente sarà FIGLIO del Provider, quindi può usare useChat
const ChatContent = () => {
    const { user } = useAuth();
    const { conversationId } = useParams();
    const navigate = useNavigate(); // <--- Hook per il redirect
    const {
        messageHistory,
        loadConversation,
        userOwnsConversation,
        loading,
        setMessageHistory,
        areConversationsLoaded // <--- Prendiamo questo valore dal context
    } = useChat();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    };
    marked.setOptions({
        async: true
    })
    useEffect(() => {
        scrollToBottom();
    }, [messageHistory, loading]);
    useEffect(() => {
        // 1. Se non abbiamo un ID conversazione, non facciamo nulla
        if (!conversationId) return;

        // 2. Se le conversazioni non sono ancora state caricate, ASPETTIAMO (return)
        // Questo evita il falso negativo iniziale
        if (!areConversationsLoaded) return;

        // 3. Ora che siamo sicuri che la lista è caricata, facciamo il controllo
        const isOwner = userOwnsConversation(conversationId);

        if (isOwner) {
            console.log("Caricamento conversazione:", conversationId);
            loadConversation(conversationId);
        } else {
            console.warn("Accesso negato. Redirect alla home.");
            // 4. Redirect effettivo
            navigate('/app'); // O dove vuoi tu, es: '/chat/new'
        }

    }, [conversationId, areConversationsLoaded, user?.id]); // Aggiunto areConversationsLoaded alle dipendenze

const MarkdownRenderer = ({ text }: { text: string }) => {
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const processMarkdown = async () => {
            const rawText = text || "";
            
            // MAPPA PER SALVARE IL LATEX
            // Usiamo una mappa per conservare le formule originali e il loro render HTML
            const latexMap = new Map<string, string>();
            let latexCounter = 0;

            // FUNZIONE DI PROTEZIONE:
            // Sostituisce il LaTeX con un placeholder che non rompe le tabelle (nessun carattere speciale)
            const protectLatex = (str: string) => {
                // 1. Blocchi $$...$$
                let protectedStr = str.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
                    const placeholder = `LATEXBLOCK${latexCounter++}ENDLATEX`;
                    try {
                        const rendered = katex.renderToString(formula, { displayMode: true, throwOnError: false });
                        latexMap.set(placeholder, rendered);
                    } catch (e) {
                        latexMap.set(placeholder, match); // Fallback
                    }
                    return placeholder;
                });

                // 2. Inline $...$ (Escludiamo $ singoli non chiusi)
                protectedStr = protectedStr.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
                    // Evitiamo di matchare cose come "$100 e $200" controllando la lunghezza o pattern comuni se necessario
                    const placeholder = `LATEXINLINE${latexCounter++}ENDLATEX`;
                    try {
                        const rendered = katex.renderToString(formula, { displayMode: false, throwOnError: false });
                        latexMap.set(placeholder, rendered);
                    } catch (e) {
                        latexMap.set(placeholder, match);
                    }
                    return placeholder;
                });

                return protectedStr;
            };

            // 1. PROTEGGIAMO IL LATEX PRIMA DEL PARSING
            // Questo impedisce che i caratteri '|' nelle formule rompano le tabelle Markdown
            const safeText = protectLatex(rawText);

            try {
                const highlighter = await getHighlighter();
                // Parsiamo il testo "protetto"
                const tokens = marked.lexer(safeText);

                // Gestiamo SOLO l'evidenziazione del codice con Shiki
                // Non tocchiamo più il LaTeX qui dentro perché è già protetto
                const walkTokens = async (tokenList: any[]) => {
                    for (const token of tokenList) {
                        if (token.type === 'code') {
                            const rawLang = token.lang || 'text';
                            const isSupported = highlighter.getLoadedLanguages().includes(rawLang);
                            const lang = isSupported ? rawLang : 'text';
                            
                            const highlightedCode = highlighter.codeToHtml(token.text, {
                                lang: lang,
                                theme: 'github-light'
                            });
                            
                            // Applichiamo stile per evitare sfondo bianco su bianco se necessario
                            token.type = 'html';
                            token.text = `<div class="code-block-wrapper">${highlightedCode}</div>`;
                        }
                        
                        // Ricorsione per elementi annidati (es. liste)
                        if (token.items) await walkTokens(token.items);
                        // IMPORTANTE: Marked gestisce header e rows delle tabelle separatamente,
                        // ma dato che abbiamo protetto il LaTeX a monte, non serve iterare dentro le tabelle qui.
                    }
                };

                await walkTokens(tokens);

                // 2. GENERIAMO L'HTML BASE
                let rawHtml = marked.parser(tokens);

                // 3. RIPRISTINIAMO IL LATEX
                // Sostituiamo i placeholder (es. LATEXINLINE0ENDLATEX) con l'HTML di KaTeX
                latexMap.forEach((renderedHtml, placeholder) => {
                    // Usiamo una regex globale per sostituire tutte le occorrenze
                    rawHtml = rawHtml.replace(new RegExp(placeholder, 'g'), renderedHtml);
                });

                // 4. SANITIZZAZIONE
                // Configuriamo DOMPurify per accettare tabelle e tag matematici
                const cleanHtml = DOMPurify.sanitize(rawHtml, {
                    ADD_TAGS: [
                        // Tag Tabelle (spesso default, ma esplicitiamoli per sicurezza)
                        'table', 'thead', 'tbody', 'tr', 'td', 'th',
                        // Tag Matematica (KaTeX)
                        'math', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 
                        'mfrac', 'mtext', 'annotation', 'annotation-xml', 'svg', 'path', 'g'
                    ],
                    ADD_ATTR: [
                        'style', 'class', 'viewBox', 'd', 'fill', 'xmlns', 'width', 'height' // Attributi SVG/KaTeX
                    ]
                });

                setHtmlContent(cleanHtml);
            } catch (error) {
                console.error("Errore rendering:", error);
                setHtmlContent(DOMPurify.sanitize(rawText)); // Fallback sicuro
            } finally {
                setIsLoading(false);
            }
        };

        processMarkdown();
    }, [text]);

    if (isLoading && !htmlContent) {
        return <div className="p-4 text-gray-400">Generazione risposta...</div>;
    }

    return (
        <div
            className="renderChat prose max-w-none" // Aggiungi classi 'prose' se usi Tailwind Typography
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">

            {messageHistory.length !== 0 ? (
                <main className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold mb-4">Chat</h1>
                        <div className="space-y-4">
                            {messageHistory.map((msg, index) => {
                                if (msg.role === 'user') {
                                    return <UserMessage key={index} i={index} htmlContent={msg.content}></UserMessage>;
                                } else {
                                    return <BotMessage key={index} i={index} usage={msg.usage}><MarkdownRenderer text={msg.content} /></BotMessage>;
                                }
                            })}
                            {loading && (
                                <BotLoading />
                            )}
                            <div ref={messagesEndRef} /> {/* Ancorina per lo scroll automatico */}
                        </div>
                    </div>

                </main>) : (
                <PromptStarter />
            )}
            <button className="fixed bottom-4 right-4  text-neutral-700 border border-neutral-300 px-4 py-2 rounded"
                onClick={() => { setMessageHistory([]); }}> {/* Pulsante per resettare le conversazioni e tornare alla home */}
                Home
            </button>
            {/* FOOTER / TEXTBAR */}
            <footer className="flex-shrink-0 w-full bg-white pt-0 px-4 pb-4">
                {/* Contenitore centrato con larghezza massima */}
                <div className="max-w-3xl mx-auto mt-4 flex justify-center">
                    <div className="w-full flex items-center justify-center"> {/* Forza il componente a usare lo spazio del max-w-3xl */}
                        <Textbar />
                    </div>
                </div>

                <p className="text-center text-[10px] text-neutral-400 mt-2">
                    IA can make mistakes. Please verify the information provided.
                </p>
            </footer>
        </div>
    );
};

// 2. Il componente principale esportato serve SOLO a fornire il contesto
const ChatPage = () => {
    return (
        <ChatContent />
    );
};

export default ChatPage;