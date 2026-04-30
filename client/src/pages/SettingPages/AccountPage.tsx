import React, { useEffect, useState, useMemo } from "react";
import { User, Envelope, Calendar, Camera, FloppyDisk } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import selectUserDetails from "../../services/supabase/User/SelectuserDetails";
import insertUserDetails from "../../services/supabase/User/InsertUserDetails";
import { useApp } from "../../context/AppContext";

const AccountPage: React.FC = () => {
    const { user, theme } = useAuth();
    const { setIsSettingOpen } = useApp();
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
        try {
            await insertUserDetails(user.id, fullName, birthday);
            setIsSettingOpen(false);
        } finally {
            setSaving(false);
        }
    };

    const styles = useMemo(() => ({
        container: `flex flex-col h-full relative transition-all duration-500 font-['Manrope'] ${isDark ? "bg-transparent text-[#f4f1ea]" : "bg-white"}`,
        title: `text-2xl font-black tracking-tighter ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-xs font-medium opacity-40 mt-1`,
        sectionTitle: `text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-white/30" : "text-neutral-500"}`,
        label: `text-[13px] font-bold tracking-tight ${isDark ? "text-white/90" : "text-neutral-700"}`,
        description: `text-[11px] font-medium opacity-40 leading-relaxed mt-0.5`,
        card: `rounded-[1.5rem] p-6 border transition-all duration-300 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-neutral-50 border-neutral-100"}`,
        input: `text-[13px] font-semibold border rounded-xl px-4 py-2 outline-none transition-all ${isDark
                ? "bg-white/[0.03] border-white/10 text-white focus:border-orange-500/50 focus:bg-white/[0.06]"
                : "bg-white border-neutral-300 text-neutral-700 focus:ring-neutral-200"
            }`,
        readOnlyInput: `text-[13px] font-semibold border rounded-xl px-4 py-2 outline-none transition-all cursor-not-allowed opacity-40 ${isDark
                ? "bg-white/[0.01] border-white/5 text-white/50"
                : "bg-neutral-100 border-neutral-200 text-neutral-500"
            }`,
        footer: `p-6 pt-2 shrink-0 flex justify-end relative z-10`,
        saveButton: `flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all shadow-lg active:scale-95 ${isDark ? "bg-orange-500 text-black hover:bg-orange-400" : "bg-neutral-900 text-white hover:bg-neutral-800"
            } ${saving ? "opacity-70 cursor-not-allowed" : ""}`
    }), [isDark, saving]);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className={`w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin`}></div>
        </div>
    );

    return (
        <div className={styles.container}>
            {isDark && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px]" />
                </div>
            )}

            {/* HEADER */}
            <div className="px-6 pt-8 pb-4 shrink-0 relative z-10">
                <h2 className={styles.title}>Il mio Account</h2>
                <p className={styles.subtitle}>Gestisci le tue informazioni personali e le preferenze del profilo.</p>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10 relative z-10 custom-scrollbar">

                {/* Profile Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-600"}`}>
                            <User size={18} weight="bold" />
                        </div>
                        <h3 className={styles.sectionTitle}>Profilo Personale</h3>
                    </div>

                    <div className="space-y-6">
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
                                    className={`${styles.input} w-full`}
                                />
                                <Calendar size={18} weight="bold" className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-white/20" : "text-neutral-400"}`} />
                            </div>
                        </div>
                    </div>
                </section>

                <div className={`border-none h-px my-4 ${isDark ? "bg-gradient-to-r from-transparent via-white/5 to-transparent" : "bg-neutral-100"}`} />

                {/* Account Details */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-600"}`}>
                            <Envelope size={18} weight="bold" />
                        </div>
                        <h3 className={styles.sectionTitle}>Credenziali Accesso</h3>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={styles.label}>Indirizzo Email</label>
                        <input
                            type="email"
                            value={email}
                            readOnly
                            className={styles.readOnlyInput}
                        />
                        <p className={styles.description}>L'email è verificata e gestita tramite il sistema di autenticazione Supabase.</p>
                    </div>
                </section>

                <div className={`border-none h-px my-4 ${isDark ? "bg-gradient-to-r from-transparent via-white/5 to-transparent" : "bg-neutral-100"}`} />

                {/* Avatar Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-600"}`}>
                            <Camera size={18} weight="bold" />
                        </div>
                        <h3 className={styles.sectionTitle}>Media Profilo</h3>
                    </div>

                    <div className={styles.card}>
                        <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black border-2 ${isDark ? "bg-white/[0.03] border-white/10 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "bg-neutral-200 border-white text-neutral-500"}`}>
                                {fullName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-3">
                                <button className={`text-[11px] font-black tracking-widest uppercase px-5 py-2.5 rounded-xl transition-all border ${isDark ? "text-white/40 border-white/10 hover:bg-white/5 hover:text-white" : "border-neutral-200 hover:bg-neutral-50"}`}>
                                    Update Avatar
                                </button>
                                <p className={styles.description}>Formato supportato: JPG, PNG. Max 2MB.</p>
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
                    <FloppyDisk size={16} weight="bold" />
                    {saving ? "Salvataggio..." : "Salva Modifiche"}
                </button>
            </div>
        </div>
    );
};

export default AccountPage;
