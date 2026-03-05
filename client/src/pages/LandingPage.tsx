import React, { useState, useEffect } from "react";
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
    User,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { Link } from "react-router-dom";
import Tooltip from "../components/other/Tooltip";

/* --- Fonts & Global Styles Injection --- */
const GlobalStyles = () => (
    <style>{`
    @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
    }
    @keyframes pulse-glow {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
    }
    @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    @keyframes infinite-scroll {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
    }
    .animate-infinite-scroll {
        animation: infinite-scroll 25s linear infinite;
    }
    .shimmer-text {
        background: linear-gradient(90deg, #171717 40%, #a3a3a3 50%, #171717 60%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shimmer 3s linear infinite;
    }
    .gradient-border {
        position: relative;
    }
    .gradient-border::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, #d4d4d4, #525252, #d4d4d4);
        background-size: 300% 300%;
        animation: gradient-shift 4s ease infinite;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
    }
    .glass {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
    .glass-dark {
        background: rgba(23, 23, 23, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
    .premium-shadow {
        box-shadow: 
            0 1px 2px rgba(0,0,0,0.04),
            0 4px 8px rgba(0,0,0,0.04),
            0 16px 32px rgba(0,0,0,0.06),
            0 32px 64px rgba(0,0,0,0.04);
    }
    .premium-shadow-lg {
        box-shadow: 
            0 4px 8px rgba(0,0,0,0.04),
            0 8px 16px rgba(0,0,0,0.06),
            0 24px 48px rgba(0,0,0,0.08),
            0 48px 96px rgba(0,0,0,0.06);
    }
    .card-glow:hover {
        box-shadow: 
            0 0 0 1px rgba(82, 82, 82, 0.1),
            0 4px 8px rgba(0,0,0,0.04),
            0 16px 32px rgba(0,0,0,0.06);
    }
    .hero-mesh {
        background: 
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(245, 245, 245, 0.8) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 60%, rgba(229, 229, 229, 0.5) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 50% 20%, rgba(245, 245, 245, 0.6) 0%, transparent 60%);
        background-color: #fafafa;
    }
    `}</style>
);

const logos = [
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7AvKmIcAF9QUdS96opCZooZxVua16crDwkg&s", provider: "Google" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBdcgkdcDy5z4PYGx_kDJB1AvvC_x1pCBbbQ&s", provider: "OpenAI" },
    { img: "https://www.silicon.fr/wp-content/uploads/2025/09/Anthropic-cet-anti-OpenAI-qui-veut-voir-choses-autrement-F.jpg", provider: "Anthropic" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ53JTsKmwYwqgN-wAkAUh9zuhuyTXNcppyTQ&s", provider: "Meta" },
    { img: "https://img.icons8.com/color/512/nvidia.png", provider: "Nvidia" },
    { img: "https://www-cdn.morphcast.com/wp-content/uploads/2025/01/deepseek.jpg.webp", provider: "Deepseek" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNPKTChXqcgiZQIuBJqB143siOoH1jh7ADuQ&s", provider: "Qwen" },
    { img: "https://upload.wikimedia.org/wikipedia/commons/2/25/XAI.svg", provider: "XAI" }
];

/* --- Utility Components --- */

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
    >
        {children}
    </motion.div>
);

