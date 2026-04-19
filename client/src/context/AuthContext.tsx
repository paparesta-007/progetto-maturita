import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import supabase from "../library/supabaseclient"; // Assicurati che il percorso sia corretto
import getInstructions from "../services/supabase/User/getInstructions";
import getUserPreferences from "../services/supabase/User/getUserPreferences";

interface AuthContextType {
    user: User | null;
    session: Session | null; // Utile aggiungerlo con Supabase
    loading: boolean;
    tone: string;
    allowedCustomInstructions: boolean;
    experimental: boolean;
    systemPrompt: string;
    personalInfo: {
        name: string;
        job: string;
        hobbies: string;
    };
    setTone: React.Dispatch<React.SetStateAction<string>>;
    setAllowedCustomInstructions: React.Dispatch<React.SetStateAction<boolean>>;
    setSystemPrompt: React.Dispatch<React.SetStateAction<string>>;
    setPersonalInfo: React.Dispatch<React.SetStateAction<{ name: string; job: string; hobbies: string }>>;
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    stylePreferences: any;
    setStylePreferences: React.Dispatch<React.SetStateAction<any>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("theme");
            if (stored === "dark" || stored === "light") return stored;
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return "dark";
            }
        }
        return "light";
    });
    // Stati delle istruzioni
    const [tone, setTone] = useState("default");
    const [allowedCustomInstructions, setAllowedCustomInstructions] = useState(true);
    const [experimental, setExperimental] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [personalInfo, setPersonalInfo] = useState({ name: "", job: "", hobbies: "" });
    const [stylePreferences, setStylePreferences] = useState({})

    // Theme initialization is now handled by the state initializer above.

    useEffect(() => {
        const root = window.document.documentElement;
        localStorage.setItem("theme", theme);

        if (theme === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }
    }, [theme]);

    // 1. EFFETTO PER L'AUTENTICAZIONE
    useEffect(() => {
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            const googleAccessToken = session?.provider_token;
            const googleRefreshToken = session?.provider_refresh_token;
            console.log("Access Token Google:", googleAccessToken);
            console.log("Refresh Token Google:", googleRefreshToken);
            setUser(session?.user ?? null);
            setLoading(false);
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);
    // 2. EFFETTO PER IL CARICAMENTO ISTRUZIONI (Reagisce al cambio di user)
    useEffect(() => {
        const fetchInstructions = async () => {
            if (!user?.id) return; // Se non c'è l'utente, non fare nulla

            try {
                // Opzionale: puoi mettere un piccolo stato di loading specifico per i dati
                const data = await getInstructions(user.id);

                if (data && data.instructions) {
                    const instructions = typeof data.instructions === 'string' ? JSON.parse(data.instructions) : data.instructions;
                    if (instructions) {
                        setTone(instructions.tone || "default");
                        setAllowedCustomInstructions(instructions.allowedCustomInstructions ?? false);
                        setSystemPrompt(instructions.systemPrompt || "");
                        setPersonalInfo(instructions.personalInfo || { name: "", job: "", hobbies: "" });
                    }
                }
            } catch (error) {
                console.error("Errore caricamento istruzioni:", error);
            }
        };
        const fetchPreferences = async () => {
            if (!user?.id) return; // Se non c'è l'utente, non fare nulla

            try {
                // Opzionale: puoi mettere un piccolo stato di loading specifico per i dati
                const data = await getUserPreferences(user.id);

                if (data && data.preferences) {
                    const preferences = typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences;
                    setStylePreferences(preferences);
                    console.log("Preferenze: ", preferences);
                }
            } catch (error) {
                console.error("Errore caricamento preferenze:", error);
            }
        }
        fetchInstructions();
        fetchPreferences();
    }, [user?.id]); // <--- FONDAMENTALE: Riesegui quando l'ID utente cambia

    return (
        <AuthContext.Provider value={{
            user, session, loading, tone, allowedCustomInstructions,
            experimental, systemPrompt, personalInfo,
            setTone, setAllowedCustomInstructions, setSystemPrompt, setPersonalInfo, theme, setTheme, stylePreferences, setStylePreferences
        }}>
            {/* Mostriamo i children solo quando il check iniziale della sessione è finito.
               Se vuoi che i dati siano pronti prima di mostrare l'app, 
               potresti aver bisogno di un secondo stato di loading.
            */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth deve essere usato all'interno di AuthProvider");
    }
    return context;
};