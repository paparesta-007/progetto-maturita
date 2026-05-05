import { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";


export interface CalendarContextType {
    isFloatingChat: boolean;
    setIsFloatingChat: (val: boolean) => void;
    events: any[];
    fetchEvents: () => Promise<void>;
    currentWeekStart: Date;
    setCurrentWeekStart: (d: Date) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
}

// Provider Component
export const CalendarProvider = ({ children }: { children: React.ReactNode }) => {
    const { session } = useAuth();
    const [isFloatingChat, setIsFloatingChat] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));

    const fetchEvents = useCallback(async () => {
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
            console.error('fetchEvents error', err);
        }
    }, [session?.provider_token, currentWeekStart]);

    const value: CalendarContextType = {
        isFloatingChat,
        setIsFloatingChat,
        events,
        fetchEvents,
        currentWeekStart,
        setCurrentWeekStart
    };

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    );
};

// Custom Hook
export const useCalendar = () => {
    const context = useContext(CalendarContext);
    if (context === undefined) {
        throw new Error("useCalendar must be used within a CalendarProvider");
    }
    return context;
};

export default CalendarContext;

