import React, { lazy, Suspense, useCallback, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { useCalendar } from "../../context/CalendarContext";
import FloatingChat from "./FloatingChat";
import { MagicWandIcon, Clock } from "@phosphor-icons/react";
import supabase from "../../library/supabaseclient";
import MarkdownRender from "../../library/markdownRender";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_HEIGHT = 48;

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
const EventCard = React.memo(({ event, isDark, onClick, onContextMenu, isSelected }: { 
    event: any, 
    isDark: boolean, 
    onClick: (ev: any, e: React.MouseEvent) => void, 
    onContextMenu: (e: React.MouseEvent, ev: any) => void,
    isSelected?: boolean 
}) => {
    const topPx = event.startMinuteOffset * ROW_HEIGHT;
    const heightPx = event.durationHours * ROW_HEIGHT - 2;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick(event, e);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(e, event);
            }}
            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
            className={`absolute inset-x-1 p-2 text-xs leading-tight font-medium rounded-xl overflow-hidden z-10 border transition-all cursor-pointer ${isDark
                ? (isSelected 
                    ? "bg-orange-500/30 border-orange-500 text-orange-100 glass shadow-lg shadow-orange-500/20 scale-[1.02] z-20" 
                    : "bg-orange-500/10 border-orange-500/30 text-orange-200 hover:bg-orange-500/20 glass-soft shadow-lg shadow-orange-500/5")
                : (isSelected
                    ? "bg-[#e8e2d8] border-[#d6cfc4] text-[#2c2825] shadow-md scale-[1.02] z-20"
                    : "bg-[#f0ebe4] border-[#e2ddd5] text-[#2c2825] hover:bg-[#e8e2d8]")
                }`}
        >
            <span className="font-bold block truncate">{event.summary}</span>
            {event.durationHours >= 1 && (
                <span className={`block mt-0.5 opacity-80 font-mono`}>
                    {new Date(event.start.dateTime || event.start.date).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </span>
            )}
        </div>
    );
});
EventCard.displayName = "EventCard";

// --- Sub-component for the hour cell (Memoized) ---
const CalendarCell = React.memo(({ hour, day, isDark, events, onClick, onCellClick, onEventContextMenu, selectedEventId, isCreateCellFocused }: {
    hour: number,
    day: Date,
    isDark: boolean,
    events: any[],
    onClick: (ev: any, e: React.MouseEvent) => void,
    onCellClick: (day: Date, hour: number, e: React.MouseEvent) => void,
    onEventContextMenu: (e: React.MouseEvent, ev: any) => void,
    selectedEventId?: string,
    isCreateCellFocused?: boolean
}) => {
    return (
        <div 
            onClick={(e) => onCellClick(day, hour, e)}
            className={`border-r border-b relative h-12 group transition-colors ${
                isDark 
                    ? `border-white/[0.04] ${isCreateCellFocused ? 'bg-orange-500/15 border-orange-500/30' : 'hover:bg-white/[0.02]'}` 
                    : `border-neutral-100 ${isCreateCellFocused ? 'bg-orange-100/35 border-orange-300/60' : 'hover:bg-neutral-50'}`
            }`}
        >
            {events.map(event => (
                <EventCard
                    key={event.id}
                    event={event}
                    isDark={isDark}
                    onClick={onClick}
                    onContextMenu={onEventContextMenu}
                    isSelected={selectedEventId === event.id}
                />
            ))}
        </div>
    );
});
CalendarCell.displayName = "CalendarCell";

