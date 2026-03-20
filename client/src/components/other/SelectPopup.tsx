import React, { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
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
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const clickedTrigger = triggerRef.current?.contains(target);
            const clickedMenu = menuRef.current?.contains(target);

            if (!clickedTrigger && !clickedMenu) {
                setOpen(false);
            }
        };

        const handleScrollOrResize = () => {
            if (open) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScrollOrResize, { capture: true });
            window.addEventListener("resize", handleScrollOrResize);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScrollOrResize, { capture: true });
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, [open]);

    const toggleOpen = () => {
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({ top: rect.top, left: rect.left, width: rect.width });
        }
        setOpen((prev) => !prev);
    };

    const selectedOption = options.find((o) => o.value === value);

    return (
        <div className="relative">
            {/* Trigger */}
            <button
                ref={triggerRef}
                type="button"
                onClick={toggleOpen}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors select-none ${
                    isDark
                        ? "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                }`}
            >
                <div className="flex items-center gap-1.5">
                    {renderLabel ? (
                        renderLabel(selectedOption)
                    ) : (
                        <>
                            {selectedOption?.icon && <span className="opacity-70 flex-shrink-0">{selectedOption.icon}</span>}
                            <span>{selectedOption?.label ?? placeholder}</span>
                        </>
                    )}
                </div>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <CaretDownIcon size={12} />
                </motion.span>
            </button>

            {/* Popup — rendered in body to avoid clipping from overflow containers */}
            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                ref={menuRef}
                                style={{
                                    position: "fixed",
                                    left: coords.left,
                                    bottom: window.innerHeight - coords.top + 6,
                                    minWidth: Math.max(coords.width, 180),
                                    maxWidth: "90vw",
                                }}
                                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className={`rounded-xl border shadow-xl z-[2147483647] p-1.5 ${
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
                                            onClick={() => {
                                                onChange(option.value);
                                                setOpen(false);
                                            }}
                                            className={`flex items-center justify-between gap-3 w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                                                isSelected
                                                    ? isDark
                                                        ? "bg-neutral-800 text-white"
                                                        : "bg-neutral-100 text-neutral-900"
                                                    : isDark
                                                      ? "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                                      : "text-neutral-700 hover:bg-neutral-100"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {option.icon && <span className="opacity-60 flex-shrink-0">{option.icon}</span>}
                                                <div className="flex flex-col">
                                                    <span className="font-medium leading-snug">{option.label}</span>
                                                    {option.description && (
                                                        <span
                                                            className={`text-[11px] leading-tight mt-0.5 ${
                                                                isDark ? "text-neutral-500" : "text-neutral-600"
                                                            }`}
                                                        >
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
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
}

export default SelectPopup;
