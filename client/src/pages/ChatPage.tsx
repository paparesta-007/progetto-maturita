
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
                const safe = text || "";

                try {
                    const highlighter = await getHighlighter();
                    // 1. Otteniamo i token DAL TESTO GREZZO (senza aver ancora toccato il LaTeX)
                    const tokens = marked.lexer(safe);

                    const walkTokens = async (tokenList: any[]) => {
                        for (const token of tokenList) {
                            // CASO A: È un blocco di codice (```js ...)
                            if (token.type === 'code') {
                                // Se non c'è un linguaggio specificato (es. solo ```), usa 'text' o quello che preferisci
                                const rawLang = token.lang || 'text';
                                const isSupported = highlighter.getLoadedLanguages().includes(rawLang);
                                const lang = isSupported ? rawLang : 'text';

                                // Generiamo l'HTML
                                const highlightedCode = highlighter.codeToHtml(token.text, {
                                    lang: lang,
                                    theme: 'github-light'
                                });

                                // TRUCCO: Se vogliamo aggiungere una nostra classe personalizzata 
                                // per i blocchi senza linguaggio o per tutti i blocchi
                                let finalHtml = highlightedCode;
                                if (!token.lang) {
                                    // Avvolgiamo il risultato di Shiki in un div con la nostra classe
                                    finalHtml = `<div class="" style="color:red">${highlightedCode}</div>`;
                                }

                                token.type = 'html';
                                token.text = finalHtml;
                            }
                            // CASO B: È codice inline (`const x = $...`)
                            else if (token.type === 'codespan') {
                                // Non facciamo nulla, lasciamo che marked lo renderizzi come <code>
                                // ma NON passiamo convertLatexInMarkdown qui.
                            }
                            // CASO C: È testo normale, titoli, liste, ecc.
                            else {
                                // Applichiamo LaTeX SOLO qui
                                if (token.text && typeof token.text === 'string' && token.type !== 'html') {
                                    token.text = convertLatexInMarkdown(token.text);
                                }

                                // Se ha dei sotto-token (es. grassetto dentro una lista), processali
                                if (token.tokens) await walkTokens(token.tokens);
                            }

                            // Gestione liste
                            if (token.items) await walkTokens(token.items);
                        }
                    };

                    await walkTokens(tokens);

                    const rawHtml = marked.parser(tokens);
                    const cleanHtml = DOMPurify.sanitize(rawHtml, {
                        ADD_TAGS: ['pre', 'code', 'span'],
                        ADD_ATTR: ['style', 'class', 'data-language'],
                    });

                    setHtmlContent(cleanHtml);
                } catch (error) {
                    console.error("Errore rendering:", error);
                    setHtmlContent(DOMPurify.sanitize(safe));
                } finally {
                    setIsLoading(false);
                }
            };

            processMarkdown();
        }, [text]);
        if (isLoading && !htmlContent) {
            return <div className="renderChat loading">...</div>;
        }

        return (
            <div
                className="renderChat"
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