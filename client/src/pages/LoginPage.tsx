import { Telescope } from "lucide-react";
import React, { useState, useEffect } from "react";
import  supabase  from "../library/supabaseclient"; // Assicurati che questo import sia corretto
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const { session, loading } = useAuth();
    const navigate = useNavigate();

    // Stati per il form
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // Stato per cambiare tra Login e Sign Up
    const [isSignUp, setIsSignUp] = useState(false); 
    
    const [error, setError] = useState("");
    const [loadingAuth, setLoadingAuth] = useState(false); // Caricamento durante il click del bottone

    const socialButtonStyle = "flex items-center justify-center border border-neutral-200 rounded-lg p-3 w-full mt-3 transition-colors hover:bg-neutral-50 active:scale-[0.98]";

    // Reindirizza se l'utente è già loggato
    useEffect(() => {
        if (!loading && session?.user) {
            navigate("/app");
        }
    }, [session, loading, navigate]);

    // Funzione unica per Login e Registrazione
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoadingAuth(true);

        try {
            if (isSignUp) {
                // LOGICA REGISTRAZIONE (SIGN UP)
                if (password !== confirmPassword) {
                    setError("Le password non coincidono.");
                    setLoadingAuth(false);
                    return;
                }

                const { error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                
                alert("Registrazione avvenuta! Controlla la tua email per confermare.");
                setIsSignUp(false); // Torna al login

            } else {
                // LOGICA LOGIN
                const { error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                navigate("/app");
            }
        } catch (err: any) {
            setError(err.message || "Si è verificato un errore.");
        } finally {
            setLoadingAuth(false);
        }
    };

    const handleGoogleLogin = async () => {
        // PER ORA VUOTO COME RICHIESTO
        console.log("Login con Google non ancora implementato");
    };

    const handleGitHubLogin = () => { 
        console.log("Login con Github non ancora implementato");
    };

    return (
        <div className="border border-neutral-200 text-neutral-900 p-6 max-w-md mx-auto mt-20 rounded-lg shadow-sm bg-white">
            
            {/* Logo e Home Link */}
            <div className="fixed top-4 left-4 flex items-center gap-2 cursor-pointer"
                onClick={() => window.location.href = "/"}>
                <Telescope className="bg-neutral-900 text-white p-2 rounded-md" size={32} />
                <span className="text-neutral-900 font-semibold text-lg">SmartAI</span>
            </div>

            <h1 className="text-2xl font-semibold mb-2">
                {isSignUp ? "Create an account" : "Welcome back!"}
            </h1>
            <p className="mb-6 text-neutral-500 text-sm">
                {isSignUp 
                    ? "Enter your details to create your workspace." 
                    : "You are a step away from logging in to your account."}
            </p>

            {/* Messaggio di Errore */}
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <div>
                    <input
                        type="email"
                        required
                        className="border border-neutral-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        required
                        className="border border-neutral-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                
                {/* Campo Conferma Password (visibile solo in Sign Up) */}
                {isSignUp && (
                    <div>
                        <input
                            type="password"
                            required
                            className="border border-neutral-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                )}

                <button 
                    disabled={loadingAuth}
                    className="bg-neutral-900 text-white py-3 hover:bg-neutral-800 transition-all px-4 rounded-md mt-2 w-full disabled:opacity-50">
                    {loadingAuth ? "Processing..." : (isSignUp ? "Sign Up" : "Login")}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-200"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-neutral-500">Oppure continua con</span></div>
            </div>

            <div className="space-y-2">
                <button className={socialButtonStyle} onClick={handleGitHubLogin}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/250px-GitHub_Invertocat_Logo.svg.png" alt="" className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">GitHub</span>
                </button>

                <button className={socialButtonStyle} onClick={handleGoogleLogin}>
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s" alt="" className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">Google</span>
                </button>
            </div>

            {/* Toggle Link tra Login e Sign Up */}
            <p className="mt-4 text-center text-sm text-neutral-600">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button 
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError(""); // Resetta errori quando cambi modalità
                    }} 
                    className="text-neutral-900 font-semibold hover:underline bg-transparent border-none cursor-pointer">
                    {isSignUp ? "Login" : "Sign up"}
                </button>
            </p>
        </div>
    )
}

export default LoginPage;