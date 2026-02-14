import React, { useEffect, useState, type ChangeEvent } from "react";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import updateInstructions from "../../services/supabase/User/updateInstructions";
import getInstructions from "../../services/supabase/User/getInstructions";

const InstructionsSettingPage: React.FC = () => {
    const { user, experimental, systemPrompt, personalInfo, tone, allowedCustomInstructions, setAllowedCustomInstructions, setTone, setSystemPrompt, setPersonalInfo, loading } = useAuth()


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
    }, [])
    const handleSend = async () => {
        const json = {
            allowedCustomInstructions: allowedCustomInstructions,
            tone: tone,
            systemPrompt: systemPrompt,
            personalInfo: personalInfo
        }
        console.log("JSON da inviare:", json);
        await updateInstructions(user!.id, json)
    }
    return (
        <>
            {loading ?
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neutral-900"></div>
                </div>
                :
                <div className="flex flex-col h-full relative px-6">
                    {/* HEADER: Titolo fisso in alto */}
                    <div className="pt-6 pb-2 shrink-0">
                        <h2 className="text-xl font-semibold text-neutral-900">
                            Impostazioni Istruzioni
                        </h2>

                    </div>
                    <div className="flex justify-between items-center py-2 mt-2 border-b border-neutral-200 pb-4">
                        <div className="flex gap-3 items-start ">

                            <label className="text-sm font-medium text-neutral-700 cursor-pointer" onClick={() => setAllowedCustomInstructions(!allowedCustomInstructions)}>
                                Abilita Istruzioni Personalizzate
                                <p className="text-xs text-neutral-400 font-normal mt-0.5">L'IA rispetterà le tue istruzioni personalizzate.</p>
                            </label>
                        </div>
                        <ToggleSwitch active={allowedCustomInstructions} onClick={() => setAllowedCustomInstructions(!allowedCustomInstructions)} />
                    </div>
                    {/* BODY: Area scrollabile */}
                    <div className={`flex-1 overflow-y-auto  py-4 space-y-6 ${!allowedCustomInstructions ? "opacity-40 pointer-events-none " : ""}`}>

                        {/* Sezione 1: Tono e Stile */}
                        <section>
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-neutral-700">
                                    Profilo Comportamentale
                                </label>
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-neutral-200 outline-none transition-all"
                                >
                                    <option value="default">Professionale (Default)</option>
                                    <option value="student">Studente / Didattico</option>
                                    <option value="direct">Schietto e Conciso</option>
                                    <option value="creative">Creativo</option>
                                </select>
                            </div>

                            <div className="mt-4">
                                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                                    Prompt di Sistema
                                </label>
                                <textarea
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm min-h-[100px] resize-y focus:ring-2 focus:ring-neutral-200 outline-none transition-all"
                                    placeholder="Esempio: Rispondi sempre citando le fonti..."

                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    value={systemPrompt}
                                />
                                <p className="text-xs text-neutral-400 mt-1">
                                    Queste istruzioni verranno aggiunte a ogni conversazione.
                                </p>
                            </div>
                        </section>

                        <hr className="border-neutral-200" />

                        {/* Sezione 2: Informazioni Personali (Memoria) */}
                        <section className="space-y-4">
                            <div>
                                <h3 className="text-base font-medium text-neutral-900">Su di te</h3>
                                <p className="text-xs text-neutral-500">
                                    Nessuna di queste informazioni verrà condivisa
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <InputGroup label="Come ti chiami?" placeholder="Es. Mario Rossi" value={personalInfo.name} onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })} />
                                <InputGroup label="Di cosa ti occupi?" placeholder="Es. Sviluppatore React" value={personalInfo.job} onChange={(e) => setPersonalInfo({ ...personalInfo, job: e.target.value })} />
                                <InputGroup label="Hobby o interessi?" placeholder="Es. Trekking, Fotografia" value={personalInfo.hobbies} onChange={(e) => setPersonalInfo({ ...personalInfo, hobbies: e.target.value })} />
                            </div>
                        </section>

                        {/* Spazio extra per evitare che l'ultimo input sia attaccato al bordo */}
                        <div className="h-4"></div>
                    </div>

                    {/* FOOTER: Azioni (Opzionale, ma consigliato per UX) */}
                    <div className="p-4 border-t border-neutral-200 bg-white shrink-0 flex justify-end">
                        <button className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            onClick={handleSend}>
                            <FloppyDiskIcon size={18} />
                            Salva Modifiche
                        </button>
                    </div>
                </div>

            }
        </>
    )
};
const InputGroup = ({ label, placeholder, value, onChange }: { label: string, placeholder: string, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
            {label}
        </label>
        <input
            type="text"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-neutral-200 outline-none transition-all placeholder:text-neutral-400"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
    </div>
);
// Helper per lo Switch UI
const ToggleSwitch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 ${active ? 'bg-neutral-900' : 'bg-neutral-200'}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

export default InstructionsSettingPage;