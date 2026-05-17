import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Plus, Bot, FileText, Zap, ChevronRight, CheckCircle2, Search, Brain, LayoutDashboard, ShieldCheck, Cpu, Database, Layers, Github, Linkedin, Instagram } from 'lucide-react';
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
          {[{label:'Prodotto', id:'product'}, {label:'Intelligenza', id:'intelligence'}, {label:'Flusso', id:'workflow'}, {label:'Sicurezza', id:'security'}].map(item => (
            <a key={item.id} href={`#${item.id}`} className="text-sm font-medium text-[#737373] hover:text-[#171717] transition-colors">{item.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-[#737373] hover:text-[#171717] transition-colors">Accedi</Link>
          <Link to="/login" className="warm-btn-primary !py-2 !px-5 text-sm !rounded-full shadow-sm">Inizia Ora</Link>
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
              <Zap size={12} className="text-[#b08968]" /> Ingegneria di Precisione per il Pensiero
            </motion.div>
            <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
              className="text-6xl sm:text-7xl lg:text-[7.5rem] font-normal tracking-[-0.04em] leading-[0.9] text-[#171717]">
              Un\'IA che <br />
              <span className="serif-accent italic text-[#b08968]">lavora per te. Davvero.</span>
            </motion.h1>
            <WordReveal 
                className="mt-12 text-xl font-light max-w-lg leading-relaxed" 
                text="Oltre la semplice chat. Una forza lavoro ad alta utilità progettata per gestire il tuo calendario, strutturare i tuoi dati e ricordare ogni documento che hai letto con precisione assoluta. Costruita per chi crea: i nostri agenti non si limitano a rispondere alle domande, ma eseguono compiti, pianificano flussi e mappano in tempo reale le relazioni tra i tuoi progetti." 
            />
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-12 flex items-center gap-6">
              <Link to="/login" className="warm-btn-primary !px-8 !py-4 text-base !rounded-full">Schiera il tuo Agente</Link>
              <button className="flex items-center gap-2 text-[#737373] hover:text-[#171717] font-medium transition-colors">
                Guardalo in azione <ChevronRight size={18} />
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
                <div className="text-[11px] font-medium uppercase tracking-widest text-[#a3a3a3]">Ambiente di Ricerca v1.0</div>
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
                      <span>Indicizzazione Vettoriale</span>
                      <span>94% Sincronizzato</span>
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
                  <span>Sintetizza i risultati in tutta la libreria...</span>
                </div>
              </div>
            </div>
            
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-8 top-1/4 h-24 w-56 bg-white border border-[#e5e5e5] rounded-2xl editorial-shadow p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#b08968]" />
                <span className="text-[10px] font-bold uppercase text-[#737373]">Hub di Conoscenza</span>
              </div>
              <div className="text-xs font-semibold text-[#171717]">482 Fonti connesse</div>
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
            <div className="warm-section-label">Lo Standard di Utilità</div>
            <h2 className="text-4xl sm:text-6xl tracking-tight text-[#171717] leading-tight">Agenti che <br /><span className="serif-accent italic text-[#a3a3a3]">agiscono concretamente.</span></h2>
            <WordReveal 
                text="In un mondo pieno di hype sull\'IA, noi ci concentriamo sull\'utilità. Smart AI non è solo un\'altra interfaccia per gli LLM; è un motore per la produttività. Costruiamo agenti che comprendono il tuo contesto, rispettano il tuo tempo e gestiscono il carico amministrativo. Ogni funzionalità ha un obiettivo: il risultato. Che si tratti di riprogrammare una riunione per proteggere il tuo lavoro profondo o mappare una base di conoscenza, l\'IA lavora per te." 
                className="text-lg font-light leading-relaxed max-w-xl"
            />
            <div className="pt-6 grid grid-cols-2 gap-8">
              <div>
                <div className="text-2xl font-normal text-[#171717] mb-2">Esecuzione Proattiva</div>
                <p className="text-sm text-[#a3a3a3] font-light">Dalla pianificazione alla creazione di schemi, in autonomia.</p>
              </div>
              <div>
                <div className="text-2xl font-normal text-[#171717] mb-2">Contesto Totale</div>
                <p className="text-sm text-[#a3a3a3] font-light">Memoria illimitata per la tua libreria, sempre pronta.</p>
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
    { title: 'RAG con Memoria Illimitata', desc: 'Ancora la tua IA alla tua realtà. Il nostro motore a contesto infinito indicizza i tuoi PDF, email e appunti senza alcuna perdita di memoria. Ogni risposta è basata sui tuoi dati specifici.', icon: Layers, color: 'text-indigo-500' },
    { title: 'Agente Calendario IA', desc: 'Your schedule, optimized autonomously. Our agent doesn\'t just remind you; it actively coordinates, reschedules meetings, and protects your focus time based on your current priorities.', icon: Zap, color: 'text-orange-500' },
    { title: 'Mappa Mentale', desc: 'Visualizza le connessioni invisibili. Una mappa dinamica a nodi che rivela come i tuoi progetti, idee e documenti si intersecano, offrendoti un vero e proprio secondo cervello.', icon: Brain, color: 'text-emerald-500' },
    { title: 'Architetto di Schemi', desc: 'Trasforma il caos in struttura. Genera istantaneamente schemi di database, strutture API e flussi di lavoro pronti per la produzione a partire da conversazioni grezze o appunti.', icon: Database, color: 'text-amber-500' }
  ];

  return (
    <section id="product" className="py-24 lg:py-40 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-24 max-w-3xl">
          <div className="warm-section-label mb-6">Capacità Autonoma</div>
          <h2 className="text-4xl sm:text-6xl tracking-tight text-[#171717] mb-8 font-normal">Oltre il <br /> <span className="text-[#a3a3a3] italic serif-accent">confine della chat.</span></h2>
          <WordReveal 
            text="Abbiamo costruito Smart AI per essere più di una conversazione. È una forza lavoro. Integrando il recupero profondo della conoscenza con azioni autonome degli agenti, abbiamo creato un sistema che ti toglie concretamente il peso del lavoro. Smetti di passare ore a organizzare, cercare e pianificare. Lascia che i tuoi agenti gestiscano la logistica mentre tu ti concentri sulla strategia di alto livello."
            className="text-xl text-[#737373] font-light max-w-2xl leading-relaxed mb-6"
          />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
          "L\'utilità è la <span className="serif-accent italic text-[#b08968]">forma più alta</span> di intelligenza. Non elaboriamo solo informazioni; le trasformiamo in azioni autonome."
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


const CalendarPreview = () => (
  <div className="h-full w-full bg-[#fcfbf9] p-4 flex flex-col gap-2 relative">
    <div className="h-8 border-b border-[#e5e5e5] flex items-center justify-between mb-2">
      <span className="text-xs font-semibold">Oggi</span>
      <span className="text-[10px] text-[#a3a3a3]">Agente Attivo</span>
    </div>
    <div className="flex-1 border border-[#e5e5e5] rounded-xl bg-white p-3 relative flex flex-col gap-2">
       <div className="h-12 w-full bg-blue-50/50 border border-blue-100 rounded-lg p-2">
         <div className="text-[10px] font-semibold text-blue-800">Lavoro Profondo</div>
         <div className="text-[9px] text-blue-600">09:00 - 12:00</div>
       </div>
       <div className="h-10 w-full bg-[#f9f8f6] border border-[#e5e5e5] rounded-lg p-2 opacity-50 relative">
         <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] italic text-[#a3a3a3]">Riunione spostata</span>
         </div>
       </div>
       <div className="absolute bottom-4 right-4 bg-white border border-[#e5e5e5] rounded-xl p-3 shadow-lg max-w-[150px] animate-[floating_3s_ease-in-out_infinite]">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-4 h-4 rounded-full bg-[#171717] flex items-center justify-center"><Bot size={10} className="text-white"/></div>
             <span className="text-[10px] font-bold">Agente</span>
          </div>
          <p className="text-[9px] text-[#737373] leading-tight">Ho spostato la riunione per proteggere il tuo lavoro profondo.</p>
       </div>
    </div>
  </div>
);

const BrainMapPreview = () => (
  <div className="h-full w-full bg-white relative overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
       <line x1="30%" y1="30%" x2="50%" y2="50%" stroke="#e5e5e5" strokeWidth="2" />
       <line x1="70%" y1="30%" x2="50%" y2="50%" stroke="#e5e5e5" strokeWidth="2" />
       <line x1="30%" y1="70%" x2="50%" y2="50%" stroke="#e5e5e5" strokeWidth="2" />
       <line x1="70%" y1="70%" x2="50%" y2="50%" stroke="#e5e5e5" strokeWidth="2" />
    </svg>
    <div className="absolute top-[30%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f9f8f6] border border-[#e5e5e5] flex items-center justify-center"><FileText size={12} className="text-[#a3a3a3]"/></div>
    <div className="absolute top-[30%] left-[70%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f9f8f6] border border-[#e5e5e5] flex items-center justify-center"><Brain size={12} className="text-[#a3a3a3]"/></div>
    <div className="absolute top-[70%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f9f8f6] border border-[#e5e5e5] flex items-center justify-center"><Database size={12} className="text-[#a3a3a3]"/></div>
    <div className="absolute top-[70%] left-[70%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f9f8f6] border border-[#e5e5e5] flex items-center justify-center"><Layers size={12} className="text-[#a3a3a3]"/></div>
    <div className="relative w-12 h-12 rounded-full bg-[#171717] border-4 border-white shadow-lg flex items-center justify-center z-10">
      <Sparkles size={16} className="text-[#b08968]" />
    </div>
  </div>
);

const RAGPreview = () => (
  <div className="h-full w-full bg-[#fcfbf9] relative overflow-hidden p-6 flex flex-col justify-center gap-3">
     {[1, 2, 3].map(i => (
        <div key={i} className={`h-12 bg-white border border-[#e5e5e5] rounded-lg p-2 flex items-center gap-3 shadow-sm transform transition-all ${i === 2 ? 'translate-x-4 border-[#b08968]' : ''}`}>
           <div className={`w-8 h-8 rounded bg-[#f9f8f6] flex items-center justify-center ${i === 2 ? 'text-[#b08968]' : 'text-[#a3a3a3]'}`}>
             <FileText size={14} />
           </div>
           <div className="flex-1 space-y-1.5">
             <div className="h-2 w-3/4 bg-[#e5e5e5] rounded" />
             <div className="h-2 w-1/2 bg-[#e5e5e5] rounded" />
           </div>
           {i === 2 && (
             <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
               <CheckCircle2 size={12} />
             </div>
           )}
        </div>
     ))}
     <div className="absolute bottom-4 left-4 right-4 bg-[#171717] text-white p-3 rounded-xl text-[10px] flex items-center gap-2">
       <Search size={12} className="text-[#b08968]" /> 
       <span>"Trovato nel documento 2, pag 4"</span>
     </div>
  </div>
);

function VisualShowcase() {
  const showcase = [
    { title: 'Memoria Infallibile', Component: RAGPreview, desc: 'RAG illimitata che non dimentica un dettaglio.' },
    { title: 'Mappatura Mentale', Component: BrainMapPreview, desc: 'Visualizza le connessioni nella tua libreria.' },
    { title: 'Agente Calendario', Component: CalendarPreview, desc: 'Pianificazione autonoma per il tuo tempo.' }
  ];

  return (
    <section className="py-24 lg:py-40 bg-[#fcfbf9] overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="warm-section-label mb-12">Ambiente Visivo</div>
        <div className="grid lg:grid-cols-3 gap-12">
          {showcase.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
              className="group">
              <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-[#e5e5e5] editorial-shadow mb-8 bg-white transition-all duration-700 group-hover:shadow-xl group-hover:-translate-y-1">
                <s.Component />
              </div>
              <h3 className="text-2xl font-normal text-[#171717] mb-3">{s.title}</h3>
              <p className="text-[#a3a3a3] font-light text-sm tracking-wide uppercase">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


function HowItWorks() {
  const steps = [
    { step: '01', title: 'Integrazione Profonda', desc: 'Collega i tuoi documenti, il calendario e i flussi di lavoro. Il nostro agente costruisce una mappa semantica unificata della tua vita professionale in pochi minuti.' },
    { step: '02', title: 'Azione Autonoma', desc: 'Deploy agents to handle specific tasks. Whether it\'s organizing a research library or managing your weekly syncs, the AI works in the background.' },
    { step: '03', title: 'Intuizioni Sintetizzate', desc: 'Vedi i risultati nel tuo grafo della conoscenza. Ogni azione e ogni documento è collegato, ricercabile e visualizzato nella mappa mentale.' }
  ];

  return (
    <section id="workflow" className="py-24 lg:py-40 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-start">
          <div className="sticky top-40">
            <div className="warm-section-label mb-6">Il Flusso di Lavoro</div>
            <h2 className="text-4xl sm:text-7xl tracking-tighter text-[#171717] mb-10 leading-tight">Dai dati alla <br /> <span className="text-[#a3a3a3] italic serif-accent">saggezza.</span></h2>
            <WordReveal 
                text="Il ponte tra informazione e intuizione è un processo ben definito. Abbiamo automatizzato il duro lavoro di organizzazione e recupero, così tu puoi concentrarti sul pensiero di alto livello. La nostra pipeline RAG è ottimizzata per l\'integrità. Ogni affermazione è supportata da un link diretto ai tuoi documenti."
                className="text-xl text-[#737373] font-light max-w-md mb-8 leading-relaxed"
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
        <div className="warm-section-label mb-6 mx-auto">Sicurezza e Fiducia</div>
        <h2 className="text-4xl sm:text-6xl tracking-tight text-[#171717] mb-12 font-normal">La tua proprietà intellettuale, <br /> <span className="text-[#a3a3a3] italic serif-accent">sovrana e al sicuro.</span></h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { t: 'Crittografia', d: 'AES-256 a riposo e TLS 1.3 in transito.', i: ShieldCheck },
             { t: 'Sovranità', d: 'Tu possiedi i tuoi dati. Non addestriamo modelli sui tuoi documenti.', i: Database },
             { t: 'Conformità', d: 'Costruito con rigorosi standard di protezione dei dati.', i: CheckCircle2 },
             { t: 'Affidabilità', d: 'Uptime del 99,9% con infrastruttura distribuita.', i: Zap }
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
          text="Comprendiamo che per i professionisti, la privacy non è una funzionalità—è un requisito. Smart AI è costruito per essere una fortezza per le tue idee."
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
            <h2 className="text-5xl sm:text-7xl font-normal tracking-tight text-white mb-10 leading-tight">Schiera la tua <br /> <span className="serif-accent italic text-[#b08968]">intelligenza.</span></h2>
            <p className="text-neutral-400 text-xl mb-16 font-light leading-relaxed">Unisciti alla forza lavoro d'élite di domani. Inizia ad automatizzare la tua conoscenza e le tue azioni con agenti di precisione che fanno davvero il lavoro.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-6 bg-white text-[#171717] rounded-full text-lg font-semibold hover:bg-[#f9f8f6] transition-colors shadow-2xl">
                Inizia gratis <ArrowRight size={22} />
              </Link>
              <button className="text-neutral-500 hover:text-white transition-colors text-lg font-medium">Parla con un architetto</button>
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
            <p className="text-base text-[#737373] font-light leading-relaxed mb-8">Uno spazio di lavoro specializzato per l'interazione intelligente. Costruiamo strumenti che onorano la complessità della ricerca umana e la velocità digitale.</p>
            <div className="flex gap-4">
               <a href="#" className="h-10 w-10 rounded-full border border-[#e5e5e5] bg-white flex items-center justify-center hover:bg-[#fcfbf9] transition-colors"><Github size={18} className="text-[#737373]"/></a>
               <a href="#" className="h-10 w-10 rounded-full border border-[#e5e5e5] bg-white flex items-center justify-center hover:bg-[#fcfbf9] transition-colors"><Linkedin size={18} className="text-[#737373]"/></a>
               <a href="#" className="h-10 w-10 rounded-full border border-[#e5e5e5] bg-white flex items-center justify-center hover:bg-[#fcfbf9] transition-colors"><Instagram size={18} className="text-[#737373]"/></a>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 lg:gap-24">
            <div>
              <div className="text-sm font-medium italic text-[#737373] mb-8">Piattaforma</div>
              <div className="flex flex-col gap-4">
                {['Intelligenza', 'Documenti', 'Sicurezza', 'Prezzi', 'API'].map(l => <a key={l} href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors italic font-light">{l}</a>)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium italic text-[#737373] mb-8">Azienda</div>
              <div className="flex flex-col gap-4">
                {['Giornale', 'Chi Siamo', 'Contatti', 'Lavora con noi'].map(l => <a key={l} href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors italic font-light">{l}</a>)}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium italic text-[#737373] mb-8">Supporto</div>
              <div className="flex flex-col gap-4">
                {['Documentazione', 'Assistenza', 'Twitter', 'GitHub'].map(l => <a key={l} href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors italic font-light">{l}</a>)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-24 pt-10 border-t border-[#e5e5e5] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[12px] text-[#a3a3a3] uppercase tracking-[0.15em] font-medium">© 2025 Smart AI Systems Inc. Creato per il lavoro profondo.</div>
          <div className="flex gap-10 text-[12px] text-[#a3a3a3] uppercase tracking-[0.15em] font-medium">
            <a href="#" className="hover:text-[#171717]">Privacy Policy</a>
            <a href="#" className="hover:text-[#171717]">Termini</a>
            <a href="#" className="hover:text-[#171717]">Cookie</a>
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
          <VisualShowcase />
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
