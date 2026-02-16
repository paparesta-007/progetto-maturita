import React, { useState, useRef } from "react";
import { useDocument, type DocumentStep } from "../../context/DocumentContext";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Check,
    ArrowRight,
    CaretLeft,
    Tag,
    Cards,
    UploadSimple,
    Trash,
    Cpu,
    Files,
    Info,
    QuestionIcon
} from "@phosphor-icons/react";
import { Sparkles } from "lucide-react";
import Tooltip from "../../components/other/Tooltip";

const DocumentWizard = () => {
    // --- Context & State ---
    const { currentStep, setCurrentStep } = useDocument();
    const { user, theme } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local state
    const [formData, setFormData] = useState({
        title: "",
        embeddingModel: "google-vertex-embedding-gecko-001",
        category: "Finance",
        description: "",
        file: null as File | null // Changed to store actual File object
    });

    // --- Helpers ---
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // --- Theme Logic ---
    const isDark = theme === "dark";

    const style = {
        // Layout
        wrapper: `flex flex-col h-full w-full items-center justify-center p-4 transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-neutral-50"}`,
        card: `w-full max-w-xl rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-colors duration-300 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"}`,

        // Text
        textPrimary: isDark ? "text-white" : "text-neutral-900",
        textSecondary: isDark ? "text-neutral-400" : "text-neutral-500",
        heading: `text-lg font-semibold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`,

        // Inputs
        inputGroup: "space-y-1.5",
        label: `text-xs font-medium uppercase tracking-wider ml-1 ${isDark ? "text-neutral-500" : "text-neutral-500"}`,
        input: `w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-200 outline-none
            ${isDark
                ? "bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
                : "bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
            }`,

        // Custom File Upload Styles
        uploadArea: `relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group
            ${isDark
                ? "border-neutral-800 bg-neutral-950 hover:border-neutral-600 hover:bg-neutral-900"
                : "border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100"
            }`,
        fileCard: `flex items-center justify-between p-3 rounded-lg border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}`,

        // Review Cards
        reviewCard: `p-4 rounded-xl border h-full ${isDark ? "bg-neutral-950/30 border-neutral-800" : "bg-neutral-50/50 border-neutral-200"}`,
        reviewLabel: `text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? "text-neutral-500" : "text-neutral-500"}`,
        reviewValue: `text-sm font-medium ${isDark ? "text-neutral-200" : "text-neutral-800"}`,

        // Buttons
        buttonPrimary: `flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${isDark
                ? "bg-white text-neutral-950 hover:bg-neutral-200"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`,
        buttonSecondary: `flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200
            ${isDark
                ? "border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                : "border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`,

        // Step Indicators
        stepIndicator: (active: boolean, completed: boolean) => `
            flex items-center justify-center w-8 h-8 rounded-full border text-xs font-semibold transition-all duration-300
            ${active
                ? (isDark ? "bg-white text-neutral-950 border-white scale-110" : "bg-neutral-900 text-white border-neutral-900 scale-110")
                : completed
                    ? (isDark ? "bg-neutral-800 text-white border-neutral-800" : "bg-neutral-200 text-neutral-900 border-neutral-200")
                    : (isDark ? "bg-transparent text-neutral-600 border-neutral-800" : "bg-transparent text-neutral-300 border-neutral-200")
            }
        `,
        stepLine: (filled: boolean) => `
            flex-1 h-px transition-colors duration-300 mx-2
            ${filled
                ? (isDark ? "bg-neutral-700" : "bg-neutral-300")
                : (isDark ? "bg-neutral-800" : "bg-neutral-100")
            }
        `
    };

    // --- Handlers ---
    const handleNext = () => {
        // Basic validation
        if (currentStep === 1 && !formData.title) return; // Add better validation UX in real app
        if (currentStep < 3) setCurrentStep((currentStep + 1) as DocumentStep);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep((currentStep - 1) as DocumentStep);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, file: file }));

            // Auto-fill title if empty
            if (!formData.title) {
                const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
                setFormData(prev => ({ ...prev, title: nameWithoutExt }));
            }
        }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, file: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- Animation Variants ---
    const contentVariants = {
        hidden: { opacity: 0, x: 10 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -10 }
    };

    return (
        <div className={style.wrapper}>

            <div className={style.card}>
                {/* Header / Progress Steps */}
                <div className={`px-8 pt-8 pb-6 border-b ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((step) => (
                            <React.Fragment key={step}>
                                <div className="flex flex-col items-center gap-2 relative">
                                    <div className={style.stepIndicator(currentStep === step, currentStep > step)}>
                                        {currentStep > step ? <Check weight="bold" /> : step}
                                    </div>
                                </div>
                                {step !== 3 && (
                                    <div className={style.stepLine(currentStep > step)} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="text-center mt-6">
                        <h2 className={style.heading}>
                            {currentStep === 1 && "Start a new RAG Document"}
                            {currentStep === 2 && "Configure Context"}
                            {currentStep === 3 && "Review & Generate"}
                        </h2>
                        <p className={`text-xs mt-1 ${style.textSecondary}`}>
                            {currentStep === 1 && "Upload your source file and give it a name."}
                            {currentStep === 2 && "Set the domain and description for better embeddings."}
                            {currentStep === 3 && "Verify details before processing."}
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-8 min-h-[350px] flex flex-col">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: Details & Upload */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                variants={contentVariants}
                                initial="hidden" animate="visible" exit="exit"
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-6 flex-1"
                            >
                                {/* File Upload Area */}
                                <div>
                                    <label className={`${style.label} mb-2 block`}>Source File</label>
                                    {!formData.file ? (
                                        <label className={style.uploadArea}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                ref={fileInputRef}
                                                accept=".pdf,.txt,.docx,.md"
                                            />
                                            <div className={`p-3 rounded-full mb-3 transition-colors ${isDark ? "bg-neutral-800 group-hover:bg-neutral-700 text-neutral-400" : "bg-neutral-100 group-hover:bg-neutral-200 text-neutral-500"}`}>
                                                <UploadSimple size={24} />
                                            </div>
                                            <p className={`text-sm font-medium mb-1 ${style.textPrimary}`}>Click to upload or drag and drop</p>
                                            <p className={`text-xs ${style.textSecondary}`}>PDF, DOCX, TXT or MD (max 10MB)</p>
                                        </label>
                                    ) : (
                                        <div className={style.fileCard}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-md ${isDark ? "bg-neutral-900 text-blue-400" : "bg-neutral-100 text-blue-600"}`}>
                                                    <FileText size={24} weight="duotone" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${style.textPrimary}`}>{formData.file.name}</p>
                                                    <p className={`text-xs ${style.textSecondary}`}>{formatFileSize(formData.file.size)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={removeFile}
                                                className={`p-2 rounded-md transition-colors ${isDark ? "hover:bg-red-900/30 text-neutral-400 hover:text-red-400" : "hover:bg-red-50 text-neutral-400 hover:text-red-600"}`}
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Document Name */}
                                <div className={style.inputGroup}>
                                    <label className={style.label}>Document Name</label>
                                    <div className="relative">
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            type="text"
                                            placeholder="e.g. Q4 Financial Report"
                                            className={`${style.input} pl-10`}
                                        />
                                        <Tag size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${style.textSecondary}`} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Settings */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                variants={contentVariants}
                                initial="hidden" animate="visible" exit="exit"
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-5 flex-1"
                            >
                                <div className={`${style.inputGroup} `}>
                                    <div className="flex items-center gap-2">
                                        <label className={`${style.label} flex items-center gap-2`}>Domain Category </label>
                                        <Tooltip content={"Helps the system understand the context of your document."} position="right">
                                            <span className="text-neutral-600<l border border-neutral-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">?</span>
                                        </Tooltip>

                                    </div>
                                    <div className="relative">
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className={`${style.input} pl-10 appearance-none`}
                                        >
                                            <option>Finance</option>
                                            <option>Legal</option>
                                            <option>Technical Documentation</option>
                                            <option>Human Resources</option>
                                            <option>Healthcare</option>
                                            <option>Education</option>
                                            <option>General</option>
                                        </select>
                                        <Files size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${style.textSecondary}`} />
                                    </div>
                                </div>
                                <div className={style.inputGroup}>
                                    <label className={style.label}>Embedding Model</label>
                                    <div className="relative">
                                        <select
                                            name="embeddingModel"
                                            value={formData.embeddingModel}
                                            onChange={handleInputChange}
                                            className={`${style.input} pl-10 appearance-none`}
                                        >
                                            <option value="google/gemini-embedding-001">Google: Gemini Embedding 001 - $0.15/M input tokens</option>
                                            <option value="openai/text-embedding-3-large">OpenAI: Text Embedding 3 Large - $0.13/M input tokens</option>
                                            <option value="mistralai/mistral-embed-2312">Mistral: Mistral Embed 2312 - $0.10/M input tokens</option>
                                            <option value="qwen/qwen3-embedding-8b">Qwen: Qwen3 Embedding 8B - $0.01/M input tokens</option>
                                        </select>
                                        <Cpu size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${style.textSecondary}`} />
                                    </div>
                                </div>
                                <div className={style.inputGroup}>
                                    <label className={style.label}>Context Description</label>
                                    <div className="relative">
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={4}
                                            placeholder="Provide a brief summary of what this document contains to help the AI understand context..."
                                            className={`${style.input} pl-10 resize-none`}
                                        />
                                        <Cards size={18} className={`absolute left-3 top-4 ${style.textSecondary}`} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Review */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                variants={contentVariants}
                                initial="hidden" animate="visible" exit="exit"
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-4 flex-1 h-full"
                            >
                                <h4 className={`text-sm font-semibold mb-1 ${style.textPrimary}`}>Summary Check</h4>

                                {/* Grid Layout for Review */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                    {/* Source Material Card */}
                                    <div className={`${style.reviewCard} col-span-1 sm:col-span-2`}>
                                        <div className={style.reviewLabel}><FileText weight="bold" /> Source Material</div>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded ${isDark ? "bg-neutral-800 text-blue-300" : "bg-blue-50 text-blue-600"}`}>
                                                <FileText size={20} weight="duotone" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className={`${style.reviewValue} truncate`}>{formData.file?.name || "No file selected"}</p>
                                                <div className="flex gap-3 text-xs opacity-70">
                                                    <span>{formatFileSize(formData.file?.size || 0)}</span>
                                                    <span>•</span>
                                                    <span>{formData.title}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Configuration Card */}
                                    <div className={style.reviewCard}>
                                        <div className={style.reviewLabel}><Cpu weight="bold" /> Configuration</div>
                                        <div className="space-y-3">
                                            <div>
                                                <span className={`text-[10px] block opacity-60 mb-0.5`}>Model</span>
                                                <span className={`${style.reviewValue} text-xs`}>
                                                    {formData.embeddingModel}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`text-[10px] block opacity-60 mb-0.5`}>Category</span>
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${isDark ? "bg-neutral-800 border-neutral-700 text-neutral-300" : "bg-neutral-100 border-neutral-200 text-neutral-700"}`}>
                                                    {formData.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context Card */}
                                    <div className={style.reviewCard}>
                                        <div className={style.reviewLabel}><Info weight="bold" /> Context</div>
                                        <p className={`text-xs leading-relaxed line-clamp-4 ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                                            {formData.description || "No specific context provided. The model will rely solely on semantic chunking."}
                                        </p>
                                    </div>
                                </div>

                                <div className={`mt-auto flex items-start gap-3 p-3 rounded-lg border ${isDark ? "bg-indigo-950/30 border-indigo-900/50 text-indigo-200" : "bg-indigo-50 border-indigo-100 text-indigo-800"}`}>
                                    <Sparkles size={18} className="mt-0.5 shrink-0" />
                                    <p className="text-xs leading-relaxed">
                                        <strong>Ready to ingest.</strong> Clicking "Create" will upload the file, perform chunking, and generate approximately {Math.ceil((formData.file?.size || 0) / 1000)} vector embeddings.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Navigation */}
                <div className={`p-4 border-t flex items-center justify-between ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-100"}`}>
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={`${style.buttonSecondary} ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <CaretLeft size={16} weight="bold" />
                        Back
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentStep === 1 && !formData.file}
                        className={`${style.buttonPrimary} ${(currentStep === 1 && !formData.file) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {currentStep === 3 ? (
                            <>
                                <Sparkles size={16} />
                                Create Document
                            </>
                        ) : (
                            <>
                                Next Step
                                <ArrowRight size={16} weight="bold" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DocumentWizard;