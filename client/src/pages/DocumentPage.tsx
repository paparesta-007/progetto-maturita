import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import DocumentWizard from "./DocumentWizard/DocumentWizard";
import { useDocument } from "../context/DocumentContext";
import { useParams } from "react-router-dom";
import getCurrentDocument from "../services/supabase/documents/getCurrentDocument";
import { useAuth } from "../context/AuthContext";
import Textbar from "../components/Textbar";
import UserMessage from "../components/other/UserMessage";
import BotMessage from "../components/other/BotMessage";
import MarkdownRender from "../library/markdownRender";
import BotLoading from "../components/other/BotLoading";
import { useApp } from "../context/AppContext";
import PromptStarter from "../components/PromptStarter";
import supabase from "../library/supabaseclient";
import { FilePdf, X } from "@phosphor-icons/react";

// Stili costanti - evita ricreazione ad ogni render
const getStyles = (isDark: boolean) => ({
    wrapper: `flex flex-col h-screen overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
    headerText: `text-md px-4 pt-4 font-medium mb-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`,
    main: `flex-1 overflow-y-auto p-4 custom-scrollbar relative`,
    footer: `flex-shrink-0 w-full pt-0 px-4 pb-4 transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
    disclaimer: `text-center text-[10px] mt-2 ${isDark ? "text-neutral-600" : "text-neutral-600"}`,
    errorContainer: `p-4 rounded-lg ${isDark ? "bg-red-900/20 border border-red-700/50" : "bg-red-50 border border-red-200"}`,
    errorText: `${isDark ? "text-red-400" : "text-red-700"}`,
    retryButton: `ml-2 px-3 py-1 rounded ${isDark ? "bg-red-700 hover:bg-red-600" : "bg-red-600 hover:bg-red-700"} text-white text-sm transition-colors`,
    emptyStateContainer: `flex-1 overflow-y-auto flex flex-col items-center justify-center`,
    emptyStateText: `text-center text-lg ${isDark ? "text-neutral-500" : "text-neutral-600"}`,
});

// Componente memoizzato per il messaggio
const MemoizedUserMessage = React.memo(UserMessage);
const MemoizedBotMessage = React.memo(BotMessage);

