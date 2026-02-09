import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import selectUserDetails from '../services/supabase/User/SelectuserDetails';

const ProtectedRoute = () => {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    
    // Stati per gestire il controllo asincrono del database
    const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
    const [checkingProfile, setCheckingProfile] = useState(true);

    useEffect(() => {
        // 1. Se l'auth sta ancora caricando o non c'è user, aspettiamo
        if (authLoading) return;
        
        if (!user) {
            setCheckingProfile(false);
            return;
        }

        const checkUserProfile = async () => {
            try {
                // Recuperiamo i dati dal DB
                const data = await selectUserDetails(user.id);
                
                // 2. LOGICA RIGIDA: Il profilo è completo SOLO se ha sia nome che compleanno
                const hasName = !!data?.full_name;
                const hasBirthday = !!data?.birthday;
                
                // Aggiorniamo lo stato
                setIsProfileComplete(hasName && hasBirthday);
            } catch (error) {
                console.error("Errore controllo profilo", error);
                setIsProfileComplete(false); // In caso di errore, assumiamo incompleto
            } finally {
                setCheckingProfile(false);
            }
        };

        checkUserProfile();

    }, [user, authLoading]); // Rimuovi 'location' dalle dipendenze per evitare loop infiniti

    // --- LOGICA DI RENDER ---

    // 1. Stiamo caricando l'auth o stiamo controllando il DB? Mostra niente (o uno spinner)
    if (authLoading || (user && checkingProfile)) {
        return null; // O <LoadingSpinner />
    }

    // 2. Utente non loggato -> Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isCompleteProfileRoute = location.pathname === '/complete-profile';

    // 3. Profilo INCOMPLETO e non siamo già nella pagina di completamento -> Vai a completare
    if (!isProfileComplete && !isCompleteProfileRoute) {
        return <Navigate to="/complete-profile" replace />;
    }

    // 4. Profilo COMPLETO e siamo nella pagina di completamento -> Vai all'app (inutile stare qui)
    if (isProfileComplete && isCompleteProfileRoute) {
        return <Navigate to="/app" replace />;
    }

    // 5. Tutto ok -> Renderizza la pagina richiesta
    return <Outlet />;
}

export default ProtectedRoute;