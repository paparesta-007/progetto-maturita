import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Github, Sparkles, ChevronDown, ChevronRight, Minus, Plus, ExternalLink, Bot, FileText, CircleDot } from 'lucide-react';
import { LandingStyles, fadeUp, slideIn, featureDeck, modelCaps, workflow, faqs } from './LandingStyles';

function useScrolled(t = 16) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const fn = () => setS(window.scrollY > t);
    fn(); window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [t]);
  return s;
}

function TopNav() {
  const scrolled = useScrolled(14);
  const [open, setOpen] = useState<null | 'product' | 'resources'>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('[data-dropdown]')) setOpen(null); };
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn);
  }, []);
  const menu = {
    product: [{ label: 'Overview', href: '#hero' }, { label: 'Features', href: '#features' }, { label: 'Workflow', href: '#workflow' }],
    resources: [{ label: 'FAQ', href: '#faq' }, { label: 'About', href: '#about' }, { label: 'GitHub', href: 'https://github.com/paparesta-007/progetto-maturita' }, { label: 'Help', href: '/help' }],
  } as const;
  const toggle = (k: 'product' | 'resources') => setOpen(cur => cur === k ? null : k);
  const Dropdown = ({ id }: { id: 'product' | 'resources' }) => (
    <div className="relative" data-dropdown>
      <button onClick={() => toggle(id)} className="inline-flex items-center gap-1 hover:text-[#2c2825] transition-colors capitalize">
        {id} <ChevronDown size={14} className={`transition-transform ${open === id ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open === id && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute left-1/2 top-full mt-3 -translate-x-1/2 min-w-52 rounded-xl warm-card p-2 z-50">
            {menu[id].map(item => item.href.startsWith('http') ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#8c8278] hover:bg-[#f5f0eb] hover:text-[#2c2825] transition-colors">
                {item.label} <ExternalLink size={14} className="opacity-40" />
              </a>
            ) : (
              <a key={item.label} href={item.href} onClick={() => setOpen(null)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#8c8278] hover:bg-[#f5f0eb] hover:text-[#2c2825] transition-colors">
                {item.label} <ChevronRight size={14} className="opacity-40" />
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'pt-3' : 'pt-5'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`warm-glass rounded-2xl px-4 py-3 ${scrolled ? 'shadow-lg' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-[#2c2825] text-white grid place-items-center shadow-md">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight text-[#2c2825]">Smart AI</span>
                  <span className="hidden sm:inline-flex text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full warm-chip">v2.0</span>
                </div>
                <div className="text-[11px] text-[#b5a99a]">multi-model learning OS</div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm text-[#8c8278]">
              <Dropdown id="product" />
              <a href="#features" className="hover:text-[#2c2825] transition-colors">Features</a>
              <a href="#workflow" className="hover:text-[#2c2825] transition-colors">Workflow</a>
              <a href="#faq" className="hover:text-[#2c2825] transition-colors">FAQ</a>
              <Dropdown id="resources" />
            </nav>
            <div className="flex items-center gap-2">
              <button onClick={() => window.open('https://github.com/paparesta-007/progetto-maturita', '_blank')}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#8c8278] hover:text-[#2c2825] hover:bg-[#f5f0eb] transition-colors">
                <Github size={18} /> Source
              </button>
              <Link to="/login" className="warm-btn-primary inline-flex items-center gap-2 !py-2 !px-4 text-sm">
                Login <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="hero" className="relative pt-32 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e8e2d9] to-transparent" />
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#dbc1ac]/20 blur-3xl" />
      <div className="absolute top-24 right-0 h-64 w-64 rounded-full bg-[#e8e2d9]/40 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8 items-center">
          <div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
              className="inline-flex items-center gap-2 rounded-full warm-chip px-3 py-1.5 text-[11px] uppercase tracking-[0.2em]">
              <CircleDot size={10} className="text-[#b08968]" /> Progetto di maturità 2025
            </motion.div>
            <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
              className="mt-5 text-5xl sm:text-6xl lg:text-[5.5rem] font-normal tracking-[-0.04em] leading-[0.95]">
              <span className="block">A workstation for</span>
              <span className="block serif-accent italic">AI, PDFs and study flow.</span>
            </motion.h1>
            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
              className="mt-6 max-w-2xl text-base sm:text-lg text-[#8c8278] leading-relaxed font-light">
              Un'interfaccia pensata per lavorare davvero con documenti e intelligenza artificiale. Semplice, curata, pronta.
            </motion.p>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login" className="warm-btn-primary inline-flex items-center gap-2">
                Entra nel sistema <ArrowRight size={16} />
              </Link>
              <button onClick={() => window.open('https://github.com/paparesta-007/progetto-maturita', '_blank')}
                className="warm-btn-ghost inline-flex items-center gap-2">
                <Github size={16} /> Source code
              </button>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-10 flex flex-wrap gap-3">
              {['Streaming SSE', 'RAG su PDF', 'OpenRouter', 'Flashcard engine'].map(tag => (
                <span key={tag} className="warm-chip rounded-full px-3 py-1.5 text-[11px] tracking-[0.15em] uppercase">{tag}</span>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} className="relative">
            <div className="warm-card !rounded-[2rem] p-4 sm:p-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e8e2d9] pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-300" />
                  <div className="h-3 w-3 rounded-full bg-amber-300" />
                  <div className="h-3 w-3 rounded-full bg-emerald-300" />
                </div>
                <div className="text-[11px] text-[#b5a99a]">smart-ai · session</div>
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <div className="rounded-2xl border border-[#e8e2d9] bg-[#faf9f6] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-sm text-[#2c2825]">Conversation</div>
                    <div className="warm-chip rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider">Live</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#f5f0eb] grid place-items-center text-sm font-bold text-[#8c8278]">U</div>
                      <div className="flex-1 rounded-xl rounded-tl-sm bg-[#f0ebe4] px-4 py-2.5 text-sm text-[#2c2825]">
                        Analyze this PDF and make flashcards about neural networks.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#b08968]/10 grid place-items-center text-[#b08968] border border-[#b08968]/20">
                        <Bot size={16} />
                      </div>
                      <div className="flex-1 rounded-xl rounded-tl-sm bg-white px-4 py-2.5 text-sm border border-[#e8e2d9]">
                        <div className="mb-1.5 flex items-center gap-2 text-[11px] text-[#b5a99a]">
                          <FileText size={12} /> neural_networks.pdf
                        </div>
                        <span className="text-[#8c8278]">Extracting key ideas and shaping them into a compact study set…</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-12">
                      <div className="rounded-xl border border-[#b08968]/20 bg-[#b08968]/5 p-2.5">
                        <div className="text-[10px] uppercase tracking-wider text-[#b08968] mb-1">Flashcard</div>
                        <div className="text-xs text-[#2c2825]">What introduces non-linearity?</div>
                      </div>
                      <div className="rounded-xl border border-[#6b8cae]/20 bg-[#6b8cae]/5 p-2.5">
                        <div className="text-[10px] uppercase tracking-wider text-[#6b8cae] mb-1">Quiz</div>
                        <div className="text-xs text-[#2c2825]">Which algorithm updates the weights?</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 right-4 warm-card !rounded-xl px-4 py-2.5 !shadow-lg">
              <div className="text-[10px] uppercase tracking-wider text-[#b5a99a] mb-0.5">Status</div>
              <div className="flex items-center gap-2 text-sm text-[#2c2825]">
                <div className="h-2 w-2 rounded-full bg-emerald-400" /> Ready
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[.72fr_1.28fr] gap-8 items-end mb-10">
          <div>
            <div className="warm-section-label mb-3">Capabilities</div>
            <h2 className="text-3xl sm:text-5xl tracking-[-0.03em] leading-tight">
              Non una lista di feature.
              <span className="block text-[#8c8278] italic">Una tavola di controllo.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-[#8c8278] leading-relaxed font-light">
            Ogni blocco ha un ruolo diverso: alcuni portano fiducia, altri mostrano potenza, altri ancora danno la sensazione di un sistema pensato davvero per lavorare.
          </p>
        </div>
        <div className="grid md:grid-cols-12 gap-4">
          {featureDeck.map((f, i) => (
            <motion.article key={f.title} variants={fadeUp} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: '-80px' }} custom={i}
              className={`${i <= 1 ? 'md:col-span-6' : 'md:col-span-4'} warm-card p-6 sm:p-7 overflow-hidden`}>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-[#f5f0eb] border border-[#e8e2d9] grid place-items-center text-[#b08968]">
                  <f.icon size={22} />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[#b5a99a]">0{i + 1}</div>
              </div>
              <h3 className="text-2xl tracking-[-0.03em] mb-3 !font-normal">{f.title}</h3>
              <p className="text-[#8c8278] leading-relaxed">{f.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Providers() {
  return (
    <section className="py-8 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="warm-card !rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="warm-section-label mb-2">Supported models</div>
              <h3 className="text-2xl sm:text-3xl tracking-[-0.03em]">Multi-provider, one interface.</h3>
            </div>
            <div className="text-sm text-[#8c8278] max-w-xl font-light">
              Una stessa interazione, molti motori diversi: l'utente vede un solo prodotto, ma dietro c'è un set di provider intercambiabili.
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {modelCaps.map((m, i) => (
              <motion.div key={m.name} variants={slideIn} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                className="rounded-2xl border border-[#e8e2d9] bg-[#faf9f6] p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="h-10 w-10 rounded-xl bg-[#f5f0eb] border border-[#e8e2d9] grid place-items-center mb-3">
                  <span className="text-[#b08968] text-xs font-bold">{m.name.slice(0, 2)}</span>
                </div>
                <div className="font-semibold text-[#2c2825] text-sm">{m.name}</div>
                <div className="text-[11px] mt-1 text-[#b5a99a] uppercase tracking-wider">{m.provider}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="sticky top-24">
            <div className="warm-section-label mb-3">Workflow</div>
            <h2 className="text-3xl sm:text-5xl tracking-[-0.03em] leading-tight mb-5">
              Tre mosse.
              <span className="block text-[#8c8278] italic">Zero fronzoli.</span>
            </h2>
            <p className="text-[#8c8278] leading-relaxed max-w-xl font-light">
              Il layout guida l'occhio in modo netto: prima l'ingresso, poi l'interpretazione, infine la trasformazione del contenuto in materiale utile.
            </p>
          </div>
          <div className="space-y-4">
            {workflow.map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: '-60px' }} custom={i} className="warm-card p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 rounded-2xl bg-[#b08968]/10 border border-[#b08968]/20 grid place-items-center text-[#b08968] shrink-0">
                    <item.icon size={20} />
                    <span className="absolute -bottom-2 -right-2 rounded-full bg-white border border-[#e8e2d9] px-2 py-0.5 text-[10px] text-[#8c8278]">{item.step}</span>
                  </div>
                  <div>
                    <div className="text-xl tracking-[-0.02em] mb-2">{item.title}</div>
                    <p className="text-[#8c8278] leading-relaxed">{item.description}</p>
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

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="warm-section-label mb-3">FAQ</div>
          <h2 className="text-3xl sm:text-5xl tracking-[-0.03em]">Domande frequenti.</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q} className="warm-card overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-[#faf9f6] transition-colors">
                  <span className="font-semibold tracking-[-0.01em] text-[#2c2825]" style={{ fontFamily: 'Inter' }}>{faq.q}</span>
                  {isOpen ? <Minus size={18} className="text-[#b08968] shrink-0" /> : <Plus size={18} className="text-[#b5a99a] shrink-0" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <div className="px-5 sm:px-6 pb-5 text-[#8c8278] leading-relaxed border-t border-[#e8e2d9] pt-4">{faq.a}</div>
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

function About() {
  return (
    <section id="about" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="warm-card !rounded-[2rem] p-6 sm:p-10 lg:p-12 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#b08968]/5 via-transparent to-[#e8e2d9]/20 pointer-events-none" />
          <div className="relative grid lg:grid-cols-[.9fr_1.1fr] gap-8 items-center">
            <div>
              <div className="h-20 w-20 rounded-[1.75rem] bg-[#2c2825] text-white grid place-items-center font-bold text-xl shadow-lg mb-6">TP</div>
              <div className="warm-section-label mb-3">Author</div>
              <h3 className="text-3xl sm:text-4xl tracking-[-0.03em]">Tommaso Paparesta</h3>
              <p className="mt-3 text-[#8c8278] max-w-xl leading-relaxed font-light">
                Un progetto di maturità che racconta AI, documenti e interfacce come un prodotto vero, non come una presentazione scolastica.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[['Open-source', 'GitHub first'], ['Study-oriented', 'PDF + flashcards'], ['Secure auth', 'Protected routes'], ['Live feel', 'Streaming responses']].map(([title, sub]) => (
                <div key={title} className="rounded-2xl border border-[#e8e2d9] bg-[#faf9f6] p-4">
                  <div className="font-semibold text-[#2c2825]">{title}</div>
                  <div className="text-sm text-[#b5a99a] mt-1">{sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <button onClick={() => window.open('https://github.com/paparesta-007/progetto-maturita', '_blank')}
              className="warm-btn-ghost inline-flex items-center gap-2"><Github size={16} /> GitHub</button>
            <Link to="/login" className="warm-btn-primary inline-flex items-center gap-2">Open app <ArrowRight size={16} /></Link>
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-[#e8e2d9] pt-6 text-sm text-[#b5a99a]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#b08968]" />
            <span className="font-semibold text-[#2c2825]">Smart AI</span>
            <span className="text-[11px] uppercase tracking-wider">2025</span>
          </div>
          <div className="flex flex-wrap gap-5 text-[11px] uppercase tracking-wider">
            <a href="#features" className="hover:text-[#2c2825] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[#2c2825] transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-[#2c2825] transition-colors">FAQ</a>
            <a href="#about" className="hover:text-[#2c2825] transition-colors">About</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <>
      <LandingStyles />
      <div className="landing-page min-h-screen">
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
