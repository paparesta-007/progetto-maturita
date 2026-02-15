import { createContext, useContext, useMemo, useState } from "react";

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
    isWizardFinished:boolean;
	documentText: string;
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
	const [currentStep, setCurrentStep] = useState<DocumentStep>(1);

	const stepContent = stepContentMap[currentStep];

    const [isWizardFinished, setIsWizardFinished] = useState(false);
	const documentText = useMemo(() => {
		return `Step ${stepContent.step}: ${stepContent.title}. ${stepContent.description}`;
	}, [stepContent]);

	const value: DocumentContextType = {
		currentStep,
		setCurrentStep,
		stepContent,
		documentText,
        isWizardFinished,
        setIsWizardFinished
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
