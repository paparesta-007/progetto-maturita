import { FloppyDiskIcon, Globe, Flask, CurrencyDollar, Plug, Plus } from "@phosphor-icons/react";
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Assicurati che il percorso sia corretto

const INTEGRATIONS_DATA = [
    { id: 'gcal', name: "Google Calendar", connected: true, icon: "https://fonts.gstatic.com/s/i/productlogos/calendar_2020q4/v13/192px.svg" },
    { id: 'github', name: "GitHub", connected: false, icon: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" },
    { id: 'gmail', name: "Gmail", connected: true, icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfAFm_QWvScvmazbwSOAU2mpzbcSZNDEcaFg&s" },
    { id: 'slack', name: "Slack", connected: false, icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png" },
];

const GeneralSettings: React.FC = () => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    const [allowExpensive, setAllowExpensive] = useState("no");
    const [experimental, setExperimental] = useState(false);

    // Mappa degli stili per pulizia del JSX
    const styles = {
        container: `flex flex-col h-full relative transition-colors ${isDark ? "" : "bg-white"}`,
        title: `text-xl font-semibold ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`,
        sectionTitle: `text-sm font-semibold uppercase tracking-wide ${isDark ? "text-neutral-400" : "text-neutral-900"}`,
        label: `text-sm font-medium ${isDark ? "text-neutral-200" : "text-neutral-700"}`,
        description: `text-xs font-normal mt-0.5 ${isDark ? "text-neutral-500" : "text-neutral-400"}`,
        card: `rounded-xl p-4 border transition-colors ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-neutral-50 border-neutral-100"}`,
        input: `text-sm border rounded-lg px-2 py-1.5 outline-none transition-all ${
            isDark 
                ? "bg-neutral-900 border-neutral-700 text-white focus:ring-neutral-800" 
                : "bg-white border-neutral-300 text-neutral-700 focus:ring-neutral-200"
        }`,
        divider: `border-neutral-100 ${isDark ? "border-neutral-800" : "border-neutral-100"}`,
        integrationCard: `group flex items-center justify-between p-3 transition-colors ${isDark ? "hover:bg-neutral-900/50" : "hover:bg-neutral-50"}`,
        footer: `p-4 border-t shrink-0 flex justify-end transition-colors ${
            isDark ? "border-neutral-800" : "border-neutral-200 bg-white"
        }`,
        saveButton: `flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
            isDark ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`
    };

    return (
        <div className={styles.container}>
            
            {/* HEADER */}
            <div className="px-6 pt-6 pb-2 shrink-0">
                <h2 className={styles.title}>Impostazioni Avanzate</h2>
                <p className={styles.subtitle}>Gestisci modelli, lingua e integrazioni esterne.</p>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                {/* Sezione 1: Costi */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <CurrencyDollar size={18} className={isDark ? "text-neutral-500" : "text-neutral-400"} />
                        <h3 className={styles.sectionTitle}>Limiti e Costi</h3>
                    </div>
                    
                    <div className={styles.card}>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <label className={styles.label}>
                                    Uso modelli costosi
                                    <p className={styles.description}>Consenti l'uso di modelli $2 / 1M token.</p>
                                </label>
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
                                <div className={`mt-2 pt-3 border-t flex items-center justify-between animate-in fade-in slide-in-from-top-1 ${isDark ? "border-neutral-800" : "border-neutral-200/60"}`}>
                                    <span className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>Soglia massima</span>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-neutral-500 text-sm">$</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            placeholder="2.00" 
                                            className={`${styles.input} pl-7 w-[100px] text-right`} 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <hr className={styles.divider} />

                {/* Sezione 2: Preferenze */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Globe size={18} className={isDark ? "text-neutral-500" : "text-neutral-400"} />
                        <h3 className={styles.sectionTitle}>Preferenze</h3>
                    </div>

                    <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <label className={styles.label}>
                                Lingua di default
                                <p className={styles.description}>Lingua principale per le risposte dell'IA.</p>
                            </label>
                            <select className={`${styles.input} w-full sm:w-auto px-3`}>
                                <option value="default">Automatico</option>
                                <option value="it">Italiano</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex gap-3 items-start">
                                <div className={`mt-0.5 p-1.5 rounded-md ${isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-100 text-neutral-500"}`}>
                                    <Flask size={16} />
                                </div>
                                <label className={`${styles.label} cursor-pointer`} onClick={() => setExperimental(!experimental)}>
                                    Funzionalità sperimentali
                                    <p className={styles.description}>Accedi alle beta feature prima del rilascio.</p>
                                </label>
                            </div>
                            <ToggleSwitch active={experimental} isDark={isDark} onClick={() => setExperimental(!experimental)} />
                        </div>
                    </div>
                </section>

                <hr className={styles.divider} />

                {/* Sezione 3: Integrazioni */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Plug size={18} className={isDark ? "text-neutral-500" : "text-neutral-400"} />
                            <h3 className={styles.sectionTitle}>Integrazioni</h3>
                        </div>
                        <button className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1">
                            <Plus size={12} weight="bold"/> Aggiungi
                        </button>
                    </div>

                    <div className={`border rounded-xl overflow-hidden divide-y ${isDark ? "border-neutral-800 divide-neutral-800" : "border-neutral-200 divide-neutral-100"}`}>
                        {INTEGRATIONS_DATA.map(conn => (
                            <div key={conn.id} className={styles.integrationCard}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg p-1 flex items-center justify-center shadow-sm border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}`}>
                                        <img src={conn.icon} alt={conn.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium leading-tight ${isDark ? "text-white" : "text-neutral-900"}`}>{conn.name}</p>
                                        <p className={styles.description}>
                                            {conn.connected ? 'Sincronizzazione attiva' : 'Non collegato'}
                                        </p>
                                    </div>
                                </div>
                                
                                {conn.connected ? (
                                    <button className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                                        isDark ? "text-red-400 bg-red-500/10 hover:bg-red-500/20" : "text-red-500 bg-red-50 hover:bg-red-100"
                                    }`}>
                                        Disconnetti
                                    </button>
                                ) : (
                                    <button className={`text-xs font-medium px-3 py-1.5 rounded-full shadow-sm transition-colors border ${
                                        isDark 
                                            ? "text-neutral-300 bg-neutral-800 border-neutral-700 hover:bg-neutral-700" 
                                            : "text-neutral-600 bg-white border-neutral-200 hover:border-neutral-300"
                                    }`}>
                                        Collega
                                    </button>
                                )}
                            </div>
                        ))}
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
}

const ToggleSwitch = ({ active, onClick, isDark }: { active: boolean, onClick: () => void, isDark: boolean }) => (
    <button 
        onClick={onClick}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            active 
                ? (isDark ? 'bg-white focus:ring-neutral-400' : 'bg-neutral-900 focus:ring-neutral-400') 
                : (isDark ? 'bg-neutral-800 focus:ring-neutral-700' : 'bg-neutral-200 focus:ring-neutral-400')
        } ${isDark ? "focus:ring-offset-neutral-950" : "focus:ring-offset-white"}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
            active ? 'translate-x-6' : 'translate-x-1'
        } ${active && isDark ? 'bg-neutral-950' : 'bg-white'}`} />
    </button>
);

export default GeneralSettings;