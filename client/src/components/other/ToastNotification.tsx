import React, { useEffect, useState } from "react";
import { X, CheckCircle, WarningCircle, XCircle, Info } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    type?: ToastType;
    title?: string;
    message: string;
    duration?: number; // Se passato, si chiude automaticamente dopo X ms
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
    isOpen,
    onClose,
    type = "info",
    title,
    message,
    duration = 5000 // Default 5 secondi
}) => {
    const { theme } = useAuth();
    const isDark = theme === "dark";
    const [isVisible, setIsVisible] = useState(false);

    // Gestione animazione entrata/uscita e auto-close
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleClose();
                }, duration);
                return () => clearTimeout(timer);
            }
        } else {
            // Aspetta la fine dell'animazione di uscita prima di smontare
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration]);

    const handleClose = () => {
        onClose();
    };

    if (!isVisible && !isOpen) return null;

    // Configurazione stili e icone in base al tipo
    const config = {
        success: {
            icon: <CheckCircle weight="fill" size={24} />,
            style: isDark 
                ? "bg-green-900/30 border-green-800 text-green-200" 
                : "bg-green-50 border-green-200 text-green-800",
            iconColor: isDark ? "text-green-400" : "text-green-600"
        },
        error: {
            icon: <XCircle weight="fill" size={24} />,
            style: isDark 
                ? "bg-red-900/30 border-red-800 text-red-200" 
                : "bg-red-50 border-red-200 text-red-800",
            iconColor: isDark ? "text-red-400" : "text-red-600"
        },
        warning: {
            icon: <WarningCircle weight="fill" size={24} />,
            style: isDark 
                ? "bg-amber-900/30 border-amber-800 text-amber-200" 
                : "bg-amber-50 border-amber-200 text-amber-800",
            iconColor: isDark ? "text-amber-400" : "text-amber-600"
        },
        info: {
            icon: <Info weight="fill" size={24} />,
            style: isDark 
                ? "bg-blue-900/30 border-blue-800 text-blue-200" 
                : "bg-blue-50 border-blue-200 text-blue-800",
            iconColor: isDark ? "text-blue-400" : "text-blue-600"
        }
    };

    const currentConfig = config[type];

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-300 transform 
            ${isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}
            ${currentConfig.style}
            ${isDark ? "shadow-black/50" : "shadow-neutral-200/50"}
        `}>
            {/* Icona */}
            <div className={`shrink-0 mt-0.5 ${currentConfig.iconColor}`}>
                {currentConfig.icon}
            </div>

            {/* Contenuto */}
            <div className="flex-1 mr-2">
                {title && <h4 className="text-sm font-bold mb-1">{title}</h4>}
                <p className="text-sm opacity-90 leading-relaxed">{message}</p>
            </div>

            {/* Bottone Chiudi */}
            <button 
                onClick={handleClose}
                className={`shrink-0 p-1 rounded-full transition-colors ${
                    isDark 
                        ? "hover:bg-white/10 text-neutral-400 hover:text-white" 
                        : "hover:bg-black/5 text-neutral-500 hover:text-black"
                }`}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastNotification;