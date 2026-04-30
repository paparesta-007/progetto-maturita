import React, { useEffect, useMemo } from "react";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import updateInstructions from "../../services/supabase/User/updateInstructions";
import getInstructions from "../../services/supabase/User/getInstructions";
import { useApp } from "../../context/AppContext";

const InstructionsSettingPage: React.FC = () => {
    const { setIsSettingOpen } = useApp();
    const {
        user, theme, tone, allowedCustomInstructions, systemPrompt, personalInfo,
        setAllowedCustomInstructions, setTone, setSystemPrompt, setPersonalInfo, loading
    } = useAuth();

    const isDark = theme === 'dark';

    useEffect(() => {
        if (!user) return;
        const fetchInstructions = async () => {
            const data = await getInstructions(user.id);
            if (data && data.instructions) {
                setTone(data.instructions.tone || "default");
                setAllowedCustomInstructions(data.instructions.allowedCustomInstructions || false);
                setSystemPrompt(data.instructions.systemPrompt || "");
                setPersonalInfo(data.instructions.personalInfo || { name: "", job: "", hobbies: "" });
            }
        }
        fetchInstructions();
    }, [user]);

    const handleSend = async () => {
        if (!user) return;
        const json = { allowedCustomInstructions, tone, systemPrompt, personalInfo };
        await updateInstructions(user.id, json);
        setIsSettingOpen(false);
    }

    const styles = useMemo(() => ({
        container: `flex flex-col h-full relative transition-all duration-500 font-['Manrope'] ${isDark ? "bg-transparent text-[#f4f1ea]" : "bg-white"}`,
        title: `text-2xl font-black tracking-tighter ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-xs font-medium opacity-40 mt-1`,
        sectionTitle: `text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-white/30" : "text-neutral-500"}`,
        label: `text-[13px] font-bold tracking-tight ${isDark ? "text-white/90" : "text-neutral-700"}`,
        description: `text-[11px] font-medium opacity-40 leading-relaxed mt-0.5`,
        input: `text-[13px] font-semibold border rounded-xl px-4 py-2 outline-none transition-all ${isDark
                ? "bg-white/[0.03] border-white/10 text-white focus:border-orange-500/50 focus:bg-white/[0.06]"
                : "bg-white border-neutral-300 text-neutral-700 focus:ring-neutral-200"
            }`,
        footer: `p-6 pt-2 shrink-0 flex justify-end relative z-10`,
        section: `space-y-8 transition-opacity duration-500 ${!allowedCustomInstructions ? "opacity-30 pointer-events-none grayscale-[0.5]" : ""}`,
        saveButton: `flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all shadow-lg active:scale-95 ${isDark ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`
    }), [isDark, allowedCustomInstructions]);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className={`w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin`}></div>
        </div>
    );

    return (
        <div className={styles.container}>
            {isDark && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 -right-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px]" />
                </div>
            )}

            {/* Header */}
            <div className="px-6 pt-8 pb-4 shrink-0 relative z-10">
                <h2 className={styles.title}>Istruzioni Agente</h2>
                <p className={styles.subtitle}>Personalizza il comportamento e le conoscenze di base dell'IA.</p>
            </div>

            {/* Area Contenuto */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10 relative z-10 custom-scrollbar">

                {/* Main Toggle */}
                <div className={`flex justify-between items-center p-6 rounded-3xl border transition-all ${isDark ? "bg-white/[0.02] border-white/5" : "bg-neutral-50 border-neutral-200"}`}>
                    <div>
                        <label className={styles.label}>Attiva Personalizzazione</label>
                        <p className={styles.description}>Permette all'IA di adattarsi al tuo stile e alle tue preferenze.</p>
                    </div>
                    <ToggleSwitch active={allowedCustomInstructions} isDark={isDark} onClick={() => setAllowedCustomInstructions(!allowedCustomInstructions)} />
                </div>

                <div className={styles.section}>
                    {/* Tone Selector */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className={styles.sectionTitle}>Profilo Comportamentale</h3>
                        </div>
                        <select value={tone} onChange={(e) => setTone(e.target.value)} className={styles.input}>
                            <option value="default">Professionale & Analitico</option>
                            <option value="student">Didattico & Semplificato</option>
                            <option value="direct">Diretto & Essenziale</option>
                            <option value="creative">Creativo & Narrativo</option>
                        </select>
                    </div>

                    {/* System Prompt */}
                    <div className="flex flex-col gap-3">
                        <h3 className={styles.sectionTitle}>Prompt di Sistema</h3>
                        <textarea
                            className={`${styles.input} min-h-[140px] resize-none py-4 leading-relaxed`}
                            placeholder="Esempio: Rispondi sempre citando le fonti ufficiali e usa un tono rassicurante..."
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                        />
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-6 pb-10">
                        <h3 className={styles.sectionTitle}>Contesto Utente</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <InputGroup isDark={isDark} label="Identità" placeholder="Es. Mario Rossi" value={personalInfo.name} onChange={(v: any) => setPersonalInfo({ ...personalInfo, name: v })} />
                            <InputGroup isDark={isDark} label="Occupazione" placeholder="Es. Software Engineer presso Google" value={personalInfo.job} onChange={(v: any) => setPersonalInfo({ ...personalInfo, job: v })} />
                            <InputGroup isDark={isDark} label="Interessi & Hobbies" placeholder="Es. Astrofisica, Tennis, Musica Jazz" value={personalInfo.hobbies} onChange={(v: any) => setPersonalInfo({ ...personalInfo, hobbies: v })} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <button onClick={handleSend} className={styles.saveButton}>
                    <FloppyDiskIcon size={16} weight="bold" />
                    Applica Modifiche
                </button>
            </div>
        </div>
    );
};

// --- Helpers ---

const InputGroup = ({ label, placeholder, value, onChange, isDark }: any) => (
    <div className="flex flex-col gap-2">
        <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? "text-white/20" : "text-neutral-500"}`}>
            {label}
        </label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full border rounded-xl px-4 py-2.5 text-[13px] font-semibold outline-none transition-all ${
                isDark 
                    ? "bg-white/[0.02] border-white/5 text-white focus:border-orange-500/50 focus:bg-white/[0.04]" 
                    : "bg-white border-neutral-300 text-neutral-900"
            }`}
            placeholder={placeholder}
        />
    </div>
);

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

export default InstructionsSettingPage;