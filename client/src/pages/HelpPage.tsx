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
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen w-full bg-[#fafafa] flex flex-col font-sans text-neutral-900 selection:bg-neutral-200 relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-white to-[#fafafa] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] opacity-70 pointer-events-none" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-50/50 rounded-full blur-[100px] opacity-60 pointer-events-none" />

      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-5xl mx-auto w-full pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors bg-white/60 backdrop-blur-md border border-neutral-200/60 px-4 py-2 rounded-xl shadow-sm hover:shadow-md cursor-pointer pointer-events-auto"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors px-4 py-2 rounded-xl shadow-sm hover:shadow-md cursor-pointer pointer-events-auto"
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
            <div className="w-14 h-14 bg-white border border-neutral-200 shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-5 text-neutral-900">
              <HelpCircle size={28} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mb-3">
              Support Request
            </h1>
            <p className="text-neutral-500 text-[15px] leading-relaxed max-w-sm mx-auto">
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

          <div className="bg-white border border-neutral-200 rounded-[28px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-neutral-900 rounded-full" />
                  Your Support History
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  View all past requests and responses.
                </p>
              </div>

              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-100 px-2.5 py-1 rounded-full">
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
                  <thead className="bg-neutral-50/80">
                    <tr className="text-left text-[10px] uppercase tracking-widest text-neutral-500">
                      <th className="px-6 py-4 font-bold">ID</th>
                      <th className="px-6 py-4 font-bold">Request</th>
                      <th className="px-6 py-4 font-bold">Title</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Type</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-100">
                    {userTickets.map((ticket, idx) => (
                      <motion.tr
                        key={ticket.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 * (idx % 6) }}
                        className="hover:bg-neutral-50/60 transition-colors align-top"
                      >
                        <td className="px-6 py-5 text-sm font-medium text-neutral-900 whitespace-nowrap">
                          #{ticket.id || idx + 1}
                        </td>

                        <td className="px-6 py-5">
                          <div className="max-w-md">
                            <p className="text-sm text-neutral-700 leading-relaxed line-clamp-2">
                              {ticket.message}
                            </p>

                            {ticket.admin_reply && (
                              <p className="mt-2 text-xs text-neutral-400 line-clamp-2">
                                Reply: {ticket.admin_reply}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <h3 className="text-sm font-semibold text-neutral-900 leading-tight">
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

                        <td className="px-6 py-5 text-sm text-neutral-500 whitespace-nowrap">
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
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <HelpCircle size={26} className="text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    No support tickets yet
                  </h3>
                  <p className="text-sm text-neutral-500 mb-6">
                    Open a new request to contact the support team.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-[14px] font-semibold rounded-2xl hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/10 hover:shadow-xl hover:shadow-neutral-900/20 active:scale-95"
                    >
                      <Send size={16} />
                      New Request
                    </button>
                    <button 
                      onClick={() => navigate('/app/profile')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-900 border border-neutral-200 text-[14px] font-semibold rounded-2xl hover:bg-neutral-50 transition-all shadow-sm active:scale-95"
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 30 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-white border border-neutral-200 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.10)] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[180px] bg-gradient-to-b from-neutral-50 to-transparent pointer-events-none" />

                <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">
                      New Support Request
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      Describe the issue and the team will reply as soon as possible.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
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
                        className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-[24px]"
                      >
                        <Loader2 className="animate-spin text-neutral-900 mb-2" size={32} />
                        <p className="text-sm font-semibold text-neutral-700">
                          Submitting your request...
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tim@apple.com"
                          className="w-full px-4 cursor-not-allowed py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all text-[15px] text-neutral-500 placeholder:text-neutral-400 font-medium"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider">
                          Problem Type
                        </label>
                        <div className="relative">
                          <select
                            value={problemType}
                            onChange={(e) => setProblemType(e.target.value)}
                            className={`appearance-none w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all text-[15px] font-medium ${
                              problemType ? "text-neutral-900" : "text-neutral-400"
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

                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
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
                      <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Briefly describe what this is about"
                        className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all text-[15px] text-neutral-900 placeholder:text-neutral-400 font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider">
                          Message Details
                        </label>
                        <span className="text-[11px] text-neutral-400 font-medium">
                          {message.length}/1000
                        </span>
                      </div>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value.substring(0, 1000))}
                        placeholder="Please provide steps to reproduce the issue, expected behavior, and any other relevant context..."
                        rows={5}
                        className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all text-[15px] text-neutral-900 placeholder:text-neutral-400 resize-none font-medium leading-relaxed"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSuccess}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[15px] font-semibold transition-all duration-300 shadow-sm ${
                          isSuccess
                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg"
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

                    <p className="text-center text-xs text-neutral-400 font-medium select-none">
                      By submitting, you agree to our Support Policy and acknowledge that responses may take up to 24h.
                    </p>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}