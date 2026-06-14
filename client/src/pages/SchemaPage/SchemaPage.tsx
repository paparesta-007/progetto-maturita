import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSchema, type SchemaNodeData } from '../../context/SchemaContext';
import { useAuth } from '../../context/AuthContext';
import SchemaTextbar from './Textbar';
import { 
    PlusIcon, 
    TrashIcon, 
    DownloadSimple, 
    FileCode, 
    FilePdf, 
    Palette, 
    MagnifyingGlassPlus, 
    MagnifyingGlassMinus, 
    ArrowsOutCardinal, 
    Rows, 
    Columns, 
    Eraser,
    Copy,
    ArrowUp,
    ArrowDown,
    Sparkle
} from '@phosphor-icons/react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 11);
};

const SOFT_COLORS = [
    { name: 'Default', text: '', bg: '' },
    { name: 'Blue', text: 'rgb(37, 99, 235)', bg: 'rgba(37, 99, 235, 0.1)' },
    { name: 'Green', text: 'rgb(22, 163, 74)', bg: 'rgba(22, 163, 74, 0.1)' },
    { name: 'Purple', text: 'rgb(147, 51, 234)', bg: 'rgba(147, 51, 234, 0.1)' },
    { name: 'Pink', text: 'rgb(219, 39, 119)', bg: 'rgba(219, 39, 119, 0.1)' },
    { name: 'Orange', text: 'rgb(234, 88, 12)', bg: 'rgba(234, 88, 12, 0.1)' },
    { name: 'Red', text: 'rgb(220, 38, 38)', bg: 'rgba(220, 38, 38, 0.1)' },
    { name: 'Teal', text: 'rgb(13, 148, 136)', bg: 'rgba(13, 148, 136, 0.1)' },
    { name: 'Yellow', text: 'rgb(202, 138, 4)', bg: 'rgba(202, 138, 4, 0.1)' },
];

const duplicateSubtree = (node: SchemaNodeData): SchemaNodeData => {
    const newId = generateId();
    return {
        ...node,
        id: newId,
        children: node.children ? node.children.map(duplicateSubtree) : []
    };
};

const duplicateInTree = (nodes: SchemaNodeData[], id: string): SchemaNodeData[] => {
    return nodes.reduce((acc: SchemaNodeData[], node) => {
        acc.push(node);
        if (node.id === id) {
            acc.push(duplicateSubtree(node));
        } else if (node.children && node.children.length > 0) {
            node.children = duplicateInTree(node.children, id);
        }
        return acc;
    }, []);
};

const moveNodeSibling = (nodes: SchemaNodeData[], id: string, direction: 'up' | 'down'): SchemaNodeData[] => {
    const index = nodes.findIndex(n => n.id === id);
    if (index !== -1) {
        const newNodes = [...nodes];
        if (direction === 'up' && index > 0) {
            const temp = newNodes[index];
            newNodes[index] = newNodes[index - 1];
            newNodes[index - 1] = temp;
        } else if (direction === 'down' && index < newNodes.length - 1) {
            const temp = newNodes[index];
            newNodes[index] = newNodes[index + 1];
            newNodes[index + 1] = temp;
        }
        return newNodes;
    }
    return nodes.map(node => {
        if (node.children && node.children.length > 0) {
            return {
                ...node,
                children: moveNodeSibling(node.children, id, direction)
            };
        }
        return node;
    });
};

