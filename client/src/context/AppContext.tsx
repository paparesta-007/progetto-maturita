import { createContext, useContext, useState } from "react";

export interface AppContextType {
    isSettingOpen: boolean;
    setIsSettingOpen: (val: boolean) => void;
    toggleSetting: () => void;
    settingPage: string;
    setSettingPage: (page: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [settingPage, setSettingPage] = useState("generale");
    const toggleSetting = () => {
        setIsSettingOpen(!isSettingOpen);
    };

    const value: AppContextType = {
        isSettingOpen,
        setIsSettingOpen,
        toggleSetting,
        settingPage,
        setSettingPage,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// Custom Hook
export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
};

export default AppContext;

