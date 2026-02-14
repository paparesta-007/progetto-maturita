import React, { useEffect } from "react";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import updateInstructions from "../../services/supabase/User/updateInstructions";
import getInstructions from "../../services/supabase/User/getInstructions";

const InstructionsSettingPage: React.FC = () => {
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
        const json = { allowedCustomInstructions, tone, systemPrompt, personalInfo };
        await updateInstructions(user!.id, json);
    }

    const styles = {
        title: `text-xl font-semibold ${isDark ? "text-white" : "text-neutral-900"}`,
        label: `text-sm font-medium ${isDark ? "text-neutral-200" : "text-neutral-700"}`,
        description: `text-xs ${isDark ? "text-neutral-500" : "text-neutral-400"}`,
        input: `w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
            isDark 
                ? "bg-neutral-900 border-neutral-700 text-white focus:ring-neutral-700" 
                : "bg-white border-neutral-300 text-neutral-900 focus:ring-neutral-200"
        }`,
        footer: `p-4 border-t shrink-0 flex justify-end transition-colors ${
            isDark ? "border-neutral-800" : "border-neutral-200 bg-white"
        }`,
        section: `space-y-6 py-4 transition-opacity ${!allowedCustomInstructions ? "opacity-30 pointer-events-none" : ""}`
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDark ? "border-white" : "border-neutral-900"}`}></div>
        </div>
    );

    return (
        /* Il container principale occupa tutta l'altezza disponibile */
        <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header: statico */}
            <div className="pt-6 pb-2 px-6 shrink-0">
                <h2 className={styles.title}>Impostazioni Istruzioni</h2>
            </div>

            {/* Area Contenuto: SCROLLABILE */}
            <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
                
                {/* Toggle Switch Principal */}
                <div className={`flex justify-between items-center py-4 border-b ${isDark ? "border-neutral-800" : "border-neutral-200"}`}>
                    <div>
                        <label className={styles.label}>Abilita Istruzioni Personalizzate</label>
                        <p className={styles.description}>L'IA rispetterà le tue istruzioni personalizzate.</p>
                    </div>
                    <ToggleSwitch active={allowedCustomInstructions} isDark={isDark} onClick={() => setAllowedCustomInstructions(!allowedCustomInstructions)} />
                </div>

                <div className={styles.section}>
                    {/* Tone Selector */}
                    <div className="flex flex-col gap-2">
                        <label className={styles.label}>Profilo Comportamentale</label>
                        <select value={tone} onChange={(e) => setTone(e.target.value)} className={styles.input}>
                            <option value="default">Professionale (Default)</option>
                            <option value="student">Studente / Didattico</option>
                            <option value="direct">Schietto e Conciso</option>
                            <option value="creative">Creativo</option>
                        </select>
                    </div>

                    {/* System Prompt */}
                    <div className="flex flex-col gap-2">
                        <label className={styles.label}>Prompt di Sistema</label>
                        <textarea 
                            className={`${styles.input} min-h-[120px]`}
                            placeholder="Esempio: Rispondi sempre citando le fonti..."
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                        />
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-4 pb-8"> {/* pb-8 per dare respiro prima della fine dello scroll */}
                        <h3 className={styles.label}>Su di te</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <InputGroup isDark={isDark} label="Come ti chiami?" placeholder="Es. Mario Rossi" value={personalInfo.name} onChange={(v:any) => setPersonalInfo({ ...personalInfo, name: v })} />
                            <InputGroup isDark={isDark} label="Di cosa ti occupi?" placeholder="Es. Sviluppatore React" value={personalInfo.job} onChange={(v:any) => setPersonalInfo({ ...personalInfo, job: v })} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer: SEMPRE IN FONDO */}
            <div className={styles.footer}>
                <button onClick={handleSend} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                    isDark ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
                }`}>
                    <FloppyDiskIcon size={18} />
                    Salva Modifiche
                </button>
            </div>
        </div>
    );
};

// --- Helper Components con supporto Dark ---

const InputGroup = ({ label, placeholder, value, onChange, isDark }: any) => (
    <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
            {label}
        </label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900"
            }`}
            placeholder={placeholder}
        />
    </div>
);

const ToggleSwitch = ({ active, onClick, isDark }: { active: boolean, onClick: () => void, isDark: boolean }) => (
    <button
        onClick={onClick}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            active ? (isDark ? 'bg-white' : 'bg-neutral-900') : (isDark ? 'bg-neutral-700' : 'bg-neutral-200')
        }`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
            active ? 'translate-x-6' : 'translate-x-1'
        } ${isDark && active ? 'bg-neutral-900' : 'bg-white'}`} />
    </button>
);

export default InstructionsSettingPage;