// --- Sub-component for the hour row (Memoized) ---
const CalendarRow = React.memo(({ hour, weekDays, isDark, groupedEvents, onClick, onCellClick, onEventContextMenu, selectedEventId, focusedCell }: {
    hour: number,
    weekDays: Date[],
    isDark: boolean,
    groupedEvents: Record<string, any[]>,
    onClick: (ev: any, e: React.MouseEvent) => void,
    onCellClick: (day: Date, hour: number, e: React.MouseEvent) => void,
    onEventContextMenu: (e: React.MouseEvent, ev: any) => void,
    selectedEventId?: string,
    focusedCell: { day: Date; hour: number } | null
}) => {
    return (
        <div className="contents">
            <div className={`sticky left-0 z-20 text-right pr-3 text-xs font-mono border-r h-12 flex items-center justify-end ${isDark ? "bg-[#07070a] text-neutral-600 border-white/[0.04]" : "bg-white text-neutral-400 border-neutral-100"}`}>
                {`${hour.toString().padStart(2, '0')}:00`}
            </div>
            {weekDays.map((day, i) => {
                const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const dayEvents = groupedEvents[`${dateKey}-${hour}`] || [];
                const isCreateCellFocused = focusedCell && 
                    focusedCell.hour === hour && 
                    focusedCell.day.toDateString() === day.toDateString();
                return (
                    <CalendarCell
                        key={`${hour}-${i}`}
                        hour={hour}
                        day={day}
                        isDark={isDark}
                        events={dayEvents}
                        onClick={onClick}
                        onCellClick={onCellClick}
                        onEventContextMenu={onEventContextMenu}
                        selectedEventId={selectedEventId}
                        isCreateCellFocused={!!isCreateCellFocused}
                    />
                );
            })}
        </div>
    );
});
CalendarRow.displayName = "CalendarRow";

