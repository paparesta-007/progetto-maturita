import React, { useEffect } from "react";
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

const DocumentPage = () => {
    const { documentId } = useParams();
    const { user, theme } = useAuth();
    const { setIsLivePreview } = useApp();
    const isDark = theme === 'dark';
    const { currentStep, currentDocument, setCurrentDocument, messageHistory, loading, setMessageHistory, sendMessage } = useDocument();
    const styles = {
        wrapper: `flex flex-col h-screen overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        headerText: `text-md px-4 pt-4 font-medium mb-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`,
        main: `flex-1 overflow-y-auto p-4 custom-scrollbar relative`,
        footer: `flex-shrink-0 w-full pt-0 px-4 pb-4 transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        disclaimer: `text-center text-[10px] mt-2 ${isDark ? "text-neutral-600" : "text-neutral-600"}`
    };
    useEffect(() => {
        setIsLivePreview(false);
        const fetchDocument = async () => {
            // Se abbiamo già i dati e l'ID coincide, non fare nulla
            if (currentDocument && currentDocument[0]?.document_id === documentId) {
                console.log("Documento già caricato, nessuna fetch necessaria.");
                return;
            }

            const data = await getCurrentDocument(user?.id || "", documentId || "");
            setCurrentDocument(data);
        };
        
        if (!documentId) {
            if (currentDocument) setCurrentDocument(null);
            setMessageHistory([]);
            return;
        }

        if (user?.id && documentId) {
            // Se stiamo per caricare un documento diverso da quello attuale, puliamo la chat
            if (!currentDocument || currentDocument[0]?.document_id !== documentId) {
                setMessageHistory([]);
            }
            fetchDocument();
        }
    }, [documentId, user?.id, setCurrentDocument, setMessageHistory]);
    if (currentStep < 4 && !documentId) {
        return <DocumentWizard />;
    }

    // On step 3 (last step), you can render something else
    // For now, still show the wizard to complete it
    return (
        <div className={styles.wrapper}>
            <h2 className={styles.headerText}>
                {currentDocument ? `Modifica Documento: ${currentDocument[0].metadata.title}` : "Nuovo Documento"}
            </h2>
            <div className={styles.main}>
                {messageHistory.length !== 0 ? (
                    <main className={styles.main}>
                        <div className="max-w-3xl mx-auto">
                            <div className="space-y-4">
                                {messageHistory.map((msg, index) => {
                                    if (msg.role === 'user') {
                                        return <UserMessage key={index} i={index} htmlContent={msg.content} />;
                                    } else {
                                        return (
                                            <BotMessage key={index} i={index} usage={msg.usage} model={msg.model}
                                                suggestedQuestions={msg.suggestedQuestions}
                                                onSuggestedClick={(q) => sendMessage(q, "ask-pdf")}
                                            >
                                                <MarkdownRender text={msg.content} />
                                            </BotMessage>
                                        );
                                    }
                                })}
                                {loading && <BotLoading />}
                            </div>
                        </div>
                    </main>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* <PromptStarter /> */}
                        <h2 className={`text-center text-lg mt-20 ${isDark ? "text-neutral-500" : "text-neutral-600"}`}>
                            {currentDocument ? "Inizia a chattare sul tuo documento!" : "Carica un documento per iniziare a chattare!"}
                        </h2>
                    </div>
                )}
            </div>
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
    );
}

export default DocumentPage;