import { FloppyDiskIcon, Globe, Flask, CurrencyDollar, Plug, Plus } from "@phosphor-icons/react";
import React, { useState } from "react";

// Dati spostati fuori dal componente o in una costante per pulizia
const INTEGRATIONS_DATA = [
    { id: 'gcal', name: "Google Calendar", connected: true, icon: "https://fonts.gstatic.com/s/i/productlogos/calendar_2020q4/v13/192px.svg" },
    { id: 'github', name: "GitHub", connected: false, icon: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" },
    { id: 'gmail', name: "Gmail", connected: true, icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfAFm_QWvScvmazbwSOAU2mpzbcSZNDEcaFg&s" },
    { id: 'slack', name: "Slack", connected: false, icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png" },
];

const InstructionsSettingPage: React.FC = () => {
    // Stati
    const [allowExpensive, setAllowExpensive] = useState("no");
    const [experimental, setExperimental] = useState(false);
    
    
    return (
        <div className="flex flex-col h-full relative bg-white">
            
            {/* HEADER: Titolo fisso in alto */}
            <div className="px-6 pt-6 pb-2 shrink-0">
                <h2 className="text-xl font-semibold text-neutral-900">
                    Impostazioni Avanzate
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                    Gestisci modelli, lingua e integrazioni esterne.
                </p>
            </div>

            {/* BODY: Area scrollabile */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                {/* Sezione 1: Costi e Modelli */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <CurrencyDollar size={18} className="text-neutral-500" />
                        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Limiti e Costi</h3>
                    </div>
                    
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <label className="text-sm font-medium text-neutral-700">
                                    Uso modelli costosi
                                    <p className="text-xs text-neutral-500 font-normal mt-0.5 max-w-[250px]">
                                        Consenti l'uso di modelli $2 / 1M token.
                                    </p>
                                </label>
                                <select 
                                    value={allowExpensive}
                                    onChange={(e) => setAllowExpensive(e.target.value)}
                                    className="text-sm text-neutral-700 border border-neutral-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-neutral-200 outline-none"
                                >
                                    <option value="yes">Consenti</option>
                                    <option value="no">Blocca</option>
                                </select>
                            </div>

                            {/* Mostra input prezzo solo se abilitato */}
                            {allowExpensive === 'yes' && (
                                <div className="mt-2 pt-3 border-t border-neutral-200/60 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                                    <span className="text-sm text-neutral-600">Soglia massima</span>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-neutral-400 text-sm">$</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            placeholder="2.00" 
                                            className="pl-7 pr-3 py-1.5 w-[100px] text-right border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-200 outline-none transition-all" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <hr className="border-neutral-100" />

                {/* Sezione 2: Preferenze Generali */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Globe size={18} className="text-neutral-500" />
                        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Preferenze</h3>
                    </div>

                    <div className="space-y-5">
                        {/* Lingua */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <label className="text-sm font-medium text-neutral-700">
                                Lingua di default
                                <p className="text-xs text-neutral-400 font-normal mt-0.5">Lingua principale per le risposte dell'IA.</p>
                            </label>
                            <select className="w-full sm:w-auto text-sm text-neutral-700 border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-neutral-200 outline-none">
                                <option value="default">Automatico</option>
                                <option value="it">Italiano</option>
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                            </select>
                        </div>

                        {/* Sperimentale */}
                        <div className="flex justify-between items-center">
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 p-1.5 bg-neutral-100 rounded-md text-neutral-500">
                                    <Flask size={16} />
                                </div>
                                <label className="text-sm font-medium text-neutral-700 cursor-pointer" onClick={() => setExperimental(!experimental)}>
                                    Funzionalità sperimentali
                                    <p className="text-xs text-neutral-400 font-normal mt-0.5">Accedi alle beta feature prima del rilascio.</p>
                                </label>
                            </div>
                            <ToggleSwitch active={experimental} onClick={() => setExperimental(!experimental)} />
                        </div>
                    </div>
                </section>

                <hr className="border-neutral-100" />

                {/* Sezione 3: Connessioni */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Plug size={18} className="text-neutral-500" />
                            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Integrazioni</h3>
                        </div>
                        <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            <Plus size={12} weight="bold"/> Aggiungi
                        </button>
                    </div>

                    <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
                        {INTEGRATIONS_DATA.map(conn => (
                            <div key={conn.id} className="group flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 p-1 flex items-center justify-center shadow-sm">
                                        <img src={conn.icon} alt={conn.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900 leading-tight">{conn.name}</p>
                                        <p className="text-[10px] text-neutral-400 mt-0.5">
                                            {conn.connected ? 'Sincronizzazione attiva' : 'Non collegato'}
                                        </p>
                                    </div>
                                </div>
                                
                                {conn.connected ? (
                                    <button className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors">
                                        Disconnetti
                                    </button>
                                ) : (
                                    <button className="text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 px-3 py-1.5 rounded-full shadow-sm transition-colors">
                                        Collega
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Spazio finale */}
                <div className="h-4"></div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-neutral-200 bg-white shrink-0 flex justify-end">
                <button className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow active:scale-95">
                    <FloppyDiskIcon size={18} />
                    Salva Modifiche
                </button>
            </div>
        </div>
    );
}
    const ToggleSwitch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
        <button 
            onClick={onClick}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 ${active ? 'bg-neutral-900' : 'bg-neutral-200'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
export default InstructionsSettingPage;