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
        async function getCalendarEvents() {
            const providerToken = session?.provider_token;
            if (!providerToken) return;

            try {
                setIsLivePreview(true);
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

    const getEventsForDayAndHour = (day: Date, hour: number) => {
        return events.filter(event => {
            const startStr = event.start.dateTime || event.start.date;
            const startDate = new Date(startStr);
            return startDate.getDate() === day.getDate() &&
                startDate.getMonth() === day.getMonth() &&
                startDate.getFullYear() === day.getFullYear() &&
                startDate.getHours() === hour;
        });
    };

    return (
        <div className={`h-full flex flex-col overflow-hidden ${isDark ? "bg-neutral-950 text-neutral-100" : "bg-white text-neutral-900"}`}>

            {/* Header - Bordo dinamico */}
            <div className={`p-4 flex items-center justify-between border-b ${borderColor}`}>
                <h1 className="text-xl font-bold">
                    {currentWeekStart.toLocaleDateString("it-IT", { month: 'long', year: 'numeric' }).toUpperCase()}
                </h1>
                <div className="flex gap-2">
                    <button onClick={handlePrev} className={`px-4 py-2 border rounded-md transition ${borderColor} hover:bg-neutral-100 dark:hover:bg-neutral-800`}>Prev</button>
                    <button onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))} className={`px-4 py-2 border rounded-md transition ${borderColor} hover:bg-neutral-100 dark:hover:bg-neutral-800`}>Oggi</button>
                    <button onClick={handleNext} className={`px-4 py-2 border rounded-md transition ${borderColor} hover:bg-neutral-100 dark:hover:bg-neutral-800`}>Next</button>
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
                                const dayEvents = getEventsForDayAndHour(day, hour);
                                return (
                                    <div key={`${hour}-${i}`} className={`border-r border-b relative h-10 group hover:bg-neutral-500/10 ${borderColor}`}>
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className="absolute inset-x-1 p-1 text-[10px] leading-tight rounded bg-blue-600/20 border border-blue-500 text-blue-600 dark:text-blue-200 overflow-hidden z-10"
                                            >
                                                {event.summary}
                                            </div>
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
                <div className="fixed bottom-4 right-4">
                    <button
                        onClick={() => setIsFloatingChat(!isFloatingChat)}
                        className={`p-3 rounded-full transition-all shadow-lg ${isDark ? "bg-neutral-800 text-white hover:bg-neutral-700" : "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-100"}`}
                    >
                        <MagicWandIcon size={24} />
                    </button>
                </div>
            )}
            {isFloatingChat && <FloatingChat />}
        </div>
    );
};

export default CalendarPage;