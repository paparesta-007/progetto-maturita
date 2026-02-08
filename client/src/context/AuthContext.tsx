import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import supabase from "../library/supabaseclient"; // Assicurati che il percorso sia corretto

interface AuthContextType {
    user: User | null;
    session: Session | null; // Utile aggiungerlo con Supabase
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

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

        // Cleanup: Rimuove l'ascoltatore quando il componente viene smontato
        return () => subscription.unsubscribe();
    }, []);

    return (
        // Passo sia 'user' che 'session', spesso utile per fare chiamate al DB
        <AuthContext.Provider value={{ user, session, loading }}>
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