const Button = ({ children, variant = "primary", className = "", icon = false }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string; icon?: boolean }) => {
    const baseStyle = "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer";

    const variants = {
        primary: "bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/20 hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-white text-neutral-900 border border-neutral-200 hover:border-neutral-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        ghost: "bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
    };

    return (
        <button className={`${baseStyle} ${variants[variant]} ${className}`}>
            {children}
            {icon && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
        </button>
    );
};

/* --- Premium Badge Component --- */
const PremiumBadge = ({ children }: { children: React.ReactNode }) => (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neutral-900/5 border border-neutral-200/80 rounded-full text-neutral-700 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
        <Sparkles size={12} className="text-amber-500" />
        {children}
    </div>
);

/* --- Section Label Component --- */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
        <div className="w-8 h-px bg-neutral-300" />
        {children}
    </div>
);

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
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass border-b border-neutral-200/50 py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-neutral-900 text-white flex items-center justify-center rounded-lg shadow-md shadow-neutral-900/20">
                        <BrainCircuit size={18} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-neutral-900">NeuralTrust</span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1 bg-neutral-100/60 backdrop-blur-sm rounded-full px-2 py-1 border border-neutral-200/50">
                    {["Features", "Workflow", "Privacy", "Pricing"].map((item) => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-white/80 transition-all px-4 py-1.5 rounded-full">
                            {item}
                        </a>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Link to="/login" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">Log in</Link>
                    <Button variant="primary" className="!py-2.5 !px-5 !rounded-full !text-xs">
                        Get Started
                        <ChevronRight size={14} />
                    </Button>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-neutral-900 p-2 hover:bg-neutral-100 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass border-b border-neutral-200/50 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-5">
                            {["Features", "Workflow", "Privacy", "Pricing"].map((item) => (
                                <a key={item} href={`#${item.toLowerCase()}`} className="text-lg font-semibold text-neutral-900 hover:text-neutral-600 transition-colors">
                                    {item}
                                </a>
                            ))}
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
        <section className="relative pt-36 pb-28 md:pt-52 md:pb-40 overflow-hidden hero-mesh">
            {/* Decorative Grid */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }} />

            {/* Decorative Orbs */}
            <div className="absolute top-32 left-1/4 w-96 h-96 bg-neutral-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-neutral-300/20 rounded-full blur-3xl" />

            <div className="max-w-6xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                <FadeIn className="text-center lg:text-left">
                    <PremiumBadge>Now with GPT-4o & Claude 3.5</PremiumBadge>

                    <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 leading-[1.05] mb-8 tracking-tight mt-8">
                        Your Daily <br />
                        <span className="relative">
                            AI Workspace
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                                <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 6" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                            </svg>
                        </span>.
                    </h1>

                    <p className="text-lg md:text-xl text-neutral-500 mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                        Semplifica la tua routine. Gestisci email, documenti e progetti in un unico posto sicuro.
                        <strong className="text-neutral-700"> Privacy inclusa, non un ostacolo.</strong>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <Button variant="primary" className="w-full sm:w-auto h-13 px-10 !text-base !rounded-xl" icon>
                            Inizia Gratis
                        </Button>
                        <Button variant="secondary" className="w-full sm:w-auto h-13 px-10 !text-base !rounded-xl">
                            Guarda Demo
                        </Button>
                    </div>

                    <div className="mt-14 flex items-center justify-center lg:justify-start gap-10 text-xs text-neutral-400 font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                <Check size={10} className="text-emerald-600" />
                            </div>
                            Free Forever Plan
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                <Check size={10} className="text-emerald-600" />
                            </div>
                            No training on your data*
                        </div>
                    </div>
                </FadeIn>

                {/* Productivity Visual */}
                <FadeIn delay={0.2} className="relative hidden lg:block">
                    <div className="relative z-20 w-full aspect-[4/3] bg-white rounded-2xl border border-neutral-200/80 premium-shadow-lg overflow-hidden">
                        {/* Header with Mac-style dots */}
                        <div className="h-12 bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-100 flex items-center px-5 justify-between">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-48 bg-neutral-100 rounded-md flex items-center px-2 gap-1">
                                    <Search size={10} className="text-neutral-400" />
                                    <div className="h-2 w-24 bg-neutral-200 rounded-sm"></div>
                                </div>
                            </div>
                            <div className="w-16" />
                        </div>

                        {/* Body */}
                        <div className="p-8 flex gap-8 h-full">
                            <div className="w-14 border-r border-neutral-100/80 flex flex-col gap-5 items-center pt-2">
                                <div className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center text-white shadow-sm shadow-neutral-900/20"><MessageSquare size={15} /></div>
                                <div className="w-9 h-9 text-neutral-300 hover:text-neutral-700 transition-colors flex items-center justify-center cursor-pointer"><Mail size={15} /></div>
                                <div className="w-9 h-9 text-neutral-300 hover:text-neutral-700 transition-colors flex items-center justify-center cursor-pointer"><Calendar size={15} /></div>
                                <div className="w-9 h-9 text-neutral-300 hover:text-neutral-700 transition-colors flex items-center justify-center cursor-pointer"><Search size={15} /></div>
                            </div>
                            <div className="flex-1 space-y-5">
                                {/* User Prompt */}
                                <div className="flex gap-3 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">ME</div>
                                    <div className="p-4 bg-neutral-900 rounded-2xl rounded-tr-md text-sm text-white/90 shadow-sm max-w-[85%]">
                                        Riassumi le email di oggi e prepara la to-do list per il meeting delle 15:00.
                                    </div>
                                </div>

                                {/* AI Response */}
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200 flex items-center justify-center">
                                        <Sparkles size={12} className="text-neutral-600" />
                                    </div>
                                    <div className="flex-1 space-y-3 max-w-[85%]">
                                        <div className="p-4 bg-neutral-50/80 border border-neutral-100 rounded-2xl rounded-tl-md text-sm text-neutral-700 leading-relaxed">
                                            <p className="mb-2 font-semibold text-neutral-900">Ecco il briefing, Marco:</p>
                                            <ul className="list-none pl-0 space-y-2 text-neutral-600">
                                                <li className="flex gap-2 items-start">
                                                    <div className="w-1 h-1 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
                                                    <span><strong className="text-neutral-800">Email Clienti:</strong> 3 nuove richieste di preventivo da approvare.</span>
                                                </li>
                                                <li className="flex gap-2 items-start">
                                                    <div className="w-1 h-1 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
                                                    <span><strong className="text-neutral-800">Team Update:</strong> Giulia ha caricato i design finali su Drive.</span>
                                                </li>
                                            </ul>
                                            <div className="mt-4 pt-3 border-t border-neutral-200/60">
                                                <p className="text-[10px] font-bold uppercase text-neutral-400 mb-2 tracking-wider">To-Do List — Meeting 15:00</p>
                                                <div className="flex items-center gap-2.5 text-neutral-800 text-[13px]">
                                                    <div className="w-4 h-4 border-2 border-neutral-300 rounded hover:border-neutral-500 transition-colors cursor-pointer"></div>
                                                    Review design di Giulia
                                                </div>
                                                <div className="flex items-center gap-2.5 text-neutral-800 text-[13px] mt-1.5">
                                                    <div className="w-4 h-4 border-2 border-neutral-300 rounded hover:border-neutral-500 transition-colors cursor-pointer"></div>
                                                    Approvare preventivi
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-4 -right-4 bg-white rounded-xl border border-neutral-200 p-3 premium-shadow flex items-center gap-2 z-30"
                    >
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <Shield size={14} className="text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-neutral-900">End-to-End Encrypted</div>
                            <div className="text-[9px] text-neutral-400">AES-256 bit</div>
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-neutral-200 p-3 premium-shadow flex items-center gap-2 z-30"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-neutral-700">3 tasks generated</span>
                    </motion.div>
                </FadeIn>
            </div>
        </section>
    );
};

