import React, { useState } from "react";
import supabase from "../library/supabaseclient";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, ArrowRight, Loader2, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

/* ─── Premium Auth Styles ─── */
const AuthStyles = () => (
    <style>{`
        .auth-page {
            min-height: 100vh;
            position: relative;
            overflow: hidden;
        }
        .auth-page::before {
            content: '';
            position: absolute;
            inset: 0;
            opacity: 0.025;
            background-image:
                linear-gradient(#171717 1px, transparent 1px),
                linear-gradient(90deg, #171717 1px, transparent 1px);
            background-size: 64px 64px;
            pointer-events: none;
        }
        .auth-orb-1 {
            position: absolute;
            width: 600px;
            height: 600px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%);
            top: -200px;
            right: -100px;
            pointer-events: none;
        }
        .auth-orb-2 {
            position: absolute;
            width: 500px;
            height: 500px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%);
            bottom: -150px;
            left: -100px;
            pointer-events: none;
        }
        .input-premium {
            transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .input-premium:focus {
            transform: translateY(-0.5px);
        }
        .social-btn-premium {
            transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .social-btn-premium:hover {
            transform: translateY(-1px);
        }
        .social-btn-premium:active {
            transform: translateY(0);
        }
        .auth-card-premium {
            box-shadow:
                0 1px 2px rgba(0,0,0,0.03),
                0 4px 8px rgba(0,0,0,0.03),
                0 16px 32px rgba(0,0,0,0.04),
                0 32px 64px rgba(0,0,0,0.02);
        }
    `}</style>
);

