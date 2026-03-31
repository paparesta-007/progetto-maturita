import React, { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import {
    BrainCircuit,
    Database,
    Search,
    FileText,
    Cpu,
    ArrowRight,
    Layers,
    Shield,
    Zap,
    MessageSquare,
    Network
} from 'lucide-react';
import { Link } from "react-router-dom";

/* --- Global Styles --- */
const GlobalStyles = () => (
    <style>{`
    @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    .hero-mesh {
        background: 
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(245, 245, 245, 0.8) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 60%, rgba(229, 229, 229, 0.5) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 50% 20%, rgba(245, 245, 245, 0.6) 0%, transparent 60%);
        background-color: #fafafa;
    }
    .premium-shadow-lg {
        box-shadow: 
            0 4px 8px rgba(0,0,0,0.04),
            0 8px 16px rgba(0,0,0,0.06),
            0 24px 48px rgba(0,0,0,0.08),
            0 48px 96px rgba(0,0,0,0.06);
    }
    .glass {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
    `}</style>
);

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

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-neutral-600 mb-6">
        <div className="w-8 h-px bg-neutral-300" />
        {children}
    </div>
);

/* --- Navbar (Semplificata per la pagina interna) --- */
const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass border-b border-neutral-200/50 py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-neutral-900 text-white flex items-center justify-center rounded-lg shadow-md shadow-neutral-900/20">
                        <BrainCircuit size={18} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-neutral-900">NeuralTrust</span>
                </Link>
                <Link to="/app" className="px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-all">
                    Torna all'App
                </Link>
            </div>
        </nav>
    );
};

/* --- Main Content --- */
const KnowledgeHero = () => (
    <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 overflow-hidden hero-mesh">
        <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)',
            backgroundSize: '60px 60px'
        }} />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <FadeIn>
                <SectionLabel>Knowledge Base</SectionLabel>
                <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 leading-[1.05] mb-8 tracking-tight mt-4">
                    Come funziona <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-500">l'architettura RAG</span>.
                </h1>
                <p className="text-lg md:text-xl text-neutral-500 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                    Retrieval-Augmented Generation (RAG) è la tecnologia che permette alle Intelligenze Artificiali di leggere i tuoi documenti privati per darti risposte precise, senza inventare nulla e senza addestrare modelli sui tuoi dati.
                </p>
            </FadeIn>
        </div>
    </section>
);