// --- Sub-component for Markdown Sandbox Editor ---
const MarkdownSandbox = ({ 
    value, 
    onChange, 
    isDark, 
    placeholder = "Dettagli evento...",
    activeTab,
    setActiveTab
}: { 
    value: string; 
    onChange: (val: string) => void; 
    isDark: boolean; 
    placeholder?: string;
    activeTab: 'write' | 'preview';
    setActiveTab: (tab: 'write' | 'preview') => void;
}) => {
    return (
        <div className={`rounded-2xl border transition-all overflow-hidden ${
            isDark 
                ? 'border-white/10 bg-[#0d0e14]/50' 
                : 'border-neutral-200 bg-white'
        }`}>
            {/* Header / Tabs */}
            <div className={`flex items-center justify-between px-3 py-2 border-b text-xs font-bold uppercase tracking-wider ${
                isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-neutral-100 bg-neutral-50/50'
            }`}>
                <span className="opacity-50">Editor Descrizione</span>
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('write')}
                        className={`px-2.5 py-0.5 rounded-md transition-all text-xs ${
                            activeTab === 'write'
                                ? (isDark ? 'bg-white/10 text-white' : 'bg-neutral-200 text-neutral-800')
                                : 'opacity-50 hover:opacity-100'
                        }`}
                    >
                        Scrivi
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`px-2.5 py-0.5 rounded-md transition-all text-xs ${
                            activeTab === 'preview'
                                ? (isDark ? 'bg-orange-500/20 text-[#f97316]' : 'bg-orange-100 text-orange-700')
                                : 'opacity-50 hover:opacity-100'
                        }`}
                    >
                        Anteprima
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="p-0">
                {activeTab === 'write' ? (
                    <MdEditor
                        modelValue={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        theme={isDark ? 'dark' : 'light'}
                        language="en-US"
                        style={{ height: '180px', fontSize: '14px' }}
                        toolbars={[
                            'bold',
                            'italic',
                            'strikeThrough',
                            '-',
                            'title',
                            'quote',
                            'unorderedList',
                            'orderedList',
                            '-',
                            'code',
                            'link'
                        ]}
                        footers={[]}
                        preview={false}
                    />
                ) : (
                    <div 
                        onClick={() => setActiveTab('write')}
                        className="cursor-pointer p-4 min-h-[180px] max-h-[200px] overflow-y-auto custom-scrollbar text-sm leading-relaxed max-w-none hover:opacity-95"
                        title="Clicca per modificare"
                    >
                        {value.trim() ? (
                            <MarkdownRender text={value} themeOverride={isDark ? 'dark' : 'light'} />
                        ) : (
                            <span className="italic opacity-40">Nessuna descrizione. Clicca per modificare o usa "Migliora con AI".</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

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
    const { isFloatingChat, setIsFloatingChat, events, fetchEvents, currentWeekStart, setCurrentWeekStart, chatPosition, sidebarWidth } = useCalendar();

    const isSidebarOpen = isFloatingChat && chatPosition === 'sidebar-right';

    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const borderColor = isDark ? "border-white/[0.08]" : "border-neutral-300";
    const [selectedEventCoords, setSelectedEventCoords] = useState<any | null>(null);
    const [createEventCoords, setCreateEventCoords] = useState<any | null>(null);
    const [isImprovingDescription, setIsImprovingDescription] = useState(false);
    const [descriptionTab, setDescriptionTab] = useState<'write' | 'preview'>('write');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [createEventCell, setCreateEventCell] = useState<{ day: Date; hour: number } | null>(null);

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        event: any;
    } | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState("");
    const [createDescription, setCreateDescription] = useState("");
    const [createUsers, setCreateUsers] = useState("");
    const [createRemindNotification, setCreateRemindNotification] = useState(false);
    const [createStartDate, setCreateStartDate] = useState("");
    const [createStartTime, setCreateStartTime] = useState("");
    const [createEndDate, setCreateEndDate] = useState("");
    const [createEndTime, setCreateEndTime] = useState("");
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);

    useEffect(() => {
        const handleCloseMenu = () => {
            setContextMenu(null);
        };
        window.addEventListener("click", handleCloseMenu);
        return () => window.removeEventListener("click", handleCloseMenu);
    }, []);

    useEffect(() => {
        if (isCreateModalOpen) {
            // Note: date and time are initialized in handleCellClick, but if clicked via header button:
            if (!createStartDate) {
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;
                
                setCreateStartDate(dateStr);
                setCreateEndDate(dateStr);
                
                const hour = String((now.getHours() + 1) % 24).padStart(2, '0');
                setCreateStartTime(`${hour}:00`);
                const endHour = String((now.getHours() + 2) % 24).padStart(2, '0');
                setCreateEndTime(`${endHour}:00`);
            }
        }
    }, [isCreateModalOpen, createStartDate]);

    const handleCellClick = useCallback((day: Date, hour: number, e: React.MouseEvent) => {
        const yyyy = day.getFullYear();
        const mm = String(day.getMonth() + 1).padStart(2, '0');
        const dd = String(day.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        setCreateStartDate(dateStr);
        setCreateEndDate(dateStr);
        setCreateStartTime(`${String(hour).padStart(2, '0')}:00`);
        setCreateEndTime(`${String((hour + 1) % 24).padStart(2, '0')}:00`);
        
        setCreateRemindNotification(false);
        setDescriptionTab('write');
        setEditingEventId(null);
        setCreateEventCell({ day, hour });
        
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setCreateEventCoords({
            x: e.clientX,
            y: e.clientY,
            cellLeft: rect.left,
            cellRight: rect.right,
            cellTop: rect.top,
            cellBottom: rect.bottom
        });
        setIsCreateModalOpen(true);
        setSelectedEvent(null);
    }, []);

    const handleStartEditEvent = useCallback((event: any, coords: any) => {
        setEditingEventId(event.id);
        setCreateTitle(event.summary || "");
        setCreateDescription(event.description || "");
        
        const startStr = event.start.dateTime || event.start.date;
        const endStr = event.end.dateTime || event.end.date;
        
        const startD = new Date(startStr);
        const endD = new Date(endStr);
        
        const startYYYY = startD.getFullYear();
        const startMM = String(startD.getMonth() + 1).padStart(2, '0');
        const startDD = String(startD.getDate()).padStart(2, '0');
        setCreateStartDate(`${startYYYY}-${startMM}-${startDD}`);
        
        const endYYYY = endD.getFullYear();
        const endMM = String(endD.getMonth() + 1).padStart(2, '0');
        const endDD = String(endD.getDate()).padStart(2, '0');
        setCreateEndDate(`${endYYYY}-${endMM}-${endDD}`);
        
        setCreateStartTime(`${String(startD.getHours()).padStart(2, '0')}:${String(startD.getMinutes()).padStart(2, '0')}`);
        setCreateEndTime(`${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`);
        
        if (event.attendees) {
            setCreateUsers(event.attendees.map((a: any) => a.email).join(", "));
        } else {
            setCreateUsers("");
        }
        
        const hasReminders = event.reminders && (event.reminders.useDefault || (event.reminders.overrides && event.reminders.overrides.length > 0));
        setCreateRemindNotification(!!hasReminders);
        setDescriptionTab('write');
        setCreateEventCell({ day: startD, hour: startD.getHours() });
        
        setCreateEventCoords(coords);
        setIsCreateModalOpen(true);
        setSelectedEvent(null);
    }, []);

    const handleImproveDescription = async () => {
        if (!createTitle.trim()) {
            alert("Inserisci un titolo per l'evento prima di generare la descrizione!");
            return;
        }
        setIsImprovingDescription(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/calendar/improve-description`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    title: createTitle,
                    description: createDescription
                })
            });

            if (!res.ok) {
                throw new Error("Errore nel miglioramento della descrizione");
            }

            const data = await res.json();
            if (data.description) {
                setCreateDescription(data.description);
                setDescriptionTab('preview');
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Impossibile migliorare la descrizione.");
        } finally {
            setIsImprovingDescription(false);
        }
    };

    const handleEventContextMenu = useCallback((e: React.MouseEvent, event: any) => {
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            event
        });
    }, []);

    const handleDeleteEvent = async (eventId: string) => {
        if (!session?.provider_token) return;
        const confirmDelete = window.confirm("Sei sicuro di voler eliminare questo evento?");
        if (!confirmDelete) return;

        try {
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${session.provider_token}`
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Errore durante l'eliminazione dell'evento: ${errText}`);
            }

            await fetchEvents();
            if (selectedEvent?.id === eventId) {
                setSelectedEvent(null);
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Errore nella cancellazione dell'evento.");
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.provider_token) return;
        if (!createTitle.trim()) {
            alert("Inserisci un titolo");
            return;
        }

        setIsCreatingEvent(true);
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const startDateTime = `${createStartDate}T${createStartTime}:00`;
            const endDateTime = `${createEndDate}T${createEndTime}:00`;

            const body: any = {
                summary: createTitle,
                description: createDescription,
                start: { dateTime: startDateTime, timeZone: tz },
                end: { dateTime: endDateTime, timeZone: tz }
            };

            if (createUsers.trim()) {
                const emails = createUsers.split(",")
                    .map(email => email.trim())
                    .filter(email => email.length > 0);
                body.attendees = emails.map(email => ({ email }));
            } else {
                body.attendees = [];
            }

            if (!createRemindNotification) {
                body.reminders = { useDefault: false, overrides: [] };
            } else {
                body.reminders = { useDefault: true };
            }

            const queryParams = new URLSearchParams({
                sendUpdates: createRemindNotification ? "all" : "none"
            });

            const method = editingEventId ? "PUT" : "POST";
            const url = editingEventId
                ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${editingEventId}?${queryParams}`
                : `https://www.googleapis.com/calendar/v3/calendars/primary/events?${queryParams}`;

            const response = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${session.provider_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Errore durante il salvataggio dell'evento: ${errText}`);
            }

            await fetchEvents();
            setIsCreateModalOpen(false);
            setEditingEventId(null);
            setCreateEventCell(null);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Errore nel salvataggio dell'evento.");
        } finally {
            setIsCreatingEvent(false);
        }
    };

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

    const handleEventClick = useCallback((event: any, e: React.MouseEvent) => {
        setSelectedEvent(event);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setSelectedEventCoords({ 
            x: e.clientX, 
            y: e.clientY,
            cellLeft: rect.left,
            cellRight: rect.right,
            cellTop: rect.top,
            cellBottom: rect.bottom
        });
        setIsCreateModalOpen(false);
    }, []);

    if (!session?.provider_token) {
        return <RequiredAuthCalendarPage />;
    }

    return (
        <div 
            className={`h-full flex flex-col overflow-hidden relative transition-colors duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea] noise" : "bg-white text-neutral-900"} ${isSidebarOpen ? 'md:pr-[var(--sidebar-padding)]' : ''}`}
            style={isSidebarOpen ? { '--sidebar-padding': `${sidebarWidth}px` } as React.CSSProperties : {}}
        >
            <CalendarStyles isDark={isDark} />

            {isDark && (
                <>
                    <div className="absolute -top-24 -left-24 h-[400px] w-[400px] rounded-full bg-orange-500/[0.08] blur-[80px] pointer-events-none" />
                    <div className="absolute top-1/4 -right-24 h-[300px] w-[300px] rounded-full bg-orange-600/[0.04] blur-[70px] pointer-events-none" />
                    <div className="absolute bottom-1/4 left-1/3 h-[250px] w-[250px] rounded-full bg-orange-500/[0.04] blur-[80px] pointer-events-none" />
                </>
            )}

            {/* Header - Glass Effect */}
            <div className={`p-6 pl-16 md:pl-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-b z-20 ${isDark ? "bg-white/[0.02] backdrop-blur-md border-white/[0.08]" : "bg-white border-neutral-200"}`}>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black tracking-tighter uppercase italic">
                        {currentWeekStart.toLocaleDateString("it-IT", { month: 'long', year: 'numeric' })}
                    </h1>
                    <span className="text-[10px] font-mono opacity-40 tracking-[0.2em] uppercase">Time Horizon</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => {
                            setCreateEventCoords({ x: window.innerWidth / 2 - 220, y: window.innerHeight / 2 - 240 });
                            setIsCreateModalOpen(true);
                            setSelectedEvent(null);
                            setCreateTitle("");
                            setCreateDescription("");
                            setCreateUsers("");
                            setCreateRemindNotification(false);
                            setDescriptionTab('write');
                            setEditingEventId(null);
                            setCreateEventCell(null);
                        }}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black tracking-widest uppercase border transition-all ${
                            isDark 
                                ? "border-orange-500/20 text-[#f97316] hover:bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]" 
                                : "border-neutral-200 text-neutral-800 hover:bg-neutral-50"
                        }`}
                    >
                        + CREA EVENTO
                    </button>
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
                    <div className={`sticky top-0 left-0 z-40 border-r ${isDark ? "bg-[#07070a] border-white/[0.08]" : "bg-white border-neutral-200"}`}></div>
                    {weekDays.map((day, i) => (
                        <div key={i} className={`sticky top-0 z-30 p-4 text-center border-r transition-colors ${isDark ? "bg-[#07070a]/80 backdrop-blur-xl border-white/[0.08]" : "bg-white border-neutral-200"} ${day.toDateString() === new Date().toDateString() ? "text-orange-500" : ""}`}>
                            <div className={`text-[11px] font-mono uppercase tracking-[0.3em] mb-1 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                                {day.toLocaleDateString("it-IT", { weekday: 'short' })}
                            </div>
                            <div className="text-3xl font-black tracking-tighter">{day.getDate()}</div>
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
                            onCellClick={handleCellClick}
                            onEventContextMenu={handleEventContextMenu}
                            focusedCell={createEventCell}
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

            {/* Custom Details Popup (Floating) */}
            <AnimatePresence>
                {selectedEvent && selectedEventCoords && (
                    <div className="fixed inset-0 z-[60] pointer-events-auto" onClick={() => setSelectedEvent(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            style={(() => {
                                const popupWidth = 440;
                                const popupHeight = 320;
                                let top = selectedEventCoords.y - 120;
                                let left = selectedEventCoords.x + 20;
                                
                                if (selectedEventCoords.cellLeft !== undefined) {
                                    const cellMiddleY = (selectedEventCoords.cellTop + selectedEventCoords.cellBottom) / 2;
                                    top = cellMiddleY - (popupHeight / 2);
                                    
                                    const screenMiddleX = window.innerWidth / 2;
                                    if (selectedEventCoords.cellLeft > screenMiddleX) {
                                        // Left snap of the column
                                        left = selectedEventCoords.cellLeft - popupWidth - 10;
                                    } else {
                                        // Right snap of the column
                                        left = selectedEventCoords.cellRight + 10;
                                    }
                                } else {
                                    if (left + popupWidth > window.innerWidth) {
                                        left = selectedEventCoords.x - popupWidth - 20;
                                    }
                                }
                                
                                if (left + popupWidth > window.innerWidth) {
                                    left = window.innerWidth - popupWidth - 10;
                                }
                                if (left < 10) left = 10;
                                
                                if (top + popupHeight > window.innerHeight - 90) {
                                    top = window.innerHeight - popupHeight - 90;
                                }
                                if (top < 10) top = 10;
                                
                                return { top: `${top}px`, left: `${left}px` };
                            })()}
                            className={`absolute w-[440px] rounded-[1.5rem] shadow-2xl overflow-hidden border flex flex-col p-6 font-sans select-none
                                ${isDark ? "bg-[#1f1f23] border-white/10 text-white shadow-black/80" : "bg-white border-neutral-200 text-neutral-800 shadow-neutral-300"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Toolbar (Header) */}
                            <div className="flex justify-between items-center mb-4 text-[#a3a3a3]">
                                <div className="flex items-center gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => handleStartEditEvent(selectedEvent, selectedEventCoords)}
                                        className="hover:text-white transition-colors"
                                    >
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                                        className="hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => alert("Funzione non implementata")}
                                        className="hover:text-white transition-colors"
                                    >
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => alert("Funzione non implementata")}
                                        className="hover:text-white transition-colors"
                                    >
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <button
                                    type="button"
                                    onClick={() => setSelectedEvent(null)}
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all hover:scale-105 active:scale-95
                                        ${isDark ? "border-white/10 hover:bg-white/5 text-white" : "border-neutral-200 hover:bg-neutral-50 text-neutral-800"}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Main Event Card Body */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="w-4 h-4 rounded bg-[#4285F4] flex-shrink-0 mt-1.5" />
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold tracking-tight leading-tight">
                                            {selectedEvent.summary || "(Nessun titolo)"}
                                        </h2>
                                        <div className="text-sm opacity-75">
                                            {(() => {
                                                const startD = new Date(selectedEvent.start.dateTime || selectedEvent.start.date);
                                                const endD = new Date(selectedEvent.end.dateTime || selectedEvent.end.date);
                                                return `${startD.toLocaleDateString("it-IT", { weekday: 'long', day: 'numeric', month: 'long' })} · ${startD.toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' })} - ${endD.toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' })}`;
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className="pl-7">
                                    {selectedEvent.htmlLink && (
                                        <a
                                            href={selectedEvent.htmlLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold tracking-wide transition-all active:scale-95
                                                ${isDark ? "border-white/10 hover:bg-white/5 text-[#f97316]" : "border-neutral-200 hover:bg-neutral-50 text-neutral-800"}`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                            </svg>
                                            Invite via link
                                        </a>
                                    )}
                                </div>

                                {selectedEvent.description && (
                                    <div className="flex items-start gap-3 w-full">
                                        <svg className="w-4 h-4 text-[#a3a3a3] mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                        </svg>
                                        <div className="text-sm leading-relaxed opacity-75 max-h-32 overflow-y-auto custom-scrollbar pr-2 w-full">
                                            <MarkdownRender text={selectedEvent.description} themeOverride={isDark ? 'dark' : 'light'} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-[#a3a3a3] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    <span className="text-sm font-semibold opacity-75">
                                        {session?.user?.email || "Tommaso Paparesta"}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Context Menu */}
            <AnimatePresence>
                {contextMenu && contextMenu.visible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.08 }}
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        className={`fixed z-[70] min-w-[160px] rounded-xl shadow-2xl p-1 border backdrop-blur-xl ${
                            isDark 
                                ? "bg-[#131215]/90 border-[#d6cfc4]/20 text-white" 
                                : "bg-white/95 border-neutral-200 text-neutral-800"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => {
                                setSelectedEvent(contextMenu.event);
                                setSelectedEventCoords({ x: contextMenu.x, y: contextMenu.y });
                                setContextMenu(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                                isDark ? "hover:bg-white/5 text-white/80" : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                        >
                            🔎 Dettagli
                        </button>
                        <button
                            onClick={() => {
                                const coords = {
                                    x: contextMenu.x,
                                    y: contextMenu.y,
                                    cellLeft: contextMenu.x - 200,
                                    cellRight: contextMenu.x + 200,
                                    cellTop: contextMenu.y,
                                    cellBottom: contextMenu.y + 40
                                };
                                handleStartEditEvent(contextMenu.event, coords);
                                setContextMenu(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                                isDark ? "hover:bg-white/5 text-white/80" : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                        >
                            ✏️ Modifica
                        </button>
                        <div className={`h-px my-1 ${isDark ? "bg-white/10" : "bg-neutral-200"}`} />
                        <button
                            onClick={() => {
                                handleDeleteEvent(contextMenu.event.id);
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            🗑️ Elimina Evento
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Event Popup (Floating) */}
            <AnimatePresence>
                {isCreateModalOpen && createEventCoords && (
                    <div className="fixed inset-0 z-[60] pointer-events-auto" onClick={() => {
                        setIsCreateModalOpen(false);
                        setEditingEventId(null);
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            style={(() => {
                                const popupWidth = 440;
                                const popupHeight = 560;
                                let top = createEventCoords.y - 150;
                                let left = createEventCoords.x + 20;
                                
                                if (createEventCoords.cellLeft !== undefined) {
                                    const cellMiddleY = (createEventCoords.cellTop + createEventCoords.cellBottom) / 2;
                                    top = cellMiddleY - (popupHeight / 2);
                                    
                                    const screenMiddleX = window.innerWidth / 2;
                                    if (createEventCoords.cellLeft > screenMiddleX) {
                                        // Left snap of the column
                                        left = createEventCoords.cellLeft - popupWidth - 10;
                                    } else {
                                        // Right snap of the column
                                        left = createEventCoords.cellRight + 10;
                                    }
                                } else {
                                    if (left + popupWidth > window.innerWidth) {
                                        left = createEventCoords.x - popupWidth - 20;
                                    }
                                }
                                
                                if (left + popupWidth > window.innerWidth) {
                                    left = window.innerWidth - popupWidth - 10;
                                }
                                if (left < 10) left = 10;
                                
                                if (top + popupHeight > window.innerHeight - 90) {
                                    top = window.innerHeight - popupHeight - 90;
                                }
                                if (top < 10) top = 10;
                                
                                return { top: `${top}px`, left: `${left}px` };
                            })()}
                            className={`absolute w-[440px] rounded-[1.5rem] shadow-2xl overflow-hidden border flex flex-col p-6 font-sans select-none
                                ${isDark ? "bg-[#1f1f23] border-white/10 text-white shadow-black/80" : "bg-white border-neutral-200 text-neutral-800 shadow-neutral-300"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handleCreateEvent} className="space-y-4">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                                        {editingEventId ? "Modifica Evento" : "Nuovo Evento"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setEditingEventId(null);
                                        }}
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all hover:scale-105 active:scale-95
                                            ${isDark ? "border-white/10 hover:bg-white/5 text-white" : "border-neutral-200 hover:bg-neutral-50 text-neutral-800"}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Title Input */}
                                <div className="space-y-1">
                                    <input
                                        type="text"
                                        required
                                        value={createTitle}
                                        onChange={(e) => setCreateTitle(e.target.value)}
                                        placeholder="Aggiungi titolo"
                                        className={`w-full px-1 py-2 bg-transparent border-b text-xl font-bold transition-all focus:outline-none focus:border-orange-500
                                            ${isDark ? "border-white/10 text-white" : "border-neutral-200 text-neutral-800"}`}
                                    />
                                </div>

                                {/* Date and Time Selector */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="w-14 text-[10px] font-bold uppercase tracking-wider opacity-60">Inizio</span>
                                        <div className="flex-1 flex gap-3">
                                            <input
                                                type="date"
                                                required
                                                value={createStartDate}
                                                onChange={(e) => setCreateStartDate(e.target.value)}
                                                className={`flex-1 min-w-0 bg-transparent border-b py-1 text-base focus:outline-none focus:border-orange-500`}
                                            />
                                            <input
                                                type="time"
                                                required
                                                value={createStartTime}
                                                onChange={(e) => setCreateStartTime(e.target.value)}
                                                className={`w-28 bg-transparent border-b py-1 text-base focus:outline-none focus:border-orange-500`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="w-14 text-[10px] font-bold uppercase tracking-wider opacity-60">Fine</span>
                                        <div className="flex-1 flex gap-3">
                                            <input
                                                type="date"
                                                required
                                                value={createEndDate}
                                                onChange={(e) => setCreateEndDate(e.target.value)}
                                                className={`flex-1 min-w-0 bg-transparent border-b py-1 text-base focus:outline-none focus:border-orange-500`}
                                            />
                                            <input
                                                type="time"
                                                required
                                                value={createEndTime}
                                                onChange={(e) => setCreateEndTime(e.target.value)}
                                                className={`w-28 bg-transparent border-b py-1 text-base focus:outline-none focus:border-orange-500`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Users Input */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Partecipanti</label>
                                    <input
                                        type="text"
                                        value={createUsers}
                                        onChange={(e) => setCreateUsers(e.target.value)}
                                        placeholder="Aggiungi partecipanti (email separate da virgola)"
                                        className={`w-full bg-transparent border-b py-1 text-sm focus:outline-none focus:border-orange-500
                                            ${isDark ? "border-white/10 text-white placeholder-white/20" : "border-neutral-200 text-neutral-800 placeholder-neutral-400"}`}
                                    />
                                </div>

                                {/* Description Input with AI Spark button */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Descrizione</label>
                                        
                                        <button
                                            type="button"
                                            onClick={handleImproveDescription}
                                            disabled={isImprovingDescription}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border
                                                ${isDark
                                                    ? "bg-orange-500/10 border-orange-500/20 text-[#f97316] hover:bg-orange-500/20"
                                                    : "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100"}`}
                                            title="Migliora descrizione con AI (Ministral-8B)"
                                        >
                                            {isImprovingDescription ? (
                                                <>
                                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Miglioramento...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2L14.85 8.15L21 11L14.85 13.85L12 20L9.15 13.85L3 11L9.15 8.15L12 2M12 5.5L10.35 9.65L6.2 11.3L10.35 12.95L12 17.1L13.65 12.95L17.8 11.3L13.65 9.65L12 5.5Z" />
                                                    </svg>
                                                    Migliora con AI
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <MarkdownSandbox
                                        value={createDescription}
                                        onChange={setCreateDescription}
                                        isDark={isDark}
                                        activeTab={descriptionTab}
                                        setActiveTab={setDescriptionTab}
                                    />
                                </div>

                                {/* Notifications Push checkbox */}
                                <div className="flex items-center gap-2.5 pt-1">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={createRemindNotification} 
                                            onChange={(e) => setCreateRemindNotification(e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className={`w-8 h-4 rounded-full peer transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full
                                            ${isDark 
                                                ? "bg-white/10 peer-checked:bg-orange-500" 
                                                : "bg-neutral-200 peer-checked:bg-orange-500"}`}
                                        />
                                    </label>
                                    <span className="text-xs font-semibold opacity-70">Notifiche (off per impostazione predefinita)</span>
                                </div>

                                {/* Footer buttons */}
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setEditingEventId(null);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${isDark ? "text-[#d6cfc4]/50 hover:text-white" : "text-neutral-400 hover:text-neutral-800"}`}
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingEvent}
                                        className={`px-5 py-2 rounded-xl font-bold text-xs uppercase transition-all active:scale-95 disabled:opacity-50
                                            ${isDark ? "bg-[#d6cfc4] hover:bg-[#c9bfb0] text-[#07070a]" : "bg-black hover:bg-neutral-800 text-white"}`}
                                    >
                                        {isCreatingEvent ? "Salvataggio..." : (editingEventId ? "Aggiorna" : "Salva")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarPage;