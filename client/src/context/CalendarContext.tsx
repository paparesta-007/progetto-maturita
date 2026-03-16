import { createContext, useContext, useState } from "react";


export interface AppContextType {
    isFloatingChat: boolean;
    setIsFloatingChat: (val: boolean) => void;
}

const CalendarContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
export const CalendarProvider = ({ children }: { children: React.ReactNode }) => {
    const [isFloatingChat, setIsFloatingChat] = useState(false);


    const value: AppContextType = {
        isFloatingChat,
        setIsFloatingChat,
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

