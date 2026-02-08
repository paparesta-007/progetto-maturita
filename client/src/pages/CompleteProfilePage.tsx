import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import supabase from "../library/supabaseclient"; // Assicurati che il percorso sia corretto
import insertUserDetails from "../services/supabase/User/InsertUserDetails";
import Header from "../components/other/Header";
import { QuestionIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import Tooltip from "../components/other/Tooltip";

const CompleteProfile = () => {
    const [formData, setFormData] = useState({ name: '', day: '', month: '', year: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.display_name;
    const displayNameToRender = metaName || "Stranger";

    const handleSend = async () => {
        const { name, day, month, year } = formData;

        // 1. Validazione base
        if (!name || !day || !month || !year) {
            setError("Please fill in all fields.");
            return;
        }

        // 2. Controllo esistenza utente
        if (!user?.id) {
            setError("User session not found. Please log in again.");
            return;
        }

        setLoading(true);
        setError(null); // Resetta errori precedenti prima di iniziare

        try {
            // 3. Formattazione sicura (converte in stringa prima di padStart)
            const fDay = day.toString().padStart(2, '0');
            const fMonth = month.toString().padStart(2, '0');
            const dateString = `${year}-${fMonth}-${fDay}`;

            console.log("Sending data for:", name, "Date:", dateString);

            // 4. Esecuzione insert
            const data = await insertUserDetails(user.id, name, dateString);
      

            window.location.reload();

        } catch (err: any) {
            console.error("Update error:", err);
            setError(err.message || "Failed to update user details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           
            <Header/>
            <button className="absolute top-4 right-4 text-neutral-900 hover:text-neutral-700 
            hover:underline px-4 py-2 rounded-md font-medium" onClick={() => supabase.auth.signOut()}>Logout</button>
            <div className="relative bg-white rounded-2xl  p-8 max-w-sm w-full border border-neutral-200">
                <div className="text-left mb-8">
                    <h2 className="text-2xl font-bold tracking-tight  flex items-center justify-start gap-2">Welcome<RocketLaunchIcon size={28} /></h2>
                    <p className="text-neutral-500 mt-2 text-sm">Please complete your profile to continue.</p>
                </div>

                <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Birthday Grid */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-400 mb-1.5 block flex items-center gap-1.5">Birthday
                           
                            <Tooltip content="Only 18+ can register." position="top" background="light">
                                 <QuestionIcon size={20} />
                            </Tooltip>
                            </label>
                        <div className="grid grid-cols-12 gap-2">
                            {/* Giorno */}
                            <input
                                type="number"
                                placeholder="DD"
                                min="1" max="31"
                                className="col-span-3 border border-neutral-200 rounded-xl px-2 py-2.5 focus:ring-2 focus:ring-neutral-900 outline-none text-center"
                                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                            />

                            {/* Mese (Select) */}
                            <select
                                className="col-span-5 border border-neutral-200 rounded-xl px-2 py-2.5 focus:ring-2 focus:ring-neutral-900 outline-none bg-white"
                                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                defaultValue=""
                            >
                                <option value="" disabled>Month</option>
                                {months.map((m, index) => (
                                    <option key={m} value={index + 1}>{m}</option>
                                ))}
                            </select>

                            {/* Anno */}
                            <input
                                type="number"
                                placeholder="YYYY"
                                min="1900" max={new Date().getFullYear()}
                                className="col-span-4 border border-neutral-200 rounded-xl px-2 py-2.5 focus:ring-2 focus:ring-neutral-900 outline-none text-center"
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <p className="text-xs text-neutral-400 mt-4">
                    Your data will not be shared
                </p>
                {error && <p className="bg-red-100 border border-red-200 text-red-500 text-sm mt-4 p-2 rounded">{error}</p>}
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="w-full mt-8 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Saving..." : "Continue"}
                </button>
            </div>
        </div>
    );
}

export default CompleteProfile;