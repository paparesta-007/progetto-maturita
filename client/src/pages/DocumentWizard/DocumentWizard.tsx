import React from "react";
import { useDocument, type DocumentStep, type DocumentStep } from "../../context/DocumentContext";
import { useAuth } from "../../context/AuthContext";
const DocumentWizard = () => {
    const { currentStep, setCurrentStep } = useDocument()
    const { user, theme } = useAuth();
    const isDark = theme === "dark";
    
    const handleNext = () => {
        // We check that it's less than 3, so the result of +1 
        // is guaranteed to be 2 or 3.
        if (currentStep < 3) {
            setCurrentStep((currentStep + 1) as DocumentStep);
        }
    };

    const handleBack = () => {
        // We check that it's greater than 1, so the result of -1
        // is guaranteed to be 1 or 2.
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as DocumentStep);
        }
    };
    
    const styles = {
        wrapper: `flex flex-col h-screen overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        headerText: `text-md px-4 pt-4 font-medium mb-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`,
        main: `flex-1 overflow-y-auto p-4 custom-scrollbar relative`,
        footer: `flex-shrink-0 w-full pt-0 px-4 pb-4 transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`,
        disclaimer: `text-center text-[10px] mt-2 ${isDark ? "text-neutral-600" : "text-neutral-400"}`,
        // Added basic styles for inputs/buttons to match your theme
        input: `w-full p-2 rounded border mb-4 outline-none transition-colors ${isDark ? "bg-neutral-900 border-neutral-700 text-neutral-200 focus:border-neutral-500" : "bg-neutral-50 border-neutral-300 text-neutral-800 focus:border-neutral-500"}`,
        buttonPrimary: `px-6 py-2 rounded font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white`,
        buttonSecondary: `px-6 py-2 rounded font-medium transition-colors border ${isDark ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"}`,
        label: `block text-xs font-medium mb-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`
    };
    return (
        <div className="flex items-center justify-center h-screen">

            {/* STEP 1 */}
            {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                        General Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className={styles.label}>Document Name</label>
                            <input type="text" placeholder="e.g. Q1 Report" className={styles.input} />
                        </div>
                        <div>
                            <label className={styles.label}>Author</label>
                            <input type="text" placeholder="John Doe" className={styles.input} />
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                        Content Settings
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className={styles.label}>Category</label>
                            <select className={styles.input}>
                                <option>Finance</option>
                                <option>Legal</option>
                                <option>Technical</option>
                            </select>
                        </div>
                        <div>
                            <label className={styles.label}>Description</label>
                            <textarea rows={4} placeholder="Brief summary..." className={styles.input} />
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                        Review & Export
                    </h2>
                    <div className={`p-4 rounded border ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"}`}>
                        <p className={isDark ? "text-neutral-400" : "text-neutral-600"}>
                            Review your details before finalizing the document creation.
                        </p>
                    </div>
                </div>
            )}
              {/* Footer Navigation */}
            <footer className={styles.footer}>
                <div className="flex items-center justify-between pt-4 border-t border-transparent">
                    {/* Back Button - Hidden on Step 1 */}
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={`${styles.buttonSecondary} ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        Back
                    </button>

                    {/* Next/Finish Button */}
                    <button
                        onClick={handleNext}
                        className={styles.buttonPrimary}
                    >
                        {currentStep === 3 ? "Create Document" : "Next Step"}
                    </button>
                </div>

                <div className={styles.disclaimer}>
                    All changes are saved automatically to your local draft.
                </div>
            </footer>
        </div>
    );
}
export default DocumentWizard;