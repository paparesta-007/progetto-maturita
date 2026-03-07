import React, { useEffect, useState } from "react";
import { User, Envelope, Calendar, Camera, FloppyDisk } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import selectUserDetails from "../../services/supabase/User/SelectuserDetails";
import insertUserDetails from "../../services/supabase/User/InsertUserDetails";

const AccountPage: React.FC = () => {
    const { user, theme } = useAuth();
    const isDark = theme === "dark";

    const [fullName, setFullName] = useState("");
    const [birthday, setBirthday] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            setEmail(user.email || "");
            
            const details = await selectUserDetails(user.id);
            if (details) {
                setFullName(details.full_name || "");
                setBirthday(details.birthday || "");
            }
            setLoading(false);
        };

        fetchUserData();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        await insertUserDetails(user.id, fullName, birthday);
        setSaving(false);
    };

    const styles = {
        container: `flex flex-col h-full relative transition-colors ${isDark ? "" : "bg-white"}`,
        title: `text-xl font-semibold ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-sm ${isDark ? "text-neutral-600" : "text-neutral-500"}`,
        sectionTitle: `text-sm font-semibold uppercase tracking-wide ${isDark ? "text-neutral-600" : "text-neutral-900"}`,
        label: `text-sm font-medium ${isDark ? "text-neutral-200" : "text-neutral-700"}`,
        description: `text-xs font-normal mt-0.5 ${isDark ? "text-neutral-500" : "text-neutral-600"}`,
        card: `rounded-xl p-4 border transition-colors ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-neutral-50 border-neutral-100"}`,
        input: `w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all ${
            isDark 
                ? "bg-neutral-900 border-neutral-700 text-white focus:ring-neutral-800" 
                : "bg-white border-neutral-300 text-neutral-700 focus:ring-neutral-200"
        }`,
        readOnlyInput: `w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all cursor-not-allowed ${
            isDark 
                ? "bg-neutral-800/50 border-neutral-700 text-neutral-500" 
                : "bg-neutral-100 border-neutral-200 text-neutral-600"
        }`,
        footer: `p-4 border-t shrink-0 flex justify-end transition-colors ${
            isDark ? "border-neutral-800" : "border-neutral-200 bg-white"
        }`,
        saveButton: `flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
            isDark ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
        } ${saving ? "opacity-70 cursor-not-allowed" : ""}`
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDark ? "border-white" : "border-neutral-900"}`}></div>
        </div>
    );

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <div className="px-6 pt-6 pb-2 shrink-0">
                <h2 className={styles.title}>Il mio Account</h2>
                <p className={styles.subtitle}>Gestisci le tue informazioni personali e le credenziali di accesso.</p>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                
                {/* Profile Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <User size={18} className={isDark ? "text-neutral-500" : "text-neutral-600"} />
                        <h3 className={styles.sectionTitle}>Profilo Personale</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className={styles.label}>Nome Completo</label>
                            <input 
                                type="text" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Mario Rossi"
                                className={styles.input}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className={styles.label}>Data di Nascita</label>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    className={styles.input}
                                />
                                <Calendar size={18} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-neutral-500" : "text-neutral-600"}`} />
                            </div>
                        </div>
                    </div>
                </section>

                <hr className={`border-neutral-100 ${isDark ? "border-neutral-800" : "border-neutral-100"}`} />

                {/* Account Details */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Envelope size={18} className={isDark ? "text-neutral-500" : "text-neutral-600"} />
                        <h3 className={styles.sectionTitle}>Dati d'accesso</h3>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={styles.label}>Indirizzo Email</label>
                        <input 
                            type="email" 
                            value={email}
                            readOnly
                            className={styles.readOnlyInput}
                        />
                        <p className={styles.description}>L'email è collegata al tuo account Supabase e non può essere modificata qui.</p>
                    </div>
                </section>

                {/* Avatar Section (Placeholder) */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Camera size={18} className={isDark ? "text-neutral-500" : "text-neutral-600"} />
                        <h3 className={styles.sectionTitle}>Immagine del profilo</h3>
                    </div>

                    <div className={styles.card}>
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${isDark ? "bg-neutral-800 text-neutral-600" : "bg-neutral-200 text-neutral-500"}`}>
                                {fullName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <button className={`text-sm font-medium px-3 py-1.5 rounded-lg border ${isDark ? "border-neutral-700 hover:bg-neutral-800" : "border-neutral-200 hover:bg-neutral-50"}`}>
                                    Cambia Avatar
                                </button>
                                <p className={styles.description}>JPG o PNG. Max 2MB.</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            {/* FOOTER */}
            <div className={styles.footer}>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={styles.saveButton}
                >
                    <FloppyDisk size={18} />
                    {saving ? "Salvataggio..." : "Salva Modifiche"}
                </button>
            </div>
        </div>
    );
};

export default AccountPage;
