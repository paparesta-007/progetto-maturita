import { useEffect, useState, Suspense, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BrainCircuit,
    CheckCircle2,
    ChevronRight,
    Database,
    FileSearch,
    Layers,
    MessageSquare,
    Sparkles,
    XCircle,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VectorCanvas from './components/VectorCanvas';
import RAGSteps from './components/RAGSteps';

const SystemStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;800;900&display=swap');

        :root {
            --bg: #fafaf9;
            --fg: #1c1917;
            --accent: #f97316;
            --accent-soft: #ffedd5;
            --muted: #78716c;
            --border: #e7e5e4;
        }

        .knowledge-page {
            background: var(--bg);
            color: var(--fg);
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
        }

        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }

        .brutalist-border {
            border: 1.5px solid var(--fg);
        }

        .brutalist-shadow {
            box-shadow: 4px 4px 0px 0px var(--fg);
            transition: all 0.2s ease;
        }

        .brutalist-shadow:hover {
            box-shadow: 6px 6px 0px 0px var(--fg);
            transform: translate(-2px, -2px);
        }

        .brutalist-shadow-sm {
            box-shadow: 2px 2px 0px 0px var(--fg);
        }

        .bento-card {
            background: white;
            border: 1.5px solid var(--border);
            transition: all 0.3s ease;
        }

        .bento-card:hover {
            border-color: var(--fg);
            box-shadow: 4px 4px 0px 0px var(--fg);
            transform: translate(-2px, -2px);
        }

        .text-gradient {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .grid-pattern {
            background-size: 40px 40px;
            background-image:
                linear-gradient(to right, rgba(28, 25, 23, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(28, 25, 23, 0.05) 1px, transparent 1px);
        }

        .section-divider {
            height: 1px;
            width: 100%;
            background: linear-gradient(90deg, transparent, #d6d3d1, transparent);
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
        }

        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
    `}</style>
);

const FadeIn = ({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.55, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
    <span className="font-mono text-xs uppercase tracking-[0.22em] text-orange-600 mb-2 block">{children}</span>
);

const TopNav = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-stone-50/90 backdrop-blur-md border-b border-stone-200' : ''
            }`}
        >
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 brutalist-shadow-sm flex items-center justify-center">
                        <BrainCircuit size={18} className="text-white" />
                    </div>
                    <span className="font-mono font-bold text-lg tracking-tight text-stone-900">Smart AI</span>
                    <span className="hidden sm:inline-block px-2 py-0.5 bg-stone-200 text-stone-600 text-[10px] font-mono uppercase rounded-full">
                        knowledge
                    </span>
                </Link>

                <Link
                    to="/"
                    className="font-mono text-xs sm:text-sm bg-stone-900 text-white px-3 sm:px-4 py-2 brutalist-shadow hover:bg-orange-500 transition-colors inline-flex items-center gap-2"
                >
                    <ArrowLeft size={14} />
                    Home
                </Link>
            </div>
        </header>
    );
};

const Hero = () => (
    <section className="pt-32 pb-20 px-6 grid-pattern">
        <div className="max-w-5xl mx-auto">
            <FadeIn>
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 border border-orange-200 rounded-full text-orange-700 text-xs font-mono font-medium mb-6">
                        <Sparkles size={12} />
                        Interactive Knowledge Guide
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.92] mb-6">
                        Understand
                        <span className="block text-gradient">RAG Architecture</span>
                    </h1>

                    <p className="text-lg text-stone-600 font-mono leading-relaxed mb-8 max-w-2xl mx-auto">
                        Retrieval-Augmented Generation connects your private documents with powerful language models.
                        Explore how search, embeddings, and response grounding work together.
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center">
                        <a href="#vector-space" className="bg-orange-500 text-white px-6 py-3 font-mono text-sm brutalist-shadow hover:bg-orange-600 inline-flex items-center gap-2">
                            Explore Vector Space
                            <ArrowRight size={16} />
                        </a>
                        <a href="#pipeline" className="bg-white border-2 border-stone-900 px-6 py-3 font-mono text-sm brutalist-shadow hover:bg-stone-100 inline-flex items-center gap-2">
                            View Pipeline
                        </a>
                    </div>
                </div>
            </FadeIn>
        </div>
    </section>
);

