import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assumendo che tu abbia un hook personalizzato

const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    if (loading) {
        return <div>Loading...</div>;
    }
    if (!user) {
        // Se non c'è l'utente, reindirizza al login
        return <Navigate to="/login" replace />;
    }

    // Se l'utente esiste, renderizza i figli (le rotte dentro /app)
    return <Outlet />;

}

export default ProtectedRoute