const TrustBar = () => {
    return (
        <div className="py-20 border-y border-neutral-100 bg-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.25em] mb-14">Trusted by the most productive teams</p>
                <div className="flex flex-wrap justify-center gap-x-20 gap-y-8 items-center">
                    {["Notion", "Linear", "Vercel", "Shopify", "Intercom"].map((company, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 0.25 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ opacity: 0.6 }}
                            className="text-xl md:text-2xl font-bold text-neutral-800 font-sans tracking-tight cursor-default transition-opacity duration-300"
                        >
                            {company}
                        </motion.span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Features = () => {
    const features = [
        {
            icon: Calendar,
            title: "Smart Agenda",
            description: "Collega il tuo calendario. L'AI organizza i tuoi meeting, prepara i briefing e ti ricorda le scadenze importanti.",
            accent: "from-blue-500/10 to-blue-600/5"
        },
        {
            icon: Layers,
            title: "Knowledge Base",
            description: "Carica PDF, Docx e link. NeuralTrust diventa la tua enciclopedia aziendale personale, pronta a rispondere a tutto.",
            accent: "from-violet-500/10 to-violet-600/5"
        },
        {
            icon: Mail,
            title: "Email Pilot",
            description: "Scrivi bozze in secondi, riassumi thread infiniti ed estrai action item automaticamente dalle tue email.",
            accent: "from-amber-500/10 to-amber-600/5"
        },
        {
            icon: Lock,
            title: "Private Workspace",
            description: "I tuoi dati sono tuoi. Niente viene usato per il training dei modelli. Isolamento garantito per ogni utente.",
            accent: "from-emerald-500/10 to-emerald-600/5"
        },
        {
            icon: Zap,
            title: "Fast Actions",
            description: "Scorciatoie da tastiera per ogni cosa. Crea task, cerca documenti e lancia comandi senza toccare il mouse.",
            accent: "from-orange-500/10 to-orange-600/5"
        }
    ];

    return (
        <section id="features" className="py-40 bg-white relative">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

            <div className="max-w-6xl mx-auto px-6">
                <FadeIn>
                    <SectionLabel>Features</SectionLabel>
                    <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight leading-tight">
                        Your Routine,<br />Supercharged.
                    </h2>
                    <p className="text-neutral-400 text-lg max-w-xl font-light mb-20">
                        Tutti gli strumenti di cui hai bisogno per eliminare il lavoro ripetitivo e concentrarti su ciò che conta.
                    </p>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <FadeIn key={i} delay={i * 0.08}>
                            <div className="group relative p-8 rounded-2xl border border-neutral-200/60 bg-white hover:bg-neutral-50/50 transition-all duration-500 card-glow h-full">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="text-neutral-800" size={22} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 mb-3">{feature.title}</h3>
                                <p className="text-neutral-500 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </FadeIn>
                    ))}

                    {/* CTA Card */}
                    <FadeIn delay={0.4}>
                        <div className="group relative p-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 hover:border-neutral-400 transition-all duration-500 flex flex-col justify-center h-full">
                            <h3 className="text-lg font-bold text-neutral-900 mb-3">Integrazioni</h3>
                            <p className="text-neutral-500 text-sm mb-6">
                                Google Drive, Slack, Notion e molto altro. NeuralTrust si connette dove lavori tu.
                            </p>
                            <a href="#" className="text-neutral-900 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                Vedi tutte <ArrowRight size={16} />
                            </a>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

const ModelSelection = () => {
    return (
        <section className="py-40 bg-neutral-50/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Left Column: Text */}
                <FadeIn className="flex flex-col justify-center">
                    <SectionLabel>Models</SectionLabel>
                    <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight leading-tight">
                        You choose the model,<br />we deliver.
                    </h2>
                    <p className="text-neutral-400 text-lg max-w-xl font-light mb-10">
                        Scegli tra i modelli di ultima generazione come Google, OpenAI, Anthropic e molto altro. Noi ci occupiamo di connetterli in modo sicuro al tuo workspace.
                    </p>
                    <ul className="space-y-5">
                        {[
                            "Scegli la tua api key, e imposta un budget",
                            "Tieni sotto controllo i costi, niente sorprese",
                            "Inizia a chattare in pochi secondi",
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-4 text-neutral-800 font-medium">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 text-xs font-bold shadow-sm">
                                    {i + 1}
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </FadeIn>

                {/* Right Column: Infinite Carousel */}
                <FadeIn delay={0.15} className="relative w-full overflow-hidden">
                    <div className="absolute top-0 left-0 z-10 w-24 h-full bg-gradient-to-r from-neutral-50/50 to-transparent pointer-events-none"></div>
                    <div className="absolute top-0 right-0 z-10 w-24 h-full bg-gradient-to-l from-neutral-50/50 to-transparent pointer-events-none"></div>

                    <div className="flex w-max animate-infinite-scroll hover:[animation-play-state:paused]">
                        <div className="flex gap-5 px-4 py-12 items-center">
                            {logos.map((src, index) => (
                                <LogoCard key={`original-${index}`} src={src.img} provider={src.provider} />
                            ))}
                        </div>
                        <div className="flex gap-5 px-4 py-12 items-center">
                            {logos.map((src, index) => (
                                <LogoCard key={`duplicate-${index}`} src={src.img} provider={src.provider} />
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

const LogoCard = ({ src, provider }: { src: string; provider: string }) => (
    <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-2xl border border-neutral-200/60 flex items-center justify-center p-5 hover:scale-105 hover:shadow-lg hover:shadow-neutral-200/50 transition-all duration-300 cursor-pointer">
        <Tooltip content={`Clicca per saperne di più su ${provider}`} position="top">
            <img src={src} alt={`${provider} Logo`} className="max-w-full max-h-full object-contain" />
        </Tooltip>
    </div>
);

const PrivacySection = () => {
    return (
        <section id="privacy" className="py-40 bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

            <div className="max-w-6xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <FadeIn>
                        <SectionLabel>Privacy</SectionLabel>
                        <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight leading-tight">
                            Non vogliamo<br />i tuoi dati.
                            <span className="text-neutral-300 ml-1">Davvero*</span>
                        </h2>
                        <p className="text-lg text-neutral-500 mb-10 leading-relaxed font-light">
                            La maggior parte delle AI impara da te. Noi no.
                            I tuoi dati vengono salvati in modo sicuro solo per essere a tua disposizione.
                            <strong className="text-neutral-700"> Nessun training sui tuoi messaggi. Nemmeno noi possiamo leggerli.</strong>
                        </p>
                        <ul className="space-y-5">
                            {[
                                "I dati sono salvati per la TUA cronologia, non per i nostri modelli",
                                "Accesso bloccato al nostro team tecnico (Zero-Trust)",
                                "Crittografia End-to-End di default"
                            ].map((item, i) => (
                                <FadeIn key={i} delay={i * 0.1}>
                                    <li className="flex items-center gap-4 text-neutral-800 font-medium">
                                        <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        {item}
                                    </li>
                                </FadeIn>
                            ))}
                        </ul>
                        <p className="text-xs text-neutral-400 mt-8 flex items-start gap-1.5 leading-relaxed">
                            <span className="text-neutral-300">*</span>
                            <span>Solo i modelli <span className="font-mono text-neutral-500 bg-neutral-100 px-1 py-0.5 rounded text-[10px]">free</span> possono essere usati senza inserire una chiave API, e in questo caso i dati 
                            vengono usati per migliorare quei modelli. Per tutti gli altri modelli, è necessario inserire la propria chiave API, e in quel caso i dati non 
                            vengono usati per il training di nessun modello.</span>
                        </p>
                    </FadeIn>

                    {/* Visual Diagram */}
                    <FadeIn delay={0.2} className="relative">
                        <div className="bg-white rounded-2xl border border-neutral-200/80 p-10 md:p-14 premium-shadow relative overflow-hidden">

                            <div className="flex flex-col gap-8 relative z-10">

                                {/* Secure Path */}
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col items-center gap-2.5">
                                        <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center border border-neutral-200 text-neutral-900 shadow-sm">
                                            <User size={22} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Tu</span>
                                    </div>

                                    {/* Connection Line */}
                                    <div className="flex-1 h-px bg-neutral-200 mx-6 relative overflow-hidden rounded-full">
                                        <motion.div
                                            animate={{ x: [-150, 250] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-full opacity-60"
                                        />
                                    </div>

                                    <div className="flex flex-col items-center gap-2.5">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 text-emerald-600 relative shadow-sm">
                                            <Database size={22} />
                                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-1 border-2 border-white shadow-sm">
                                                <Lock size={8} className="text-white" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Secure DB</span>
                                    </div>
                                </div>

                                {/* Blocked Paths */}
                                <div className="relative pl-20">
                                    {/* Blocked: Training */}
                                    <div className="flex items-center justify-between opacity-60 mt-5">
                                        <div className="w-8 h-px bg-neutral-200"></div>
                                        <div className="flex-1 border-t border-dashed border-neutral-300 mx-3 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                                                    <X size={10} className="text-red-500" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-11 h-11 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200 text-neutral-400">
                                                <BrainCircuit size={17} />
                                            </div>
                                            <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider">AI Training</span>
                                        </div>
                                    </div>

                                    {/* Blocked: Staff */}
                                    <div className="flex items-center justify-between opacity-60 mt-5">
                                        <div className="w-8 h-px bg-neutral-200"></div>
                                        <div className="flex-1 border-t border-dashed border-neutral-300 mx-3 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                                                    <X size={10} className="text-red-500" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-11 h-11 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200 text-neutral-400">
                                                <EyeOff size={17} />
                                            </div>
                                            <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider">Staff Access</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-neutral-100 flex justify-between items-center">
                                <div className="text-xs text-neutral-500">
                                    <span className="block font-bold text-neutral-900 mb-0.5">Dati Criptati a Riposo</span>
                                    AES-256 + Chiavi Gestite dall'Utente
                                </div>
                                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full border border-emerald-100 tracking-wider flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
        <section id="pricing" className="py-40 bg-neutral-50/30 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

            <div className="max-w-6xl mx-auto px-6">
                <FadeIn className="text-center mb-24">
                    <SectionLabel>Pricing</SectionLabel>
                    <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 tracking-tight">Investi nella tua produttività.</h2>
                    <p className="text-neutral-400 text-lg font-light">Piani semplici che scalano con le tue ambizioni.</p>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    {/* Free Plan */}
                    <FadeIn>
                        <div className="p-10 border border-neutral-200/80 rounded-2xl bg-white hover:shadow-lg hover:shadow-neutral-200/50 transition-all duration-500 flex flex-col h-full">
                            <div className="text-sm font-bold text-neutral-500 mb-3 uppercase tracking-wider">Free</div>
                            <div className="text-5xl font-bold text-neutral-900 mb-8">€0<span className="text-base font-normal text-neutral-400 ml-1">/mo</span></div>
                            <p className="text-neutral-500 text-sm mb-8 leading-relaxed">Perfetto per organizzare la routine personale.</p>
                            <Button variant="secondary" className="w-full mb-10 !rounded-xl">Crea Account</Button>
                            <ul className="space-y-4 text-sm text-neutral-600 flex-1">
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Accesso limitato a diversi modelli</li>
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> 5 Upload Documenti/giorno</li>
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Integrazione Calendario (Read-only)</li>
                                <li className="flex gap-3 items-start text-neutral-400"><Minus size={16} className="mt-0.5 flex-shrink-0" /> No Email Assistant</li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* Pro — Featured */}
                    <FadeIn delay={0.1}>
                        <div className="p-10 rounded-2xl relative bg-white flex flex-col h-full gradient-border premium-shadow-lg">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold px-5 py-1.5 rounded-full uppercase tracking-[0.15em] shadow-lg shadow-neutral-900/20">
                                Consigliato
                            </div>
                            <div className="text-sm font-bold text-neutral-500 mb-3 mt-2 uppercase tracking-wider">Pro</div>
                            <div className="text-3xl font-bold text-neutral-900 mb-8">Pay as you go</div>
                            <p className="text-neutral-500 text-sm mb-8 leading-relaxed">Per freelance e professionisti.</p>
                            <Button variant="primary" className="w-full mb-10 !rounded-xl">Attiva Pro</Button>
                            <ul className="space-y-4 text-sm text-neutral-900 font-medium flex-1">
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Modelli Avanzati (Gemini 3.1 Pro)</li>
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Upload Illimitati</li>
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Smart Agenda & Email Pilot</li>
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Aumento capacità di elaborazione</li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* Team */}
                    <FadeIn delay={0.2}>
                        <div className="p-10 border border-neutral-200/80 rounded-2xl bg-white hover:shadow-lg hover:shadow-neutral-200/50 transition-all duration-500 flex flex-col h-full">
                            <div className="text-sm font-bold text-neutral-500 mb-3 uppercase tracking-wider">Team</div>
                            <div className="text-3xl font-bold text-neutral-900 mb-8">Coming Soon</div>
                            <p className="text-neutral-500 text-sm mb-8 leading-relaxed">Per collaborare sui progetti.</p>
                            <Button variant="secondary" className="w-full mb-10 !rounded-xl">Contatta Sales</Button>
                            <ul className="space-y-4 text-sm text-neutral-600 flex-1">
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Workspace Condivisi</li>
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Gestione Ruoli & Permessi</li>
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Fatturazione Centralizzata</li>
                                <li className="flex gap-3 items-start"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Supporto Prioritario</li>
                            </ul>
                        </div>
                    </FadeIn>
                </div>

                {/* Enterprise Callout */}
                <FadeIn>
                    <div className="bg-neutral-900 text-white rounded-2xl p-14 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10 premium-shadow-lg relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.02] rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-3xl font-bold mb-3">Sei un'azienda Enterprise?</h3>
                            <p className="text-neutral-400 text-sm max-w-lg leading-relaxed">
                                Offriamo deployment su Cloud Privato (VPC), SSO, Audit Logs e conformità GDPR avanzata per grandi organizzazioni.
                            </p>
                        </div>
                        <div className="flex-shrink-0 relative z-10">
                            <Button variant="secondary" className="!bg-white !text-neutral-900 hover:!bg-neutral-100 !rounded-xl !px-8 !py-3.5 !font-bold">
                                Parla con noi
                                <ArrowRight size={16} />
                            </Button>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-white relative pt-28 pb-14">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-24">
                <div className="col-span-1">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white shadow-sm shadow-neutral-900/20">
                            <BrainCircuit size={16} />
                        </div>
                        <span className="text-base font-bold text-neutral-900 tracking-tight">NeuralTrust</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-6 leading-relaxed max-w-xs">
                        Il tuo assistente quotidiano. <br />Made in Milan, Italy 🇮🇹
                    </p>
                </div>

                {[
                    { title: "Prodotto", links: ["Features", "Download App", "Integrazioni", "Changelog"] },
                    { title: "Risorse", links: ["Guide", "Community", "Help Center", "Blog"] },
                    { title: "Legale", links: ["Privacy Policy", "Termini", "Cookie", "Sicurezza"] }
                ].map((col, idx) => (
                    <div key={idx}>
                        <h4 className="text-neutral-900 font-bold text-sm mb-6 tracking-wide">{col.title}</h4>
                        <ul className="space-y-4 text-sm text-neutral-400">
                            {col.links.map(link => (
                                <li key={link}>
                                    <a href="#" className="hover:text-neutral-900 transition-colors duration-200">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="max-w-6xl mx-auto px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent mb-8" />
                <div className="flex flex-col md:flex-row justify-between items-center text-xs text-neutral-400">
                    <p>&copy; {new Date().getFullYear()} NeuralTrust Inc. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <span className="flex items-center gap-2 text-neutral-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const LandingPage: React.FC = () => {
    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen bg-white antialiased">
                <Navbar />
                <Hero />
                <TrustBar />
                <Features />
                <ModelSelection />
                <PrivacySection />
                <Pricing />
                <Footer />
            </div>
        </>
    );
}

export default LandingPage;