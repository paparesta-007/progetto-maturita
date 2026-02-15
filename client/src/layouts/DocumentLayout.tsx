import React from "react";
import { DocumentProvider } from "../context/DocumentContext";
import DocumentPage from "../pages/DocumentPage";

const DocumentLayout = () => {
    return (
        <DocumentProvider>
            <DocumentPage />
        </DocumentProvider>
    );
}
export default DocumentLayout;