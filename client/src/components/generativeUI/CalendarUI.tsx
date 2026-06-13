import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Notebook, Trash, Check, PencilSimple, ArrowUpRight } from '@phosphor-icons/react';

interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string } | string;
    end: { dateTime?: string; date?: string } | string;
    description?: string;
    location?: string;
    htmlLink?: string;
}

interface CalendarUIProps {
    data: {
        action: 'create' | 'update' | 'delete' | 'list';
        events?: CalendarEvent[];
        event?: CalendarEvent; // support both singular and plural
    };
    isDark?: boolean;
}

const CalendarUI: React.FC<CalendarUIProps> = ({ data, isDark = true }) => {
    const action = data.action;
    const rawEvents = data.events || (data.event ? [data.event] : []);

    const formatDate = (dateInput: any) => {
        let dateStr = '';
        if (typeof dateInput === 'string') {
            dateStr = dateInput;
        } else if (dateInput && typeof dateInput === 'object') {
            dateStr = dateInput.dateTime || dateInput.date || '';
        }
        if (!dateStr) return '';
        
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const formatTimeRange = (startInput: any, endInput: any) => {
        let startStr = '';
        let endStr = '';
        
        if (typeof startInput === 'string') startStr = startInput;
        else if (startInput) startStr = startInput.dateTime || startInput.date || '';

        if (typeof endInput === 'string') endStr = endInput;
        else if (endInput) endStr = endInput.dateTime || endInput.date || '';

        if (!startStr) return '';
        
        const startObj = new Date(startStr);
        const startTime = startObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        if (!endStr) return startTime;
        
        const endObj = new Date(endStr);
        const endTime = endObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        return `${startTime} - ${endTime}`;
    };

    const getActionTheme = () => {
        switch (action) {
            case 'create':
                return {
                    label: 'Evento Creato',
                    icon: <Check size={17} weight="bold" />,
                    bgClasses: isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700',
                    indicatorColor: 'bg-emerald-500'
                };
            case 'update':
                return {
                    label: 'Evento Modificato',
                    icon: <PencilSimple size={17} weight="bold" />,
                    bgClasses: isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700',
                    indicatorColor: 'bg-blue-500'
                };
            case 'delete':
                return {
                    label: 'Evento Eliminato',
                    icon: <Trash size={17} weight="bold" />,
                    bgClasses: isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700',
                    indicatorColor: 'bg-rose-500'
                };
            default:
                return {
                    label: 'Eventi Trovati',
                    icon: <Calendar size={17} weight="bold" />,
                    bgClasses: isDark ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-[#f0ebe4] border-[#e2ddd5] text-[#2c2825]',
                    indicatorColor: 'bg-orange-500'
                };
        }
    };

    const themeInfo = getActionTheme();

    if (!rawEvents || rawEvents.length === 0) {
        return (
            <div className={`p-4 rounded-2xl border text-center text-[14px] font-medium ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
                Nessun evento da mostrare.
            </div>
        );
    }

    return (
        <div className="w-full space-y-3.5 my-2">
            {/* Header Badge of Action */}
            {action !== 'list' && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-bold uppercase tracking-wider border ${themeInfo.bgClasses}`}>
                    {themeInfo.icon}
                    <span>{themeInfo.label}</span>
                </div>
            )}

            {/* Event List/Cards */}
            <div className="space-y-2">
                {rawEvents.map((event, idx) => (
                    <motion.div
                        key={event.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, ease: 'easeOut', duration: 0.2 }}
                        className={`p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-all
                            ${isDark 
                                ? 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]' 
                                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/50'}`}
                    >
                        {/* Colored Left Indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${themeInfo.indicatorColor}`} />

                        {/* Top Line: Summary and Link */}
                        <div className="flex justify-between items-start gap-4 pl-1">
                            <h4 className={`text-[17px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {event.summary || '(Nessun titolo)'}
                            </h4>
                            {event.htmlLink && (
                                <a
                                    href={event.htmlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-1 rounded-lg transition-all ${isDark ? 'hover:bg-white/5 text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800'}`}
                                    title="Apri in Google Calendar"
                                >
                                    <ArrowUpRight size={20} weight="bold" />
                                </a>
                            )}
                        </div>

                        {/* Middle Line: Date, Time & Location */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] opacity-75 font-medium pl-1">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={16} className="text-orange-500" />
                                <span>{formatDate(event.start)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={16} className="text-orange-500" />
                                <span>{formatTimeRange(event.start, event.end)}</span>
                            </div>
                            {event.location && (
                                <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                                    <MapPin size={16} className="text-orange-500" />
                                    <span className="truncate">{event.location}</span>
                                </div>
                            )}
                        </div>

                        {/* Bottom Line: Description (Only if present and action isn't list or it's a single event card) */}
                        {event.description && (
                            <div className={`text-[14px] leading-relaxed p-2.5 rounded-xl border border-dashed pl-3
                                ${isDark 
                                    ? 'bg-black/20 border-white/5 text-neutral-400' 
                                    : 'bg-white border-neutral-100 text-neutral-600'}`}
                            >
                                <div className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase opacity-40 mb-1">
                                    <Notebook size={14} />
                                    Descrizione
                                </div>
                                <div 
                                    className="max-h-20 overflow-y-auto custom-scrollbar pr-1"
                                    dangerouslySetInnerHTML={{ __html: event.description }}
                                />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(CalendarUI);
