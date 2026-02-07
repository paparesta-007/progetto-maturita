import React, {useState,useEffect} from "react";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Zap,
    FileText,
    MessageSquare,
    Check,
    Menu,
    X,
    Layers,
    ArrowRight,
    Minus,
    Calendar,
    Mail,
    Search,
    BrainCircuit,
    Lock,
    Server,
    Database,
    EyeOff,
    User
} from 'lucide-react';
import { Link, redirect } from "react-router-dom";

/* --- Fonts & Global Styles Injection --- */
const GlobalStyles = () => (
    <style>{`
  
  `}</style>
);

/* --- Utility Components --- */

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

const Button = ({ children, variant = "primary", className = "", icon = false, onClick }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string; icon?: boolean; onClick?: () => void })    => {
    const baseStyle = "px-6 py-3 rounded-md font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border";

    const variants = {
        primary: "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800",
        secondary: "bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50",
        ghost: "bg-transparent text-neutral-600 border-transparent hover:text-neutral-900 hover:bg-neutral-100"
    };

    return (
        <button className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick}>
            {children}
            {icon && <ArrowRight size={16} />}
        </button>
    );
};

/* --- Main Sections --- */

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-sm border-b border-neutral-200 py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-900 text-white flex items-center justify-center rounded-sm">
                        <BrainCircuit size={18} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-neutral-900">NeuralTrust</span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {["Features", "Workflow", "Privacy", "Pricing"].map((item) => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                            {item}
                        </a>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-neutral-900">Log in</Link>
                    <Button variant="primary" className="!py-2 !px-4"
                    onClick={() => {window.location.href = "/app"}}>Get Started</Button>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-neutral-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-neutral-200 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            <a href="#features" className="text-lg font-medium text-neutral-900">Features</a>
                            <a href="#workflow" className="text-lg font-medium text-neutral-900">Workflow</a>
                            <a href="#privacy" className="text-lg font-medium text-neutral-900">Privacy</a>
                            <a href="#pricing" className="text-lg font-medium text-neutral-900">Pricing</a>
                            <hr className="border-neutral-100" />
                            <Button variant="secondary" className="w-full justify-center">Log in</Button>
                            <Button variant="primary" className="w-full justify-center">Get Started</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

const Hero = () => {
    return (
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-grid">
            <div className="max-w-6xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <FadeIn className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-full text-neutral-600 text-xs font-semibold mb-8 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Now with GPT-4o & Claude 3.5
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 leading-[1.1] mb-6 tracking-tight">
                        Your Daily <br />
                        AI Workspace.
                    </h1>

                    <p className="text-lg text-neutral-600 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
                        Semplifica la tua routine. Gestisci email, documenti e progetti in un unico posto sicuro.
                        <strong> Privacy inclusa, non un ostacolo.</strong>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <Button variant="primary" className="w-full sm:w-auto h-12 px-8" icon>
                            Inizia Gratis
                        </Button>
                        <Button variant="secondary" className="w-full sm:w-auto h-12 px-8">
                            Guarda Demo
                        </Button>
                    </div>

                    <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-xs text-neutral-500 font-medium">
                        <div className="flex items-center gap-2">
                            <Check size={14} /> Free Forever Plan
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={14} /> No training on your data
                        </div>
                    </div>
                </FadeIn>

                {/* Productivity Visual */}
                <FadeIn delay={0.2} className="relative hidden lg:block">
                    <div className="relative z-20 w-full aspect-[4/3] bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden">
                        {/* Header with Mac-style dots */}
                        <div className="h-12 bg-neutral-50 border-b border-neutral-200 flex items-center px-4 justify-between">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]"></div>
                            </div>
                            <div className="h-2 w-32 bg-neutral-200 rounded-sm"></div>
                        </div>

                        {/* Body */}
                        <div className="p-8 flex gap-8 h-full">
                            <div className="w-16 border-r border-neutral-100 flex flex-col gap-6 items-center pt-2">
                                <div className="w-8 h-8 bg-neutral-900 rounded-md flex items-center justify-center text-white"><MessageSquare size={16} /></div>
                                <div className="w-8 h-8 text-neutral-400 hover:text-neutral-900 transition-colors"><Mail size={16} /></div>
                                <div className="w-8 h-8 text-neutral-400 hover:text-neutral-900 transition-colors"><Calendar size={16} /></div>
                                <div className="w-8 h-8 text-neutral-400 hover:text-neutral-900 transition-colors"><Search size={16} /></div>
                            </div>
                            <div className="flex-1 space-y-6">
                                {/* User Prompt */}
                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-[10px] font-bold text-white">ME</div>
                                    <div className="p-4 bg-white border border-neutral-200 rounded-md text-sm text-neutral-900 shadow-sm">
                                        Riassumi le email di oggi e prepara la to-do list per il meeting delle 15:00.
                                    </div>
                                </div>

                                {/* AI Response */}
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[10px] font-bold">AI</div>
                                    <div className="flex-1 space-y-3">
                                        <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-md text-sm text-neutral-700 leading-relaxed shadow-sm">
                                            <p className="mb-2 font-semibold">Ecco il briefing, Marco:</p>
                                            <ul className="list-disc pl-4 space-y-1 text-neutral-600">
                                                <li><strong>Email Clienti:</strong> 3 nuove richieste di preventivo da approvare.</li>
                                                <li><strong>Team Update:</strong> Giulia ha caricato i design finali su Drive.</li>
                                            </ul>
                                            <div className="mt-4 pt-3 border-t border-neutral-200">
                                                <p className="text-xs font-semibold uppercase text-neutral-400 mb-2">To-Do List (Meeting 15:00)</p>
                                                <div className="flex items-center gap-2 text-neutral-800">
                                                    <div className="w-4 h-4 border border-neutral-300 rounded"></div>
                                                    Review design di Giulia
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-800 mt-1">
                                                    <div className="w-4 h-4 border border-neutral-300 rounded"></div>
                                                    Approvare preventivi
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subtle Back Element */}
                    <div className="absolute -bottom-6 -right-6 w-full h-full border border-neutral-200 rounded-lg -z-10 bg-neutral-50/50"></div>
                </FadeIn>
            </div>
        </section>
    );
};

