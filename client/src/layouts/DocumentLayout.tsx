import React from "react";
import { DocumentProvider, useDocument } from "../context/DocumentContext";
import DocumentPage from "../pages/DocumentPage";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const DocumentLayout = () => {
    const { theme } = useAuth()
    const {currentDocument}=useDocument()
    const isDark = theme === 'dark';
    const styles = {
        headerText: `text-md px-4 pt-4 font-medium mb-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`,
    };
    return (
        <>
            <h2 className={styles.headerText}>
                {currentDocument ? `Modifica Documento: ${currentDocument[0].metadata.title}` : "Nuovo Documento"}
            </h2>
            <DocumentPage />
        </>
    );
}
export default DocumentLayout;