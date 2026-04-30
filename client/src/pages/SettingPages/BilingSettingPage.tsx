import React, { useMemo } from "react";
import { FloppyDiskIcon, CreditCard, Receipt, CaretRight, Sparkle, CheckCircle } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

const BillingSettingPage: React.FC = () => {
    const { theme } = useAuth();
    const { setIsSettingOpen } = useApp();
    const isDark = theme === 'dark';

    const handleSave = () => {
        setIsSettingOpen(false);
    };

    const styles = useMemo(() => ({
        container: `flex flex-col h-full relative transition-all duration-500 font-['Manrope'] ${isDark ? "bg-transparent text-[#f4f1ea]" : "bg-white"}`,
        title: `text-2xl font-black tracking-tighter ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-xs font-medium opacity-40 mt-1`,
        sectionTitle: `text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-white/30" : "text-neutral-500"}`,
        label: `text-[13px] font-bold tracking-tight ${isDark ? "text-white/90" : "text-neutral-700"}`,
        description: `text-[11px] font-medium opacity-40 leading-relaxed mt-0.5`,
        card: `rounded-[2rem] p-6 border transition-all duration-300 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-neutral-50 border-neutral-100"}`,
        buttonSecondary: `text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition-all border ${isDark
                ? "text-white/40 border-white/10 hover:bg-white/5 hover:text-white"
                : "text-neutral-600 border-neutral-300 hover:bg-neutral-100"
            }`,
        saveButton: `flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all shadow-lg active:scale-95 ${isDark ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`,
        mono: `font-['IBM_Plex_Mono'] font-bold`
    }), [isDark]);

    const invoices = [
        { id: "INV-001", date: "01 Apr 2024", amount: "$19.99", status: "Paid" },
        { id: "INV-002", date: "01 Mar 2024", amount: "$19.99", status: "Paid" },
        { id: "INV-003", date: "01 Feb 2024", amount: "$19.99", status: "Paid" },
    ];

    return (
        <div className={styles.container}>
            {isDark && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px]" />
                </div>
            )}

            {/* HEADER */}
            <div className="px-6 pt-8 pb-4 shrink-0 relative z-10">
                <h2 className={styles.title}>Fatturazione & Piano</h2>
                <p className={styles.subtitle}>Gestisci l'abbonamento Premium e monitora i tuoi consumi mensili.</p>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10 relative z-10 custom-scrollbar">

                {/* Piano Attuale - Visual Card */}
                <section className="space-y-4">
                    <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all ${isDark ? "bg-white/[0.03] border-white/10" : "bg-neutral-900 text-white"}`}>
                        {isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />}
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkle size={16} weight="fill" className="text-orange-500" />
                                    <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50">Abbonamento Attivo</span>
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter mb-1">Piano PRO</h3>
                                <p className="text-sm opacity-60 font-medium">$19.99 / mese • Prossimo rinnovo 1 Maggio</p>
                            </div>
                            <button className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-white/10 hover:bg-white/20"}`}>
                                Gestisci Piano
                            </button>
                        </div>

                        {/* Progress Bar for Limits */}
                        <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[11px] font-bold tracking-tight opacity-40">Utilizzo Messaggi AI</span>
                                <span className={`${styles.mono} text-[11px] opacity-80`}>842 / 2000</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 w-[42%] rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Metodo di Pagamento */}
                <section className="space-y-4">
                    <h3 className={styles.sectionTitle}>Metodo di Pagamento</h3>
                    <div className={styles.card}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-neutral-200"}`}>
                                    <CreditCard size={24} weight="duotone" className="text-orange-500" />
                                </div>
                                <div>
                                    <p className={styles.label}>Visa •••• 4242</p>
                                    <p className={styles.description}>Scade il 12/26</p>
                                </div>
                            </div>
                            <button className={styles.buttonSecondary}>Cambia</button>
                        </div>
                    </div>
                </section>

                {/* Storico Fatture */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className={styles.sectionTitle}>Cronologia Fatture</h3>
                        <button className="text-[10px] font-black tracking-widest uppercase text-orange-500 hover:text-orange-400 transition-colors">Scarica Tutto</button>
                    </div>
                    
                    <div className={`rounded-3xl border overflow-hidden ${isDark ? "bg-white/[0.01] border-white/5" : "bg-neutral-50 border-neutral-100"}`}>
                        <div className="divide-y divide-white/[0.03]">
                            {invoices.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl transition-all ${isDark ? "bg-white/5 text-white/30 group-hover:text-white group-hover:bg-white/10" : "bg-white text-neutral-400 shadow-sm"}`}>
                                            <Receipt size={18} weight="bold" />
                                        </div>
                                        <div>
                                            <p className={styles.label}>{inv.date}</p>
                                            <p className={`text-[10px] font-mono tracking-wider uppercase opacity-30`}>{inv.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className={`${styles.mono} text-[13px] ${isDark ? "text-white" : "text-neutral-900"}`}>{inv.amount}</p>
                                            <p className="text-[9px] font-black tracking-[0.1em] uppercase text-emerald-500 flex items-center gap-1 justify-end">
                                                <CheckCircle size={10} weight="fill" /> {inv.status}
                                            </p>
                                        </div>
                                        <CaretRight size={14} weight="bold" className="opacity-20 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* FOOTER */}
            <div className="p-6 pt-2 shrink-0 flex justify-end relative z-10">
                <button onClick={handleSave} className={styles.saveButton}>
                    <FloppyDiskIcon size={16} weight="bold" />
                    Salva Configurazione
                </button>
            </div>
        </div>
    );
};

export default BillingSettingPage;