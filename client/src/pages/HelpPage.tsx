import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  User,
} from "lucide-react";
type Ticket = {
  id?: number | string;
  created_at: string;
  problem_type?: string;
  subject: string;
  status?: string;
  message: string;
  admin_reply?: string;
};

export default function HelpPage() {
  const { user,theme } = useAuth();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      const response = await fetch("http://localhost:3000/api/support/getUserTickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !problemType || !subject || !message) {
      setError("Please fill out all required fields.");
      return;
    }

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/api/support/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        }, 1400);
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
       <SystemStyles isDark={isDark} />
    <div className={ `min-h-screen ${isDark ? "bg-[#07070a] text-[#f4f1ea] font-['Manrope']" : 'bg-[#fafafa] text-neutral-900'} w-full flex flex-col font-sans selection:bg-neutral-200 relative overflow-x-hidden` }>
      <div className="absolute top-0 left-0 w-full h-[400px]  pointer-events-none" />

      <div className={`absolute inset-0 pointer-events-none ${isDark ? "gridline opacity-30" : "gridline-light opacity-80"}`} />

          <div className={`absolute inset-0 ${isDark ? "bg-gradient-to-br from-orange-500/10 via-transparent to-white/5" : "bg-gradient-to-br from-orange-500/4 via-transparent to-white/2"} pointer-events-none`} />
        <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-orange-500/12 blur-[110px] pointer-events-none" />
        <div className="absolute bottom-8 -right-20 w-80 h-80 rounded-full bg-orange-400/10 blur-[120px] pointer-events-none" />

      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-5xl mx-auto w-full pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors backdrop-blur-md px-4 py-2 rounded-xl shadow-sm hover:shadow-md cursor-pointer pointer-events-auto ${isDark ? "text-white/75 hover:text-white bg-white/5 border border-white/10" : "text-neutral-500 hover:text-neutral-900 bg-white/60 border border-neutral-200/60"}`}
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 text-sm font-semibold text-white transition-colors px-4 py-2 rounded-xl shadow-sm hover:shadow-md cursor-pointer pointer-events-auto ${isDark ? "bg-orange-500 hover:bg-orange-400" : "bg-neutral-900 hover:bg-neutral-800"}`}
        >
          <Send size={16} />
          New Request
        </button>
      </nav>

      <div className="flex-1 flex items-start justify-center p-6 z-10 pt-28 md:pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-5xl"
        >
          <div className="text-center mb-10">
            <div className={`w-14 h-14 border shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-white/5 border-white/10 text-[#f4f1ea]" : "bg-white border-neutral-200 text-neutral-900"}`}>
              <HelpCircle size={28} />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-3 ${isDark ? "text-[#f4f1ea]" : "text-neutral-900"}`}>
              Support Request
            </h1>
            <p className={`text-[15px] leading-relaxed max-w-sm mx-auto ${isDark ? "text-white/60" : "text-neutral-500"}`}>
              Here are your tickets. Open a new request whenever you need help.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle size={18} />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`border rounded-[28px] overflow-hidden ${isDark ? "bg-white/5 border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-md" : "bg-white border-neutral-200 shadow-[0_8px_40px_rgb(0,0,0,0.04)]"}`}>
            <div className={`flex items-center justify-between px-6 py-5 border-b ${isDark ? "border-white/10" : "border-neutral-100"}`}>
              <div>
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-[#f4f1ea]" : "text-neutral-900"}`}>
                  <div className={`w-1.5 h-6 rounded-full ${isDark ? "bg-orange-400" : "bg-neutral-900"}`} />
                  Your Support History
                </h2>
                <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-neutral-500"}`}>
                  View all past requests and responses.
                </p>
              </div>

              <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${isDark ? "text-white/65 bg-white/10" : "text-neutral-400 bg-neutral-100"}`}>
                {userTickets.length} {userTickets.length === 1 ? "Record" : "Records"}
              </span>
            </div>

            <div className="overflow-x-auto">
              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-neutral-400" size={24} />
                </div>
              ) : userTickets.length > 0 ? (
                <table className="min-w-full">
                  <thead className={isDark ? "bg-white/5" : "bg-neutral-50/80"}>
                    <tr className={`text-left text-[10px] uppercase tracking-widest ${isDark ? "text-white/55" : "text-neutral-500"}`}>
                      <th className="px-6 py-4 font-bold">ID</th>
                      <th className="px-6 py-4 font-bold">Request</th>
                      <th className="px-6 py-4 font-bold">Title</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Type</th>
                    </tr>
                  </thead>

                  <tbody className={`divide-y ${isDark ? "divide-white/10" : "divide-neutral-100"}`}>
                    {userTickets.map((ticket, idx) => (
                      <motion.tr
                        key={ticket.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 * (idx % 6) }}
                        className={`transition-colors align-top ${isDark ? "hover:bg-white/5" : "hover:bg-neutral-50/60"}`}
                      >
                        <td className={`px-6 py-5 text-sm font-medium whitespace-nowrap ${isDark ? "text-white/90" : "text-neutral-900"}`}>
                          #{ticket.id || idx + 1}
                        </td>

                        <td className="px-6 py-5">
                          <div className="max-w-md">
                            <p className={`text-sm leading-relaxed line-clamp-2 ${isDark ? "text-white/75" : "text-neutral-700"}`}>
                              {ticket.message}
                            </p>

                            {ticket.admin_reply && (
                              <p className={`mt-2 text-xs line-clamp-2 ${isDark ? "text-white/50" : "text-neutral-400"}`}>
                                Reply: {ticket.admin_reply}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <h3 className={`text-sm font-semibold leading-tight ${isDark ? "text-[#f4f1ea]" : "text-neutral-900"}`}>
                            {ticket.subject}
                          </h3>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                              ticket.status === "resolved"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : ticket.status === "in-progress"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : isDark
                                ? "bg-white/5 text-white/70 border-white/15"
                                : "bg-white text-neutral-500 border-neutral-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ticket.status === "resolved"
                                  ? "bg-emerald-500"
                                  : ticket.status === "in-progress"
                                  ? "bg-blue-500"
                                  : "bg-neutral-300"
                              }`}
                            />
                            {ticket.status || "Open"}
                          </span>
                        </td>

                        <td className={`px-6 py-5 text-sm whitespace-nowrap ${isDark ? "text-white/60" : "text-neutral-500"}`}>
                          {new Date(ticket.created_at).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "long",
                          })}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
                              ticket.problem_type === "technical"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : ticket.problem_type === "billing"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : isDark
                                ? "bg-white/5 text-white/65 border-white/15"
                                : "bg-neutral-50 text-neutral-500 border-neutral-100"
                            }`}
                          >
                            {ticket.problem_type || "General"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20 px-6 text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-white/10" : "bg-neutral-100"}`}>
                    <HelpCircle size={26} className={isDark ? "text-white/70" : "text-neutral-500"} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-[#f4f1ea]" : "text-neutral-900"}`}>
                    No support tickets yet
                  </h3>
                  <p className={`text-sm mb-6 ${isDark ? "text-white/60" : "text-neutral-500"}`}>
                    Open a new request to contact the support team.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-[14px] font-semibold rounded-2xl transition-all shadow-lg active:scale-95 ${isDark ? "bg-orange-500 hover:bg-orange-400 shadow-orange-900/20 hover:shadow-orange-900/30" : "bg-neutral-900 hover:bg-neutral-800 shadow-neutral-900/10 hover:shadow-neutral-900/20"}`}
                    >
                      <Send size={16} />
                      New Request
                    </button>
                    <button 
                      onClick={() => navigate('/app/profile')}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 border text-[14px] font-semibold rounded-2xl transition-all shadow-sm active:scale-95 ${isDark ? "bg-white/5 text-white/85 border-white/15 hover:bg-white/10" : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50"}`}
                    >
                      <User size={16} />
                      Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col overflow-x-hidden selection:bg-orange-400 selection:text-black"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 15% 20%, rgba(249,115,22,.12), transparent 24%), radial-gradient(circle at 80% 15%, rgba(255,255,255,.05), transparent 18%), radial-gradient(circle at 70% 80%, rgba(249,115,22,.10), transparent 20%), linear-gradient(180deg, rgba(7,7,10,0.9), rgba(13,14,20,0.9))'
                : 'radial-gradient(circle at 15% 20%, rgba(249,115,22,.10), transparent 26%), radial-gradient(circle at 80% 10%, rgba(15,23,42,.05), transparent 20%), linear-gradient(180deg, rgba(250,250,250,0.94), rgba(245,245,245,0.96))',
              color: isDark ? '#f4f1ea' : '#171717',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {/* 1. Backdrop overlay goes first so it sits BEHIND the grid and effects */}
            <div
              onClick={() => setIsModalOpen(false)}
              className={`absolute inset-0 backdrop-blur-sm z-0 ${isDark ? "bg-black/30" : "bg-white/35"}`}
            />

            {/* 2. Grid and glows (pointer-events-none so clicks pass through to backdrop) */}
            <div className={`absolute inset-0 pointer-events-none z-0 ${isDark ? "gridline opacity-30" : "gridline-light opacity-80"}`} />
            <div className={`absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl pointer-events-none z-0 ${isDark ? "bg-orange-500/10" : "bg-orange-400/10"}`} />
            <div className={`absolute top-24 right-0 h-64 w-64 rounded-full blur-3xl pointer-events-none z-0 ${isDark ? "bg-white/5" : "bg-slate-900/5"}`} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 30 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-2xl border rounded-[28px] p-6 sm:p-8 relative overflow-hidden ${isDark ? "bg-[#11131a]/95 border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.45)]" : "bg-white border-neutral-200 shadow-[0_20px_80px_rgba(0,0,0,0.10)]"}`}
              >
                <div className={`absolute top-0 left-0 w-full h-[180px] pointer-events-none ${isDark ? "bg-gradient-to-b from-white/5 to-transparent" : "bg-gradient-to-b from-neutral-50 to-transparent"}`} />

                <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                  <div>
                    <h2 className={`text-2xl font-bold ${isDark ? "text-[#f4f1ea]" : "text-neutral-900"}`}>
                      New Support Request
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-neutral-500"}`}>
                      Describe the issue and the team will reply as soon as possible.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDark ? "bg-white/10 hover:bg-white/15 text-white/70 hover:text-white" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900"}`}
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="overflow-hidden relative z-10"
                    >
                      <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
                        <AlertCircle size={18} />
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative z-10">
                  <AnimatePresence>
                    {isSubmitting && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-[24px] ${isDark ? "bg-black/40" : "bg-white/70"}`}
                      >
                        <Loader2 className={`animate-spin mb-2 ${isDark ? "text-[#f4f1ea]" : "text-neutral-900"}`} size={32} />
                        <p className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-neutral-700"}`}>
                          Submitting your request...
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className={`text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-white/55" : "text-neutral-500"}`}>
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tim@apple.com"
                          className={`w-full px-4 cursor-not-allowed py-3.5 rounded-xl border transition-all text-[15px] placeholder:text-neutral-400 font-medium ${isDark ? "border-white/15 bg-white/5 text-white/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300/40" : "border-neutral-200 bg-neutral-50 text-neutral-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"}`}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className={`text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-white/55" : "text-neutral-500"}`}>
                          Problem Type
                        </label>
                        <div className="relative">
                          <select
                            value={problemType}
                            onChange={(e) => setProblemType(e.target.value)}
                            className={`appearance-none w-full px-4 py-3.5 rounded-xl border transition-all text-[15px] font-medium ${
                              isDark
                                ? `border-white/15 bg-white/5 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300/40 ${problemType ? "text-[#f4f1ea]" : "text-white/45"}`
                                : `border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 ${problemType ? "text-neutral-900" : "text-neutral-400"}`
                            }`}
                          >
                            <option value="" disabled>
                              Select a category...
                            </option>
                            <option value="technical">Technical Issue</option>
                            <option value="billing">Billing & Subscription</option>
                            <option value="account">Account Recovery</option>
                            <option value="feature">Feature Request</option>
                            <option value="other">Other Inquiry</option>
                          </select>

                          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${isDark ? "text-white/45" : "text-neutral-400"}`}>
                            <svg
                              className="fill-current h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className={`text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-white/55" : "text-neutral-500"}`}>
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Briefly describe what this is about"
                        className={`w-full px-4 py-3.5 rounded-xl border transition-all text-[15px] placeholder:text-neutral-400 font-medium ${isDark ? "border-white/15 bg-white/5 text-[#f4f1ea] focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300/40" : "border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"}`}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-baseline">
                        <label className={`text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-white/55" : "text-neutral-500"}`}>
                          Message Details
                        </label>
                        <span className={`text-[11px] font-medium ${isDark ? "text-white/45" : "text-neutral-400"}`}>
                          {message.length}/1000
                        </span>
                      </div>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value.substring(0, 1000))}
                        placeholder="Please provide steps to reproduce the issue, expected behavior, and any other relevant context..."
                        rows={5}
                        className={`w-full px-4 py-3.5 rounded-xl border transition-all text-[15px] placeholder:text-neutral-400 resize-none font-medium leading-relaxed ${isDark ? "border-white/15 bg-white/5 text-[#f4f1ea] focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300/40" : "border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"}`}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSuccess}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[15px] font-semibold transition-all duration-300 shadow-sm ${
                          isSuccess
                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg"
                            : isDark
                            ? "bg-orange-500 text-white hover:bg-orange-400"
                            : "bg-neutral-900 text-white hover:bg-neutral-800"
                        }`}
                      >
                        {isSuccess ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle2 size={18} />
                            Request Received
                          </motion.div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send size={18} />
                            Submit Support Request
                          </div>
                        )}
                      </button>
                    </div>

                    <p className={`text-center text-xs font-medium select-none ${isDark ? "text-white/45" : "text-neutral-400"}`}>
                      By submitting, you agree to our Support Policy and acknowledge that responses may take up to 24h.
                    </p>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div> 
        )}
      </AnimatePresence>
    </div>
     </>
  );


 


function SystemStyles({ isDark }: { isDark: boolean }) {
  if (!isDark) return null;
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
      body { font-family: 'Manrope', sans-serif; }

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
        backdrop-filter: blur(18px) !important;
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

      .gridline-light {
        background-image:
          linear-gradient(to right, rgba(15,23,42,.07) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(15,23,42,.07) 1px, transparent 1px);
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
}