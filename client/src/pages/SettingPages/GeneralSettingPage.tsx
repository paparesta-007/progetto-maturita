import { FloppyDiskIcon, Globe, Flask, CurrencyDollar, Plug, Plus } from "@phosphor-icons/react";
import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext"; // Assicurati che il percorso sia corretto
import { useApp } from "../../context/AppContext";

const INTEGRATIONS_DATA = [
    { id: 'gcal', name: "Google Calendar", connected: true, icon: "https://fonts.gstatic.com/s/i/productlogos/calendar_2020q4/v13/192px.svg" },
    { id: 'github', name: "GitHub", connected: false, icon: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" },
    { id: 'gmail', name: "Gmail", connected: true, icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfAFm_QWvScvmazbwSOAU2mpzbcSZNDEcaFg&s" },
    { id: 'slack', name: "Slack", connected: false, icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png" },
];

const GeneralSettings: React.FC = () => {
    const { theme } = useAuth();
    const { setIsSettingOpen } = useApp();
    const isDark = theme === 'dark';

    const [allowExpensive, setAllowExpensive] = useState("no");
    const [experimental, setExperimental] = useState(false);

    const handleSave = () => {
        setIsSettingOpen(false);
    };

    // Mappa degli stili per pulizia del JSX
    const styles = useMemo(() => ({
        container: `flex flex-col h-full relative transition-all duration-500 font-['Manrope'] ${isDark ? "bg-transparent text-[#f4f1ea]" : "bg-white"}`,
        title: `text-2xl font-black tracking-tighter ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-xs font-medium opacity-40 mt-1`,
        sectionTitle: `text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-white/30" : "text-neutral-500"}`,
        label: `text-[13px] font-bold tracking-tight ${isDark ? "text-white/90" : "text-neutral-700"}`,
        description: `text-[11px] font-medium opacity-40 leading-relaxed mt-0.5`,
        card: `rounded-[1.5rem] p-6 border transition-all duration-300 ${isDark ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]" : "bg-neutral-50 border-neutral-100"}`,
        input: `text-[13px] font-semibold border rounded-xl px-4 py-2 outline-none transition-all ${isDark
                ? "bg-white/[0.03] border-white/10 text-white focus:border-orange-500/50 focus:bg-white/[0.06]"
                : "bg-white border-neutral-300 text-neutral-700 focus:ring-neutral-200"
            }`,
        divider: `border-none h-px my-4 ${isDark ? "bg-gradient-to-r from-transparent via-white/5 to-transparent" : "bg-neutral-100"}`,
        integrationCard: `group flex items-center justify-between p-4 transition-all rounded-2xl ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-neutral-50"}`,
        footer: `p-6 pt-2 shrink-0 flex justify-end relative z-10`,
        saveButton: `flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all shadow-lg active:scale-95 ${isDark ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`
    }), [isDark]);

    return (
        <div className={styles.container}>
            {isDark && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
                </div>
            )}

            {/* HEADER */}
            <div className="px-6 pt-8 pb-4 shrink-0 relative z-10">
                <h2 className={styles.title}>Impostazioni Avanzate</h2>
                <p className={styles.subtitle}>Configura i limiti di utilizzo, la lingua e le integrazioni attive.</p>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10 relative z-10 custom-scrollbar">

                {/* Sezione 1: Costi */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-600"}`}>
                            <CurrencyDollar size={18} weight="bold" />
                        </div>
                        <h3 className={styles.sectionTitle}>Limiti e Costi</h3>
                    </div>

                    <div className={styles.card}>
                        <div className="flex flex-col gap-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <label className={styles.label}>Uso modelli premium</label>
                                    <p className={styles.description}>Permette l'accesso ai modelli più avanzati e costosi.</p>
                                </div>
                                <select
                                    value={allowExpensive}
                                    onChange={(e) => setAllowExpensive(e.target.value)}
                                    className={styles.input}
                                >
                                    <option value="yes">Consenti</option>
                                    <option value="no">Blocca</option>
                                </select>
                            </div>

                            {allowExpensive === 'yes' && (
                                <div className={`pt-5 border-t flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${isDark ? "border-white/5" : "border-neutral-200/60"}`}>
                                    <span className={`text-[11px] font-mono tracking-wider opacity-40 uppercase`}>Soglia massima mensile</span>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-40">
                                            <span className="text-sm font-bold">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="2.00"
                                            className={`${styles.input} pl-8 w-[110px] text-right font-mono`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className={styles.divider} />

                {/* Sezione 2: Preferenze */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-600"}`}>
                            <Globe size={18} weight="bold" />
                        </div>
                        <h3 className={styles.sectionTitle}>Preferenze Sistema</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <label className={styles.label}>Lingua di risposta</label>
                                <p className={styles.description}>Definisce la lingua principale utilizzata dall'assistente.</p>
                            </div>
                            <select className={`${styles.input} w-full sm:w-auto`}>
                                <option value="default">Rilevamento automatico</option>
                                <option value="it">Italiano</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-500"}`}>
                                    <Flask size={18} weight="bold" />
                                </div>
                                <div>
                                    <label className={`${styles.label} cursor-pointer`} onClick={() => setExperimental(!experimental)}>
                                        Programma Beta
                                    </label>
                                    <p className={styles.description}>Attiva l'accesso anticipato alle nuove funzioni sperimentali.</p>
                                </div>
                            </div>
                            <ToggleSwitch active={experimental} isDark={isDark} onClick={() => setExperimental(!experimental)} />
                        </div>
                    </div>
                </section>

                <div className={styles.divider} />

                {/* Sezione 3: Integrazioni */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-600"}`}>
                                <Plug size={18} weight="bold" />
                            </div>
                            <h3 className={styles.sectionTitle}>Integrazioni</h3>
                        </div>
                        <button className="text-[10px] font-black tracking-widest uppercase text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-2">
                            <Plus size={14} weight="bold" /> Gestisci
                        </button>
                    </div>

                    <div className={`rounded-3xl overflow-hidden border transition-all ${isDark ? "bg-white/[0.01] border-white/5" : "bg-neutral-50 border-neutral-100"}`}>
                        <div className="divide-y divide-white/[0.03]">
                            {INTEGRATIONS_DATA.map(conn => (
                                <div key={conn.id} className={styles.integrationCard}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl p-2 flex items-center justify-center border transition-all ${isDark ? "bg-white/[0.03] border-white/5" : "bg-white border-neutral-200"}`}>
                                            <img src={conn.icon} alt={conn.name} className="w-full h-full object-contain grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                                        </div>
                                        <div>
                                            <p className={`text-[13px] font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{conn.name}</p>
                                            <p className={`text-[10px] font-mono tracking-wider uppercase opacity-30 mt-0.5`}>
                                                {conn.connected ? 'Active Sync' : 'Not Linked'}
                                            </p>
                                        </div>
                                    </div>

                                    {conn.connected ? (
                                        <button className={`text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition-all ${isDark ? "text-red-400 bg-red-500/10 hover:bg-red-500/20" : "text-red-500 bg-red-50 hover:bg-red-100"
                                            }`}>
                                            Remove
                                        </button>
                                    ) : (
                                        <button className={`text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition-all border ${isDark
                                                ? "text-white/40 border-white/10 hover:bg-white/5 hover:text-white"
                                                : "text-neutral-600 bg-white border-neutral-200 hover:border-neutral-300"
                                            }`}>
                                            Connect
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* FOOTER */}
            <div className={styles.footer}>
                <button onClick={handleSave} className={styles.saveButton}>
                    <FloppyDiskIcon size={16} weight="bold" />
                    Salva Configurazione
                </button>
            </div>
        </div>
    );
}

const ToggleSwitch = ({ active, onClick, isDark }: { active: boolean, onClick: () => void, isDark: boolean }) => (
    <button
        onClick={onClick}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none ${active
                ? (isDark ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-neutral-900')
                : (isDark ? 'bg-white/10' : 'bg-neutral-200')
            }`}
    >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full transition-all duration-300 shadow-sm ${active 
                ? 'translate-x-5 bg-black' 
                : 'translate-x-1 bg-white/40'
            }`} />
    </button>
);

export default GeneralSettings;