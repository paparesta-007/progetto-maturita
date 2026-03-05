import React, { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";

export interface SelectOption<T = any> {
    label: string;
    value: T;
    description?: string;
    icon?: React.ReactNode;
}

interface SelectPopupProps<T = any> {
    options: SelectOption<T>[];
    value: T;
    onChange: (value: T) => void;
    placeholder?: string;
    renderLabel?: (selected: SelectOption<T> | undefined) => React.ReactNode;
}

function SelectPopup<T = any>({
    options,
    value,
    onChange,
    placeholder = "Select...",
    renderLabel,
}: SelectPopupProps<T>) {
    const { theme } = useAuth();
    const isDark = theme === "dark";
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o) => o.value === value);

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors select-none ${
                    isDark
                        ? "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                }`}
            >
                <span>{renderLabel ? renderLabel(selectedOption) : (selectedOption?.label ?? placeholder)}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <CaretDownIcon size={12} />
                </motion.span>
            </button>

            {/* Popup — slide up */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute bottom-full left-0 mb-2 min-w-[180px] rounded-xl border shadow-xl z-50 p-1.5 ${
                            isDark
                                ? "bg-neutral-900 border-neutral-800 shadow-black/40"
                                : "bg-white border-neutral-200 shadow-black/10"
                        }`}
                    >
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={String(option.value)}
                                    type="button"
                                    onClick={() => { onChange(option.value); setOpen(false); }}
                                    className={`flex items-center justify-between gap-3 w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                                        isSelected
                                            ? isDark ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-900"
                                            : isDark ? "text-neutral-300 hover:bg-neutral-800 hover:text-white" : "text-neutral-700 hover:bg-neutral-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {option.icon && (
                                            <span className="opacity-60 flex-shrink-0">{option.icon}</span>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-medium leading-snug">{option.label}</span>
                                            {option.description && (
                                                <span className={`text-[11px] leading-tight mt-0.5 ${
                                                    isDark ? "text-neutral-500" : "text-neutral-400"
                                                }`}>
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <CheckIcon
                                            size={14}
                                            weight="bold"
                                            className={isDark ? "text-white flex-shrink-0" : "text-neutral-900 flex-shrink-0"}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SelectPopup;
