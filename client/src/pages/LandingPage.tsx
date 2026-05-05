import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Plus, Bot, FileText, Zap, ChevronRight, CheckCircle2, Search, Brain, LayoutDashboard, ShieldCheck, Cpu, Database, Layers } from 'lucide-react';
import { LandingStyles, fadeUp } from './LandingStyles';

function useScrolled(t = 16) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const fn = () => setS(window.scrollY > t);
    fn(); window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [t]);
  return s;
}

function ScrollWord({ children, progress, range }: { children: string, progress: any, range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.3, 1]);
  const color = useTransform(progress, range, ['#a3a3a3', '#171717']);
  return (
    <motion.span style={{ opacity, color }}>
      {children}
    </motion.span>
  );
}

function WordReveal({ text, className = "" }: { text: string, className?: string }) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 0.9", "end 0.6"]
  });
  
  const words = text.split(' ');
  return (
    <p ref={container} className={`flex flex-wrap gap-x-[0.35em] ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + (1 / words.length);
        return (
          <ScrollWord key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </ScrollWord>
        );
      })}
    </p>
  );
}

function Navbar() {
  const scrolled = useScrolled(20);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-[#e5e5e5] h-16' : 'bg-transparent h-24'}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-[#171717] text-white flex items-center justify-center shadow-sm">
            <Sparkles size={18} />
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#171717]">Smart AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          {['Product', 'Intelligence', 'Workflow', 'Security'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-[#737373] hover:text-[#171717] transition-colors">{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-[#737373] hover:text-[#171717] transition-colors">Sign in</Link>
          <Link to="/login" className="warm-btn-primary !py-2 !px-5 text-sm !rounded-full shadow-sm">Get Started</Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 bg-[#ffffff] overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f9f8f6] border border-[#e5e5e5] text-[12px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-8">
              <Zap size={12} className="text-[#b08968]" /> Precision Engineering for Thought
            </motion.div>
            <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
              className="text-6xl sm:text-7xl lg:text-[7.5rem] font-normal tracking-[-0.04em] leading-[0.9] text-[#171717]">
              Orchestrate <br />
              <span className="serif-accent italic text-[#b08968]">your legacy.</span>
            </motion.h1>
            <WordReveal 
                className="mt-12 text-xl font-light max-w-lg leading-relaxed" 
                text="A high-performance workstation for the digital age. Smart AI transforms how you interact with information, merging the raw power of large language models with the structured precision of your own private document library." 
            />
            <WordReveal 
                className="mt-6 text-base font-light max-w-md leading-relaxed text-[#a3a3a3]" 
                text="Built for the relentless researcher who demands more than a simple chat box. Our architecture is designed to handle complex cross-document synthesis while maintaining the highest standard of cognitive clarity and speed." 
            />
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-12 flex items-center gap-6">
              <Link to="/login" className="warm-btn-primary !px-8 !py-4 text-base !rounded-full">Start Building</Link>
              <button className="flex items-center gap-2 text-[#737373] hover:text-[#171717] font-medium transition-colors">
                Explore the technical manifest <ChevronRight size={18} />
              </button>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:h-[650px] w-full rounded-[2.5rem] bg-[#f9f8f6] border border-[#e5e5e5] editorial-shadow p-4 lg:p-8">
            <div className="h-full w-full bg-white rounded-[1.5rem] border border-[#e5e5e5] overflow-hidden flex flex-col">
              <div className="h-14 border-b border-[#e5e5e5] flex items-center px-6 justify-between bg-[#fcfbf9]">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5]" />)}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-widest text-[#a3a3a3]">Research Environment v1.0</div>
                <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="flex-1 p-8 flex flex-col justify-center max-w-md mx-auto w-full">
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#f9f8f6] border border-[#e5e5e5] flex items-center justify-center text-[#b08968]">
                      <Brain size={20} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="h-3 bg-[#f9f8f6] rounded w-full" />
                      <div className="h-3 bg-[#f9f8f6] rounded w-3/4" />
                      <div className="h-3 bg-[#f9f8f6] rounded w-1/2" />
                    </div>
                  </div>
                  <div className="bg-[#f9f8f6] rounded-2xl p-6 border border-[#e5e5e5] space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#a3a3a3] uppercase tracking-tighter">
                      <span>Vector Indexing</span>
                      <span>94% Synchronized</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#e5e5e5] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} transition={{ duration: 2, delay: 1 }} className="h-full bg-[#b08968]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['Semantic', 'Citation', 'Extract'].map(tag => (
                      <div key={tag} className="px-3 py-2 rounded-xl border border-[#e5e5e5] text-[10px] font-bold uppercase text-center text-[#a3a3a3]">{tag}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#e5e5e5] bg-[#fcfbf9]">
                <div className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-xl px-4 py-4 text-sm text-[#a3a3a3]">
                  <Search size={16} />
                  <span>Synthesize findings across library...</span>
                </div>
              </div>
            </div>
            
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-8 top-1/4 h-24 w-56 bg-white border border-[#e5e5e5] rounded-2xl editorial-shadow p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#b08968]" />
                <span className="text-[10px] font-bold uppercase text-[#737373]">Knowledge Hub</span>
              </div>
              <div className="text-xs font-semibold text-[#171717]">482 Sources connected</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PhilosophySection() {
  return (
    <section id="intelligence" className="py-24 lg:py-40 bg-[#fcfbf9]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="warm-section-label">Philosophy of Focus</div>
            <h2 className="text-4xl sm:text-6xl tracking-tight text-[#171717] leading-tight">Quiet tools for <br /><span className="serif-accent italic text-[#a3a3a3]">loud minds.</span></h2>
            <WordReveal 
                text="In an era of constant distraction, true breakthroughs happen in silence. Smart AI is built on the belief that software should vanish when you are working, leaving only the essentials at your fingertips. We don't build features to keep you in the app; we build them to help you get the work done." 
                className="text-lg font-light leading-relaxed max-w-xl"
            />
            <WordReveal 
                text="Our interface is a direct manifestation of this philosophy. By removing gradients, glows, and noise, we create a sanctuary for thought. Every pixel has a purpose, every interaction is intentional. This is not just another SaaS tool; it is a dedicated environment for cognitive excellence." 
                className="text-base font-light leading-relaxed text-[#737373] max-w-lg"
            />
            <div className="pt-6 grid grid-cols-2 gap-8">
              <div>
                <div className="text-2xl font-normal text-[#171717] mb-2">Zero Friction</div>
                <p className="text-sm text-[#a3a3a3] font-light">From idea to execution in seconds, not clicks.</p>
              </div>
              <div>
                <div className="text-2xl font-normal text-[#171717] mb-2">Infinite Context</div>
                <p className="text-sm text-[#a3a3a3] font-light">Your entire library, instantly accessible and understood.</p>
              </div>
            </div>
          </div>
          <div className="relative aspect-square lg:aspect-auto lg:h-[500px] rounded-[3rem] bg-white border border-[#e5e5e5] editorial-shadow overflow-hidden p-12">
             <div className="absolute inset-0 bg-grid-pattern opacity-10" />
             <div className="relative h-full w-full border border-[#e5e5e5] rounded-[2rem] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="relative h-48 w-48 border border-dashed border-[#e5e5e5] rounded-full flex items-center justify-center">
                   <div className="h-32 w-32 border border-[#e5e5e5] rounded-full flex items-center justify-center">
                      <Sparkles size={40} className="text-[#b08968]" />
                   </div>
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-[#fcfbf9] border border-[#e5e5e5] rounded-lg flex items-center justify-center"><Cpu size={14} /></div>
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-8 w-8 bg-[#fcfbf9] border border-[#e5e5e5] rounded-lg flex items-center justify-center"><Database size={14} /></div>
                </motion.div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoFeatures() {
  const features = [
    { title: 'Neural Retrieval Engine', desc: 'Our custom RAG pipeline doesn\'t just search; it understands. It identifies relationships across hundreds of documents, surfacing the exact paragraph you need with pinpoint citations and contextual relevance.', icon: Layers, color: 'text-indigo-500' },
    { title: 'Multi-Model Fabric', desc: 'The ability to switch intelligence on the fly. Use Claude for reasoning, GPT-4 for logic, and Llama for speed—all within the same thread, preserving your workspace state and active document context.', icon: Brain, color: 'text-orange-500' },
    { title: 'Privacy First Architecture', desc: 'Your research is your edge. We treat your data with absolute reverence. Local-first principles and enterprise-grade encryption ensure your knowledge base remains yours alone.', icon: ShieldCheck, color: 'text-emerald-500' }
  ];

  return (
    <section id="product" className="py-24 lg:py-40 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-24 max-w-3xl">
          <div className="warm-section-label mb-6">Technical Architecture</div>
          <h2 className="text-4xl sm:text-6xl tracking-tight text-[#171717] mb-8 font-normal">Engineered for <br /> <span className="text-[#a3a3a3] italic serif-accent">uncompromising performance.</span></h2>
          <WordReveal 
            text="We built Smart AI from the ground up to solve the specific bottlenecks of academic and professional research. From vector synchronization to streaming inference, every layer is optimized for speed and reliability."
            className="text-xl text-[#737373] font-light max-w-2xl leading-relaxed mb-6"
          />
          <WordReveal 
            text="Traditional LLM interfaces are broad and shallow. We chose a different path: narrow and deep. By focusing exclusively on the document-to-insight pipeline, we've achieved a level of integration that general-purpose AI simply cannot match."
            className="text-base text-[#a3a3a3] font-light max-w-2xl leading-relaxed"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-10 rounded-[2.5rem] bg-[#f9f8f6] border border-[#e5e5e5] hover:bg-white transition-all duration-500 group editorial-shadow">
              <div className={`h-14 w-14 rounded-[1.25rem] bg-white border border-[#e5e5e5] flex items-center justify-center mb-10 ${f.color} shadow-sm group-hover:scale-110 transition-transform`}>
                <f.icon size={26} />
              </div>
              <h3 className="text-2xl font-normal text-[#171717] mb-6">{f.title}</h3>
              <p className="text-[#737373] leading-relaxed font-light text-base">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductQuote() {
  return (
    <section className="py-24 lg:py-48 bg-[#fcfbf9] border-y border-[#e5e5e5]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#171717] text-white mb-12 shadow-lg">
          <Sparkles size={24} />
        </div>
        <blockquote className="text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.1] tracking-tight text-[#171717]">
          "Precision is the <span className="serif-accent italic text-[#b08968]">final form</span> of intelligence. We don't just find answers; we reveal the architecture of knowledge."
        </blockquote>
        <div className="mt-14 flex items-center justify-center gap-5">
          <img src={`https://ui-avatars.com/api/?name=TP&background=171717&color=fff`} className="h-12 w-12 rounded-2xl shadow-sm" alt="Author" />
          <div className="text-left">
            <div className="text-base font-semibold text-[#171717]">Tommaso Paparesta</div>
            <div className="text-sm text-[#a3a3a3] font-light uppercase tracking-widest">Lead Architect • Smart AI</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { step: '01', title: 'Contextual Ingestion', desc: 'Drop multi-format documents (PDF, MD, TXT). Our system immediately vectorizes the content, building a semantic map of every concept, date, and relationship within the data.' },
    { step: '02', title: 'Intelligent Querying', desc: 'Engage with your library using natural language. Our system selects the most relevant chunks using hybrid search (Keyword + Semantic) and feeds them into the model of your choice.' },
    { step: '03', title: 'Knowledge Synthesis', desc: 'Go beyond simple answers. Generate comprehensive literature reviews, structured study guides, or automated flashcards that are permanently linked to their sources.' }
  ];

  return (
    <section id="workflow" className="py-24 lg:py-40 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-start">
          <div className="sticky top-40">
            <div className="warm-section-label mb-6">The Workflow</div>
            <h2 className="text-4xl sm:text-7xl tracking-tighter text-[#171717] mb-10 leading-tight">From data to <br /> <span className="text-[#a3a3a3] italic serif-accent">wisdom.</span></h2>
            <WordReveal 
                text="The bridge between information and insight is a well-defined process. We've automated the heavy lifting of organization and retrieval so you can focus on the higher-order task: thinking."
                className="text-xl text-[#737373] font-light max-w-md mb-8 leading-relaxed"
            />
            <WordReveal 
                text="Our RAG (Retrieval-Augmented Generation) pipeline is fine-tuned for academic integrity. Every claim made by the AI is backed by a direct link to your uploaded documents, ensuring that you never have to guess about the validity of a response."
                className="text-base text-[#a3a3a3] font-light max-w-md mb-12 leading-relaxed"
            />
          </div>
          <div className="space-y-20">
            {steps.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group">
                <div className="flex items-center gap-6 mb-6">
                  <span className="text-6xl font-normal text-[#f0eee6] group-hover:text-[#b08968] transition-colors duration-700">{s.step}</span>
                  <div className="h-px bg-[#e5e5e5] flex-1" />
                </div>
                <h4 className="text-3xl font-normal text-[#171717] mb-4">{s.title}</h4>
                <p className="text-[#737373] font-light text-lg leading-relaxed max-w-xl">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="py-24 lg:py-40 bg-[#fcfbf9] border-t border-[#e5e5e5]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <div className="warm-section-label mb-6 mx-auto">Security & Trust</div>
        <h2 className="text-4xl sm:text-6xl tracking-tight text-[#171717] mb-12 font-normal">Your intellectual property, <br /> <span className="text-[#a3a3a3] italic serif-accent">sovereign and secure.</span></h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { t: 'Encryption', d: 'AES-256 at rest and TLS 1.3 in transit.', i: ShieldCheck },
             { t: 'Sovereignty', d: 'You own your data. We never train on your documents.', i: Database },
             { t: 'Compliance', d: 'Built with rigorous data protection standards.', i: CheckCircle2 },
             { t: 'Reliability', d: '99.9% uptime with distributed infrastructure.', i: Zap }
           ].map(item => (
             <div key={item.t} className="bg-white p-8 rounded-3xl border border-[#e5e5e5] text-left hover:shadow-md transition-shadow">
               <div className="h-10 w-10 rounded-xl bg-[#f9f8f6] border border-[#e5e5e5] flex items-center justify-center text-[#b08968] mb-6">
                 <item.i size={20} />
               </div>
               <div className="text-lg font-semibold text-[#171717] mb-2">{item.t}</div>
               <p className="text-sm text-[#737373] font-light leading-relaxed">{item.d}</p>
             </div>
           ))}
        </div>
        <WordReveal 
          text="We understand that for professional researchers, privacy is not a feature—it is a requirement. Smart AI is built to be a fortress for your ideas, combining the convenience of cloud-based AI with the security profile of a local workstation."
          className="mt-16 text-lg text-[#a3a3a3] font-light max-w-3xl mx-auto leading-relaxed"
        />
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 lg:py-48">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative rounded-[5rem] bg-[#171717] px-8 py-32 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#262626_0%,_transparent_100%)] opacity-50" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-5xl sm:text-7xl font-normal tracking-tight text-white mb-10 leading-tight">Begin your <br /> <span className="serif-accent italic text-[#b08968]">ascension.</span></h2>
            <p className="text-neutral-400 text-xl mb-16 font-light leading-relaxed">Join a new generation of thinkers who are using precision intelligence to redefine the boundaries of their research.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-6 bg-white text-[#171717] rounded-full text-lg font-semibold hover:bg-[#f9f8f6] transition-colors shadow-2xl">
                Get Started for free <ArrowRight size={22} />
              </Link>
              <button className="text-neutral-500 hover:text-white transition-colors text-lg font-medium">Talk to an architect</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-24 border-t border-[#e5e5e5] bg-[#fcfbf9]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 lg:gap-10">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-10 w-10 rounded-xl bg-[#171717] text-white flex items-center justify-center shadow-lg">
                <Sparkles size={20} />
              </div>
              <span className="font-semibold text-xl text-[#171717] tracking-tight">Smart AI</span>
            </div>
            <p className="text-base text-[#737373] font-light leading-relaxed mb-8">A specialized workspace for deep thinking and intelligent interaction. We build tools that honor the complexity of human research and the speed of digital information.</p>
            <div className="flex gap-4">
               {[1, 2, 3].map(i => <div key={i} className="h-10 w-10 rounded-full border border-[#e5e5e5] bg-white" />)}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 lg:gap-24">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a3a3a3] mb-8">Platform</div>
              <div className="flex flex-col gap-4">
                {['Intelligence', 'Documents', 'Security', 'Pricing', 'API'].map(l => <a key={l} href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">{l}</a>)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a3a3a3] mb-8">Company</div>
              <div className="flex flex-col gap-4">
                {['Journal', 'About', 'Contact', 'Careers'].map(l => <a key={l} href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">{l}</a>)}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a3a3a3] mb-8">Support</div>
              <div className="flex flex-col gap-4">
                {['Documentation', 'Help Center', 'Twitter', 'GitHub'].map(l => <a key={l} href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">{l}</a>)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-24 pt-10 border-t border-[#e5e5e5] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[12px] text-[#a3a3a3] uppercase tracking-[0.15em] font-medium">© 2025 Smart AI Systems Inc. Crafted for deep work.</div>
          <div className="flex gap-10 text-[12px] text-[#a3a3a3] uppercase tracking-[0.15em] font-medium">
            <a href="#" className="hover:text-[#171717]">Privacy Policy</a>
            <a href="#" className="hover:text-[#171717]">Terms</a>
            <a href="#" className="hover:text-[#171717]">Cookies</a>
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
      <div className="landing-page selection:bg-[#b08968]/15 text-[#171717] antialiased">
        <Navbar />
        <main>
          <HeroSection />
          <PhilosophySection />
          <BentoFeatures />
          <ProductQuote />
          <HowItWorks />
          <SecuritySection />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
