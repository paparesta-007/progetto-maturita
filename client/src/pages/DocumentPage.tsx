import React from "react";
// Assuming useDocument provides isDark. If not, you might need to grab it from a ThemeContext
import { useDocument, type DocumentStep } from "../context/DocumentContext";
import { useAuth } from "../context/AuthContext";

const DocumentWizard = () => {
    // Destructure isDark from context, or default to false if not available
    const { currentStep, setCurrentStep, } = useDocument();
    const { user, theme } = useAuth();
    const isDark = theme === "dark";
    // The styles object provided, derived from isDark
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
        <div className={styles.wrapper}>
            {/* Header */}
            <div className={styles.headerText}>
                New Document &mdash; Step {currentStep} of 3
            </div>

            {/* Main Content Area */}
            <main className={styles.main}>
                {currentStep < 4 && <DocumentWizard />}
            </main>

          
        </div>
    );
}

export default DocumentWizard;