const WhatIsRAG = () => {
    const cards = [
        {
            icon: FileSearch,
            title: 'Retrieval',
            description: 'Searches your documents with semantic similarity to fetch the most relevant chunks.',
            color: 'text-blue-600 bg-blue-50 border-blue-200',
        },
        {
            icon: Layers,
            title: 'Augmented',
            description: 'Injects retrieved evidence into the prompt so the model answers with context.',
            color: 'text-orange-600 bg-orange-50 border-orange-200',
        },
        {
            icon: MessageSquare,
            title: 'Generation',
            description: 'Produces responses that combine model reasoning and source-backed facts.',
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        },
    ];

    return (
        <section id="rag" className="py-24 px-6 bg-white border-t border-stone-200">
            <div className="max-w-6xl mx-auto">
                <FadeIn>
                    <SectionLabel>The Concept</SectionLabel>
                    <h2 className="text-4xl font-black tracking-tight mb-4">What is <span className="text-gradient">RAG</span>?</h2>
                    <p className="text-stone-600 font-mono text-sm max-w-2xl mb-12 leading-relaxed">
                        RAG stands for Retrieval-Augmented Generation. Instead of relying only on model memory,
                        it pulls trusted information from your own files before generating an answer.
                    </p>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-6">
                    {cards.map((card, i) => (
                        <FadeIn key={card.title} delay={i * 0.08}>
                            <div className="bento-card rounded-xl p-6 h-full bg-stone-50">
                                <div className={`w-12 h-12 rounded-lg border flex items-center justify-center mb-4 ${card.color}`}>
                                    <card.icon size={22} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 font-mono text-stone-900">{card.title}</h3>
                                <p className="text-sm text-stone-600 leading-relaxed">{card.description}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
};

const VectorSpaceSection = () => (
    <section id="vector-space" className="py-24 px-6 bg-stone-50 border-t border-stone-200">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,1.35fr] gap-10 items-center">
            <FadeIn>
                <SectionLabel>Interactive Demo</SectionLabel>
                <h2 className="text-4xl font-black tracking-tight mb-4 leading-tight">
                    Explore the <span className="text-gradient">Vector Space</span>
                </h2>
                <p className="text-stone-600 font-mono text-sm leading-relaxed mb-8">
                    Each point is a chunk embedding. Drag the query sphere to simulate retrieval and observe
                    nearest neighbors in real time.
                </p>

                <div className="bento-card rounded-xl p-5 bg-white space-y-3">
                    {[
                        { color: 'bg-indigo-500', label: 'Document chunks' },
                        { color: 'bg-amber-500', label: 'Nearest matches' },
                        { color: 'bg-cyan-500', label: 'Query vector (drag me)' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3 text-sm text-stone-700">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="bg-white brutalist-border brutalist-shadow rounded-xl overflow-hidden h-[380px] md:h-[500px]">
                    <Suspense
                        fallback={
                            <div className="w-full h-full flex items-center justify-center gap-3 text-stone-500 font-mono text-sm">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                >
                                    <BrainCircuit size={18} />
                                </motion.div>
                                Loading 3D space...
                            </div>
                        }
                    >
                        <VectorCanvas />
                    </Suspense>
                </div>
            </FadeIn>
        </div>
    </section>
);

const Comparison = () => {
    const [activeTab, setActiveTab] = useState<'vanilla' | 'rag'>('vanilla');

    return (
        <section id="comparison" className="py-24 px-6 bg-white border-t border-stone-200">
            <div className="max-w-4xl mx-auto">
                <FadeIn>
                    <div className="text-center mb-10">
                        <SectionLabel>Why It Matters</SectionLabel>
                        <h2 className="text-4xl font-black tracking-tight mb-4">
                            Vanilla LLM vs <span className="text-gradient">RAG</span>
                        </h2>
                        <p className="text-stone-600 font-mono text-sm max-w-xl mx-auto">
                            Same prompt, two different outcomes. RAG adds retrieval so responses become grounded,
                            auditable, and fresher.
                        </p>
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="flex justify-center mb-6">
                        <div className="bg-stone-100 border border-stone-200 rounded-lg p-1 flex gap-1">
                            {[
                                { key: 'vanilla' as const, label: 'Vanilla LLM', icon: AlertTriangle },
                                { key: 'rag' as const, label: 'RAG Powered', icon: CheckCircle2 },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 rounded-md text-sm font-mono inline-flex items-center gap-2 transition-colors ${
                                        activeTab === tab.key
                                            ? tab.key === 'rag'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-stone-900 text-white'
                                            : 'text-stone-600 hover:bg-stone-200'
                                    }`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white brutalist-border rounded-xl p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'vanilla' ? (
                                <motion.div
                                    key="vanilla"
                                    initial={{ opacity: 0, x: -14 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 14 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex justify-end mb-4">
                                        <div className="max-w-[80%] rounded-xl rounded-tr-sm border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-700">
                                            What are the Q3 revenue figures for our EMEA division?
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                                            <AlertTriangle size={14} className="text-red-500" />
                                        </div>
                                        <div className="rounded-xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-3 flex-1">
                                            <p className="text-sm text-stone-700 leading-relaxed mb-3">
                                                I do not have access to your private company financials, so giving exact figures
                                                would be unreliable.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {['No private data access', 'Knowledge cutoff', 'Hallucination risk'].map((tag) => (
                                                    <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-md border border-red-200 text-red-600 bg-white">
                                                        <XCircle size={11} />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="rag"
                                    initial={{ opacity: 0, x: 14 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -14 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex justify-end mb-4">
                                        <div className="max-w-[80%] rounded-xl rounded-tr-sm border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-700">
                                            What are the Q3 revenue figures for our EMEA division?
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.08em] text-orange-600 mb-3 ml-11">
                                        <Database size={12} />
                                        3 documents retrieved from your knowledge base
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={14} className="text-orange-600" />
                                        </div>
                                        <div className="rounded-xl rounded-tl-sm border border-orange-200 bg-orange-50 px-4 py-3 flex-1">
                                            <p className="text-sm text-stone-700 leading-relaxed mb-3">
                                                From the Q3 2024 report, EMEA revenue is <strong className="text-stone-900">EUR 14.2M</strong>
                                                , up <strong className="text-emerald-600">12.5% YoY</strong>, with strongest growth from UK and DACH.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {['Grounded in docs', 'Verifiable', 'Up to date'].map((tag) => (
                                                    <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-md border border-orange-200 text-orange-700 bg-white">
                                                        <CheckCircle2 size={11} />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

const PipelineSection = () => (
    <section id="pipeline" className="py-24 px-6 bg-stone-50 border-t border-stone-200">
        <div className="max-w-6xl mx-auto">
            <FadeIn>
                <div className="text-center mb-10">
                    <SectionLabel>Step By Step</SectionLabel>
                    <h2 className="text-4xl font-black tracking-tight mb-4">
                        The Complete <span className="text-gradient">RAG Pipeline</span>
                    </h2>
                    <p className="text-stone-600 font-mono text-sm max-w-xl mx-auto">
                        Click each stage to inspect what happens during ingestion, retrieval, and response generation.
                    </p>
                </div>
            </FadeIn>

            <FadeIn delay={0.08}>
                <div className="bg-white brutalist-border rounded-xl p-4 md:p-6">
                    <RAGSteps />
                </div>
            </FadeIn>
        </div>
    </section>
);

const Stats = () => {
    const stats = [
        { value: '~70%', label: 'Lower hallucination rate' },
        { value: '<200ms', label: 'Average retrieval latency' },
        { value: '100%', label: 'Source traceability' },
        { value: 'Live', label: 'Knowledge freshness' },
    ];

    return (
        <section id="metrics" className="py-20 px-6 bg-white border-t border-stone-200">
            <div className="max-w-6xl mx-auto">
                <SectionLabel>Metrics</SectionLabel>
                <h2 className="text-4xl font-black tracking-tight mb-10">Performance Snapshot</h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((item, i) => (
                        <FadeIn key={item.label} delay={i * 0.06}>
                            <div className="bento-card rounded-xl p-6 text-center bg-stone-50">
                                <div className="text-4xl font-black text-stone-900 tracking-tight mb-2 font-mono">{item.value}</div>
                                <div className="text-xs uppercase tracking-widest text-stone-500 font-mono">{item.label}</div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTAFooter = () => (
    <section id="pricing" className="py-24 px-6 bg-stone-900 text-stone-100 border-t border-stone-700">
        <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-xl mx-auto mb-6 flex items-center justify-center brutalist-shadow-sm">
                <Zap size={28} className="text-white" />
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-4">Ready to Build with RAG?</h2>
            <p className="text-stone-300 font-mono text-sm leading-relaxed mb-8 max-w-xl mx-auto">
                Upload your own documents and let Smart AI deliver answers that are grounded, searchable, and verifiable.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/login" className="bg-orange-500 text-white px-6 py-3 font-mono text-sm brutalist-shadow hover:bg-orange-600 inline-flex items-center gap-2">
                    Get Started
                    <ChevronRight size={16} />
                </Link>
                <Link to="/" className="bg-stone-100 text-stone-900 px-6 py-3 font-mono text-sm brutalist-shadow hover:bg-white inline-flex items-center gap-2">
                    Back to Home
                    <ArrowRight size={16} />
                </Link>
            </div>

            <div className="section-divider my-10" />
            <p className="font-mono text-xs text-stone-400">NeuralTrust Knowledge • {new Date().getFullYear()}</p>
        </div>
    </section>
);

export default function KnowledgePage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <SystemStyles />
            <div className="knowledge-page min-h-screen selection:bg-orange-200 selection:text-orange-900">
                <TopNav />
                <main>
                    <Hero />
                    <WhatIsRAG />
                    <VectorSpaceSection />
                    <Comparison />
                    <PipelineSection />
                    <Stats />
                </main>
                <CTAFooter />
            </div>
        </>
    );
}
