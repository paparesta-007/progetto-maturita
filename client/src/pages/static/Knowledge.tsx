import { useState, useEffect, Suspense } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import {
    BrainCircuit,
    ChevronRight,
    Sparkles,
    ArrowLeft,
    Database,
    FileSearch,
    MessageSquare,
    Layers,
    ArrowRight,
    Zap,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    GitCompare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VectorCanvas from './components/VectorCanvas';
import RAGSteps from './components/RAGSteps';

/* ═══════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════ */
const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    .rag-page {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fafafa;
      color: #171717;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .rag-page * {
      box-sizing: border-box;
    }

    /* ── Noise texture overlay ── */
    .noise-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.02;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* ── Grid background ── */
    .grid-bg {
      background-image:
        linear-gradient(rgba(23, 23, 23, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(23, 23, 23, 0.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    /* ── Gradient text ── */
    .gradient-text {
      background: linear-gradient(135deg, #171717 0%, #525252 50%, #171717 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .gradient-text-subtle {
      background: linear-gradient(135deg, #525252 0%, #737373 50%, #525252 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Glow effects ── */
    .glow-indigo {
      box-shadow:
        0 4px 8px rgba(0,0,0,0.04),
        0 16px 32px rgba(0,0,0,0.06);
    }

    .glow-cyan {
      box-shadow:
        0 4px 8px rgba(0,0,0,0.04),
        0 16px 32px rgba(0,0,0,0.06);
    }

    /* ── Glass card ── */
    .glass-card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }

    /* ── Section divider ── */
    .section-divider {
      height: 1px;
      width: 100%;
      background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent);
    }

    /* ── Scrollbar ── */
    .rag-page::-webkit-scrollbar {
      width: 6px;
    }
    .rag-page::-webkit-scrollbar-track {
      background: #fafafa;
    }
    .rag-page::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }

    /* ── Animations ── */
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(1deg); }
    }

    @keyframes pulse-ring {
      0% { transform: scale(0.95); opacity: 0.7; }
      50% { transform: scale(1.05); opacity: 0.3; }
      100% { transform: scale(0.95); opacity: 0.7; }
    }

    @keyframes shimmer-flow {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    .animate-float { animation: float-slow 6s ease-in-out infinite; }
    .animate-pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
    >
        {children}
    </motion.div>
);

const SectionLabel = ({ children, color = '#818cf8' }: { children: React.ReactNode; color?: string }) => (
    <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color,
        marginBottom: '24px',
    }}>
        <div style={{ width: '32px', height: '1px', background: color, opacity: 0.5 }} />
        {children}
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════════ */
const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            transition: 'all 0.5s ease',
            background: isScrolled ? '' : 'transparent',
            backdropFilter: isScrolled ? 'blur(20px)' : 'none',
            borderBottom: isScrolled ? '' : '1px solid transparent',
            padding: isScrolled ? '12px 0' : '20px 0',
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    }}>
                        <BrainCircuit size={18} color="#fff" />
                    </div>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#171717',
                        letterSpacing: '-0.02em',
                    }}>
                        NeuralTrust / Knowledge
                    </span>
                </Link>

                {/* Back to Home */}
                <Link to="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#525252',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    transition: 'all 0.3s ease',
                }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#171717';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99, 102, 241, 0.3)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(99, 102, 241, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#525252';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(148, 163, 184, 0.15)';
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                >
                    <ArrowLeft size={14} />
                    Back to Home
                </Link>
            </div>
        </nav>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════ */
