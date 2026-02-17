import { createContext, useContext, useMemo, useState, useCallback } from "react";
// Assicurati che il percorso di importazione sia corretto in base alla tua struttura cartelle
import getDocumentsMetadata from "../services/supabase/documents/getAllDocuments"; 

export type DocumentStep = 1 | 2 | 3;

export interface DocumentStepContent {
    step: DocumentStep;
    title: string;
    description: string;
}

export interface DocumentContextType {
    currentStep: DocumentStep;
    setCurrentStep: (step: DocumentStep) => void;
    stepContent: DocumentStepContent;
    setIsWizardFinished: (finished: boolean) => void;
    isWizardFinished: boolean;
    documentText: string;
    
    // Gestione Documenti
    currentDocument: any;
    setCurrentDocument: (document: any) => void;
    documentList: any[];
    setDocumentList: React.Dispatch<React.SetStateAction<any[]>>;
    fetchUserDocuments: (userId: string, force?: boolean) => Promise<void>;

    // --- NUOVE PROPRIETÀ AGGIUNTE (Chat & Model) ---
    sendMessage: (message: string) => Promise<void>; // Funzione sendMessage
    messageHistory: { role: 'user' | 'bot'; content: string; usage?: any, model?: string }[];
    setMessageHistory: React.Dispatch<React.SetStateAction<{ role: 'user' | 'bot'; content: string; usage?: any, model?: string }[]>>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    model: any;
    setModel: React.Dispatch<React.SetStateAction<any>>;
}

const stepContentMap: Record<DocumentStep, DocumentStepContent> = {
    1: {
        step: 1,
        title: "Wizard",
        description: "Collects the user information needed to start.",
    },
    2: {
        step: 2,
        title: "Model selection",
        description: "Lets the user choose the model and other functions.",
    },
    3: {
        step: 3,
        title: "Main page",
        description: "Opens the normal page for standard usage.",
    },
};

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: React.ReactNode }) => {
    // --- Stati esistenti ---
    const [currentStep, setCurrentStep] = useState<DocumentStep>(1);
    const stepContent = stepContentMap[currentStep];
    
    const [currentDocument, setCurrentDocument] = useState<any>(null);
    const [documentList, setDocumentList] = useState<any[]>([]); 
    const [isWizardFinished, setIsWizardFinished] = useState(false);

    // --- NUOVI STATI (Chat & Model) ---
    const [messageHistory, setMessageHistory] = useState<{ role: 'user' | 'bot'; content: string; usage?: any, model?: string }[]>([]);
    const [loading, setLoading] = useState(false);
    // Valore di default del modello (puoi personalizzarlo come nel ChatContext)
    const [model, setModel] = useState<any>({ 
        name: "Gemini 2.5 Flash Lite", 
        provider: "Google", 
        name_id: "google/gemini-2.5-flash-lite", 
        cost_per_input_token: 0.10, 
        cost_per_output_token: 0.40 
    });

    const documentText = useMemo(() => {
        return `Step ${stepContent.step}: ${stepContent.title}. ${stepContent.description}`;
    }, [stepContent]);

    // --- LOGICA FETCH ---
    const fetchUserDocuments = useCallback(async (userId: string, force: boolean = false) => {
        if (!userId) return;

        if (documentList.length > 0 && !force) {
            console.log("Documenti già presenti in cache, skip fetch.");
            return;
        }

        try {
            const data = await getDocumentsMetadata(userId);
            if (data) {
                setDocumentList(data);
                console.log("Documenti caricati da Supabase:", data);
            }
        } catch (error) {
            console.error("Errore nel fetch dei documenti:", error);
        }
    }, [documentList]);

    // --- NUOVA FUNZIONE SENDMESSAGE (Placeholder) ---
    const sendMessage = useCallback(async (message: string) => {
        console.log("sendMessage chiamato nel DocumentContext con:", message);
        // Qui implementerai la logica per chattare con il documento (es. RAG)
        // Per ora è vuota come richiesto.
    }, []);

    const value: DocumentContextType = {
        currentStep,
        setCurrentStep,
        stepContent,
        documentText,
        isWizardFinished,
        setIsWizardFinished,
        currentDocument,
        setCurrentDocument,
        documentList,
        setDocumentList,
        fetchUserDocuments,
        
        // --- Export Nuove Proprietà ---
        sendMessage,
        messageHistory,
        setMessageHistory,
        loading,
        setLoading,
        model,
        setModel,
    };

    return (
        <DocumentContext.Provider value={value}>
            {children}
        </DocumentContext.Provider>
    );
};

export const useDocument = () => {
    const context = useContext(DocumentContext);
    if (context === undefined) {
        throw new Error("useDocument must be used within a DocumentProvider");
    }
    return context;
};

export default DocumentContext;