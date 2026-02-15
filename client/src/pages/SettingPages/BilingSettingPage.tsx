import React from "react";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";

const BillingSettingPage: React.FC = () => {
    // Recuperiamo il tema dal context
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    // Stili dinamici basati sul tema
    const styles = {
        container: `flex flex-col h-full relative ${isDark ? "" : "bg-white"}`,
        headerText: `text-md font-medium ${isDark ? "text-white" : "text-neutral-900"}`,
        label: `text-sm font-medium ${isDark ? "text-neutral-200" : "text-neutral-700"}`,
        subLabel: `text-xs font-normal ${isDark ? "text-neutral-500" : "text-neutral-400"}`,
        divider: `border-t ${isDark ? "border-neutral-800" : "border-neutral-200"} my-4`,
        buttonSecondary: `flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            isDark 
                ? "text-neutral-300 border-neutral-700 hover:bg-neutral-800" 
                : "text-neutral-600 border-neutral-300 hover:bg-neutral-100"
        }`,
        footer: `p-4 border-t shrink-0 flex justify-end transition-colors ${
            isDark ? "border-neutral-800 " : "border-neutral-200 bg-white"
        }`,
        saveButton: `flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
            isDark ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`
    };

    return (
        <div className={styles.container}>

            {/* BODY: Area scrollabile */}
            <div className="flex-1 overflow-y-auto px-6 py-12 space-y-6">

                {/* Sezione 1: Piano */}
                <section className="space-y-4">
                    <div className="flex flex-row justify-between items-center gap-3">
                        <label className={styles.label}>
                            Piano Attuale
                            <p className={styles.subLabel}>Pro plan</p>
                        </label>
                        <button className={styles.buttonSecondary}>
                            Cambia Piano
                        </button>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className={styles.headerText}>Dati di Fatturazione</h2>
                    <hr className={styles.divider} />
                    
                    {/* Metodo di Pagamento */}
                    <div className="flex flex-row justify-between items-center gap-3">
                        <label className={styles.label}>
                            Metodo di Pagamento
                            <p className={styles.subLabel}>•••• •••• •••• 4242 (Visa)</p>
                        </label>
                        <button className={styles.buttonSecondary}>
                            Modifica Metodo
                        </button>
                    </div>

                    <hr className={styles.divider} />

                    {/* Email di Fatturazione */}
                    <div className="flex flex-row justify-between items-center gap-3">
                        <label className={styles.label}>
                            Email di Fatturazione
                            <p className={styles.subLabel}>mario.rossi@example.com</p>
                        </label>
                        <button className={styles.buttonSecondary}>
                            Modifica Email
                        </button>
                    </div>

                    <hr className={styles.divider} />

                    {/* Cronologia Fatture */}
                    <div className="flex flex-row justify-between items-center gap-3">
                        <label className={styles.label}>
                            Ultime Fatture
                            <p className={styles.subLabel}>Gennaio 2024, Febbraio 2024</p>
                        </label>
                        <button className={styles.buttonSecondary}>
                            Vedi Tutto
                        </button>
                    </div>
                </section>

                <div className="h-4"></div>
            </div>

            {/* FOOTER */}
            <div className={styles.footer}>
                <button className={styles.saveButton}>
                    <FloppyDiskIcon size={18} />
                    Salva Modifiche
                </button>
            </div>
        </div>
    );
};

export default BillingSettingPage;