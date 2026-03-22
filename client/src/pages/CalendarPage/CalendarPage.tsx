import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { useCalendar } from "../../context/CalendarContext";
import FloatingChat from "./FloatingChat";
import { MagicWandIcon } from "@phosphor-icons/react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

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
    const borderColor = isDark ? "border-neutral-800" : "border-neutral-300";

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

    useEffect(() => {
        // setIsLivePreview(true)
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
                console.log(data);  
                setEvents(data.items || []);
            } catch (err) {
                setError("Impossibile caricare gli eventi.");
            }
        }
        
        getCalendarEvents();
    }, [session, currentWeekStart]);

    const handlePrev = () => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() - 7);
        setCurrentWeekStart(d);
    };

    const handleNext = () => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + 7);
        setCurrentWeekStart(d);
    };

    const ROW_HEIGHT = 40; // h-10 = 40px

    const getEventsStartingAt = (day: Date, hour: number) => {
        return events
            .filter(event => {
                const startStr = event.start.dateTime || event.start.date;
                const startDate = new Date(startStr);
                return startDate.getDate() === day.getDate() &&
                    startDate.getMonth() === day.getMonth() &&
                    startDate.getFullYear() === day.getFullYear() &&
                    startDate.getHours() === hour;
            })
            .map(event => {
                const start = new Date(event.start.dateTime || event.start.date);
                const end = new Date(event.end.dateTime || event.end.date);
                const durationMs = end.getTime() - start.getTime();
                const durationHours = Math.max(durationMs / (1000 * 60 * 60), 0.5); // min 30min
                const startMinuteOffset = start.getMinutes() / 60; // fraction of hour
                return { ...event, durationHours, startMinuteOffset };
            });
    };

    // Modificata per aprire il modale
    function handleEventClick(event: any) {
        setSelectedEvent(event);
    }

    return (
        <div className={`h-full flex flex-col overflow-hidden relative ${isDark ? "bg-neutral-950 text-neutral-100" : "bg-white text-neutral-900"}`}>

            {/* Header - Bordo dinamico */}
            <div className={`p-4 flex items-center justify-between border-b ${borderColor}`}>
                <h1 className="text-xl font-bold">
                    {currentWeekStart.toLocaleDateString("it-IT", { month: 'long', year: 'numeric' }).toUpperCase()}
                </h1>
                <div className="flex gap-2">
                    <button onClick={handlePrev} className={`px-4 py-2 border rounded-md transition ${borderColor} ${isDark ? "dark:hover:bg-neutral-800" : "hover:bg-neutral-100"}`}>Prev</button>
                    <button onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))} className={`px-4 py-2 border rounded-md transition ${borderColor} ${isDark ? "dark:hover:bg-neutral-800" : "hover:bg-neutral-100"}`}>Oggi</button>
                    <button onClick={handleNext} className={`px-4 py-2 border rounded-md transition ${borderColor} ${isDark ? "dark:hover:bg-neutral-800" : "hover:bg-neutral-100"}`}>Next</button>
                </div>
            </div>

            {/* Griglia Calendario */}
            <div className="flex-1 overflow-auto">
                <div className={`min-w-[800px] grid grid-cols-[60px_repeat(7,1fr)] border-b ${borderColor}`}>
                    
                    {/* Header Giorni */}
                    <div className={`sticky top-0 z-20 bg-inherit border-r ${borderColor}`}></div>
                    {weekDays.map((day, i) => (
                        <div key={i} className={`sticky top-0 z-20 p-2 text-center border-r bg-inherit ${borderColor} ${day.toDateString() === new Date().toDateString() ? "text-blue-500 font-bold" : ""}`}>
                            <div className="text-xs uppercase">{day.toLocaleDateString("it-IT", { weekday: 'short' })}</div>
                            <div className="text-xl">{day.getDate()}</div>
                        </div>
                    ))}

                    {/* Righe Orarie */}
                    {HOURS.map(hour => (
                        <div key={hour} className="contents">
                            {/* Etichetta Ora */}
                            <div className={`text-right pr-2 text-xs text-neutral-500 border-r h-10 flex items-center justify-end ${borderColor}`}>
                                {`${hour}:00`}
                            </div>

                            {/* Celle Giornaliere */}
                            {weekDays.map((day, i) => {
                                const dayEvents = getEventsStartingAt(day, hour);
                                return (
                                    <div key={`${hour}-${i}`} className={`border-r border-b relative h-10 group hover:bg-neutral-500/10 ${borderColor}`}>
                                        {dayEvents.map(event => {
                                            const topPx = event.startMinuteOffset * ROW_HEIGHT;
                                            const heightPx = event.durationHours * ROW_HEIGHT - 2; // -2 for gap
                                           
                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Evita conflitti di click
                                                        handleEventClick(event);
                                                    }}
                                                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                                                    className={`absolute inset-x-1 p-1.5 text-[10px] leading-tight rounded-md overflow-hidden z-10 border transition-colors cursor-pointer ${
                                                        isDark
                                                            ? "bg-blue-500/20 border-blue-500/40 text-blue-200 hover:bg-blue-500/30"
                                                            : "bg-blue-500 border-blue-600 text-white hover:bg-blue-600"
                                                    }`}
                                                >
                                                    <span className="font-semibold block truncate">{event.summary}</span>
                                                    {event.durationHours >= 1 && (
                                                        <span className={`block mt-0.5 ${isDark ? "text-blue-300/70" : "text-blue-100"}`}>
                                                            {new Date(event.start.dateTime).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                                                            {" – "}
                                                            {new Date(event.end.dateTime).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pulsante Floating */}
            {!isFloatingChat && (
                <div className="fixed bottom-4 right-4 z-40">
                    <button
                        onClick={() => setIsFloatingChat(!isFloatingChat)}
                        className={`p-3 rounded-full transition-all shadow-lg ${isDark ? "bg-neutral-800 text-white hover:bg-neutral-700" : "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-100"}`}
                    >
                        <MagicWandIcon size={24} />
                    </button>
                </div>
            )}
            {isFloatingChat && <FloatingChat />}

            {/* --- Modale Event Detail --- */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
                    <div 
                        className={`relative w-full max-w-lg p-6 rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}
                        onClick={(e) => e.stopPropagation()} // Previene la chiusura cliccando dentro il modale
                    >
                        {/* Header Modale */}
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold pr-4">{selectedEvent.summary || "(Nessun titolo)"}</h2>
                            <button 
                                onClick={() => setSelectedEvent(null)}
                                className={`p-1 rounded-md transition-colors ${isDark ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"}`}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Corpo Modale */}
                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3">
                                <span className={`font-medium w-16 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Inizio:</span>
                                <span>{new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleString("it-IT")}</span>
                            </div>
                            <div className="flex gap-3">
                                <span className={`font-medium w-16 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Fine:</span>
                                <span>{new Date(selectedEvent.end.dateTime || selectedEvent.end.date).toLocaleString("it-IT")}</span>
                            </div>

                            {selectedEvent.location && (
                                <div className="flex gap-3">
                                    <span className={`font-medium w-16 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Luogo:</span>
                                    <span>{selectedEvent.location}</span>
                                </div>
                            )}

                            {selectedEvent.description && (
                                <div className="flex gap-3">
                                    <span className={`font-medium w-16 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Dettagli:</span>
                                    <div 
                                        className="whitespace-pre-wrap max-h-32 overflow-y-auto pr-2"
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
                                    className="text-blue-500 hover:underline text-sm font-medium mr-auto"
                                >
                                    Apri in GCalendar
                                </a>
                            )}
                            <button 
                                onClick={() => setSelectedEvent(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-100 hover:bg-neutral-200"}`}
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

export default CalendarPage;