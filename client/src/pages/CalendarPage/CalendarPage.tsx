import React, { lazy, Suspense, useCallback, useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { useCalendar } from "../../context/CalendarContext";
const FloatingChat = lazy(() => import("./FloatingChat"));
import { MagicWandIcon } from "@phosphor-icons/react";
import supabase from "../../library/supabaseclient";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* -------------------------------------------------------
   System Styles (Shared from Chat/LandingPage)
------------------------------------------------------- */
const CalendarStyles = ({ isDark }: { isDark: boolean }) => {
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
};

const CalendarPage = () => {
    const { session, theme } = useAuth();
    const { setIsLivePreview } = useApp();
    const [error, setError] = useState("");
    const [events, setEvents] = useState<any[]>([]);
    const isDark = theme === 'dark';
    const { isFloatingChat, setIsFloatingChat } = useCalendar();

    // Nuovo stato per l'evento selezionato
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    // Definiamo il colore del bordo una volta per riutilizzarlo facilmente
    const borderColor = isDark ? "border-white/[0.08]" : "border-neutral-300";

    const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));

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

    // O(N) grouping instead of O(N*M*K) filtering in the render loop
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
        async function getCalendarEvents() {
            const providerToken = session?.provider_token;
            if (!providerToken) return;

            try {
                const timeMin = currentWeekStart.toISOString();
                const timeMax = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
                const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${providerToken}` }
                });

                if (!response.ok) throw new Error('Errore nel recupero');
                const data = await response.json();
                setEvents(data.items || []);
            } catch (err) {
                setError("Impossibile caricare gli eventi.");
            }
        }

        getCalendarEvents();
    }, [session, currentWeekStart]);

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

    const ROW_HEIGHT = 40; // h-10 = 40px

    const handleEventClick = useCallback((event: any) => {
        setSelectedEvent(event);
    }, []);

    if (!session?.provider_token) {
        return <RequiredAuthCalendarPage />;
    }

    return (
        <div className={`h-full flex flex-col overflow-hidden relative transition-colors duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea] noise" : "bg-white text-neutral-900"}`}>
            <CalendarStyles isDark={isDark} />
            
            {isDark && (
                <>
                    <div className="absolute -top-24 -left-24 h-[400px] w-[400px] rounded-full bg-orange-500/[0.08] blur-[80px] pointer-events-none" />
                    <div className="absolute top-1/4 -right-24 h-[300px] w-[300px] rounded-full bg-orange-600/[0.04] blur-[70px] pointer-events-none" />
                    <div className="absolute bottom-1/4 left-1/3 h-[250px] w-[250px] rounded-full bg-orange-500/[0.04] blur-[80px] pointer-events-none" />
                </>
            )}

            {/* Header - Glass Effect */}
            <div className={`p-4 flex items-center justify-between border-b z-20 ${isDark ? "bg-white/[0.02] backdrop-blur-md border-white/[0.08]" : "bg-white border-neutral-200"}`}>
                <h1 className="text-xl font-bold tracking-tight">
                    {currentWeekStart.toLocaleDateString("it-IT", { month: 'long', year: 'numeric' }).toUpperCase()}
                </h1>
                <div className="flex gap-2">
                    <button onClick={handlePrev} className={`px-4 py-1.5 border rounded-xl text-sm font-medium transition-all ${isDark ? "bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.1] text-white" : "bg-white border-neutral-200 hover:bg-neutral-50"}`}>Prev</button>
                    <button onClick={handleToday} className={`px-4 py-1.5 border rounded-xl text-sm font-medium transition-all ${isDark ? "bg-white text-black hover:bg-neutral-200 border-transparent" : "bg-black text-white hover:bg-neutral-800"}`}>Oggi</button>
                    <button onClick={handleNext} className={`px-4 py-1.5 border rounded-xl text-sm font-medium transition-all ${isDark ? "bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.1] text-white" : "bg-white border-neutral-200 hover:bg-neutral-50"}`}>Next</button>
                </div>
            </div>

            {/* Griglia Calendario */}
            <div className="flex-1 overflow-auto z-10 custom-scrollbar">
                <div className={`min-w-[800px] grid grid-cols-[60px_repeat(7,1fr)] border-b ${borderColor}`}>

                    {/* Header Giorni */}
                    <div className={`sticky top-0 z-20 border-r ${isDark ? "bg-[#07070a]/90 backdrop-blur-md border-white/[0.08]" : "bg-white border-neutral-200"}`}></div>
                    {weekDays.map((day, i) => (
                        <div key={i} className={`sticky top-0 z-20 p-2 text-center border-r transition-colors ${isDark ? "bg-[#07070a]/90 backdrop-blur-md border-white/[0.08]" : "bg-white border-neutral-200"} ${day.toDateString() === new Date().toDateString() ? "text-orange-500 font-bold" : ""}`}>
                            <div className={`text-[10px] uppercase tracking-wider ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>{day.toLocaleDateString("it-IT", { weekday: 'short' })}</div>
                            <div className="text-xl font-bold">{day.getDate()}</div>
                        </div>
                    ))}

                    {/* Righe Orarie */}
                    {HOURS.map(hour => (
                        <div key={hour} className="contents">
                            {/* Etichetta Ora */}
                            <div className={`text-right pr-3 text-[10px] font-mono border-r h-10 flex items-center justify-end ${isDark ? "text-neutral-600 border-white/[0.04]" : "text-neutral-400 border-neutral-100"}`}>
                                {`${hour.toString().padStart(2, '0')}:00`}
                            </div>

                            {/* Celle Giornaliere */}
                            {weekDays.map((day, i) => {
                                const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                                const dayEvents = groupedEvents[`${dateKey}-${hour}`] || [];
                                return (
                                    <div key={`${hour}-${i}`} className={`border-r border-b relative h-10 group transition-colors ${isDark ? "border-white/[0.04] hover:bg-white/[0.02]" : "border-neutral-100 hover:bg-neutral-50"}`}>
                                        {dayEvents.map(event => (
                                            <EventCard 
                                                key={event.id} 
                                                event={event} 
                                                isDark={isDark} 
                                                onClick={handleEventClick} 
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pulsante Floating */}
            {!isFloatingChat && (
                <div className="fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => setIsFloatingChat(!isFloatingChat)}
                        className={`p-4 rounded-2xl transition-all shadow-2xl scale-100 hover:scale-105 active:scale-95 ${isDark ? "bg-white text-black" : "bg-black text-white"}`}
                    >
                        <MagicWandIcon size={24} weight="fill" />
                    </button>
                </div>
            )}
            {isFloatingChat && (
                <Suspense fallback={null}>
                    <FloatingChat />
                </Suspense>
            )}

            {/* --- Modale Event Detail --- */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
                    <div
                        className={`relative w-full max-w-lg p-8 rounded-3xl shadow-2xl overflow-hidden glass ${isDark ? "text-white" : "bg-white text-neutral-900"}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modale */}
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold pr-8 tracking-tight">{selectedEvent.summary || "(Nessun titolo)"}</h2>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/10 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"}`}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Corpo Modale */}
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <span className={`font-semibold w-16 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>Orario</span>
                                <div className="flex flex-col">
                                    <span className="font-medium">{new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleString("it-IT", { dateStyle: 'full' })}</span>
                                    <span className="text-xs opacity-60">
                                        {new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' })} 
                                        {" - "}
                                        {new Date(selectedEvent.end.dateTime || selectedEvent.end.date).toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {selectedEvent.location && (
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                    <span className={`font-semibold w-16 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>Luogo</span>
                                    <span className="truncate">{selectedEvent.location}</span>
                                </div>
                            )}

                            {selectedEvent.description && (
                                <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                    <span className={`font-semibold block ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>Descrizione</span>
                                    <div
                                        className="whitespace-pre-wrap max-h-40 overflow-y-auto pr-2 text-sm leading-relaxed opacity-90"
                                        dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer Modale */}
                        <div className="mt-8 flex justify-end gap-3 items-center">
                            {selectedEvent.htmlLink && (
                                <a
                                    href={selectedEvent.htmlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-500 hover:text-orange-400 text-sm font-bold mr-auto transition-colors"
                                >
                                    Apri in Calendar
                                </a>
                            )}
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"}`}
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ROW_HEIGHT = 40;

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
export default CalendarPage;