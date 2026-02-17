import React, { useEffect } from "react";
import DocumentWizard from "./DocumentWizard/DocumentWizard";
import { useDocument } from "../context/DocumentContext";
import { useParams } from "react-router-dom";
import getCurrentDocument from "../services/supabase/documents/getCurrentDocument";
import { useAuth } from "../context/AuthContext";
import Textbar from "../components/Textbar";

const DocumentPage = () => {
    const { documentId } = useParams();
    const { user, theme } = useAuth();
    const isDark = theme === 'dark';
    const { currentStep, currentDocument, setCurrentDocument } = useDocument();
    const styles = {
        wrapper: `flex flex-col h-screen overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        headerText: `text-md px-4 pt-4 font-medium mb-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`,
        main: `flex-1 overflow-y-auto p-4 custom-scrollbar relative`,
        footer: `flex-shrink-0 w-full pt-0 px-4 pb-4 transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        disclaimer: `text-center text-[10px] mt-2 ${isDark ? "text-neutral-600" : "text-neutral-400"}`
    };
    useEffect(() => {
        const fetchDocument = async () => {
            alert("Fetching document with ID: " + documentId + " User: " + user?.id); // Debug: mostra l'ID del documento
            // Se abbiamo già i dati e l'ID coincide, non fare nulla
            if (currentDocument && currentDocument[0]?.document_id === documentId) {
                console.log("Documento già caricato, nessuna fetch necessaria.");
                console.log("Documento caricato:", currentDocument);
                return;
            }

            const data = await getCurrentDocument(user?.id || "", documentId || "");
            setCurrentDocument(data);

        };

        if (user?.id && documentId) {
            fetchDocument();
        }
    }, [documentId, user?.id, currentDocument, setCurrentDocument]);
    if (currentStep < 4 && !documentId) {
        return <DocumentWizard />;
    }

    // On step 3 (last step), you can render something else
    // For now, still show the wizard to complete it
    return (
        <div className={styles.wrapper}>
            <div className={styles.main}>

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