// --- 1. The Recursive Node Component ---
const SchemaNode = ({ 
    node, 
    onUpdate, 
    onAddChild, 
    onDelete,
    onDuplicate,
    onMoveSibling,
    onAIExpand,
    isDark,
    orientation,
    searchQuery
}: { 
    node: SchemaNodeData, 
    onUpdate: (id: string, field: string, value: any) => void,
    onAddChild: (id: string) => void,
    onDelete: (id: string) => void,
    onDuplicate: (id: string) => void,
    onMoveSibling: (id: string, direction: 'up' | 'down') => void,
    onAIExpand: (id: string, title: string) => void,
    isDark: boolean,
    orientation: 'vertical' | 'horizontal',
    searchQuery: string
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowColorPicker(false);
            }
        };
        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorPicker]);

    const isMatched = searchQuery && (
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <li className={orientation === 'horizontal' ? 'flex items-center' : ''}>
            {/* The Node Card */}
            <div className={`group/node relative inline-block text-left w-56 p-3 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                isDark 
                    ? 'bg-[#0f0f13] border-white/10 hover:border-white/20' 
                    : 'bg-white border-neutral-200 shadow-sm hover:border-orange-300 hover:shadow-orange-500/10'
            } ${isMatched ? 'ring-4 ring-orange-500/60 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.35)] scale-[1.03] z-20' : ''}`}
            style={{ 
                borderColor: node.color ? `${node.color}66` : undefined,
                backgroundColor: node.bgColor || undefined
            }}
            >
                <div className="flex flex-col flex-grow items-center">
                    <input
                        type="text"
                        value={node.title}
                        onChange={(e) => onUpdate(node.id, 'title', e.target.value)}
                        placeholder="Titolo"
                        style={{ color: node.color || undefined }}
                        className={`w-full text-sm font-bold bg-transparent text-center focus:outline-none placeholder-neutral-400 transition-colors ${!node.color && (isDark ? 'text-white focus:text-orange-400' : 'text-neutral-900 focus:text-orange-500')}`}
                    />
                    <textarea
                        value={node.description}
                        onChange={(e) => onUpdate(node.id, 'description', e.target.value)}
                        placeholder="Descrizione (opzionale)..."
                        rows={1}
                        ref={(el) => {
                            if (el) {
                                el.style.height = "auto";
                                el.style.height = `${el.scrollHeight}px`;
                            }
                        }}
                        onInput={(e) => {
                            e.currentTarget.style.height = "auto";
                            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                        }}
                        className={`w-full text-xs mt-2 bg-transparent text-center resize-none focus:outline-none placeholder-neutral-500 overflow-hidden ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
                    />
                </div>
                
                {/* Collapse/Expand Toggle Button */}
                {node.children && node.children.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate(node.id, 'isCollapsed', !node.isCollapsed);
                        }}
                        title={node.isCollapsed ? "Espandi sotto-albero" : "Riduci sotto-albero"}
                        className={`absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center border shadow-md transition-all z-20 active:scale-90 ${
                            isDark 
                                ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800' 
                                : 'bg-white border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                        }`}
                    >
                        {node.isCollapsed ? (
                            <span className="text-[10px] font-extrabold text-orange-500">+{node.children.length}</span>
                        ) : (
                            <span className="text-[12px] font-extrabold leading-[10px]">-</span>
                        )}
                    </button>
                )}
                
                {/* Action Buttons (Hover Toolbar Pill) */}
                <div className={`absolute ${node.children && node.children.length > 0 ? '-bottom-9' : '-bottom-5'} left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-all duration-200 z-30 p-1 rounded-full border shadow-xl ${
                    isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-neutral-200'
                }`}>
                    <button 
                        onClick={() => onAddChild(node.id)}
                        title="Aggiungi nodo figlio"
                        className={`p-1.5 rounded-full transition-all active:scale-95 ${
                            isDark ? 'text-white hover:bg-white/10' : 'text-neutral-900 hover:bg-neutral-100'
                        }`}
                    >
                        <PlusIcon size={13} weight="bold" />
                    </button>
                    <button 
                        onClick={() => onAIExpand(node.id, node.title)}
                        title="Espandi con AI"
                        className={`p-1.5 rounded-full transition-all active:scale-95 ${
                            isDark ? 'text-white hover:bg-white/10' : 'text-neutral-900 hover:bg-neutral-100'
                        }`}
                    >
                        <Sparkle size={13} weight="bold" className="text-orange-500 animate-pulse" />
                    </button>
                    <button 
                        onClick={() => onDuplicate(node.id)}
                        title="Duplica ramo"
                        className={`p-1.5 rounded-full transition-all active:scale-95 ${
                            isDark ? 'text-white hover:bg-white/10' : 'text-neutral-900 hover:bg-neutral-100'
                        }`}
                    >
                        <Copy size={13} weight="bold" />
                    </button>
                    <button 
                        onClick={() => onMoveSibling(node.id, 'up')}
                        title="Sposta su"
                        className={`p-1.5 rounded-full transition-all active:scale-95 ${
                            isDark ? 'text-white hover:bg-white/10' : 'text-neutral-900 hover:bg-neutral-100'
                        }`}
                    >
                        <ArrowUp size={13} weight="bold" />
                    </button>
                    <button 
                        onClick={() => onMoveSibling(node.id, 'down')}
                        title="Sposta giù"
                        className={`p-1.5 rounded-full transition-all active:scale-95 ${
                            isDark ? 'text-white hover:bg-white/10' : 'text-neutral-900 hover:bg-neutral-100'
                        }`}
                    >
                        <ArrowDown size={13} weight="bold" />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(!showColorPicker);
                        }}
                        title="Cambia colori"
                        className={`p-1.5 rounded-full transition-all active:scale-95 ${
                            isDark ? 'text-white hover:bg-white/10' : 'text-neutral-900 hover:bg-neutral-100'
                        }`}
                    >
                        <Palette size={13} weight="bold" />
                    </button>
                    <button 
                        onClick={() => onDelete(node.id)} 
                        title="Elimina nodo"
                        className={`p-1.5 rounded-full text-red-500 transition-all active:scale-95 ${
                            isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                        }`}
                    >
                        <TrashIcon size={13} weight="bold" />
                    </button>
                </div>

                {/* Color Picker Popup */}
                {showColorPicker && (
                    <div 
                        ref={pickerRef}
                        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-2xl border shadow-2xl flex flex-col gap-3 z-20 w-max ${isDark ? 'bg-[rgb(23,23,23)] border-[rgb(255,255,255,0.1)]' : 'bg-white border-neutral-200'}`}
                    >
                        {/* Text Color Row */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] uppercase font-bold tracking-widest opacity-50 px-1">Colore Testo</span>
                            <div className="flex gap-1">
                                {SOFT_COLORS.map((c) => (
                                    <button
                                        key={`text-${c.name}`}
                                        onClick={() => onUpdate(node.id, 'color', c.text)}
                                        className={`w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-125 flex items-center justify-center ${node.color === c.text ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-transparent' : ''}`}
                                        style={{ backgroundColor: c.text || (isDark ? '#fff' : '#000') }}
                                        title={`Testo ${c.name}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Background Color Row */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] uppercase font-bold tracking-widest opacity-50 px-1">Colore Sfondo</span>
                            <div className="flex gap-1">
                                {SOFT_COLORS.map((c) => (
                                    <button
                                        key={`bg-${c.name}`}
                                        onClick={() => onUpdate(node.id, 'bgColor', c.bg)}
                                        className={`w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-125 flex items-center justify-center ${node.bgColor === c.bg ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-transparent' : ''}`}
                                        style={{ backgroundColor: c.bg || (isDark ? 'transparent' : 'transparent'), border: c.bg ? 'none' : undefined }}
                                        title={`Sfondo ${c.name}`}
                                    >
                                        {!c.bg && <div className="w-px h-full bg-red-500 rotate-45" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Children container with connecting lines */}
            {node.children && node.children.length > 0 && !node.isCollapsed && (
                <ul className={orientation === 'horizontal' ? 'horizontal' : ''}>
                    {node.children.map((child) => (
                        <SchemaNode
                            key={child.id}
                            node={child}
                            onUpdate={onUpdate}
                            onAddChild={onAddChild}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            onMoveSibling={onMoveSibling}
                            onAIExpand={onAIExpand}
                            isDark={isDark}
                            orientation={orientation}
                            searchQuery={searchQuery}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

// --- 2. The Main Parent Component ---
const SchemaBuilder = ({
    isChatOpen,
    setIsChatOpen
}: {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
}) => {
    const { schema, setSchema, orientation, setOrientation, expandNodeWithAI } = useSchema();
    const { theme, stylePreferences } = useAuth();
    const isDark = theme === 'dark';
    const containerRef = useRef<HTMLDivElement>(null);
    const orgTreeRef = useRef<HTMLDivElement>(null);

    // Zoom and Pan State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [searchQuery, setSearchQuery] = useState("");

    const updateTree = (nodes: SchemaNodeData[], id: string, action: string, payload?: any): SchemaNodeData[] => {
        return nodes.reduce((acc: SchemaNodeData[], node) => {
            if (action === 'DELETE' && node.id === id) return acc;

            let updatedNode = { ...node };

            if (node.id === id) {
                if (action === 'UPDATE') {
                    (updatedNode as any)[payload.field] = payload.value;
                } else if (action === 'ADD_CHILD') {
                    updatedNode.children = [
                        ...updatedNode.children,
                        { id: generateId(), title: '', description: '', x: 0, y: 0, children: [] }
                    ];
                }
            } else if (updatedNode.children.length > 0) {
                updatedNode.children = updateTree(updatedNode.children, id, action, payload);
            }

            acc.push(updatedNode);
            return acc;
        }, []);
    };

    const handleUpdate = (id: string, field: string, value: any) => {
        setSchema((prev) => updateTree(prev, id, 'UPDATE', { field, value }));
    };

    const handleAddChild = (id: string) => {
        setSchema((prev) => updateTree(prev, id, 'ADD_CHILD'));
    };

    const handleDelete = (id: string) => {
        setSchema((prev) => updateTree(prev, id, 'DELETE'));
    };

    const handleDuplicate = (id: string) => {
        setSchema((prev) => duplicateInTree(prev, id));
    };

    const handleMoveSibling = (id: string, direction: 'up' | 'down') => {
        setSchema((prev) => moveNodeSibling(prev, id, direction));
    };

    const handleAIExpand = (id: string, title: string) => {
        expandNodeWithAI(id, title);
    };

    const handleAddRoot = () => {
        setSchema([
            ...schema,
            { id: generateId(), title: '', description: '', x: 0, y: 0, children: [] }
        ]);
    };

    // Zoom Logic
    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => {
            const newZoom = Math.min(Math.max(prev + delta, 0.2), 3);
            return newZoom;
        });
    };

    // Pan Logic (Right Click)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 2) { // Right click
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isPanning) return;
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }, [isPanning, lastMousePos]);

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    useEffect(() => {
        if (isPanning) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPanning, handleMouseMove]);

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Export Logic
    const exportAsJSON = () => {
        const dataStr = JSON.stringify(schema, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'schema.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const exportAsPDF = async () => {
        if (!orgTreeRef.current) return;
        
        const oldZoom = zoom;
        const oldPan = pan;

        try {
            // Reset for capture
            setZoom(1);
            setPan({ x: 0, y: 0 });

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 500));

            const element = orgTreeRef.current;
            const dataUrl = await toPng(element, {
                backgroundColor: isDark ? '#07070a' : '#f9fafb',
                quality: 1,
                pixelRatio: 2,
                skipFonts: true // Faster and often avoids issues
            });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [element.scrollWidth, element.scrollHeight]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, element.scrollWidth, element.scrollHeight);
            pdf.save('schema.pdf');

        } catch (error) {
            console.error('Errore durante esportazione PDF:', error);
            alert('Errore durante l\'esportazione del PDF. Riprova.');
        } finally {
            setZoom(oldZoom);
            setPan(oldPan);
        }
    };

    const currentPrefs = stylePreferences?.style?.[0] || stylePreferences?.[0];
    const navbarStyle = currentPrefs?.navbarStyle || "classic-soft";

    const pageBg = navbarStyle === 'classic-soft'
        ? (isDark ? 'bg-[#121214] text-[#f4f1ea]' : 'bg-[#fcfbf9] text-neutral-900')
        : (isDark ? 'bg-[#07070a] text-[#f4f1ea]' : 'bg-[#fdfcfb] text-neutral-900');

    const headerClass = `w-full flex flex-col lg:flex-row items-center justify-between px-8 py-3.5 border-b shrink-0 transition-all duration-300 gap-4 shadow-sm z-30 ${
        navbarStyle === 'classic-soft'
            ? (isDark ? 'bg-[#121214] border-[#222226]' : 'bg-[#fcfbf9] border-[#ebdccb]')
            : (isDark ? 'bg-[#0d0d12]/95 backdrop-blur-md border-white/10' : 'bg-white/95 backdrop-blur-md border-neutral-200')
    }`;

    const canvasContainerClass = `relative w-full flex-1 overflow-hidden rounded-2xl border cursor-grab active:cursor-grabbing transition-all duration-300 ${
        navbarStyle === 'classic-soft'
            ? (isDark ? 'bg-[#0f0f11] border-[#222226]' : 'bg-[#fafaf7] border-[#ebdccb]')
            : (isDark ? 'bg-[#07070a] border-white/[0.05]' : 'bg-[#f9fafb] border-neutral-200')
    }`;

    return (
        <div className={`flex flex-col flex-1 h-full min-h-0 ${pageBg}`}>
            {/* Redesigned Clean Header/Navbar */}
            <div className={headerClass}>
                {/* Left Side: Title & Assistant Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                    <div className="flex flex-col text-left">
                        <span className={`text-[9px] font-black tracking-widest uppercase opacity-55 ${navbarStyle === 'classic-soft' ? 'text-[#b08968]' : 'text-neutral-500'}`}>
                            Artefatti
                        </span>
                        <h2 className={`text-lg font-extrabold tracking-tight transition-colors ${
                            isDark ? 'text-white' : 'text-neutral-900'
                        } ${navbarStyle === 'classic-soft' ? 'font-serif text-[#1e1a15] dark:text-[#f4f1ea]' : ''}`}>
                            Schema Riassuntivo
                        </h2>
                    </div>

                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        title={isChatOpen ? "Nascondi l'assistente chat AI" : "Mostra l'assistente chat AI"}
                        className={`flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase px-3.5 py-2 rounded-xl transition-all shadow-sm border active:scale-95 hover:scale-102 ${
                            isChatOpen
                                ? (isDark ? 'bg-orange-500 text-black border-orange-500 font-bold' : 'bg-[#b08968] text-white border-[#b08968] font-bold')
                                : (isDark ? 'bg-[#1c1c21] text-neutral-400 border-white/5 hover:text-white' : 'bg-[#f5f2eb] text-neutral-500 border-[#ebdccb] hover:text-neutral-900')
                        }`}
                    >
                        <span>🪄</span>
                        <span>{isChatOpen ? "Nascondi AI" : "Assistente AI"}</span>
                    </button>
                </div>

                {/* Center Side: Node Search query */}
                <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <MagnifyingGlassPlus size={15} />
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cerca nodo per testo..."
                        title="Evidenzia i nodi dello schema che contengono questo testo"
                        className={`w-full text-xs pl-8.5 pr-8 py-2 rounded-xl border focus:outline-none transition-all ${
                            isDark
                                ? 'bg-[#18181b] border-white/10 text-white placeholder-white/30 focus:border-orange-500/50'
                                : 'bg-[#f5f2eb] border-[#ebdccb] text-neutral-900 placeholder-neutral-500 focus:border-[#b08968]'
                        }`}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            title="Resetta ricerca"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Right Side: Map Controls & Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                     {/* Orientation Toggle */}
                     <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                         navbarStyle === 'classic-soft'
                             ? (isDark ? 'bg-[#18181b] border-[#222226]' : 'bg-[#f5f2eb] border-[#ebdccb]')
                             : (isDark ? 'bg-[rgb(23,23,23)] border-white/10' : 'bg-neutral-100 border-neutral-200')
                     }`}>
                        <button 
                            onClick={() => setOrientation('vertical')} 
                            className={`p-1.5 rounded-lg transition-all ${
                                orientation === 'vertical' 
                                    ? (isDark ? 'bg-[#f59e0b] text-black font-bold' : 'bg-[#b08968] text-white font-bold') 
                                    : (isDark ? 'hover:bg-white/5 text-neutral-400' : 'hover:bg-black/5 text-neutral-600')
                            }`} 
                            title="Layout Verticale (connessioni dall'alto in basso)"
                        >
                            <Rows size={16}/>
                        </button>
                        <button 
                            onClick={() => setOrientation('horizontal')} 
                            className={`p-1.5 rounded-lg transition-all ${
                                orientation === 'horizontal' 
                                    ? (isDark ? 'bg-[#f59e0b] text-black font-bold' : 'bg-[#b08968] text-white font-bold') 
                                    : (isDark ? 'hover:bg-white/5 text-neutral-400' : 'hover:bg-black/5 text-neutral-600')
                            }`} 
                            title="Layout Orizzontale (connessioni da sinistra a destra)"
                        >
                            <Columns size={16}/>
                        </button>
                    </div>

                     {/* Controls (Zoom) */}
                     <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                         navbarStyle === 'classic-soft'
                             ? (isDark ? 'bg-[#18181b] border-[#222226]' : 'bg-[#f5f2eb] border-[#ebdccb]')
                             : (isDark ? 'bg-[rgb(23,23,23)] border-white/10' : 'bg-neutral-100 border-neutral-200')
                     }`}>
                        <button 
                            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.2))} 
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-neutral-400' : 'hover:bg-black/5 text-neutral-600'}`} 
                            title="Riduci Zoom (Zoom Out)"
                        >
                            <MagnifyingGlassMinus size={16}/>
                        </button>
                        <span className="text-xs font-mono w-10 text-center font-bold">{Math.round(zoom * 100)}%</span>
                        <button 
                            onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))} 
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-neutral-400' : 'hover:bg-black/5 text-neutral-600'}`} 
                            title="Aumenta Zoom (Zoom In)"
                        >
                            <MagnifyingGlassPlus size={16}/>
                        </button>
                        <div className={`w-px h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-neutral-200'}`}/>
                        <button 
                            onClick={resetView} 
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-neutral-400' : 'hover:bg-black/5 text-neutral-600'}`} 
                            title="Ripristina Zoom al 100% e centra la vista"
                        >
                            <ArrowsOutCardinal size={16}/>
                        </button>
                    </div>

                    <div className={`w-px h-6 mx-1 hidden sm:block ${isDark ? 'bg-white/10' : 'bg-neutral-200'}`}/>

                    {/* Export Buttons */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={exportAsJSON}
                            title="Esporta l'intero albero in un file JSON locale"
                            className={`flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-xl transition-all ${
                                navbarStyle === 'classic-soft'
                                    ? (isDark ? 'bg-[#1c1c21] text-neutral-300 hover:bg-[#232329] border border-[#222226]' : 'bg-[#f5f2eb] text-[#5c544c] hover:bg-[#eadecf] border border-[#e3d6c8]')
                                    : (isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-200 text-black hover:bg-neutral-300')
                            }`}
                        >
                            <FileCode size={14} /> JSON
                        </button>
                        <button 
                            onClick={exportAsPDF}
                            title="Esporta il rendering visuale dello schema in un documento PDF"
                            className={`flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-xl transition-all ${
                                navbarStyle === 'classic-soft'
                                    ? (isDark ? 'bg-[#1c1c21] text-neutral-300 hover:bg-[#232329] border border-[#222226]' : 'bg-[#f5f2eb] text-[#5c544c] hover:bg-[#eadecf] border border-[#e3d6c8]')
                                    : (isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-200 text-black hover:bg-neutral-300')
                            }`}
                        >
                            <FilePdf size={14} /> PDF
                        </button>
                        <button 
                            onClick={() => {
                                if(window.confirm("Sei sicuro di voler svuotare l'intero schema?")) {
                                    setSchema([]);
                                }
                            }}
                            title="Elimina tutti i nodi e svuota lo schema"
                            className={`flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-xl transition-all ${
                                isDark ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/10' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            }`}
                        >
                            <TrashIcon size={14} /> Pulisci
                        </button>
                    </div>

                    <div className={`w-px h-6 mx-1 hidden sm:block ${isDark ? 'bg-white/10' : 'bg-neutral-200'}`}/>

                    <button 
                        onClick={handleAddRoot} 
                        title="Aggiungi un nuovo nodo radice indipendente al livello principale"
                        className={`text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 ${
                            navbarStyle === 'classic-soft'
                                ? (isDark ? 'bg-[#f59e0b] text-black hover:bg-[#d97706]' : 'bg-[#b08968] text-white hover:bg-[#9a7352]')
                                : (isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800')
                        }`}
                    >
                        + Aggiungi Radice
                    </button>
                </div>
            </div>

            {/* Canvas Area wrapper with padding */}
            <div className="flex-grow p-6 relative w-full h-full min-h-0 flex flex-col">
                <style>{`
                    .org-tree {
                        --line-color: ${isDark ? '#525252' : '#d4d4d4'};
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        padding: 2rem;
                        transition: transform 0.1s ease-out;
                        transform-origin: center center;
                    }
                    .org-tree ul {
                        padding-top: 2rem;
                        position: relative;
                        display: flex;
                        justify-content: center;
                        padding-left: 0;
                        transition: all 0.3s ease;
                    }
                    .org-tree li {
                        text-align: center;
                        list-style-type: none;
                        position: relative;
                        padding: 2rem 0.5rem 0 0.5rem;
                        transition: all 0.3s ease;
                    }

                    /* Vertical lines */
                    .org-tree li::before, .org-tree li::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        right: 50%;
                        border-top: 2px solid var(--line-color);
                        width: 50%;
                        height: 2rem;
                    }
                    .org-tree li::after {
                        right: auto;
                        left: 50%;
                        border-left: 2px solid var(--line-color);
                    }
                    .org-tree li:only-child::after, .org-tree li:only-child::before {
                        display: none;
                    }
                    .org-tree li:only-child {
                        padding-top: 0;
                    }
                    .org-tree li:first-child::before, .org-tree li:last-child::after {
                        border: 0 none;
                    }
                    .org-tree li:last-child::before {
                        border-right: 2px solid var(--line-color);
                        border-radius: 0 0.5rem 0 0;
                    }
                    .org-tree li:first-child::after {
                        border-radius: 0.5rem 0 0 0;
                    }
                    .org-tree ul::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 50%;
                        border-left: 2px solid var(--line-color);
                        width: 0;
                        height: 2rem;
                        transform: translateX(-50%);
                    }
                    .org-tree > ul {
                        padding-top: 0;
                    }
                    .org-tree > ul::before {
                        display: none;
                    }

                    /* Horizontal Layout */
                    .org-tree.horizontal-root {
                        align-items: center;
                        justify-content: flex-start;
                    }
                    .org-tree.horizontal-root ul {
                        flex-direction: column;
                        padding-top: 0;
                        padding-left: 2rem;
                        align-items: flex-start;
                    }
                    .org-tree.horizontal-root > ul {
                        padding-left: 0;
                    }
                    .org-tree.horizontal-root li {
                        padding: 1rem 0 1rem 2rem;
                        text-align: left;
                        display: flex;
                        align-items: center;
                    }
                    .org-tree.horizontal-root li::before, .org-tree.horizontal-root li::after {
                        content: '';
                        position: absolute;
                        left: 0;
                        right: auto;
                        width: 2rem;
                        height: 50%;
                        border-top: none;
                    }
                    .org-tree.horizontal-root li::before {
                        top: 0;
                        border-left: 2px solid var(--line-color);
                        border-bottom: 2px solid var(--line-color);
                    }
                    .org-tree.horizontal-root li::after {
                        top: 50%;
                        border-left: 2px solid var(--line-color);
                    }
                    .org-tree.horizontal-root li:first-child::before {
                        border-left: none;
                        border-radius: 0.5rem 0 0 0;
                    }
                    .org-tree.horizontal-root li:last-child::before {
                        border-radius: 0 0 0 0.5rem;
                    }
                    .org-tree.horizontal-root li:last-child::after {
                        display: none;
                    }
                    .org-tree.horizontal-root li:only-child::before {
                        border-bottom: 2px solid var(--line-color);
                        border-left: none;
                        border-radius: 0;
                    }
                    .org-tree.horizontal-root li:only-child::after {
                        display: none;
                    }
                    .org-tree.horizontal-root ul::before {
                        top: 50%;
                        left: 0;
                        width: 2rem;
                        height: 0;
                        border-left: none;
                        border-top: 2px solid var(--line-color);
                        transform: translateY(-50%);
                    }
                `}</style>
                
                <div 
                    ref={containerRef}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onContextMenu={(e) => e.preventDefault()}
                    className={canvasContainerClass} 
                    style={{
                         backgroundImage: `radial-gradient(${isDark ? '#ffffff1a' : '#0000001a'} 1px, rgba(0,0,0,0) 0)`,
                         backgroundSize: '30px 30px'
                    }}
                >
                    {schema.length === 0 ? (
                        <div className={`flex items-center justify-center h-full ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Nessun nodo presente. Aggiungi una radice per iniziare.
                        </div>
                    ) : (
                        <div 
                            ref={orgTreeRef}
                            className={`org-tree min-w-max ${orientation === 'horizontal' ? 'horizontal-root' : ''}`}
                            style={{ 
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            }}
                        >
                            <ul className={orientation === 'horizontal' ? 'horizontal' : ''}>
                                {schema.map((node) => (
                                    <SchemaNode
                                        key={node.id}
                                        node={node}
                                        onUpdate={handleUpdate}
                                        onAddChild={handleAddChild}
                                        onDelete={handleDelete}
                                        onDuplicate={handleDuplicate}
                                        onMoveSibling={handleMoveSibling}
                                        onAIExpand={handleAIExpand}
                                        isDark={isDark}
                                        orientation={orientation}
                                        searchQuery={searchQuery}
                                    />
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Hint */}
                    <div className="absolute bottom-4 left-4 text-[10px] opacity-40 uppercase tracking-widest font-bold">
                        Rotellina per Zoom • Tasto Destro per Pan
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 3. Page Layout ---
const SchemaPage = () => {
    const { messages, loading, clearMessages } = useSchema();
    const { theme, stylePreferences } = useAuth();
    const isDark = theme === 'dark';
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isChatOpen, setIsChatOpen] = useState(true);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const currentPrefs = stylePreferences?.style?.[0] || stylePreferences?.[0];
    const navbarStyle = currentPrefs?.navbarStyle || "classic-soft";

    const pageBg = navbarStyle === 'classic-soft'
        ? (isDark ? "bg-[#121214] text-[#f4f1ea]" : "bg-[#fcfbf9] text-[#1e1a15]")
        : (isDark ? "bg-[#07070a] text-[#f4f1ea]" : "bg-[#fdfcfb] text-neutral-900");

    return (
        <div className={`relative flex h-full w-full overflow-hidden transition-colors duration-500 ${pageBg}`}>
            
            {/* Main Canvas: Schema Builder */}
            <div className="flex-1 w-full h-full flex flex-col">
                <SchemaBuilder isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
            </div>

            {/* Toggle Button if Chat is hidden */}
            {!isChatOpen && (
                <div className="fixed bottom-6 right-6 z-40 animate-bounce">
                    <button
                        onClick={() => setIsChatOpen(true)}
                        title="Apri l'assistente chat AI"
                        className={`p-4 rounded-2xl shadow-2xl transition-transform hover:scale-105 active:scale-95 ${
                            isDark ? "bg-white text-black" : "bg-black text-white"
                        }`}
                    >
                        <span className="text-2xl">🪄</span>
                    </button>
                </div>
            )}

            {/* Floating Chat */}
            {isChatOpen && (
            <div className={`fixed bottom-6 right-6 w-[360px] h-[550px] max-h-[80vh] flex flex-col rounded-3xl shadow-2xl z-50 border overflow-hidden transition-colors duration-500 ${
                navbarStyle === 'classic-soft'
                    ? (isDark ? 'bg-[#121214]/95 border-[#222226] shadow-[0_0_35px_rgba(0,0,0,0.4)]' : 'bg-[#fcfbf9]/95 border-[#ebdccb] shadow-[0_0_35px_rgba(180,170,160,0.15)]')
                    : (isDark ? 'bg-[#07070a]/80 backdrop-blur-2xl border-white/[0.05] shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'bg-white/90 backdrop-blur-2xl border-neutral-200 shadow-[0_0_30px_rgba(0,0,0,0.1)]')
            }`}>
                {/* Header */}
                <div className={`px-5 py-4 border-b flex items-center justify-between ${
                    navbarStyle === 'classic-soft'
                        ? (isDark ? 'border-[#222226] bg-[#1a1a20]/40' : 'border-[#ebdccb] bg-[#f5f2eb]/40')
                        : (isDark ? 'border-white/[0.05] bg-white/[0.01]' : 'border-neutral-100 bg-neutral-50/50')
                }`}>
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🪄</span>
                        <div>
                            <h1 className={`font-bold text-base ${isDark ? 'text-white' : 'text-neutral-900'}`}>Schema Assistant</h1>
                            <p className={`text-[11px] font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Crea e Modifica con l'AI</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => {
                                if(window.confirm("Vuoi svuotare la cronologia della chat? Lo schema rimarrà invariato.")) {
                                    clearMessages();
                                }
                            }}
                            title="Svuota cronologia chat"
                            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-500'}`}
                        >
                            <Eraser size={20} />
                        </button>
                        <button 
                            onClick={() => setIsChatOpen(false)}
                            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-500'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className={`text-center text-sm py-10 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Chiedimi di creare o modificare uno schema per te!
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                    ? (isDark ? 'bg-orange-500 text-black' : 'bg-orange-500 text-white')
                                    : (isDark ? 'bg-white/[0.03] border border-white/[0.03] text-white' : 'bg-neutral-100 border border-neutral-200 text-neutral-900')
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start">
                            <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${isDark ? 'bg-white/[0.03] border border-white/[0.03] text-white' : 'bg-neutral-100 border border-neutral-200 text-neutral-900'}`}>
                                <span className="animate-pulse">Sto pensando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Textbar */}
                <div className={`p-4 pt-2 ${isDark ? 'bg-transparent' : 'bg-transparent'}`}>
                    <SchemaTextbar />
                </div>
            </div>
            )}

        </div>
    );
};

export default SchemaPage;chemaPage;
