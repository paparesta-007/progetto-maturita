import React from "react";
import DocumentWizard from "./DocumentWizard/DocumentWizard";
import { useDocument } from "../context/DocumentContext";

const DocumentPage = () => {
    const { currentStep } = useDocument();

    // Show DocumentWizard only if not on the last step, 
    // after step 3 we'd show the actual document interface
    if (currentStep < 4) {
        return <DocumentWizard />;
    }

    // On step 3 (last step), you can render something else
    // For now, still show the wizard to complete it
    return(
        <div className="flex items-center justify-center h-screen">
            <h1 className="text-2xl font-bold">Document Main Page</h1>
        </div>
    );
}

export default DocumentPage;