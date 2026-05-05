import React, { lazy, Suspense, useCallback, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { useCalendar } from "../../context/CalendarContext";
import FloatingChat from "./FloatingChat";
import { MagicWandIcon, Clock } from "@phosphor-icons/react";
import supabase from "../../library/supabaseclient";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_HEIGHT = 40;

/* -------------------------------------------------------
   System Styles (Shared from Chat/LandingPage)
------------------------------------------------------- */
const CalendarStyles = React.memo(({ isDark }: { isDark: boolean }) => {
    if (!isDark) return null;
    return (
        <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

      :root {
        --bg: #07070a;
        --accent: #f97316;
        --line: rgba(255,255,255,.10);
      }

      .glass {
        background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
        border: 1px solid var(--line);
        backdrop-filter: blur(18px);
      }

      .glass-soft {
        background: rgba(255,255,255,.035);
        border: 1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(12px);
      }

      .gridline {
        background-image:
          linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
        background-size: 42px 42px;
      }

      .noise::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: .03;
        background-image:
          linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: linear-gradient(180deg, black, transparent 80%);
      }

      ::selection {
        background: rgba(249, 115, 22, 0.3);
        color: #fff;
      }
    `}</style>
    );
});
CalendarStyles.displayName = "CalendarStyles";

// --- Sub-component for the single Event Card (Memoized) ---
const EventCard = React.memo(({ event, isDark, onClick }: { event: any, isDark: boolean, onClick: (ev: any) => void }) => {
    const topPx = event.startMinuteOffset * ROW_HEIGHT;
    const heightPx = event.durationHours * ROW_HEIGHT - 2;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick(event);
            }}
            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
            className={`absolute inset-x-1 p-2 text-[10px] leading-tight rounded-xl overflow-hidden z-10 border transition-all cursor-pointer ${isDark
                ? "bg-orange-500/10 border-orange-500/30 text-orange-200 hover:bg-orange-500/20 glass-soft shadow-lg shadow-orange-500/5"
                : "bg-blue-500 border-blue-600 text-white hover:bg-blue-600"
                }`}
        >
            <span className="font-bold block truncate">{event.summary}</span>
            {event.durationHours >= 1 && (
                <span className={`block mt-0.5 opacity-80 font-mono`}>
                    {new Date(event.start.dateTime).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </span>
            )}
        </div>
    );
});
EventCard.displayName = "EventCard";

// --- Sub-component for the hour cell (Memoized) ---
const CalendarCell = React.memo(({ hour, day, isDark, events, onClick }: {
    hour: number,
    day: Date,
    isDark: boolean,
    events: any[],
    onClick: (ev: any) => void
}) => {
    return (
        <div className={`border-r border-b relative h-10 group transition-colors ${isDark ? "border-white/[0.04] hover:bg-white/[0.02]" : "border-neutral-100 hover:bg-neutral-50"}`}>
            {events.map(event => (
                <EventCard
                    key={event.id}
                    event={event}
                    isDark={isDark}
                    onClick={onClick}
                />
            ))}
        </div>
    );
});
CalendarCell.displayName = "CalendarCell";

// --- Sub-component for the hour row (Memoized) ---
const CalendarRow = React.memo(({ hour, weekDays, isDark, groupedEvents, onClick }: {
    hour: number,
    weekDays: Date[],
    isDark: boolean,
    groupedEvents: Record<string, any[]>,
    onClick: (ev: any) => void
}) => {
    return (
        <div className="contents">
            <div className={`text-right pr-3 text-[10px] font-mono border-r h-10 flex items-center justify-end ${isDark ? "text-neutral-600 border-white/[0.04]" : "text-neutral-400 border-neutral-100"}`}>
                {`${hour.toString().padStart(2, '0')}:00`}
            </div>
            {weekDays.map((day, i) => {
                const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const dayEvents = groupedEvents[`${dateKey}-${hour}`] || [];
                return (
                    <CalendarCell
                        key={`${hour}-${i}`}
                        hour={hour}
                        day={day}
                        isDark={isDark}
                        events={dayEvents}
                        onClick={onClick}
                    />
                );
            })}
        </div>
    );
});
CalendarRow.displayName = "CalendarRow";

const RequiredAuthCalendarPage = () => {
    const { theme } = useAuth();
    const isDark = theme === 'dark';

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/app/calendar`,
                scopes: 'https://www.googleapis.com/auth/calendar.events',
            },

        });

        if (error) {
            alert(error.message || "Si è verificato un errore durante il login con Google.");
        }
    };
    return (
        <div className={`h-full flex flex-col items-center justify-center p-8 text-center relative transition-colors duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea] noise" : "bg-white text-neutral-900"}`}>
            <CalendarStyles isDark={isDark} />
            {isDark && (
                <>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-orange-500/[0.05] blur-[120px] pointer-events-none" />
                </>
            )}

            <div className="max-w-md space-y-8 z-10">
                <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl transition-all duration-500 ${isDark ? "bg-white/[0.03] border border-white/[0.1] shadow-orange-500/5" : "bg-blue-50"}`}>
                    📅
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold tracking-tight">Collega il tuo calendario</h2>
                    <p className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        Per visualizzare i tuoi impegni e organizzare la tua giornata con l'AI, connetti il tuo account Google.
                    </p>
                </div>
                <button
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-black hover:bg-neutral-200 transition-all duration-300 font-bold shadow-xl shadow-black/20 group"
                    onClick={handleGoogleLogin}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Continua con Google</span>
                </button>
            </div>
        </div>
    )
};

const CalendarPage = () => {
    const { session, theme } = useAuth();
    const { setIsLivePreview } = useApp();
    const [error, setError] = useState("");
    const isDark = theme === 'dark';
    const { isFloatingChat, setIsFloatingChat, events, fetchEvents, currentWeekStart, setCurrentWeekStart, chatPosition } = useCalendar();

    const isSidebarOpen = isFloatingChat && chatPosition === 'sidebar-right';

    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const borderColor = isDark ? "border-white/[0.08]" : "border-neutral-300";

    function getStartOfWeek(date: Date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.setDate(diff));
        start.setHours(0, 0, 0, 0);
        return start;
    }

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(currentWeekStart);
            day.setDate(day.getDate() + i);
            return day;
        });
    }, [currentWeekStart]);

    const groupedEvents = useMemo(() => {
        const map: Record<string, any[]> = {};
        events.forEach(event => {
            const startStr = event.start.dateTime || event.start.date;
            const startDate = new Date(startStr);
            const dateKey = `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()}`;
            const hour = startDate.getHours();
            const key = `${dateKey}-${hour}`;

            const end = new Date(event.end.dateTime || event.end.date);
            const durationMs = end.getTime() - startDate.getTime();
            const durationHours = Math.max(durationMs / (1000 * 60 * 60), 0.5);
            const startMinuteOffset = startDate.getMinutes() / 60;

            if (!map[key]) map[key] = [];
            map[key].push({ ...event, durationHours, startMinuteOffset });
        });
        return map;
    }, [events]);

    useEffect(() => {
        fetchEvents();
    }, [session, currentWeekStart, fetchEvents]);

    const handlePrev = useCallback(() => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() - 7);
        setCurrentWeekStart(d);
    }, [currentWeekStart]);

    const handleNext = useCallback(() => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + 7);
        setCurrentWeekStart(d);
    }, [currentWeekStart]);

    const handleToday = useCallback(() => {
        setCurrentWeekStart(getStartOfWeek(new Date()));
    }, []);

    const handleEventClick = useCallback((event: any) => {
        setSelectedEvent(event);
    }, []);

    if (!session?.provider_token) {
        return <RequiredAuthCalendarPage />;
    }

    return (
        <div className={`h-full flex flex-col overflow-hidden relative transition-colors duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea] noise" : "bg-white text-neutral-900"} ${isSidebarOpen ? 'pr-[380px]' : ''}`}>
            <CalendarStyles isDark={isDark} />

            {isDark && (
                <>
                    <div className="absolute -top-24 -left-24 h-[400px] w-[400px] rounded-full bg-orange-500/[0.08] blur-[80px] pointer-events-none" />
                    <div className="absolute top-1/4 -right-24 h-[300px] w-[300px] rounded-full bg-orange-600/[0.04] blur-[70px] pointer-events-none" />
                    <div className="absolute bottom-1/4 left-1/3 h-[250px] w-[250px] rounded-full bg-orange-500/[0.04] blur-[80px] pointer-events-none" />
                </>
            )}

            {/* Header - Glass Effect */}
            <div className={`p-6 flex items-center justify-between border-b z-20 ${isDark ? "bg-white/[0.02] backdrop-blur-md border-white/[0.08]" : "bg-white border-neutral-200"}`}>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black tracking-tighter uppercase italic">
                        {currentWeekStart.toLocaleDateString("it-IT", { month: 'long', year: 'numeric' })}
                    </h1>
                    <span className="text-[10px] font-mono opacity-40 tracking-[0.2em] uppercase">Time Horizon</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <button onClick={handlePrev} className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-neutral-100"}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={handleToday} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white"}`}>OGGI</button>
                        <button onClick={handleNext} className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-neutral-100"}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <a
                        href="https://calendar.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black tracking-widest uppercase border transition-all ${isDark ? "border-orange-500/20 text-[#f97316] hover:bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "border-neutral-200 text-neutral-800 hover:bg-neutral-50"}`}
                    >
                        Calendar →
                    </a>
                </div>
            </div>

            {/* Griglia Calendario */}
            <div className="flex-1 overflow-auto z-10 custom-scrollbar relative">
                <div className={`min-w-[1000px] grid grid-cols-[80px_repeat(7,1fr)] border-b ${borderColor}`}>

                    {/* Header Giorni */}
                    <div className={`sticky top-0 z-30 border-r ${isDark ? "bg-[#07070a] border-white/[0.08]" : "bg-white border-neutral-200"}`}></div>
                    {weekDays.map((day, i) => (
                        <div key={i} className={`sticky top-0 z-30 p-4 text-center border-r transition-colors ${isDark ? "bg-[#07070a]/80 backdrop-blur-xl border-white/[0.08]" : "bg-white border-neutral-200"} ${day.toDateString() === new Date().toDateString() ? "text-orange-500" : ""}`}>
                            <div className={`text-[9px] font-mono uppercase tracking-[0.3em] mb-1 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                                {day.toLocaleDateString("it-IT", { weekday: 'short' })}
                            </div>
                            <div className="text-2xl font-black tracking-tighter">{day.getDate()}</div>
                        </div>
                    ))}

                    {/* Righe Orarie */}
                    {HOURS.map(hour => (
                        <CalendarRow
                            key={hour}
                            hour={hour}
                            weekDays={weekDays}
                            isDark={isDark}
                            groupedEvents={groupedEvents}
                            onClick={handleEventClick}
                        />
                    ))}
                </div>
            </div>

            {/* Pulsante Floating */}
            {!isFloatingChat && (
                <div className="fixed bottom-8 right-8 z-40">
                    <button
                        onClick={() => setIsFloatingChat(!isFloatingChat)}
                        className={`p-5 rounded-3xl transition-all shadow-[0_20px_50px_rgba(0,0,0,0.4)] scale-100 hover:scale-110 active:scale-90 
                            ${isDark ? "bg-[#f97316] text-black hover:bg-[#fb923c] shadow-orange-500/20" : "bg-black text-white hover:bg-neutral-800"}`}
                    >
                        <MagicWandIcon size={28} weight="fill" />
                    </button>
                </div>
            )}

            {isFloatingChat && <FloatingChat />}

            {/* --- Modale Event Detail (Sober & Fast) --- */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15, ease: "linear" }}
                            className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border
                                ${isDark ? "bg-[#0f0f12] border-white/10 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header Modale */}
                            <div className="p-6 pb-2 flex justify-between items-start">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">Event Details</span>
                                    <h2 className="text-xl font-bold tracking-tight leading-tight">
                                        {selectedEvent.summary || "(Nessun titolo)"}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-white/5 text-neutral-500" : "hover:bg-neutral-100 text-neutral-500"}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Corpo Modale */}
                            <div className="px-6 py-4 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.02] border-white/5" : "bg-neutral-50 border-neutral-100"}`}>
                                        <div className="text-[9px] font-bold uppercase tracking-wider opacity-30 mb-2">Schedule</div>
                                        <div className="text-xs font-semibold mb-1">{new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleDateString("it-IT", { dateStyle: 'medium' })}</div>
                                        <div className="text-lg font-bold text-orange-500">
                                            {new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' })}
                                            <span className="opacity-20 mx-1">—</span>
                                            {new Date(selectedEvent.end.dateTime || selectedEvent.end.date).toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {selectedEvent.location && (
                                            <div className={`p-3 rounded-xl border ${isDark ? "bg-white/[0.01] border-white/5" : "bg-neutral-50 border-neutral-100"}`}>
                                                <div className="text-[8px] font-bold uppercase tracking-wider opacity-30 mb-0.5">Location</div>
                                                <div className="text-[11px] font-medium truncate">{selectedEvent.location}</div>
                                            </div>
                                        )}
                                        <div className={`p-3 rounded-xl border ${isDark ? "bg-white/[0.01] border-white/5" : "bg-neutral-50 border-neutral-100"}`}>
                                            <div className="text-[8px] font-bold uppercase tracking-wider opacity-30 mb-0.5">Status</div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Confirmed
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedEvent.description && (
                                    <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.01] border-white/5" : "bg-neutral-50 border-neutral-100"}`}>
                                        <div className="text-[9px] font-bold uppercase tracking-wider opacity-30 mb-2">Description</div>
                                        <div
                                            className="text-[12px] leading-relaxed opacity-70 max-h-32 overflow-y-auto custom-scrollbar pr-2"
                                            dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Footer Modale */}
                            <div className="p-6 pt-2 flex items-center justify-between gap-4">
                                {selectedEvent.htmlLink && (
                                    <a
                                        href={selectedEvent.htmlLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-black font-bold text-[11px] uppercase hover:bg-orange-400 transition-all active:scale-95"
                                    >
                                        OPEN IN CALENDAR
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </a>
                                )}
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all ${isDark ? "text-white/30 hover:text-white hover:bg-white/5" : "text-neutral-400 hover:text-neutral-800"}`}
                                >
                                    CLOSE
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarPage;