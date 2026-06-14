import React, { useEffect, useState, useMemo } from "react";
import { PaintBrush, TextT, FloppyDisk } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import updatePreferences from "../../services/supabase/User/updatePreferences";
import SelectPopup from "../../components/other/SelectPopup";

const PreferencesPage: React.FC = () => {
    // Recuperiamo stylePreferences dal context
    const { user, theme, stylePreferences } = useAuth();
    const isDark = theme === "dark";

    const [selectedTheme, setSelectedTheme] = useState("light");
    const [fontFamily, setFontFamily] = useState("domine");
    const [navbarStyle, setNavbarStyle] = useState("classic-soft");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Effetto per sincronizzare lo stato locale con le preferenze salvate nel context
    useEffect(() => {
        const syncPreferences = () => {
            if (stylePreferences && stylePreferences.style && stylePreferences.style.length > 0) {
                const currentPrefs = stylePreferences.style[0];

                // Aggiorniamo lo stato solo se i valori esistono
                if (currentPrefs.theme) setSelectedTheme(currentPrefs.theme);
                if (currentPrefs.fontFamily) setFontFamily(currentPrefs.fontFamily);
                if (currentPrefs.navbarStyle) setNavbarStyle(currentPrefs.navbarStyle);
            }

            // Rimuoviamo il loading (simuliamo un minimo delay per fluidità UI se necessario, o rimuovilo del tutto)
            setTimeout(() => {
                setLoading(false);
            }, 300);
        };

        syncPreferences();
    }, [stylePreferences]); // Si riattiva se cambiano le preferenze nel context

    const handleSend = async () => {
        if (!user) return;
        setSaving(true);

        const payload = {
            style: [{ theme: selectedTheme, fontFamily: fontFamily, navbarStyle: navbarStyle }]
        };

        try {
            const result = await updatePreferences(user.id, payload);

            if (!result) {
                // ERRORE
            }


        } catch (error) {
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
                <h2 className={styles.title}>Preferenze Visive</h2>
                <p className={styles.subtitle}>Personalizza l'aspetto e l'esperienza di lettura dell'interfaccia.</p>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10 relative z-10 custom-scrollbar">

                {/* Theme Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-600"}`}>
                            <PaintBrush size={18} weight="bold" />
                        </div>
                        <h3 className={styles.sectionTitle}>Interfaccia</h3>
                    </div>

                    <div className={styles.card}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className={styles.label}>Tema Globale</label>
                                <p className={styles.description}>Scegli l'atmosfera cromatica preferita per l'applicazione.</p>
                                <div className="relative mt-2">
                                    <SelectPopup
                                        value={selectedTheme}
                                        onChange={(value) => setSelectedTheme(value)}
                                        options={[
                                            { value: "light", label: "Pure Light" },
                                            { value: "light-beige", label: "Beige Comfort" },
                                            { value: "dark", label: "Liquid Dark" },
                                            { value: "system", label: "Sync System" }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className={`h-px ${isDark ? "bg-white/5" : "bg-neutral-100"}`} />

                            <div className="flex flex-col gap-2">
                                <label className={styles.label}>Stile Barra di Navigazione</label>
                                <p className={styles.description}>Scegli tra un look moderno satinato o uno più classico e morbido.</p>
                                <div className="relative mt-2">
                                    <SelectPopup
                                        value={navbarStyle}
                                        onChange={(value) => setNavbarStyle(value)}
                                        options={[
                                            { value: "classic-soft", label: "Classic & Soft (Classico & Morbido)" },
                                            { value: "modern-glass", label: "Modern Glass (Vibrante & Satinato)" }
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className={`border-none h-px my-4 ${isDark ? "bg-gradient-to-r from-transparent via-white/5 to-transparent" : "bg-neutral-100"}`} />

                {/* Typography Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? "bg-white/5 text-orange-500" : "bg-neutral-100 text-neutral-600"}`}>
                            <TextT size={18} weight="bold" />
                        </div>
                        <h3 className={styles.sectionTitle}>Tipografia</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className={styles.label}>Famiglia di Caratteri</label>
                            <p className={styles.description}>Seleziona il font principale per i blocchi di testo e la chat.</p>
                            <div className="relative mt-2">
                                <SelectPopup
                                    value={fontFamily}
                                    onChange={(value) => setFontFamily(value)}
                                    options={[
                                        { value: "domine", label: "Domine (Elegante)" },
                                        { value: "comic-neue", label: "Comic Neue (Informale)" },
                                        { value: "overlock", label: "Overlock (Creativo)" },
                                        { value: "poppins", label: "Poppins (Moderno)" },
                                        { value: "roboto", label: "Roboto (Standard)" },
                                        { value: "merriweather", label: "Merriweather (Libro)" }
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className={`p-6 rounded-[1.5rem] border border-dashed transition-all ${isDark ? "border-white/10 bg-white/[0.01]" : "border-neutral-200 bg-neutral-50"}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider opacity-30 mb-4`}>Live Preview</p>
                            <p
                                className={`text-xl leading-relaxed ${fontFamily === "domine" ? "f-domine" :
                                        fontFamily === "comic-neue" ? "f-comic" :
                                            fontFamily === "overlock" ? "f-overlock" :
                                                fontFamily === "poppins" ? "f-poppins" :
                                                    fontFamily === "roboto" ? "f-roboto" :
                                                        fontFamily === "merriweather" ? "f-merriweather" :
                                                            ""
                                    }`}
                            >
                                L'essenziale è invisibile agli occhi.
                            </p>
                        </div>
                    </div>
                </section>

            </div>

            {/* FOOTER */}
            <div className={styles.footer}>
                <button
                    onClick={handleSend}
                    disabled={saving}
                    className={styles.saveButton}
                >
                    <FloppyDisk size={16} weight="bold" />
                    {saving ? "Salvataggio..." : "Salva Preferenze"}
                </button>
            </div>
        </div>
    );
};

export default PreferencesPage;