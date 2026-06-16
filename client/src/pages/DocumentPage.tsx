import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import DocumentWizard from "./DocumentWizard/DocumentWizard";
import DocumentLibrary from "./DocumentWizard/DocumentLibrary";
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
import { FilePdf, X, CaretLeft, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { Document, Page, pdfjs } from 'react-pdf';

// Import react-pdf styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { RotateCcw } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Stili costanti - evita ricreazione ad ogni render
const getStyles = (isDark: boolean) => ({
    wrapper: `flex flex-col h-screen overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
    headerText: `text-md pl-16 pr-4 md:px-4 pt-4 font-medium mb-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`,
    main: `flex-1 overflow-y-auto p-4 custom-scrollbar relative`,
    footer: `flex-shrink-0 w-full pt-0 px-4 pb-4 transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
    disclaimer: `text-center text-[10px] mt-2 ${isDark ? "text-neutral-600" : "text-neutral-600"}`,
    errorContainer: `p-4 rounded-lg ${isDark ? "bg-red-900/20 border border-red-700/50" : "bg-red-50 border border-red-200"}`,
    errorText: `${isDark ? "text-red-400" : "text-red-700"}`,
    retryButton: `ml-2 px-3 py-1 rounded ${isDark ? "bg-red-700 hover:bg-red-600" : "bg-red-600 hover:bg-red-700"} text-white text-sm transition-colors`,
    emptyStateContainer: `flex-1 mt-20 overflow-y-auto flex flex-col items-center justify-center`,
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
    
    // NUOVI STATI PER IL PUNTATORE
    const [activeSource, setActiveSource] = useState<{ page: number; content: string } | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isFitToWidth, setIsFitToWidth] = useState(false);
    const [containerWidth, setContainerWidth] = useState<number | null>(null);
    
    // Refs
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const pdfContainerRef = useRef<HTMLDivElement | null>(null);
    const isUserScrolledUp = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Memoizza stili
    const styles = useMemo(() => getStyles(isDark), [isDark]);

    const [showWizard, setShowWizard] = useState(false);

    // Scroll to bottom using requestAnimationFrame (smooth follow scroll)
    const scrollToBottom = useCallback((force = false) => {
        if (force) {
            isUserScrolledUp.current = false;
        }
        if (messagesEndRef.current && !isUserScrolledUp.current) {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
            });
        }
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
            setCurrentPage(1); // Reset page number to 1 for the newly opened document
            fetchDocument(documentId, isActive);
        }

        return () => {
            isActive.current = false;
        };
    }, [documentId, user?.id, setCurrentDocument, setMessageHistory, setIsLivePreview, fetchDocument, currentDocument]);

    // Fetch per preview PDF
    useEffect(() => {
        let active = true;
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
                    if (!active) return;
                    const { data: signedData, error } = await supabase.storage
                        .from('pdfs')
                        .createSignedUrl(storagePath, 60 * 15);

                    if (!active) return;
                    if (!error && signedData?.signedUrl) {
                        setPdfPreviewUrl(signedData.signedUrl);
                        return;
                    }

                    if (error && error.message !== "Object not found") {
                        console.error("Error generating PDF signed URL:", error);
                    }
                }

                if (!active) return;
                console.warn(
                    "PDF preview not found in storage. Expected one of:",
                    candidatePaths,
                    "If this is an old document, re-upload the PDF or migrate storage objects to userId/documentId.pdf"
                );
            } catch (err) {
                if (active) {
                    console.error("Error loading PDF preview:", err);
                }
            } finally {
                if (active) {
                    setPreviewLoading(false);
                }
            }
        };
        checkPdfPreview();
        return () => {
            active = false;
        };
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

    // Keyboard navigation per il PDF
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showPreview) return;
            
            // Se l'utente sta scrivendo in un input, non cambiare pagina
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'ArrowLeft') {
                setCurrentPage(prev => Math.max(1, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setCurrentPage(prev => Math.min(numPages || prev, prev + 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPreview, numPages]);

    // Observer per la larghezza del container PDF
    useEffect(() => {
        if (!pdfContainerRef.current || !showPreview) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        observer.observe(pdfContainerRef.current);
        return () => observer.disconnect();
    }, [showPreview]);

    // Gestione download PDF
    const handleDownloadPdf = async () => {
        if (!pdfPreviewUrl) return;
        const link = document.createElement('a');
        link.href = pdfPreviewUrl;
        link.download = currentDocument?.[0]?.metadata?.title || 'documento.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    if (!documentId) {
        if (showWizard) {
            return <DocumentWizard onBackToLibrary={() => setShowWizard(false)} />;
        }
        return <DocumentLibrary onNewDocument={() => setShowWizard(true)} />;
    }

    return (
        <div className={styles.wrapper}>
            <div className={`flex items-center justify-between px-4 pt-4 mb-2`}>
                <h2 className={`text-md font-medium ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                    {loadingDocument ? "Caricamento documento..." : currentDocument ? `Documento: ${currentDocument[0].metadata.title}` : "Nuovo Documento"}
                </h2>
                <div className="flex items-center gap-2">
                    {messageHistory.length > 0 && (
                        <button 
                            onClick={() => {
                                if (window.confirm("Sei sicuro di voler pulire la cronologia dei messaggi per questo documento?")) {
                                    setMessageHistory([]);
                                }
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${isDark ? "bg-red-900/20 hover:bg-red-900/40 text-red-400 border-red-500/20" : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200 shadow-sm"}`}
                            title="Pulisci cronologia"
                        >
                            <RotateCcw size={15} />
                        </button>
                    )}
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
                                                        files={msg.files}
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
                                                        sources={msg.sources}
                                                        onSuggestedClick={(q) => sendMessage(q, "ask-pdf", "")}
                                                        onSourceClick={(source) => {
                                                            setActiveSource(source);
                                                            setCurrentPage(source.page);
                                                            setShowPreview(true);
                                                        }}
                                                    >
                                                        {msg.content === "Elaborazione in corso..." || msg.content === "Avvio della richiesta..." 
                                                            ? <p className="text-neutral-500 italic text-sm">{msg.content}</p> 
                                                            : <MarkdownRender text={msg.content} isStreaming={(msg as any).isStreaming} />
                                                        }
                                                    </MemoizedBotMessage>
                                                );
                                            }
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                            </main>
                        ) : (
                            <div className={styles.emptyStateContainer}>
                                {!loadingDocument && currentDocument && (
                                    <>
                                        <PromptStarter showSuggestions={false} />
                                      
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
                        <div className={`flex-1 overflow-hidden relative flex flex-col ${isDark ? 'bg-neutral-900/40' : 'bg-neutral-100/50'}`}>
                            {previewLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Caricamento preview...</p>
                                </div>
                            ) : pdfPreviewUrl ? (
                                <>
                                    {/* Toolbar della Preview */}
                                    <div className={`p-2 border-b flex items-center justify-between gap-2 ${isDark ? 'border-white/5 bg-neutral-900' : 'border-black/5 bg-neutral-50'}`}>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage <= 1}
                                                className={`p-1.5 rounded-lg disabled:opacity-30 transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-black/10 text-neutral-600'}`}
                                                title="Pagina precedente"
                                            >
                                                <CaretLeft size={18} weight="bold" />
                                            </button>
                                            
                                            <div className="flex items-center gap-1 mx-1">
                                                <input 
                                                    type="number"
                                                    value={currentPage}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val) && val >= 1 && val <= (numPages || 1)) {
                                                            setCurrentPage(val);
                                                        }
                                                    }}
                                                    className={`w-10 text-center text-xs font-bold py-1 rounded border transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-orange-500/50' : 'bg-white border-black/10 text-black focus:border-orange-500/50'} outline-none`}
                                                />
                                                <span className={`text-[11px] font-medium opacity-60 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                    / {numPages || '?'}
                                                </span>
                                            </div>

                                            <button 
                                                onClick={() => setCurrentPage(prev => Math.min(numPages || prev, prev + 1))}
                                                disabled={currentPage >= (numPages || 1)}
                                                className={`p-1.5 rounded-lg disabled:opacity-30 transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-black/10 text-neutral-600'}`}
                                                title="Pagina successiva"
                                            >
                                                <CaretRight size={18} weight="bold" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => {
                                                    setIsFitToWidth(!isFitToWidth);
                                                    if (!isFitToWidth && containerWidth) {
                                                        // La scala viene calcolata nel componente Page
                                                    }
                                                }}
                                                className={`text-[10px] px-2 py-1.5 rounded-md font-medium transition-colors ${isFitToWidth ? (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600') : (isDark ? 'bg-white/5 hover:bg-white/10 text-neutral-400' : 'bg-black/5 hover:bg-black/10 text-neutral-600')}`}
                                            >
                                                {isFitToWidth ? "Adatta scala" : "Adatta larghezza"}
                                            </button>
                                            
                                            <div className={`h-4 w-px mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                                            <button 
                                                onClick={() => {
                                                    setIsFitToWidth(false);
                                                    setScale(prev => Math.max(0.5, prev - 0.1));
                                                }}
                                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-black/10 text-neutral-600'}`}
                                            >
                                                -
                                            </button>
                                            <span className={`text-[10px] w-10 text-center font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                {isFitToWidth ? 'Auto' : `${Math.round(scale * 100)}%`}
                                            </span>
                                            <button 
                                                onClick={() => {
                                                    setIsFitToWidth(false);
                                                    setScale(prev => Math.min(3, prev + 0.1));
                                                }}
                                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-black/10 text-neutral-600'}`}
                                            >
                                                +
                                            </button>

                                            <div className={`h-4 w-px mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                                            
                                            <button 
                                                onClick={handleDownloadPdf}
                                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400 hover:text-white' : 'hover:bg-black/10 text-neutral-600 hover:text-black'}`}
                                                title="Scarica PDF"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V40a8,8,0,0,0-16,0v84.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contenitore PDF */}
                                    <div 
                                        ref={pdfContainerRef}
                                        className="flex-1 overflow-auto custom-scrollbar p-4 flex justify-center bg-neutral-800"
                                    >
                                        <Document
                                            file={pdfPreviewUrl}
                                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                            loading={
                                                <div className="flex flex-col items-center gap-3 mt-10">
                                                    <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                                                    <p className="text-white/50 text-xs font-medium">Caricamento PDF...</p>
                                                </div>
                                            }
                                        >
                                            <Page 
                                                pageNumber={currentPage} 
                                                scale={isFitToWidth ? undefined : scale}
                                                width={isFitToWidth && containerWidth ? containerWidth - 40 : undefined}
                                                renderAnnotationLayer={true}
                                                renderTextLayer={true}
                                                className="shadow-2xl"
                                            />
                                        </Document>
                                    </div>

                                    {/* Indicatori di highlight */}
                                    {activeSource && (
                                        <div className={`p-3 border-t text-[10px] flex items-center gap-2 ${isDark ? 'border-orange-500/20 bg-orange-500/5 text-orange-400' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
                                            <MagnifyingGlass size={14} weight="bold" />
                                            <p className="line-clamp-2">
                                                <strong>Evidenziato:</strong> {activeSource.content}
                                            </p>
                                            <button 
                                                onClick={() => setActiveSource(null)}
                                                className="ml-auto p-1 hover:bg-black/5 rounded"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-6 flex-1 flex flex-col items-center justify-center">
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