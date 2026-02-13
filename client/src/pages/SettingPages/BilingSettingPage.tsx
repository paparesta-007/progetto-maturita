import React, { useState, type ChangeEvent } from "react";
import { FloppyDiskIcon } from "@phosphor-icons/react";

const BillingSettingPage: React.FC = () => {
    const [tone, setTone] = useState("default");
    return (
        <div className="flex flex-col h-full relative">

            {/* BODY: Area scrollabile */}
            <div className="flex-1 overflow-y-auto px-6 py-12 space-y-6">

                {/* Sezione 1: Tono e Stile */}
                <section className="space-y-4">
                    <div className="flex flex-row justify-between gap-3">
                        <label className="text-sm font-medium text-neutral-700">
                            Plan
                            <p className="text-xs text-neutral-400 font-normal">Pro plan</p>
                        </label>
                        <button className="flex items-center gap-2  text-neutral-600 border border-neutral-300 px-4 py-1.5 rounded-lg
                             text-sm font-medium hover:bg-neutral-100 cursor-pointer transition-colors">
                            Change Plan
                        </button>
                    </div>


                </section>

                

                <section className="space-y-4">
                    <h2 className="text-md font-medium text-neutral-900 ">Dati di Fatturazione</h2>
                    <hr className="border-neutral-200 my-4" />
                    <div className="flex flex-row justify-between gap-3">
                        <label className="text-sm font-medium text-neutral-700">
                            Metodo di Pagamento
                            <p className="text-xs text-neutral-400 font-normal">Credit Card</p>
                        </label>
                        <button className="flex items-center gap-2  text-neutral-600 border border-neutral-300 px-4 py-1.5 rounded-lg
                             text-sm font-medium hover:bg-neutral-100 cursor-pointer transition-colors">
                            Modifica Metodo
                        </button>
                    </div>
                    <hr className="border-neutral-200 my-4" />
                    <div className="flex flex-row justify-between gap-3">
                        <label className="text-sm font- text-neutral-900">
                            Email di Fatturazione
                            <p className="text-xs text-neutral-400 font-normal">example@example.com</p>
                        </label>
                        <button className="flex items-center gap-2  text-neutral-600 border border-neutral-300 px-4 py-1.5 rounded-lg
                             text-sm font-medium hover:bg-neutral-100 cursor-pointer transition-colors">
                            Modifica Email
                        </button>
                    </div>
                    <hr className="border-neutral-200 my-4" />
                    <div className="flex flex-row justify-between gap-3">
                        <label className="text-sm font-medium text-neutral-700">
                            Metodo di Pagamento
                            <p className="text-xs text-neutral-400 font-normal">Credit Card</p>
                        </label>
                        <button className="flex items-center gap-2  text-neutral-600 border border-neutral-300 px-4 py-1.5 rounded-lg
                             text-sm font-medium hover:bg-neutral-100 cursor-pointer transition-colors">
                            Edit Method
                        </button>
                    </div>
                </section>

                {/* Spazio extra per evitare che l'ultimo input sia attaccato al bordo */}
                <div className="h-4"></div>
            </div>

            {/* FOOTER: Azioni (Opzionale, ma consigliato per UX) */}
            <div className="p-4 border-t border-neutral-200 bg-white shrink-0 flex justify-end">
                <button className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <FloppyDiskIcon size={18} />
                    Salva Modifiche
                </button>
            </div>
        </div>
    )
};
const InputGroup = ({ label, placeholder }: { label: string, placeholder: string }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
            {label}
        </label>
        <input
            type="text"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-neutral-200 outline-none transition-all placeholder:text-neutral-400"
            placeholder={placeholder}
        />
    </div>
);
export default BillingSettingPage;