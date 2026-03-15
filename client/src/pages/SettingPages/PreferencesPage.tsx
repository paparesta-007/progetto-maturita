import React, { useEffect, useState } from "react";
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
            style: [{ theme: selectedTheme, fontFamily: fontFamily }]
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

    const styles = {
        container: `flex flex-col h-full relative transition-colors ${isDark ? "" : "bg-white"}`,
        title: `text-xl font-semibold ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `text-sm ${isDark ? "text-neutral-600" : "text-neutral-500"}`,
        sectionTitle: `text-sm font-semibold uppercase tracking-wide ${isDark ? "text-neutral-600" : "text-neutral-900"}`,
        label: `text-sm font-medium ${isDark ? "text-neutral-200" : "text-neutral-700"}`,
        description: `text-xs font-normal mt-0.5 ${isDark ? "text-neutral-500" : "text-neutral-600"}`,
        card: `rounded-xl p-4 border transition-colors ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-neutral-50 border-neutral-100"}`,
        input: `w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all ${isDark
            ? "bg-neutral-900 border-neutral-700 text-white focus:ring-neutral-800"
            : "bg-white border-neutral-300 text-neutral-700 focus:ring-neutral-200"
            }`,
        select: `w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all appearance-none cursor-pointer ${isDark
            ? "bg-neutral-900 border-neutral-700 text-white focus:ring-neutral-800"
            : "bg-white border-neutral-300 text-neutral-700 focus:ring-neutral-200"
            }`,
        footer: `p-4 border-t shrink-0 flex justify-end transition-colors ${isDark ? "border-neutral-800" : "border-neutral-200 bg-white"
            }`,
        saveButton: `flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${isDark ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
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
                <h2 className={styles.title}>Preferenze</h2>
                <p className={styles.subtitle}>Personalizza l'aspetto e lo stile dell'applicazione.</p>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                {/* Theme Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <PaintBrush size={18} className={isDark ? "text-neutral-500" : "text-neutral-600"} />
                        <h3 className={styles.sectionTitle}>Aspetto</h3>
                    </div>

                    <div className={styles.card}>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className={styles.label}>Tema dell'interfaccia</label>
                                <p className={styles.description}>Scegli se visualizzare l'app in modalità chiara o scura.</p>
                            </div>

                            <div className="relative">
                                <SelectPopup
                                    value={selectedTheme}
                                    onChange={(value) => setSelectedTheme(value)}
                                    options={[
                                        { value: "light", label: "Chiaro (Light)" },
                                        { value: "light-beige", label: "Chiaro (Beige)" },
                                        { value: "dark", label: "Scuro (Dark)" },
                                        { value: "system", label: "Sistema" }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <hr className={`border-neutral-100 ${isDark ? "border-neutral-800" : "border-neutral-100"}`} />

                {/* Typography Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <TextT size={18} className={isDark ? "text-neutral-500" : "text-neutral-600"} />
                        <h3 className={styles.sectionTitle}>Tipografia</h3>
                    </div>

                    <div className="space-y-4">
                        <div className={`flex p-4 flex-col gap-2 rounded-lg border ${isDark ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-neutral-50"}`}>
                            <label className={styles.label}>Font Family</label>
                            <p className={styles.description}>Seleziona il carattere principale per la lettura.</p>
                            <div className="relative mt-1">
                                <SelectPopup
                                    value={fontFamily}
                                    onChange={(value) => setFontFamily(value)}
                                    options={[
                                        { value: "domine", label: "Domine (Serif)" },
                                        { value: "comic-neue", label: "Comic Neue (Cursive)" },
                                        { value: "overlock", label: "Overlock (Cursive)" },
                                        { value: "poppins", label: "Poppins" },
                                        { value: "roboto", label: "Roboto" },
                                        { value: "merriweather", label: "Merriweather" }
                                    ]}
                                />
                            </div>
                            {/* Preview Area */}
                            <div className={`mt-4 p-4 rounded-lg border border-dashed ${isDark ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-neutral-50"}`}>
                                <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Anteprima:</p>
                                <p
                                    className={`mt-2 text-lg ${fontFamily === "domine" ? "f-domine" :
                                            fontFamily === "comic-neue" ? "f-comic" :
                                                fontFamily === "overlock" ? "f-overlock" :
                                                    fontFamily === "poppins" ? "f-poppins" :
                                                        fontFamily === "roboto" ? "f-roboto" :       // Assumendo che la classe sia f-roboto
                                                            fontFamily === "merriweather" ? "f-merriweather" : // Assumendo che la classe sia f-merriweather
                                                                ""
                                        }`}
                                >
                                    L'eleganza non è farsi notare, ma farsi ricordare.
                                </p>
                            </div>
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
                    <FloppyDisk size={18} />
                    {saving ? "Salvataggio..." : "Salva Preferenze"}
                </button>
            </div>


        </div>
    );
};

export default PreferencesPage;