const ProcessSteps = () => {
    const steps = [
        {
            number: "01",
            title: "Ingestion & Chunking",
            description: "Quando carichi un documento (PDF, Word, TXT), il sistema non lo invia intero all'IA. Invece, lo divide in piccoli frammenti semantici chiamati 'chunks'. Questo permette di gestire documenti enormi in modo efficiente e mirato.",
            icon: Layers,
            image: "https://placehold.co/800x500/f5f5f5/171717?text=Document+Chunking+Process",
            reverse: false
        },
        {
            number: "02",
            title: "Embedding & Vector Database",
            description: "Ogni frammento di testo viene trasformato in una stringa di numeri detta 'vettore' (Embedding) utilizzando un modello linguistico. Questi vettori rappresentano il significato del testo e vengono salvati in un Vector Database ad alte prestazioni. Più due testi hanno significati simili, più i loro vettori saranno 'vicini' matematicamente nello spazio.",
            icon: Database,
            image: "https://placehold.co/800x500/171717/white?text=Vector+Embeddings+%26+Database",
            reverse: true
        },
        {
            number: "03",
            title: "Retrieval (Ricerca Semantica)",
            description: "Quando fai una domanda, NeuralTrust converte anche il tuo prompt in un vettore. Il Vector Database esegue quindi una ricerca matematica ultra-rapida per trovare i frammenti di testo (i chunk) più rilevanti e simili alla tua domanda originale.",
            icon: Search,
            image: "https://placehold.co/800x500/f5f5f5/171717?text=Semantic+Search+%26+Cosine+Similarity",
            reverse: false
        },
        {
            number: "04",
            title: "Augmented Generation",
            description: "Infine, i frammenti di testo recuperati dal database vengono 'iniettati' nel prompt iniziale assieme alla tua domanda. L'LLM (es. GPT-4 o Claude) usa queste informazioni fattuali come 'contesto' per generare una risposta precisa, citando le fonti ed evitando allucinazioni.",
            icon: BrainCircuit,
            image: "https://placehold.co/800x500/171717/white?text=LLM+Context+Injection",
            reverse: true
        }
    ];

    return (
        <section className="py-24 bg-white relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
            
            <div className="max-w-6xl mx-auto px-6 space-y-32">
                {steps.map((step, idx) => (
                    <div key={idx} className={`flex flex-col gap-12 lg:gap-20 items-center ${step.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                        {/* Text Side */}
                        <FadeIn className="w-full lg:w-1/2 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-5xl font-black text-neutral-100 tracking-tighter">{step.number}</span>
                                <div className="w-12 h-12 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-900 shadow-sm">
                                    <step.icon size={22} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-neutral-900 mb-6 tracking-tight">{step.title}</h3>
                            <p className="text-lg text-neutral-600 leading-relaxed font-light">
                                {step.description}
                            </p>
                        </FadeIn>

                        {/* Image Side (Placeholders) */}
                        <FadeIn delay={0.2} className="w-full lg:w-1/2">
                            <div className="rounded-2xl border border-neutral-200/80 premium-shadow-lg overflow-hidden bg-white p-2">
                                <img 
                                    src={step.image} 
                                    alt={step.title} 
                                    className="w-full h-auto rounded-xl object-cover"
                                />
                            </div>
                        </FadeIn>
                    </div>
                ))}
            </div>
        </section>
    );
};

const WhyItMatters = () => {
    return (
        <section className="py-32 bg-neutral-50/50 relative">
            <div className="max-w-6xl mx-auto px-6">
                <FadeIn className="text-center mb-20">
                    <SectionLabel>Vantaggi</SectionLabel>
                    <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
                        Perché il RAG è fondamentale.
                    </h2>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        {
                            title: "Zero Allucinazioni",
                            desc: "Invece di affidarsi solo alla memoria interna del modello, l'IA è obbligata a leggere i documenti forniti nel contesto prima di rispondere, garantendo aderenza ai fatti.",
                            icon: Shield
                        },
                        {
                            title: "Dati Sempre Aggiornati",
                            desc: "I modelli IA sono addestrati fino a una certa data. Con il RAG, puoi inserire i dati della tua azienda di oggi, e l'IA li conoscerà istantaneamente.",
                            icon: Zap
                        },
                        {
                            title: "Privacy Garantita",
                            desc: "I tuoi documenti restano nel Vector DB e vengono passati all'IA solo come contesto temporaneo. I tuoi dati non vengono MAI usati per addestrare l'LLM.",
                            icon: Shield
                        }
                    ].map((feat, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="p-10 rounded-2xl border border-neutral-200/60 bg-white hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-500 h-full flex flex-col">
                                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-900 mb-6">
                                    <feat.icon size={22} />
                                </div>
                                <h4 className="text-xl font-bold text-neutral-900 mb-3">{feat.title}</h4>
                                <p className="text-neutral-500 leading-relaxed text-sm">{feat.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

const Footer = () => (
    <footer className="bg-white relative pt-20 pb-10 border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-6 h-6 bg-neutral-900 rounded-md flex items-center justify-center text-white">
                    <BrainCircuit size={12} />
                </div>
                <span className="font-bold text-neutral-900 tracking-tight">NeuralTrust</span>
            </div>
            <p className="text-xs text-neutral-500">
                &copy; {new Date().getFullYear()} NeuralTrust Inc. Knowledge Base.
            </p>
        </div>
    </footer>
);

const KnowledgePage = () => {
    return (
        <div className="min-h-screen bg-white antialiased">
            <GlobalStyles />
            <Navbar />
            <KnowledgeHero />
            <ProcessSteps />
            <WhyItMatters />
            <Footer />
        </div>
    );
};

export default KnowledgePage;