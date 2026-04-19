import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Github,
  MessageSquare,
  Minus,
  Plus,
  Sparkles,
  Shield,
  Zap,
  PanelTopOpen,
  Layers3,
  ShieldCheck,
  Cpu,
  Brain,
  FileSearch,
  CircleDot,
  ExternalLink,
} from 'lucide-react';

/* -------------------------------------------------------
   Motion helpers
------------------------------------------------------- */
const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: -18 },
  show: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* -------------------------------------------------------
   Small utilities
------------------------------------------------------- */
function Typewriter({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    let current = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        if (current <= text.length) {
          setDisplay(text.slice(0, current));
          current += 1;
        } else if (interval) {
          clearInterval(interval);
        }
      }, 28);
    }, delay);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, delay]);

  return (
    <span className={className}>
      {display}
      <span className="animate-pulse">▍</span>
    </span>
  );
}

function useScrolled(threshold = 16) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

/* -------------------------------------------------------
   Styles
------------------------------------------------------- */
function SystemStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

      :root {
        --bg: #07070a;
        --bg2: #0d0e14;
        --panel: rgba(255,255,255,.04);
        --panel2: rgba(255,255,255,.06);
        --fg: #f4f1ea;
        --muted: rgba(244,241,234,.68);
        --line: rgba(255,255,255,.10);
        --line2: rgba(255,255,255,.16);
        --accent: #f97316;
        --accent2: #fb923c;
        --good: #22c55e;
        --shadow: 0 20px 80px rgba(0,0,0,.42);
      }

      html { scroll-behavior: smooth; }
      body {
        background:
          radial-gradient(circle at 15% 20%, rgba(249,115,22,.12), transparent 24%),
          radial-gradient(circle at 80% 15%, rgba(255,255,255,.05), transparent 18%),
          radial-gradient(circle at 70% 80%, rgba(249,115,22,.10), transparent 20%),
          linear-gradient(180deg, var(--bg), var(--bg2));
        color: var(--fg);
        font-family: 'Manrope', sans-serif;
      }

      .font-mono { font-family: 'IBM Plex Mono', monospace; }

      .noise::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: .055;
        mix-blend-mode: overlay;
        background-image:
          linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: linear-gradient(180deg, black, transparent 80%);
      }

      .glass {
        background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
        backdrop-filter: blur(18px);
      }

      .glass-soft {
        background: rgba(255,255,255,.035);
        border: 1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(12px);
      }

      .skinny-border {
        border: 1px solid rgba(255,255,255,.10);
      }

      .accent-glow {
        position: relative;
      }
      .accent-glow::after {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        background: linear-gradient(135deg, rgba(249,115,22,.9), rgba(255,255,255,0));
        filter: blur(18px);
        opacity: .18;
        z-index: -1;
      }

      .text-accent {
        background: linear-gradient(135deg, #fff 0%, #ffd6b0 25%, #fb923c 66%, #f97316 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .gridline {
        background-image:
          linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
        background-size: 42px 42px;
      }

      .chip {
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.04);
      }

      .lift {
        transition: transform .25s ease, border-color .25s ease, background .25s ease, box-shadow .25s ease;
      }
      .lift:hover {
        transform: translateY(-3px);
        border-color: rgba(249,115,22,.38);
        box-shadow: 0 18px 50px rgba(0,0,0,.28);
      }

      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

      @keyframes drift {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        50% { transform: translateY(-10px) translateX(2px); }
      }
      .drift { animation: drift 8s ease-in-out infinite; }

      @keyframes pulseRing {
        0% { transform: scale(.85); opacity: .6; }
        100% { transform: scale(1.35); opacity: 0; }
      }
      .pulse-ring::before {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: inherit;
        border: 1.5px solid rgba(249,115,22,.5);
        animation: pulseRing 2.1s cubic-bezier(.2,.8,.2,1) infinite;
      }
    `}</style>
  );
}

/* -------------------------------------------------------
   Data
------------------------------------------------------- */
const featureDeck = [
  {
    icon: MessageSquare,
    title: 'Chat multi-modello',
    text: 'Un hub unico per passare tra modelli diversi senza rompere il contesto.',
    tone: 'from-white/10 to-white/5',
  },
  {
    icon: FileText,
    title: 'PDF intelligence',
    text: 'Caricamento documenti, ricerca semantica e risposte ancorate al contenuto.',
    tone: 'from-orange-500/12 to-white/5',
  },
  {
    icon: Zap,
    title: 'Streaming immediato',
    text: 'Risposte token-by-token per dare la sensazione di sistema vivo.',
    tone: 'from-emerald-500/12 to-white/5',
  },
  {
    icon: BookOpen,
    title: 'Output strutturati',
    text: 'Flashcard, quiz e sintesi generate con schemi coerenti e leggibili.',
    tone: 'from-violet-500/12 to-white/5',
  },
  {
    icon: Shield,
    title: 'Accesso protetto',
    text: 'Autenticazione sicura e route riservate per mantenere ordine e controllo.',
    tone: 'from-sky-500/12 to-white/5',
  },
];

const modelCaps = [
  { name: 'GPT-4o', provider: 'OpenAI' },
  { name: 'Claude 3.5', provider: 'Anthropic' },
  { name: 'Llama 3', provider: 'Meta' },
  { name: 'DeepSeek', provider: 'DeepSeek' },
  { name: 'Gemini', provider: 'Google' },
  { name: 'Grok', provider: 'xAI' },
];

const workflow = [
  {
    step: '01',
    title: 'Ingest',
    description: 'Carichi PDF o apri una conversazione con il modello preferito.',
    icon: PanelTopOpen,
  },
  {
    step: '02',
    title: 'Interpret',
    description: 'Il sistema estrae passaggi utili e li riporta dentro il contesto.',
    icon: FileSearch,
  },
  {
    step: '03',
    title: 'Package',
    description: 'Trasformi le idee in schede, quiz e materiali pronti allo studio.',
    icon: Layers3,
  },
];

const faqs = [
  {
    q: 'Serve un modello specifico?',
    a: 'No. L’interfaccia è pensata per orchestrare più provider in modo uniforme.',
  },
  {
    q: 'I PDF sono davvero centrali?',
    a: 'Sì, il progetto ruota attorno alla lettura e al riuso del contenuto documentale.',
  },
  {
    q: 'Posso tenere la UI leggera?',
    a: 'Sì: il layout è modulare e puoi rimuovere o sostituire blocchi senza rompere il resto.',
  },
  {
    q: 'È pensata per un landing page o dashboard?',
    a: 'Funziona come landing, ma il linguaggio visivo richiama un prodotto operativo reale.',
  },
];

/* -------------------------------------------------------
   Header
------------------------------------------------------- */
function TopNav() {
  const scrolled = useScrolled(14);
  const [open, setOpen] = useState<null | 'product' | 'resources'>(null);

  useEffect(() => {
    const onDown = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) setOpen(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const menu = {
    product: [
      { label: 'Overview', href: '#hero' },
      { label: 'Features', href: '#features' },
      { label: 'Workflow', href: '#workflow' },
    ],
    resources: [
      { label: 'FAQ', href: '#faq' },
      { label: 'About', href: '#about' },
      { label: 'GitHub', href: 'https://github.com/paparesta-007/progetto-maturita' },
    ],
  } as const;

  const toggle = (k: 'product' | 'resources') => setOpen((cur) => (cur === k ? null : k));

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'pt-3' : 'pt-5'}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`glass rounded-2xl px-4 py-3 ${scrolled ? 'shadow-2xl' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-300 text-black grid place-items-center shadow-lg shadow-orange-950/20">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight">Smart AI</span>
                  <span className="hidden sm:inline-flex text-[10px] uppercase tracking-[0.22em] px-2 py-1 rounded-full chip text-white/70">
                    v2.0
                  </span>
                </div>
                <div className="text-[11px] text-white/50 font-mono">multi-model learning OS</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm text-white/75">
              <div className="relative" data-dropdown>
                <button
                  onClick={() => toggle('product')}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  Product <ChevronDown size={14} className={`transition-transform ${open === 'product' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {open === 'product' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      className="absolute left-1/2 top-full mt-3 -translate-x-1/2 min-w-52 rounded-2xl glass p-2"
                    >
                      {menu.product.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={() => setOpen(null)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/7 hover:text-white transition-colors"
                        >
                          {item.label} <ChevronRight size={14} className="opacity-50" />
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>

              <div className="relative" data-dropdown>
                <button
                  onClick={() => toggle('resources')}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  Resources <ChevronDown size={14} className={`transition-transform ${open === 'resources' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {open === 'resources' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      className="absolute left-1/2 top-full mt-3 -translate-x-1/2 min-w-52 rounded-2xl glass p-2"
                    >
                      {menu.resources.map((item) =>
                        item.href.startsWith('http') ? (
                          <a
                            key={item.label}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/7 hover:text-white transition-colors"
                          >
                            {item.label} <ExternalLink size={14} className="opacity-50" />
                          </a>
                        ) : (
                          <a
                            key={item.label}
                            href={item.href}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/7 hover:text-white transition-colors"
                            onClick={() => setOpen(null)}
                          >
                            {item.label} <ChevronRight size={14} className="opacity-50" />
                          </a>
                        ),
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open('https://github.com/paparesta-007/progetto-maturita', '_blank')}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 hover:text-white hover:bg-white/6 transition-colors"
                aria-label="View source code on GitHub"
              >
                <Github size={18} /> Source
              </button>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-orange-400 transition-colors"
              >
                Login <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------
   Hero
------------------------------------------------------- */
function Hero() {
  return (
    <section id="hero" className="relative pt-32 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="absolute inset-0 gridline opacity-30" />
      <div className="absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute top-24 right-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8 items-center">
          <div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="inline-flex items-center gap-2 rounded-full chip px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/70">
              <CircleDot size={10} className="text-orange-400" /> Progetto di maturità 2025
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-5 text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-[-0.06em] leading-[0.9]"
            >
              <span className="block">A workstation for</span>
              <span className="block text-accent">AI, PDFs and study flow.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-6 max-w-2xl text-base sm:text-lg text-white/65 leading-relaxed"
            >
              Una landing ridisegnata come un sistema operativo editoriale: più spaziosa, più cinematografica, più credibile.
              L’idea è far sembrare il prodotto già vivo, non una demo generica.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-black hover:bg-orange-400 transition-colors accent-glow"
              >
                Entra nel sistema <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => window.open('https://github.com/paparesta-007/progetto-maturita', '_blank')}
                className="inline-flex items-center gap-2 rounded-2xl chip px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/8 transition-colors"
              >
                <Github size={16} /> Source code
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-10 flex flex-wrap gap-3"
            >
              {[
                'Streaming SSE',
                'RAG su PDF',
                'OpenRouter',
                'Flashcard engine',
              ].map((tag) => (
                <span key={tag} className="chip rounded-full px-3 py-1.5 text-[11px] tracking-[0.18em] uppercase text-white/65">
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="glass rounded-[2rem] p-4 sm:p-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400/90" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/90" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/90" />
                </div>
                <div className="font-mono text-[11px] text-white/50">smart-ai://session/live</div>
                <div className="h-3 w-3 rounded-full bg-orange-400/90 pulse-ring relative" />
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {/* Section 1: Conversation Layer (Full Width) */}
                <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.035] p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold">Conversation Layer</div>
                      <div className="text-[11px] text-white/45 font-mono">model: gpt-4o-mini • streaming</div>
                    </div>
                    <div className="chip rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/65">Live</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-white/10 grid place-items-center text-sm font-bold">U</div>
                      <div className="flex-1 rounded-2xl rounded-tl-sm bg-white/6 px-4 py-3 text-sm text-white/80 border border-white/6">
                        Analyze this PDF and make flashcards about neural networks.
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-orange-500/15 grid place-items-center text-orange-300 border border-orange-500/20">
                        <Bot size={18} />
                      </div>
                      <div className="flex-1 rounded-2xl rounded-tl-sm bg-black/20 px-4 py-3 text-sm border border-white/8">
                        <div className="mb-2 flex items-center gap-2 text-[11px] text-white/40 font-mono">
                          <FileText size={12} /> neural_networks.pdf
                        </div>
                        <Typewriter
                          text="I’m extracting the key ideas and shaping them into a compact study set, with concepts arranged by importance."
                          className="text-white/78"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pl-13 sm:pl-13">
                      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/8 p-3">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-orange-300/90 mb-2">Flashcard</div>
                        <div className="text-sm text-white/82">What introduces non-linearity?</div>
                      </div>
                      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 p-3">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-sky-300/90 mb-2">Quiz</div>
                        <div className="text-sm text-white/82">Which algorithm updates the weights?</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: System Summary (2/5) + Provider Switch (3/5) */}
                <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
                  {/* Section 2: System Summary */}
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-sm">System Summary</div>
                          <div className="text-[10px] text-white/45 font-mono">what makes it feel real</div>
                        </div>
                        <div className="h-8 w-8 rounded-xl bg-orange-500/10 grid place-items-center text-orange-300 border border-orange-500/20">
                          <Brain size={14} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          ['Latency', '45 ms'],
                          ['Context', 'multi-model'],
                          ['Docs', 'PDF + RAG'],
                          ['Output', 'structured'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/8 px-3 py-1.5">
                            <span className="text-[11px] text-white/55">{k}</span>
                            <span className="text-[11px] font-semibold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Provider Switch */}
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/45 font-mono mb-3">
                      <Zap size={11} className="text-orange-400" /> Provider switch
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {modelCaps.slice(0, 4).map((m) => (
                        <div key={m.name} className="rounded-xl bg-white/[0.04] border border-white/7 px-3 py-1.5">
                          <div className="text-xs font-semibold">{m.name}</div>
                          <div className="text-[10px] text-white/45 font-mono">{m.provider}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>


            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 right-4 glass-soft rounded-2xl px-4 py-3 shadow-2xl"
            >
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/45 font-mono mb-1">Status</div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Ready to answer
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
              className="absolute -bottom-4 -left-3 glass-soft rounded-2xl px-4 py-3 shadow-2xl"
            >
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/45 font-mono mb-1">Build</div>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck size={15} className="text-orange-300" />
                Auth + docs + support
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   Feature deck
------------------------------------------------------- */
function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[.72fr_1.28fr] gap-8 items-end mb-10">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange-300/90 mb-3">Capabilities</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.05em] leading-tight">
              Non come una lista di feature.
              <span className="block text-white/55">Più come una tavola di controllo.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-white/60 leading-relaxed">
            Ogni blocco ha un ruolo diverso: alcuni portano fiducia, altri mostrano potenza, altri ancora danno la sensazione di un sistema pensato davvero per lavorare.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-4">
          {featureDeck.map((f, i) => {
            const wide = i === 0 || i === 3;
            return (
              <motion.article
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                custom={i}
                className={`${wide ? 'md:col-span-7' : 'md:col-span-5'} rounded-[1.75rem] p-6 sm:p-7 glass lift overflow-hidden relative`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.tone} opacity-100 pointer-events-none`} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-black/20 border border-white/8 grid place-items-center text-orange-300">
                      <f.icon size={22} />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                      0{i + 1}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-[-0.04em] mb-3">{f.title}</h3>
                  <p className="text-white/64 leading-relaxed max-w-xl">{f.text}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   Providers strip
------------------------------------------------------- */
function Providers() {
  return (
    <section className="py-8 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/45 mb-2">Supported models</div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-[-0.04em]">Multi-provider, one interface.</h3>
            </div>
            <div className="text-sm text-white/55 max-w-xl">
              Una stessa interazione, molti motori diversi: l’utente vede un solo prodotto, ma dietro c’è un set di provider intercambiabili.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {modelCaps.map((m, i) => (
              <motion.div
                key={m.name}
                variants={slideIn}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 lift"
              >
                <div className="h-12 w-12 rounded-2xl bg-white/8 border border-white/8 grid place-items-center mb-3">
                  <Cpu size={18} className="text-orange-300" />
                </div>
                <div className="font-semibold leading-tight">{m.name}</div>
                <div className="text-[11px] mt-1 text-white/45 font-mono uppercase tracking-[0.18em]">{m.provider}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   Workflow
------------------------------------------------------- */
function WorkflowSection() {
  return (
    <section id="workflow" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-start">
          <div className="sticky top-24">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange-300/90 mb-3">Workflow</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.05em] leading-tight mb-5">
              Tre mosse.
              <span className="block text-white/55">Zero fronzoli, solo progressione.</span>
            </h2>
            <p className="text-white/60 leading-relaxed max-w-xl">
              Il layout guida l’occhio in modo netto: prima l’ingresso, poi l’interpretazione, infine la trasformazione del contenuto in materiale utile.
            </p>
          </div>

          <div className="space-y-4">
            {workflow.map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                custom={i}
                className="glass rounded-[1.75rem] p-5 sm:p-6 lift"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 rounded-2xl bg-orange-500/12 border border-orange-500/20 grid place-items-center text-orange-300 shrink-0">
                    <item.icon size={20} />
                    <span className="absolute -bottom-2 -right-2 rounded-full bg-black/70 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-white/65">
                      {item.step}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-bold tracking-[-0.03em] mb-2">{item.title}</div>
                    <p className="text-white/62 leading-relaxed max-w-2xl">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   FAQ
------------------------------------------------------- */
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange-300/90 mb-3">FAQ</div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.05em]">Domande tipiche, risposta pulita.</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q} className="glass rounded-[1.5rem] overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold tracking-[-0.02em]">{faq.q}</span>
                  {isOpen ? <Minus size={18} className="text-orange-300 shrink-0" /> : <Plus size={18} className="text-white/45 shrink-0" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-5 text-white/62 leading-relaxed border-t border-white/8 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   About / Footer
------------------------------------------------------- */
function About() {
  return (
    <section id="about" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-[2rem] p-6 sm:p-10 lg:p-12 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-white/5 pointer-events-none" />
          <div className="relative grid lg:grid-cols-[.9fr_1.1fr] gap-8 items-center">
            <div>
              <div className="h-20 w-20 rounded-[1.75rem] bg-gradient-to-br from-orange-500 to-orange-300 text-black grid place-items-center font-extrabold text-xl shadow-lg shadow-orange-950/20 mb-6">
                TP
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange-300/90 mb-3">Author</div>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.05em]">Tommaso Paparesta</h3>
              <p className="mt-3 text-white/58 max-w-xl leading-relaxed">
                Un progetto di maturità che racconta AI, documenti e interfacce come un prodotto vero, non come una presentazione scolastica.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['Open-source', 'GitHub first'],
                ['Study-oriented', 'PDF + flashcards'],
                ['Secure auth', 'Protected routes'],
                ['Live feel', 'Streaming responses'],
              ].map(([title, subtitle]) => (
                <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-white/50 mt-1 font-mono">{subtitle}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => window.open('https://github.com/paparesta-007/progetto-maturita', '_blank')}
              className="inline-flex items-center gap-2 rounded-2xl chip px-4 py-3 text-sm text-white/78 hover:bg-white/8 transition-colors"
            >
              <Github size={16} /> GitHub
            </button>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-black hover:bg-orange-400 transition-colors"
            >
              Open app <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-white/8 pt-6 text-sm text-white/45">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-orange-300" />
            <span className="font-semibold text-white/70">Smart AI</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">2025</span>
          </div>
          <div className="flex flex-wrap gap-5 font-mono text-[11px] uppercase tracking-[0.18em]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */
export default function LandingPage() {
  return (
    <>
      <SystemStyles />
      <div className="noise min-h-screen selection:bg-orange-400 selection:text-black">
        <TopNav />
        <main>
          <Hero />
          <Features />
          <Providers />
          <WorkflowSection />
          <FAQ />
          <About />
        </main>
        <Footer />
      </div>
    </>
  );
}