const Hero = () => {
    return (
        <section style={{
            position: 'relative',
            paddingTop: '160px',
            paddingBottom: '120px',
            overflow: 'hidden',
        }}>
            {/* Background orbs */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '15%',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '0',
                right: '10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
                <FadeIn>
                    <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                        {/* Badge */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 16px',
                            background: 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#6366f1',
                            marginBottom: '32px',
                        }}>
                            <Sparkles size={14} color="#818cf8" />
                            Interactive Knowledge Base Guide
                        </div>

                        {/* Title */}
                        <h1 style={{
                            fontSize: 'clamp(40px, 6vw, 72px)',
                            fontWeight: 800,
                            lineHeight: 1.05,
                            letterSpacing: '-0.03em',
                            margin: '0 0 24px 0',
                        }}>
                            <span style={{ color: '#171717' }}>Understanding</span>
                            <br />
                            <span className="gradient-text">
                                RAG Architecture
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p style={{
                            fontSize: '18px',
                            lineHeight: 1.7,
                            color: '#525252',
                            maxWidth: '600px',
                            margin: '0 auto 40px',
                            fontWeight: 400,
                        }}>
                            Retrieval-Augmented Generation bridges your private knowledge and large language models.
                            Explore <strong style={{ color: '#737373' }}>how it works</strong> with interactive 3D visualizations.
                        </p>

                        {/* CTA buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <a href="#3d-space" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
                            }}>
                                Explore 3D Vector Space
                                <ArrowRight size={16} />
                            </a>
                            <a href="#pipeline" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: '#171717',
                                fontSize: '14px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                            }}>
                                View Pipeline Steps
                            </a>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   WHAT IS RAG? SECTION
   ═══════════════════════════════════════════════════════════════════ */
const WhatIsRAG = () => {
    const cards = [
        {
            icon: FileSearch,
            title: 'Retrieval',
            description: 'Searches your documents for the most relevant information based on semantic similarity.',
            color: '#525252',
        },
        {
            icon: Layers,
            title: 'Augmented',
            description: 'Enriches the LLM prompt with retrieved context, providing grounded knowledge.',
            color: '#22d3ee',
        },
        {
            icon: MessageSquare,
            title: 'Generation',
            description: 'The LLM generates a factual answer using both its training and your documents.',
            color: '#c084fc',
        },
    ];

    return (
        <section style={{ padding: '120px 0', position: 'relative' }}>
            <div className="section-divider" />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 0' }}>
                <FadeIn>
                    <SectionLabel>The Concept</SectionLabel>
                    <h2 style={{
                        fontSize: 'clamp(32px, 4vw, 48px)',
                        fontWeight: 800,
                        color: '#171717',
                        letterSpacing: '-0.02em',
                        margin: '0 0 16px',
                        lineHeight: 1.1,
                    }}>
                        What is RAG?
                    </h2>
                    <p style={{
                        fontSize: '17px',
                        color: '#525252',
                        maxWidth: '600px',
                        lineHeight: 1.7,
                        margin: '0 0 60px',
                    }}>
                        RAG stands for <strong style={{ color: '#171717' }}>Retrieval-Augmented Generation</strong>.
                        It's a technique that gives LLMs access to external knowledge, making their answers more accurate and verifiable.
                    </p>
                </FadeIn>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                }}>
                    {cards.map((card, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div
                                className="glass-card"
                                style={{
                                    padding: '32px',
                                    height: '100%',
                                    background: 'white',
                                    transition: 'all 0.4s ease',
                                    cursor: 'default',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.borderColor = `${card.color}40`;
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99, 102, 241, 0.1)';
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '14px',
                                    background: `${card.color}12`,
                                    border: `1px solid ${card.color}25`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                }}>
                                    <card.icon size={24} color={card.color} strokeWidth={1.5} />
                                </div>
                                <h3 style={{
                                    fontSize: '22px',
                                    fontWeight: 700,
                                    color: '#171717',
                                    marginBottom: '10px',
                                    letterSpacing: '-0.01em',
                                }}>
                                    {card.title}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#525252',
                                    lineHeight: 1.7,
                                    margin: 0,
                                }}>
                                    {card.description}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   3D VECTOR SPACE SECTION
   ═══════════════════════════════════════════════════════════════════ */
const VectorSpaceSection = () => {
    return (
        <section id="3d-space" style={{ padding: '120px 0', position: 'relative' }}>
            <div className="section-divider" />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 0' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.4fr',
                    gap: '48px',
                    alignItems: 'center',
                }}>
                    {/* Left text */}
                    <FadeIn>
                        <SectionLabel color="#22d3ee">Interactive Demo</SectionLabel>
                        <h2 style={{
                            fontSize: 'clamp(28px, 3.5vw, 40px)',
                            fontWeight: 800,
                            color: '#171717',
                            letterSpacing: '-0.02em',
                            margin: '0 0 16px',
                            lineHeight: 1.15,
                        }}>
                            Explore the
                            <br />
                            <span style={{ color: '#22d3ee' }}>Vector Space</span>
                        </h2>
                        <p style={{
                            fontSize: '15px',
                            color: '#525252',
                            lineHeight: 1.7,
                            margin: '0 0 28px',
                        }}>
                            Each point represents a document chunk embedded into 3D space.
                            <strong style={{ color: '#737373' }}> Drag the cyan sphere</strong> to simulate a search query
                            and watch the nearest neighbors update in real time.
                        </p>

                        {/* Legend */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '20px',
                            background: 'white',
                            borderRadius: '14px',
                            border: '1px solid rgba(99, 102, 241, 0.1)',
                        }}>
                            {[
                                { color: '#6366f1', label: 'Document chunks', opacity: 0.6 },
                                { color: '#a78bfa', label: 'Nearest matches', opacity: 1 },
                                { color: '#22d3ee', label: 'Your query (drag me!)', opacity: 1 },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '13px',
                                    color: '#525252',
                                }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: item.color,
                                        opacity: item.opacity,
                                        boxShadow: `0 0 8px ${item.color}40`,
                                    }} />
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Right 3D canvas */}
                    <FadeIn delay={0.15}>
                        <div
                            className="glass-card glow-indigo"
                            style={{
                                height: '500px',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            <Suspense fallback={
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#a3a3a3',
                                    fontSize: '14px',
                                    gap: '8px',
                                }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <BrainCircuit size={20} />
                                    </motion.div>
                                    Loading 3D Space...
                                </div>
                            }>
                                <VectorCanvas />
                            </Suspense>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   RAG vs VANILLA LLM COMPARISON
   ═══════════════════════════════════════════════════════════════════ */
const Comparison = () => {
    const [activeTab, setActiveTab] = useState<'vanilla' | 'rag'>('vanilla');

    return (
        <section style={{ padding: '120px 0', position: 'relative' }}>
            <div className="section-divider" />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 24px 0' }}>
                <FadeIn>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <SectionLabel color="#f472b6">Why RAG?</SectionLabel>
                        <h2 style={{
                            fontSize: 'clamp(28px, 3.5vw, 40px)',
                            fontWeight: 800,
                            color: '#171717',
                            letterSpacing: '-0.02em',
                            margin: '0 0 16px',
                            lineHeight: 1.15,
                        }}>
                            Vanilla LLM vs <span style={{ color: '#22d3ee' }}>RAG</span>
                        </h2>
                        <p style={{ fontSize: '15px', color: '#525252', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
                            See the difference between a standard LLM and one augmented with your private knowledge.
                        </p>
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '4px',
                        marginBottom: '32px',
                        padding: '4px',
                        background: 'white',
                        borderRadius: '14px',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        width: 'fit-content',
                        margin: '0 auto 32px',
                    }}>
                        {[
                            { key: 'vanilla' as const, label: 'Vanilla LLM', icon: AlertTriangle },
                            { key: 'rag' as const, label: 'RAG-Powered', icon: CheckCircle2 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'all 0.3s ease',
                                    background: activeTab === tab.key
                                        ? (tab.key === 'rag' ? 'rgba(34, 211, 238, 0.12)' : 'rgba(244, 63, 94, 0.12)')
                                        : 'transparent',
                                    color: activeTab === tab.key
                                        ? (tab.key === 'rag' ? '#22d3ee' : '#fb7185')
                                        : '#a3a3a3',
                                }}
                            >
                                <tab.icon size={15} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="glass-card" style={{ padding: '32px', overflow: 'hidden' }}>
                        <AnimatePresence mode="wait">
                            {activeTab === 'vanilla' ? (
                                <motion.div
                                    key="vanilla"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* User prompt */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginBottom: '20px',
                                        justifyContent: 'flex-end',
                                    }}>
                                        <div style={{
                                            padding: '14px 18px',
                                            background: 'rgba(255, 255, 255, 1)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            borderRadius: '14px 14px 4px 14px',
                                            fontSize: '14px',
                                            color: '#737373',
                                            maxWidth: '70%',
                                        }}>
                                            What are the Q3 revenue figures for our EMEA division?
                                        </div>
                                    </div>

                                    {/* AI response */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '10px',
                                            background: 'rgba(244, 63, 94, 0.12)',
                                            border: '1px solid rgba(244, 63, 94, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <AlertTriangle size={14} color="#fb7185" />
                                        </div>
                                        <div style={{
                                            padding: '14px 18px',
                                            background: 'rgba(244, 63, 94, 0.06)',
                                            border: '1px solid rgba(244, 63, 94, 0.12)',
                                            borderRadius: '14px 14px 14px 4px',
                                            flex: 1,
                                        }}>
                                            <p style={{ fontSize: '14px', color: '#525252', lineHeight: 1.7, margin: '0 0 12px' }}>
                                                I'm sorry, but I don't have access to your company's specific financial data.
                                                I can only provide general information based on my training data, which was cut off
                                                in a certain date. I would <span style={{ color: '#fb7185', fontWeight: 600 }}>hallucinate</span> if I tried to give you specific numbers.
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                gap: '8px',
                                                flexWrap: 'wrap',
                                            }}>
                                                {['No private data access', 'Knowledge cutoff', 'Risk of hallucination'].map((tag, i) => (
                                                    <span key={i} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '4px 10px',
                                                        background: 'rgba(244, 63, 94, 0.08)',
                                                        border: '1px solid rgba(244, 63, 94, 0.15)',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: '#fb7185',
                                                    }}>
                                                        <XCircle size={10} />
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
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* User prompt */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginBottom: '20px',
                                        justifyContent: 'flex-end',
                                    }}>
                                        <div style={{
                                            padding: '14px 18px',
                                            background: 'rgba(255, 255, 255, 1)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            borderRadius: '14px 14px 4px 14px',
                                            fontSize: '14px',
                                            color: '#737373',
                                            maxWidth: '70%',
                                        }}>
                                            What are the Q3 revenue figures for our EMEA division?
                                        </div>
                                    </div>

                                    {/* Retrieved context badge */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '12px',
                                        marginLeft: '44px',
                                    }}>
                                        <Database size={12} color="#22d3ee" />
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#22d3ee',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                        }}>
                                            3 documents retrieved from your knowledge base
                                        </span>
                                    </div>

                                    {/* AI response */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '10px',
                                            background: 'rgba(34, 211, 238, 0.12)',
                                            border: '1px solid rgba(34, 211, 238, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <CheckCircle2 size={14} color="#22d3ee" />
                                        </div>
                                        <div style={{
                                            padding: '14px 18px',
                                            background: 'rgba(255, 255, 255, 1)',
                                            border: '1px solid rgba(34, 211, 238, 0.1)',
                                            borderRadius: '14px 14px 14px 4px',
                                            flex: 1,
                                        }}>
                                            <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.7, margin: '0 0 12px' }}>
                                                Based on the <strong>Q3 2024 Financial Report</strong>, the EMEA division generated
                                                <strong style={{ color: '#22d3ee' }}> €14.2M</strong> in revenue, representing a
                                                <strong style={{ color: '#4ade80' }}> +12.5%</strong> increase YoY.
                                                The primary growth drivers were the UK and DACH markets.
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                gap: '8px',
                                                flexWrap: 'wrap',
                                            }}>
                                                {['Grounded in source docs', 'Verifiable', 'Up-to-date'].map((tag, i) => (
                                                    <span key={i} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '4px 10px',
                                                        background: 'rgba(34, 211, 238, 0.08)',
                                                        border: '1px solid rgba(34, 211, 238, 0.15)',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: '#22d3ee',
                                                    }}>
                                                        <CheckCircle2 size={10} />
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

/* ═══════════════════════════════════════════════════════════════════
   PIPELINE STEPS SECTION
   ═══════════════════════════════════════════════════════════════════ */
const PipelineSection = () => {
    return (
        <section id="pipeline" style={{ padding: '120px 0', position: 'relative' }}>
            <div className="section-divider" />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 0' }}>
                <FadeIn>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <SectionLabel color="#c084fc">Step by Step</SectionLabel>
                        <h2 style={{
                            fontSize: 'clamp(28px, 3.5vw, 40px)',
                            fontWeight: 800,
                            color: '#171717',
                            letterSpacing: '-0.02em',
                            margin: '0 0 16px',
                            lineHeight: 1.15,
                        }}>
                            The Complete RAG Pipeline
                        </h2>
                        <p style={{ fontSize: '15px', color: '#525252', maxWidth: '540px', margin: '0 auto', lineHeight: 1.7 }}>
                            Click on any step to reveal technical details and visual breakdowns.
                        </p>
                    </div>
                </FadeIn>

                <RAGSteps />
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   KEY METRICS / STATS
   ═══════════════════════════════════════════════════════════════════ */
const Stats = () => {
    const stats = [
        { value: '~70%', label: 'Reduction in hallucination', color: 'black' },
        { value: '< 200ms', label: 'Avg retrieval latency', color: 'black' },
        { value: '∞', label: 'Knowledge window', color: 'black' },
        { value: '100%', label: 'Source traceability', color: 'black' },
    ];

    return (
        <section style={{ padding: '80px 0', position: 'relative' }}>
            <div className="section-divider" />

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 24px 0' }}>
                <h2 style={{
                    fontSize: 'clamp(28px, 3.5vw, 40px)',
                    fontWeight: 800,
                    color: '#171717',
                    letterSpacing: '-0.02em',
                    margin: '0 0 16px',
                    lineHeight: 1.15,
                }}>
                    Key Metrics
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                }}>

                    {stats.map((stat, i) => (
                        <FadeIn key={i} delay={i * 0.08}>
                            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                                <div style={{
                                    fontSize: 'clamp(32px, 4vw, 44px)',
                                    fontWeight: 800,
                                    color: stat.color,
                                    letterSpacing: '-0.02em',
                                    marginBottom: '8px',
                                    fontFamily: "'JetBrains Mono', 'Inter', sans-serif",
                                }}>
                                    {stat.value}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#a3a3a3',
                                    fontWeight: 500,
                                }}>
                                    {stat.label}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   CTA FOOTER
   ═══════════════════════════════════════════════════════════════════ */
const CTAFooter = () => {
    return (
        <section style={{ padding: '120px 0 80px', position: 'relative' }}>
            <div className="section-divider" />
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '100px 24px 0', textAlign: 'center' }}>
                <FadeIn>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 32px',
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                    }}>
                        <Zap size={28} color="#fff" />
                    </div>

                    <h2 style={{
                        fontSize: 'clamp(28px, 3.5vw, 40px)',
                        fontWeight: 800,
                        color: '#171717',
                        letterSpacing: '-0.02em',
                        margin: '0 0 16px',
                        lineHeight: 1.15,
                    }}>
                        Ready to Build with RAG?
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: '#525252',
                        lineHeight: 1.7,
                        margin: '0 0 36px',
                    }}>
                        NeuralTrust uses RAG to power your personal knowledge base. Upload your documents and start asking questions.
                    </p>

                    <Link to="/login" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '14px',
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        boxShadow: '0 6px 24px rgba(99, 102, 241, 0.35)',
                        transition: 'all 0.3s ease',
                    }}>
                        Get Started Free
                        <ChevronRight size={18} />
                    </Link>
                </FadeIn>

                {/* Footer */}
                <div style={{
                    marginTop: '80px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(99, 102, 241, 0.08)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    flexWrap: 'wrap',
                }}>
                    <Link to="/" style={{
                        fontSize: '13px',
                        color: '#a3a3a3',
                        textDecoration: 'none',
                        transition: 'color 0.3s ease',
                    }}>
                        Home
                    </Link>
                    <span style={{ color: '#1e293b' }}>·</span>
                    <Link to="/login" style={{
                        fontSize: '13px',
                        color: '#a3a3a3',
                        textDecoration: 'none',
                        transition: 'color 0.3s ease',
                    }}>
                        Login
                    </Link>
                    <span style={{ color: '#1e293b' }}>·</span>
                    <span style={{
                        fontSize: '13px',
                        color: '#334155',
                    }}>
                        © {new Date().getFullYear()} NeuralTrust
                    </span>
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function KnowledgePage() {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="rag-page grid-bg">
            <GlobalStyles />
            <div className="noise-overlay" />
            <Navbar />
            <Hero />
            <WhatIsRAG />
            <VectorSpaceSection />
            <Comparison />
            <PipelineSection />
            <Stats />
            <CTAFooter />
        </div>
    );
}
