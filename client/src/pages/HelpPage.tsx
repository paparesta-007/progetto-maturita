import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  MessageSquare,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LandingStyles, fadeUp } from "./LandingStyles";

type Ticket = {
  id: string;
  created_at: string;
  problem_type?: string;
  subject: string;
  status?: string;
  message: string;
  admin_reply?: string;
};

export default function HelpPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [problemType, setProblemType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      setIsLoadingTickets(true);
      if (user.email) setEmail(user.email);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/support/getUserTickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setUserTickets(data.tickets || []);
      } else {
        setError(data.error || "Failed to fetch tickets.");
      }
    } catch (err: any) {
      setError("Failed to fetch tickets: " + err.message);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTickets();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !problemType || !subject || !message) {
      setError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/support/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          email,
          problemType,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        await fetchTickets();
        setProblemType("");
        setSubject("");
        setMessage("");

        setTimeout(() => {
          setIsSuccess(false);
          setIsModalOpen(false);
        }, 1500);
      } else {
        setError(data.error || "Submission failed.");
      }
    } catch (err: any) {
      setError("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LandingStyles />
      <div className="landing-page min-h-screen bg-[#fcfbf9] text-[#171717] antialiased selection:bg-[#b08968]/15">
        
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none bg-grid-pattern opacity-[0.4]" />
        
        <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white/90 backdrop-blur-md border-b border-[#e5e5e5]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 h-full flex items-center justify-between relative">
            <Link to="/" className="flex items-center gap-2.5 z-10">
              <div className="h-9 w-9 rounded-lg bg-[#171717] text-white flex items-center justify-center shadow-sm">
                <Sparkles size={18} />
              </div>
              <span className="font-semibold text-lg tracking-tight text-[#171717]">Smart AI</span>
            </Link>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
               <ShieldCheck size={18} className="text-[#b08968]" />
               <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#171717]">Centro Assistenza</span>
            </div>

            <div className="flex items-center gap-4 z-10">
               <button
                  onClick={() => navigate(-1)}
                  className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#737373] hover:text-[#171717] transition-colors"
                >
                  <ArrowLeft size={14} />
                  Torna indietro
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="warm-btn-primary !py-2 !px-4 text-xs !rounded-full shadow-sm"
                >
                  Nuova Richiesta
                </button>
            </div>
          </div>
        </header>

        <main className="pt-32 pb-24 px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
          <header className="mb-16 text-center lg:text-left max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="warm-section-label mb-6 flex items-center gap-2 justify-center lg:justify-start"
            >
              <HelpCircle size={14} className="text-[#b08968]" /> Supporto Clienti
            </motion.div>
            <h1 className="text-5xl sm:text-7xl font-normal tracking-[-0.04em] leading-[0.9] text-[#171717] mb-8">
              Come possiamo <br />
              <span className="serif-accent italic text-[#b08968]">aiutarti oggi?</span>
            </h1>
            <p className="text-xl font-light text-[#737373] leading-relaxed max-w-xl">
              Gestisci i tuoi ticket di assistenza e monitora le risoluzioni in tempo reale con precisione assoluta.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Tickets List */}
            <section className="lg:col-span-2 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#a3a3a3] mb-8 flex items-center gap-3">
                <Clock size={16} /> Cronologia Ticket
              </h2>

              {isLoadingTickets ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-[#e5e5e5] editorial-shadow">
                  <Loader2 className="animate-spin text-[#b08968] mb-4" size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest text-[#a3a3a3]">Recupero informazioni...</p>
                </div>
              ) : userTickets.length > 0 ? (
                <div className="space-y-6">
                  {userTickets.map((ticket, idx) => (
                    <motion.div
                      key={ticket.id}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      custom={idx}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`group p-8 rounded-[2.5rem] bg-white border transition-all cursor-pointer relative editorial-shadow ${
                        selectedTicket?.id === ticket.id
                        ? "border-[#b08968] ring-1 ring-[#b08968]/20"
                        : "border-[#e5e5e5] hover:border-[#b08968]/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${ticket.status === 'resolved' ? 'bg-emerald-400' : 'bg-[#b08968]'}`} />
                          <h3 className="text-2xl font-normal text-[#171717] group-hover:text-[#b08968] transition-colors">{ticket.subject}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-[#a3a3a3] uppercase tracking-widest bg-[#f9f8f6] px-3 py-1 rounded-full border border-[#e5e5e5]">#{ticket.id.substring(0, 8)}</span>
                      </div>
                      
                      <p className="text-base font-light text-[#737373] leading-relaxed line-clamp-2 mb-8">
                        {ticket.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-6">
                         <div className="px-4 py-1.5 rounded-full bg-[#fcfbf9] border border-[#e5e5e5] text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3]">
                            {ticket.problem_type || 'Generale'}
                         </div>
                         <div className="flex items-center gap-2 text-[11px] font-medium text-[#a3a3a3]">
                            <Clock size={14} />
                            {new Date(ticket.created_at).toLocaleDateString()}
                         </div>
                         {ticket.admin_reply && (
                           <div className="ml-auto flex items-center gap-2 text-emerald-600 text-[11px] font-bold uppercase tracking-wider">
                             <MessageSquare size={14} />
                             Risposta Ricevuta
                           </div>
                         )}
                      </div>

                      <ChevronRight size={20} className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-[#b08968] group-hover:translate-x-2" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center rounded-[3rem] border-2 border-dashed border-[#e5e5e5] bg-white/50">
                  <div className="w-16 h-16 bg-[#f9f8f6] rounded-[1.5rem] border border-[#e5e5e5] flex items-center justify-center mx-auto mb-8 text-[#b08968]">
                    <HelpCircle size={32} />
                  </div>
                  <h3 className="text-3xl font-normal mb-4">Nessun ticket attivo</h3>
                  <p className="text-[#a3a3a3] font-light mb-10 max-w-sm mx-auto">Hai bisogno di assistenza tecnica o commerciale? Crea il tuo primo ticket.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="warm-btn-primary !px-8 !py-4 !rounded-full text-sm"
                  >
                    Ottieni Supporto Ora
                  </button>
                </div>
              )}
            </section>

            {/* Ticket Detail */}
            <aside className="lg:sticky lg:top-32 space-y-8">
              <AnimatePresence mode="wait">
                {selectedTicket ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="p-10 rounded-[3rem] bg-white border border-[#e5e5e5] editorial-shadow relative"
                  >
                    <button 
                      onClick={() => setSelectedTicket(null)}
                      className="absolute top-8 right-8 p-2 hover:bg-[#fcfbf9] rounded-full transition-colors text-[#a3a3a3]"
                    >
                      <X size={20} />
                    </button>

                    <h2 className="text-3xl font-normal mb-8 pr-8 leading-tight">{selectedTicket.subject}</h2>
                    
                    <div className="space-y-10">
                      <div>
                        <span className="warm-section-label !text-[10px] block mb-4">La Tua Richiesta</span>
                        <div className="p-6 rounded-[1.5rem] bg-[#fcfbf9] border border-[#e5e5e5] text-sm font-light leading-relaxed text-[#737373]">
                          {selectedTicket.message}
                        </div>
                      </div>

                      {selectedTicket.admin_reply ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <span className="warm-section-label !text-[10px] block mb-4 !text-emerald-600">Risposta Ufficiale</span>
                          <div className="p-8 rounded-[2rem] text-sm font-light leading-relaxed border border-emerald-100 bg-emerald-50/30 relative">
                            <div className="absolute -left-1 top-6 w-1 h-10 bg-emerald-400 rounded-full" />
                            <div className="prose prose-sm max-w-none text-[#171717]" dangerouslySetInnerHTML={{ __html: selectedTicket.admin_reply }} />
                          </div>
                        </motion.div>
                      ) : (
                        <div className="p-8 rounded-[2rem] border border-dashed border-[#e5e5e5] text-center bg-[#fcfbf9]/50">
                          <Clock className="mx-auto mb-4 text-[#a3a3a3] opacity-30" size={24} />
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[#a3a3a3]">In attesa del team...</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="faq"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#a3a3a3] px-2 mb-8">Risposte Rapide</h2>
                    {[
                      { q: "Tempi di risposta?", a: "In media il nostro team risponde entro 12 ore lavorative." },
                      { q: "Posso modificare un ticket?", a: "No, una volta inviato il ticket entra in coda di elaborazione." },
                      { q: "Urgenze commerciali?", a: "Seleziona 'Fatturazione' per priorità alta." }
                    ].map((faq, i) => (
                      <div key={i} className="p-8 rounded-[2rem] bg-white border border-[#e5e5e5] editorial-shadow hover:bg-[#fcfbf9] transition-colors">
                        <h4 className="text-lg font-normal mb-3">{faq.q}</h4>
                        <p className="text-xs font-light text-[#737373] leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </aside>
          </div>
        </main>

        {/* New Request Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-[#171717]/40 backdrop-blur-md"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 20 }}
                className="relative w-full max-w-xl p-10 rounded-[3.5rem] bg-white border border-[#e5e5e5] editorial-shadow overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#b08968]/5 to-transparent pointer-events-none" />
                
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div>
                    <h2 className="text-3xl font-normal text-[#171717]">Nuova Richiesta</h2>
                    <p className="text-sm font-light text-[#737373]">Fornisci i dettagli per ricevere supporto.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#fcfbf9] rounded-full transition-colors text-[#a3a3a3]">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="warm-section-label !text-[10px]">Email di Contatto</span>
                      <input 
                        type="email" value={email} disabled 
                        className="w-full p-4 rounded-2xl border border-[#e5e5e5] bg-[#fcfbf9] opacity-60 cursor-not-allowed text-sm font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="warm-section-label !text-[10px]">Categoria</span>
                      <select 
                        value={problemType} onChange={(e) => setProblemType(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-[#e5e5e5] bg-white text-sm focus:ring-1 focus:ring-[#b08968] outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Seleziona...</option>
                        <option value="technical">Tecnico</option>
                        <option value="billing">Fatturazione</option>
                        <option value="account">Account</option>
                        <option value="other">Altro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="warm-section-label !text-[10px]">Oggetto</span>
                    <input 
                      type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                      placeholder="Breve sintesi del problema"
                      className="w-full p-4 rounded-2xl border border-[#e5e5e5] bg-white text-sm focus:ring-1 focus:ring-[#b08968] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="warm-section-label !text-[10px]">Messaggio Dettagliato</span>
                    <textarea 
                      rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descrivi qui la tua richiesta..."
                      className="w-full p-4 rounded-2xl border border-[#e5e5e5] bg-white text-sm focus:ring-1 focus:ring-[#b08968] outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className={`w-full py-5 rounded-full font-bold flex items-center justify-center gap-3 transition-all ${
                      isSuccess ? "bg-emerald-500 text-white" : "warm-btn-primary !rounded-full text-base shadow-lg"
                    }`}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : isSuccess ? <CheckCircle2 size={20} /> : <Send size={20} />}
                    {isSuccess ? "Richiesta Inviata" : "Invia Messaggio"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}