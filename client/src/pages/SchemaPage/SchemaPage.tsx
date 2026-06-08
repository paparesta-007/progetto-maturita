import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSchema, type SchemaNodeData } from '../../context/SchemaContext';
import { useAuth } from '../../context/AuthContext';
import SchemaTextbar from './Textbar';
import { PlusIcon, TrashIcon, DownloadSimple, FileCode, FilePdf, Palette, MagnifyingGlassPlus, MagnifyingGlassMinus,ArrowsOutCardinal, Rows, Columns } from '@phosphor-icons/react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 11);
};

const SOFT_COLORS = [
    { name: 'Default', value: '' },
    { name: 'Blue', value: 'rgb(96, 165, 250)' },
    { name: 'Green', value: 'rgb(74, 222, 128)' },
    { name: 'Purple', value: 'rgb(192, 132, 252)' },
    { name: 'Pink', value: 'rgb(244, 114, 182)' },
    { name: 'Orange', value: 'rgb(251, 146, 60)' },
    { name: 'Red', value: 'rgb(248, 113, 113)' },
    { name: 'Teal', value: 'rgb(45, 212, 191)' },
    { name: 'Yellow', value: 'rgb(250, 204, 21)' },
];

// --- 1. The Recursive Node Component ---
const SchemaNode = ({ 
    node, 
    onUpdate, 
    onAddChild, 
    onDelete,
    isDark,
    orientation
}: { 
    node: SchemaNodeData, 
    onUpdate: (id: string, field: string, value: any) => void,
    onAddChild: (id: string) => void,
    onDelete: (id: string) => void,
    isDark: boolean,
    orientation: 'vertical' | 'horizontal'
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

    return (
        <li className={orientation === 'horizontal' ? 'flex items-center' : ''}>
            {/* The Node Card */}
            <div className={`group/node relative inline-block text-left w-56 p-3 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                isDark 
                    ? 'bg-[#0f0f13] border-white/10 hover:border-white/20' 
                    : 'bg-white border-neutral-200 shadow-sm hover:border-orange-300 hover:shadow-orange-500/10'
            }`}
            style={{ borderColor: node.color ? `${node.color}44` : undefined }}
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
                
                {/* Action Buttons (Hover) */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity  z-10">
                    <button 
                        onClick={() => onAddChild(node.id)}
                        title="Aggiungi nodo figlio"
                        className={`p-1.5 rounded-full shadow-md transition-all active:scale-95 ${
                            isDark ? 'text-white bg-[rgb(38,38,38)] hover:bg-[rgb(64,64,64)]' : 'text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                        <PlusIcon size={14} weight="bold" />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(!showColorPicker);
                        }}
                        title="Cambia colore"
                        className={`p-1.5 rounded-full shadow-md transition-all active:scale-95 ${
                            isDark ? 'text-white bg-[rgb(38,38,38)] hover:bg-[rgb(64,64,64)]' : 'text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                        <Palette size={14} weight="bold" />
                    </button>
                    <button 
                        onClick={() => onDelete(node.id)} 
                        title="Elimina nodo"
                        className={`p-1.5 rounded-full shadow-md text-red-500 transition-all active:scale-95 ${
                            isDark ? 'bg-[rgb(38,38,38)] hover:bg-[rgb(64,64,64)]' : 'bg-white border border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                        <TrashIcon size={14} weight="bold" />
                    </button>
                </div>

                {/* Color Picker Popup */}
                {showColorPicker && (
                    <div 
                        ref={pickerRef}
                        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-xl border shadow-xl flex gap-1 z-20 ${isDark ? 'bg-[rgb(23,23,23)] border-[rgb(255,255,255,0.1)]' : 'bg-white border-neutral-200'}`}
                    >
                        {SOFT_COLORS.map((c) => (
                            <button
                                key={c.name}
                                onClick={() => {
                                    onUpdate(node.id, 'color', c.value);
                                    setShowColorPicker(false);
                                }}
                                className="w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-125"
                                style={{ backgroundColor: c.value || (isDark ? '#fff' : '#000') }}
                                title={c.name}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Children container with connecting lines */}
            {node.children && node.children.length > 0 && (
                <ul className={orientation === 'horizontal' ? 'horizontal' : ''}>
                    {node.children.map((child) => (
                        <SchemaNode
                            key={child.id}
                            node={child}
                            onUpdate={onUpdate}
                            onAddChild={onAddChild}
                            onDelete={onDelete}
                            isDark={isDark}
                            orientation={orientation}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

// --- 2. The Main Parent Component ---
const SchemaBuilder = () => {
    const { schema, setSchema, orientation, setOrientation } = useSchema();
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    const containerRef = useRef<HTMLDivElement>(null);
    const orgTreeRef = useRef<HTMLDivElement>(null);

    // Zoom and Pan State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

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

    const handleAddRoot = () => {
        setSchema([
            ...schema,
            { id: generateId(), title: '', description: '', x: 0, y: 0, children: [] }
        ]);
    };

    // Zoom Logic
    const handleWheel = (e: React.WheelEvent) => {
        // Use wheel for zoom without requiring Ctrl/Meta to avoid browser conflict
        // Prevent default scrolling only if we are zooming
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

    return (
        <div className={`flex flex-col flex-1 h-full p-6 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            <div className="w-full flex-1 flex flex-col space-y-6 min-h-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Schema Builder</h2>
                    
                    <div className="flex items-center gap-2">
                         {/* Orientation Toggle */}
                         <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-[rgb(23,23,23)] border-[rgb(255,255,255,0.1)]' : 'bg-neutral-100 border-neutral-200'}`}>
                            <button 
                                onClick={() => setOrientation('vertical')} 
                                className={`p-1.5 rounded-lg transition-all ${orientation === 'vertical' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-50'}`} 
                                title="Vertical Layout"
                            >
                                <Rows size={18}/>
                            </button>
                            <button 
                                onClick={() => setOrientation('horizontal')} 
                                className={`p-1.5 rounded-lg transition-all ${orientation === 'horizontal' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-50'}`} 
                                title="Horizontal Layout"
                            >
                                <Columns size={18}/>
                            </button>
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1"/>

                         {/* Controls */}
                         <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-rgb(23,23,23) border-[rgb(255,255,255,0.1)]' : 'bg-neutral-100 border-neutral-200'}`}>
                            <button onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.2))} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Zoom Out"><MagnifyingGlassMinus size={18}/></button>
                            <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Zoom In"><MagnifyingGlassPlus size={18}/></button>
                            <div className="w-px h-4 bg-white/10 mx-1"/>
                            <button onClick={resetView} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Reset View"><ArrowsOutCardinal size={18}/></button>
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1"/>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={exportAsJSON}
                                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl font-bold transition-all ${
                                    isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-200 text-black hover:bg-neutral-300'
                                }`}
                            >
                                <FileCode size={16} /> JSON
                            </button>
                            <button 
                                onClick={exportAsPDF}
                                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl font-bold transition-all ${
                                    isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-200 text-black hover:bg-neutral-300'
                                }`}
                            >
                                <FilePdf size={16} /> PDF
                            </button>
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1"/>

                        <button 
                            onClick={handleAddRoot} 
                            className={`text-sm px-4 py-2 rounded-xl font-bold transition-all ${
                                isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
                            }`}
                        >
                            + Add Root Node
                        </button>
                    </div>
                </div>
                
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
                    className={`relative w-full flex-1 h-full overflow-hidden rounded-2xl border cursor-grab active:cursor-grabbing ${isDark ? 'bg-[#07070a] border-[rgb(255,255,255,0.1)]' : 'bg-[#f9fafb] border-neutral-200'}`} style={{
                     backgroundImage: `radial-gradient(${isDark ? '#ffffff1a' : '#0000001a'} 1px, rgba(0,0,0,0) 0)`,
                     backgroundSize: '30px 30px'
                }}>
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
                                        isDark={isDark}
                                        orientation={orientation}
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
    const { messages, loading } = useSchema();
    const { theme } = useAuth();
    const isDark = theme === 'dark';
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isChatOpen, setIsChatOpen] = useState(true);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className={`relative flex h-full w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#07070a] text-[#f4f1ea]" : "bg-[#fdfcfb] text-neutral-900"}`}>
            
            {/* Main Canvas: Schema Builder */}
            <div className="flex-1 w-full h-full flex flex-col">
                <SchemaBuilder />
            </div>

            {/* Toggle Button if Chat is hidden */}
            {!isChatOpen && (
                <div className="fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => setIsChatOpen(true)}
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
                isDark ? 'bg-[#07070a]/80 backdrop-blur-2xl border-white/[0.05] shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'bg-white/90 backdrop-blur-2xl border-neutral-200 shadow-[0_0_30px_rgba(0,0,0,0.1)]'
            }`}>
                {/* Header */}
                <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/[0.05] bg-white/[0.01]' : 'border-neutral-100 bg-neutral-50/50'}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🪄</span>
                        <div>
                            <h1 className={`font-bold text-base ${isDark ? 'text-white' : 'text-neutral-900'}`}>Schema Assistant</h1>
                            <p className={`text-[11px] font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Crea e Modifica con l'AI</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsChatOpen(false)}
                        className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-500'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
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

export default SchemaPage;