const DocumentPage = () => {
    const { documentId } = useParams();
    const { user, theme } = useAuth();
    const { setIsLivePreview } = useApp();
    const isDark = theme === 'dark';
    const { currentStep, currentDocument, setCurrentDocument, messageHistory, loading, setMessageHistory, sendMessage } = useDocument();
    
    // State locale
    const [loadingDocument, setLoadingDocument] = useState(false);
    const [documentError, setDocumentError] = useState<string | null>(null);
    
    // NUOVI STATI PER PREVIEW
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    // Refs
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const isUserScrolledUp = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Memoizza stili
    const styles = useMemo(() => getStyles(isDark), [isDark]);

    // Scroll to bottom con debouncing
    const scrollToBottom = useCallback((force = false) => {
        if (force) {
            isUserScrolledUp.current = false;
        }
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        
        scrollTimeoutRef.current = setTimeout(() => {
            if (messagesEndRef.current && !isUserScrolledUp.current) {
                messagesEndRef.current.scrollIntoView({ behavior: force ? "auto" : "smooth" });
            }
        }, 0);
    }, []);

    const handleScroll = useCallback(() => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        isUserScrolledUp.current = distanceToBottom > 100;
    }, []);

    // Fetch document con error handling e flag per race conditions
    const fetchDocument = useCallback(async (idToFetch: string, isActive: { current: boolean }) => {
        if (!user?.id || !idToFetch) return;
        
        try {
            setLoadingDocument(true);
            setDocumentError(null);

            const data = await getCurrentDocument(user.id, idToFetch);
            
            if (!isActive.current) return; // Prevents race condition
            
            if (!data || data.length === 0) {
                setDocumentError("Documento non trovato o accesso negato.");
                setCurrentDocument(null);
            } else {
                setCurrentDocument(data);
                setDocumentError(null);
            }
        } catch (error) {
            if (!isActive.current) return;
            console.error("Errore nel caricamento del documento:", error);
            setDocumentError(
                error instanceof Error 
                    ? error.message 
                    : "Errore nel caricamento del documento. Riprova."
            );
            setCurrentDocument(null);
        } finally {
            if (isActive.current) {
                setLoadingDocument(false);
            }
        }
    }, [user?.id, setCurrentDocument]);

    // Consolidato: un solo useEffect per il caricamento del documento
    useEffect(() => {
        setIsLivePreview(false);
        let isActive = { current: true };
        
        if (!documentId) {
            if (currentDocument) setCurrentDocument(null);
            setMessageHistory([]);
            setDocumentError(null);
            return;
        }

        if (user?.id) {
            // Se abbiamo già il documento corretto renderizzato, evitiamo il fetch (ottimizzazione skip)
            if (currentDocument && currentDocument[0]?.document_id === documentId) {
                return;
            }
            
            // Puliamo la chat essendoci spostati su un nuovo documento
            setMessageHistory([]);
            fetchDocument(documentId, isActive);
        }

        return () => {
            isActive.current = false;
        };
    }, [documentId, user?.id, setCurrentDocument, setMessageHistory, setIsLivePreview, fetchDocument, currentDocument]);

    // Fetch per preview PDF
    useEffect(() => {
        const checkPdfPreview = async () => {
            if (!documentId || !user?.id) return;
            setPreviewLoading(true);
            setPdfPreviewUrl(null);
            
            try {
                const candidatePaths = [
                    `${user.id}/${documentId}.pdf`,
                    `${documentId}.pdf`,
                ];

                for (const storagePath of candidatePaths) {
                    const { data: signedData, error } = await supabase.storage
                        .from('pdfs')
                        .createSignedUrl(storagePath, 60 * 15);

                    if (!error && signedData?.signedUrl) {
                        setPdfPreviewUrl(signedData.signedUrl);
                        return;
                    }

                    if (error && error.message !== "Object not found") {
                        console.error("Error generating PDF signed URL:", error);
                    }
                }

                console.warn(
                    "PDF preview not found in storage. Expected one of:",
                    candidatePaths,
                    "If this is an old document, re-upload the PDF or migrate storage objects to userId/documentId.pdf"
                );
            } catch (err) {
                console.error("Error loading PDF preview:", err);
            } finally {
                setPreviewLoading(false);
            }
        };
        checkPdfPreview();
    }, [documentId, user?.id]);

    // useEffect per lo scroll
    useEffect(() => {
        scrollToBottom();
    }, [messageHistory, loading, scrollToBottom]);

    // useEffect per lo scroll iniziale
    useEffect(() => {
        if (documentId) {
            scrollToBottom(true);
        }
    }, [documentId, scrollToBottom]);

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    if (currentStep < 4 && !documentId) {
        return <DocumentWizard />;
    }

    return (
        <div className={styles.wrapper}>
            <div className={`flex items-center justify-between px-4 pt-4 mb-2`}>
                <h2 className={`text-md font-medium ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                    {loadingDocument ? "Caricamento documento..." : currentDocument ? `Documento: ${currentDocument[0].metadata.title}` : "Nuovo Documento"}
                </h2>
                {currentDocument && (
                    <button 
                        onClick={() => setShowPreview(!showPreview)} 
                        className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-2 transition-colors ${isDark ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300" : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700"}`}
                    >
                        <FilePdf size={16} />
                        {showPreview ? "Chiudi Preview" : "Mostra Preview"}
                    </button>
                )}
            </div>

            {/* Error banner con retry */}
            {documentError && (
                <div className={styles.errorContainer}>
                    <div className="flex items-center justify-between">
                        <p className={styles.errorText}>{documentError}</p>
                        <button
                            onClick={() => fetchDocument(documentId as string, { current: true })}
                            className={styles.retryButton}
                            disabled={loadingDocument}
                        >
                            {loadingDocument ? "Riprovando..." : "Riprova"}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex flex-1 overflow-hidden">
                {/* Chat Column */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div 
                        className={styles.main}
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                    >
                        {messageHistory.length !== 0 ? (
                            <main className="h-full">
                                <div className="max-w-3xl mx-auto">
                                    <div className="space-y-4">
                                        {messageHistory.map((msg, index) => {
                                            if (msg.role === 'user') {
                                                return (
                                                    <MemoizedUserMessage 
                                                        key={`${documentId}-user-${index}`}
                                                        i={index} 
                                                        htmlContent={msg.content} 
                                                    />
                                                );
                                            } else {
                                                return (
                                                    <MemoizedBotMessage 
                                                        key={`${documentId}-bot-${index}`}
                                                        i={index} 
                                                        usage={msg.usage} 
                                                        model={msg.model}
                                                        suggestedQuestions={msg.suggestedQuestions}
                                                        logs={(msg as any).logs}
                                                        isComplete={(msg as any).isComplete}
                                                        onSuggestedClick={(q) => sendMessage(q, "ask-pdf", "")}
                                                    >
                                                        {msg.content === "Elaborazione in corso..." || msg.content === "Avvio della richiesta..." 
                                                            ? <p className="text-neutral-500 italic text-sm">{msg.content}</p> 
                                                            : <MarkdownRender text={msg.content} />
                                                        }
                                                    </MemoizedBotMessage>
                                                );
                                            }
                                        })}
                                        {loading && <BotLoading />}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                            </main>
                        ) : (
                            <div className={styles.emptyStateContainer}>
                                {!loadingDocument && currentDocument && (
                                    <>
                                        <PromptStarter />
                                        <p className={styles.emptyStateText}>
                                            Inizia a chattare sul tuo documento!
                                        </p>
                                    </>
                                )}
                                {!loadingDocument && !currentDocument && !documentError && (
                                    <p className={styles.emptyStateText}>
                                        Carica un documento per iniziare a chattare!
                                    </p>
                                )}
                                {loadingDocument && (
                                    <p className={styles.emptyStateText}>
                                        Caricamento del documento...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Footer Input Area */}
                    <footer className={styles.footer}>
                        <div className="max-w-3xl mx-auto mt-4 flex justify-center">
                            <div className="w-full flex items-center justify-center">
                                <Textbar />
                            </div>
                        </div>
                        <p className={styles.disclaimer}>
                            IA can make mistakes. Please verify the information provided.
                        </p>
                    </footer>
                </div>

                {/* Preview Column */}
                {showPreview && (
                    <div className={`w-1/2 border-l ${isDark ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'} flex flex-col h-full overflow-hidden transition-all duration-300`}>
                        <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <h3 className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                <FilePdf size={18} weight="fill" className="text-red-500" />
                                Preview PDF
                            </h3>
                            <button onClick={() => setShowPreview(false)} className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-600 hover:text-black'}`}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className={`flex-1 overflow-hidden relative flex items-center justify-center ${isDark ? 'bg-neutral-900/40' : 'bg-neutral-100/50'}`}>
                            {previewLoading ? (
                                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Caricamento preview...</p>
                            ) : pdfPreviewUrl ? (
                                <iframe src={`${pdfPreviewUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Preview" />
                            ) : (
                                <div className="text-center p-6">
                                    <FilePdf size={48} className={`mx-auto mb-3 opacity-20 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>Preview non disponibile</p>
                                    <p className={`text-xs mt-2 max-w-xs mx-auto ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                        Questo documento potrebbe non essere un PDF o non esser stato caricato correttamente.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DocumentPage;