const LoginPage = () => {
    const { session, loading } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <Loader2 size={20} className="animate-spin text-neutral-600" />
            </div>
        );
    }

    if (session?.user) {
        return <Navigate to="/app/chat" replace />;
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoadingAuth(true);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    setError("Le password non coincidono.");
                    setLoadingAuth(false);
                    return;
                }
                if (password.length < 6) {
                    setError("La password deve avere almeno 6 caratteri.");
                    setLoadingAuth(false);
                    return;
                }
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert("Registrazione avvenuta! Controlla la tua email per confermare.");
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate("/app/chat");
            }
        } catch (err: any) {
            setError(err.message || "Si è verificato un errore.");
        } finally {
            setLoadingAuth(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        const { data,error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/app/chat`,
                scopes: 'https://www.googleapis.com/auth/calendar.events',
            },
         
        });

        if (error) {
            setError(error.message || "Si è verificato un errore durante il login con Google.");
        }
    };

    const handleGitHubLogin = async () => {
        setError("");
        const { data,error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/app/chat`,
            },
        
        });

        if (error) {
            setError(error.message || "Si è verificato un errore durante il login con GitHub.");
        }
    };

    const handleForgotPassword = async () => {
        setError("");

        if (!email) {
            setError("Inserisci prima la tua email per ricevere il link di reset.");
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message || "Errore durante l'invio dell'email di reset.");
            return;
        }

        alert("Ti abbiamo inviato un link per creare una nuova password.");
    };

    // ─── Transition Variants ───
    const formVariants = {
        hidden: { opacity: 0, y: 6 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
    };

    return (
        <>
            <AuthStyles />
            <div className="auth-page bg-[#fafafa] flex flex-col">
                <div className="auth-orb-1" />
                <div className="auth-orb-2" />

                {/* ─── Navbar ─── */}
                <nav className="relative z-10 w-full px-6 py-5">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-neutral-900 text-white flex items-center justify-center rounded-lg shadow-md shadow-neutral-900/20 transition-transform duration-300 group-hover:scale-105">
                                <BrainCircuit size={17} />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-neutral-900">NeuralTrust</span>
                        </Link>
                        <Link
                            to="/"
                            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors "
                        >
                            ← Torna alla home
                        </Link>
                    </div>
                </nav>

                {/* ─── Main Content ─── */}
                <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-[420px]"
                    >
                        <div className="auth-card-premium bg-white rounded-2xl ring-1 ring-black/[0.06] overflow-hidden">

                            {/* ─── Header ─── */}
                            <div className="px-8 pt-10 pb-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isSignUp ? 'signup' : 'login'}
                                        variants={formVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.2 }}
                                    >
                                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                                            {isSignUp ? "Crea il tuo account" : "Bentornato"}
                                        </h1>
                                        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                                            {isSignUp
                                                ? "Inserisci i tuoi dati per creare il tuo workspace."
                                                : "Accedi al tuo workspace per continuare."
                                            }
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* ─── Social Buttons ─── */}
                            <div className="px-8 pt-7">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        className="social-btn-premium flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl ring-1 ring-black/[0.06] bg-white hover:bg-neutral-50 hover:ring-black/[0.1]"
                                        onClick={handleGitHubLogin}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-neutral-900">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        <span className="text-[13px] font-semibold text-neutral-700">GitHub</span>
                                    </button>

                                    <button
                                        className="social-btn-premium flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl ring-1 ring-black/[0.06] bg-white hover:bg-neutral-50 hover:ring-black/[0.1]"
                                        onClick={handleGoogleLogin}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span className="text-[13px] font-semibold text-neutral-700">Google</span>
                                    </button>
                                </div>
                            </div>

                            {/* ─── Divider ─── */}
                            <div className="px-8 my-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-300">
                                            oppure
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ─── Error ─── */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="px-8"
                                    >
                                        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50/80 ring-1 ring-red-100 mb-5">
                                            <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-[13px] text-red-600 leading-relaxed">{error}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ─── Form ─── */}
                            <form onSubmit={handleAuth} className="px-8 pb-8">
                                <div className="flex flex-col gap-3.5">

                                    {/* Email */}
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" />
                                        <input
                                            type="email"
                                            required
                                            className="input-premium w-full pl-10 pr-4 py-3 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-600 bg-neutral-50/80 ring-1 ring-black/[0.06] outline-none focus:ring-black/[0.12]"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="input-premium w-full pl-10 pr-11 py-3 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-600 bg-neutral-50/80 ring-1 ring-black/[0.06] outline-none focus:ring-black/[0.12]"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>

                                    {/* Confirm Password (Sign Up only) */}
                                    <AnimatePresence>
                                        {isSignUp && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                                className="relative overflow-hidden"
                                            >
                                                <div className="relative">
                                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" />
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        required
                                                        className="input-premium w-full pl-10 pr-11 py-3 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-600 bg-neutral-50/80 ring-1 ring-black/[0.06] outline-none focus:ring-black/[0.12] focus:bg-white"
                                                        placeholder="Conferma Password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Forgot Password (Login only) */}
                                    {!isSignUp && (
                                        <div className="flex justify-end -mt-1">
                                            <button
                                                type="button"
                                                onClick={handleForgotPassword}
                                                className="text-[12px] font-medium text-neutral-600 hover:text-neutral-700 transition-colors"
                                            >
                                                Password dimenticata?
                                            </button>
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <motion.button
                                        type="submit"
                                        disabled={loadingAuth}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-[13px] font-semibold transition-all duration-300 mt-1 ${loadingAuth
                                            ? "bg-neutral-900 text-white opacity-60 cursor-not-allowed"
                                            : "bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/15 active:bg-neutral-700"
                                            }`}
                                    >
                                        {loadingAuth ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                <span>Attendere…</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{isSignUp ? "Crea Account" : "Accedi"}</span>
                                                <ArrowRight size={15} />
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </div>

                        {/* ─── Toggle Link ─── */}
                        <p className="mt-6 text-center text-[13px] text-neutral-600">
                            {isSignUp ? "Hai già un account?" : "Non hai un account?"}{" "}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError("");
                                    setPassword("");
                                    setConfirmPassword("");
                                }}
                                className="text-neutral-900 font-semibold hover:underline underline-offset-2 bg-transparent border-none cursor-pointer transition-colors"
                            >
                                {isSignUp ? "Accedi" : "Registrati"}
                            </button>
                        </p>

                        {/* ─── Footer Note ─── */}
                        <p className="mt-4 text-center text-[11px] text-neutral-300 leading-relaxed px-4">
                            Continuando, accetti i nostri{" "}
                            <a href="#" className="underline underline-offset-2 hover:text-neutral-500 transition-colors">Termini di Servizio</a>
                            {" "}e la{" "}
                            <a href="#" className="underline underline-offset-2 hover:text-neutral-500 transition-colors">Privacy Policy</a>.
                        </p>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;