const TrustBar = () => {
    return (
        <div className="py-20 border-y border-neutral-100 bg-white">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-12">Scelto dai team più produttivi</p>
                <div className="flex flex-wrap justify-center gap-16 items-center opacity-40 grayscale">
                    {["Notion", "Linear", "Vercel", "Shopify", "Intercom"].map((company, i) => (
                        <span key={i} className="text-xl md:text-2xl font-bold text-neutral-800 font-sans tracking-tight">
                            {company}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Features = () => {
    return (
        <section id="features" className="py-36 bg-white">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-24">
                    <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6 tracking-tight">Your Routine, Supercharged.</h2>
                    <p className="text-neutral-500 text-lg max-w-2xl font-light">
                        Tutti gli strumenti di cui hai bisogno per eliminare il lavoro ripetitivo e concentrarti su ciò che conta.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
                    {/* Card 1 */}
                    <div className="bg-white p-12 hover:bg-neutral-50 transition-colors group">
                        <Calendar className="text-neutral-900 mb-8 group-hover:text-emerald-600 transition-colors" size={32} strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Smart Agenda</h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            Collega il tuo calendario. L'AI organizza i tuoi meeting, prepara i briefing e ti ricorda le scadenze importanti.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-12 hover:bg-neutral-50 transition-colors group">
                        <Layers className="text-neutral-900 mb-8 group-hover:text-emerald-600 transition-colors" size={32} strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Knowledge Base</h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            Carica PDF, Docx e link. NeuralTrust diventa la tua enciclopedia aziendale personale, pronta a rispondere a tutto.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-12 hover:bg-neutral-50 transition-colors group">
                        <Mail className="text-neutral-900 mb-8 group-hover:text-emerald-600 transition-colors" size={32} strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Email Pilot</h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            Scrivi bozze in secondi, riassumi thread infiniti ed estrai action item automaticamente dalle tue email.
                        </p>
                    </div>

                    {/* Card 4 - Still Keeping Privacy Relevant */}
                    <div className="bg-white p-12 hover:bg-neutral-50 transition-colors group">
                        <Lock className="text-neutral-900 mb-8 group-hover:text-emerald-600 transition-colors" size={32} strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Private Workspace</h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            I tuoi dati sono tuoi. Niente viene usato per il training dei modelli. Isolamento garantito per ogni utente.
                        </p>
                    </div>

                    {/* Card 5 */}
                    <div className="bg-white p-12 hover:bg-neutral-50 transition-colors group">
                        <Zap className="text-neutral-900 mb-8 group-hover:text-emerald-600 transition-colors" size={32} strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Fast Actions</h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            Scorciatoie da tastiera per ogni cosa. Crea task, cerca documenti e lancia comandi senza toccare il mouse.
                        </p>
                    </div>

                    {/* Card 6 */}
                    <div className="bg-white p-12 hover:bg-neutral-50 transition-colors flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Integrazioni</h3>
                        <p className="text-neutral-500 text-sm mb-6">
                            Google Drive, Slack, Notion e molto altro. NeuralTrust si connette dove lavori tu.
                        </p>
                        <a href="#" className="text-neutral-900 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                            Vedi tutte <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

const PrivacySection = () => {
    return (
        <section id="privacy" className="py-24 bg-neutral-50 border-t border-neutral-200 overflow-hidden relative">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6 tracking-tight">
                            Non vogliamo i tuoi dati. <br />
                            <span className="text-neutral-400">Davvero.</span>
                        </h2>
                        <p className="text-lg text-neutral-600 mb-8 leading-relaxed font-light">
                            La maggior parte delle AI impara da te. Noi no.
                            I tuoi dati vengono salvati in modo sicuro solo per essere a tua disposizione.
                            <strong> Nessun training sui tuoi messaggi. Nemmeno noi possiamo leggerli.</strong>
                        </p>
                        <ul className="space-y-4">
                            {[
                                "I dati sono salvati per la TUA cronologia, non per i nostri modelli",
                                "Accesso bloccato al nostro team tecnico (Zero-Trust)",
                                "Crittografia End-to-End di default"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-neutral-800 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-emerald-600 shadow-sm">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </FadeIn>

                    {/* Visual Animation Diagram */}
                    <FadeIn delay={0.2} className="relative">
                        <div className="bg-white rounded-xl border border-neutral-200 p-8 md:p-12 shadow-sm relative overflow-hidden">

                            <div className="flex flex-col gap-6 relative z-10">

                                {/* 1. The Secure Path */}
                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center border border-neutral-200 text-neutral-900">
                                            <User size={20} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase text-neutral-400">Tu</span>
                                    </div>

                                    {/* Connection Line */}
                                    <div className="flex-1 h-px bg-neutral-200 mx-4 relative overflow-hidden">
                                        <motion.div
                                            animate={{ x: [-100, 200] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-full opacity-50"
                                        />
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-emerald-600 relative shadow-sm">
                                            <Database size={20} />
                                            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white">
                                                <Lock size={8} className="text-white" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase text-emerald-600">Secure DB</span>
                                    </div>
                                </div>

                                {/* 2. The Blocked Paths */}
                                <div className="relative pl-16">
                                    {/* Vertical Line from DB (conceptual) - Visualized as separate blocks */}

                                    {/* Blocked Path: Training */}
                                    <div className="flex items-center justify-between opacity-70 mt-4">
                                        <div className="w-8 h-px bg-neutral-200"></div>
                                        <div className="flex-1 border-t border-dashed border-neutral-300 mx-2 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                <X size={14} className="text-red-500" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-200 text-neutral-400">
                                                <BrainCircuit size={16} />
                                            </div>
                                            <span className="text-[9px] font-bold uppercase text-neutral-400">AI Training</span>
                                        </div>
                                    </div>

                                    {/* Blocked Path: Staff */}
                                    <div className="flex items-center justify-between opacity-70 mt-4">
                                        <div className="w-8 h-px bg-neutral-200"></div>
                                        <div className="flex-1 border-t border-dashed border-neutral-300 mx-2 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                <X size={14} className="text-red-500" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-200 text-neutral-400">
                                                <EyeOff size={16} />
                                            </div>
                                            <span className="text-[9px] font-bold uppercase text-neutral-400">Staff Access</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-between items-center">
                                <div className="text-xs text-neutral-500">
                                    <span className="block font-bold text-neutral-900">Dati Criptati a Riposo</span>
                                    AES-256 + Chiavi Gestite dall'Utente
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full border border-emerald-100">
                                    Verified Secure
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

const Pricing = () => {
    return (
        <section id="pricing" className="py-36 bg-white border-t border-neutral-100">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-24">
                    <h2 className="text-3xl font-bold text-neutral-900 mb-4 tracking-tight">Investi nella tua produttività.</h2>
                    <p className="text-neutral-500 text-lg font-light">Piani semplici che scalano con le tue ambizioni.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {/* Free Plan */}
                    <div className="p-8 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors flex flex-col">
                        <div className="text-sm font-semibold text-neutral-900 mb-2">Free</div>
                        <div className="text-4xl font-bold text-neutral-900 mb-6">€0<span className="text-sm font-normal text-neutral-500">/mo</span></div>
                        <p className="text-neutral-500 text-sm mb-8">Perfetto per organizzare la routine personale.</p>
                        <Button variant="secondary" className="w-full mb-8">Crea Account</Button>
                        <ul className="space-y-4 text-sm text-neutral-600 flex-1">
                            <li className="flex gap-2"><Check size={16} /> Assistente Chat Base</li>
                            <li className="flex gap-2"><Check size={16} /> 5 Upload Documenti/giorno</li>
                            <li className="flex gap-2"><Check size={16} /> Integrazione Calendario (Read-only)</li>
                            <li className="flex gap-2 text-neutral-400"><Minus size={16} /> No Email Assistant</li>
                        </ul>
                    </div>

                    {/* Pro */}
                    <div className="p-8 border-2 border-neutral-900 rounded-lg relative bg-neutral-50 flex flex-col shadow-lg">
                        <div className="absolute top-0 right-0 left-0 bg-neutral-900 text-white text-[10px] font-bold text-center py-1 rounded-t-sm uppercase tracking-widest">Consigliato</div>
                        <div className="text-sm font-semibold text-neutral-900 mb-2 mt-4">Pro</div>
                        <div className="text-4xl font-bold text-neutral-900 mb-6">€20<span className="text-sm font-normal text-neutral-500">/mo</span></div>
                        <p className="text-neutral-500 text-sm mb-8">Per freelance e professionisti.</p>
                        <Button variant="primary" className="w-full mb-8">Attiva Pro</Button>
                        <ul className="space-y-4 text-sm text-neutral-900 font-medium flex-1">
                            <li className="flex gap-2"><Check size={16} /> Modelli Avanzati (GPT-4o)</li>
                            <li className="flex gap-2"><Check size={16} /> Upload Illimitati</li>
                            <li className="flex gap-2"><Check size={16} /> Smart Agenda & Email Pilot</li>
                            <li className="flex gap-2"><Check size={16} /> Knowledge Base Personale</li>
                        </ul>
                    </div>

                    {/* Team */}
                    <div className="p-8 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors flex flex-col">
                        <div className="text-sm font-semibold text-neutral-900 mb-2">Team</div>
                        <div className="text-4xl font-bold text-neutral-900 mb-6">€49<span className="text-sm font-normal text-neutral-500">/user</span></div>
                        <p className="text-neutral-500 text-sm mb-8">Per collaborare sui progetti.</p>
                        <Button variant="secondary" className="w-full mb-8">Contatta Sales</Button>
                        <ul className="space-y-4 text-sm text-neutral-600 flex-1">
                            <li className="flex gap-2"><Check size={16} /> Workspace Condivisi</li>
                            <li className="flex gap-2"><Check size={16} /> Gestione Ruoli & Permessi</li>
                            <li className="flex gap-2"><Check size={16} /> Fatturazione Centralizzata</li>
                            <li className="flex gap-2"><Check size={16} /> Supporto Prioritario</li>
                        </ul>
                    </div>
                </div>

                {/* Enterprise Callout */}
                <div className="bg-neutral-900 text-white rounded-lg p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Sei un'azienda Enterprise?</h3>
                        <p className="text-neutral-400 text-sm max-w-lg">
                            Offriamo deployment su Cloud Privato (VPC), SSO, Audit Logs e conformità GDPR avanzata per grandi organizzazioni.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Button variant="secondary" className="border-none bg-white text-neutral-900 hover:bg-neutral-200">
                            Parla con noi
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-white border-t border-neutral-200 pt-24 pb-12">
            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-24">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-6 h-6 bg-neutral-900 rounded-sm flex items-center justify-center text-white">
                            <BrainCircuit size={14} />
                        </div>
                        <span className="text-base font-bold text-neutral-900 tracking-tight">NeuralTrust</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-6 leading-relaxed max-w-xs">
                        Il tuo assistente quotidiano. <br />Made in Milan, Italy.
                    </p>
                </div>

                {[
                    { title: "Prodotto", links: ["Features", "Download App", "Integrazioni", "Changelog"] },
                    { title: "Risorse", links: ["Guide", "Community", "Help Center", "Blog"] },
                    { title: "Legale", links: ["Privacy Policy", "Termini", "Cookie", "Sicurezza"] }
                ].map((col, idx) => (
                    <div key={idx}>
                        <h4 className="text-neutral-900 font-semibold text-sm mb-6">{col.title}</h4>
                        <ul className="space-y-4 text-sm text-neutral-500">
                            {col.links.map(link => (
                                <li key={link}><a href="#" className="hover:text-neutral-900 transition-colors">{link}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-400">
                <p>&copy; {new Date().getFullYear()} NeuralTrust Inc.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <span className="flex items-center gap-2 text-neutral-900"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> All systems operational</span>
                </div>
            </div>
        </footer>
    );
};

const LandingPage: React.FC = () => {
    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen">
                <Navbar />
                <Hero />
                <TrustBar />
                <Features />
                <PrivacySection />
                <Pricing />
                <Footer />
            </div>
        </>
    );
}

export default LandingPage;