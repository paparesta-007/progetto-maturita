import React from "react";
import { DocumentProvider, useDocument } from "../context/DocumentContext";
import DocumentPage from "../pages/DocumentPage";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const DocumentLayout = () => {
    const { theme } = useAuth()
    const {currentDocument}=useDocument()
    const isDark = theme === 'dark';
   
    return (
        <>
           
            <DocumentPage />
        </>
    );
}
export default DocumentLayout;