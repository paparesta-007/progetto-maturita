import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import supabase from "../library/supabaseclient"; // Assicurati che il percorso sia corretto
import getInstructions from "../services/supabase/User/getInstructions";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userInstructions, setUserInstructions] = useState<any>(null); // Per tenere traccia delle istruzioni personalizzate
    const [tone, setTone] = useState("default");
    const [allowedCustomInstructions, setAllowedCustomInstructions] = useState(true);
    const [experimental, setExperimental] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [personalInfo, setPersonalInfo] = useState({
        name: "",
        job: "",
        hobbies: ""
    });
    useEffect(() => {
        // 1. Controllo iniziale: Vediamo se c'è già una sessione attiva al caricamento
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error("Errore nel recupero sessione:", error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // 2. Ascoltatore (Listener): Reagisce a Login, Logout, ecc. in tempo reale
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });
        const fetchInstructions = async () => {
            setLoading(true);
            if (!user) return;
            const data = await getInstructions(user.id);
            if (data && data.instructions) {
                setTone(data.instructions.tone || "default");
                setAllowedCustomInstructions(data.instructions.allowedCustomInstructions || false);
                setSystemPrompt(data.instructions.systemPrompt || "");
                setPersonalInfo(data.instructions.personalInfo || { name: "", job: "", hobbies: "" });
            }
            setLoading(false);
        }
        fetchInstructions();
        return () => subscription.unsubscribe();
    }, []);

    return (
        // Passo sia 'user' che 'session', spesso utile per fare chiamate al DB
        <AuthContext.Provider value={{ user, session, loading, tone, allowedCustomInstructions, experimental, systemPrompt, personalInfo, setTone, setAllowedCustomInstructions, setSystemPrompt, setPersonalInfo }}>
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