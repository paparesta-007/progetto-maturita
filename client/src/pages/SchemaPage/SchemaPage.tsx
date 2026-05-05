import React, { useRef, useEffect,useState } from 'react';
import { useSchema, type SchemaNodeData } from '../../context/SchemaContext';
import { useAuth } from '../../context/AuthContext';
import SchemaTextbar from './Textbar';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 11);
};

// --- 1. The Recursive Node Component ---
const SchemaNode = ({ 
    node, 
    onUpdate, 
    onAddChild, 
    onDelete,
    isDark,
    isRoot = false
}: { 
    node: SchemaNodeData, 
    onUpdate: (id: string, field: string, value: string) => void,
    onAddChild: (id: string) => void,
    onDelete: (id: string) => void,
    isDark: boolean,
    isRoot?: boolean
}) => {
    return (
        <li>
            {/* The Node Card */}
            <div className={`group/node relative inline-block text-left w-56 p-3 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                isDark 
                    ? 'bg-[#0f0f13] border-white/10 hover:border-white/20' 
                    : 'bg-white border-neutral-200 shadow-sm hover:border-orange-300 hover:shadow-orange-500/10'
            }`}>
                <div className="flex flex-col flex-grow items-center">
                    <input
                        type="text"
                        value={node.title}
                        onChange={(e) => onUpdate(node.id, 'title', e.target.value)}
                        placeholder="Titolo"
                        className={`w-full text-sm font-bold bg-transparent text-center focus:outline-none placeholder-neutral-400 transition-colors ${isDark ? 'text-white focus:text-orange-400' : 'text-neutral-900 focus:text-orange-500'}`}
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
                            isDark ? 'text-white bg-neutral-800 hover:bg-neutral-700' : 'text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                        <PlusIcon size={14} weight="bold" />
                    </button>
                    {!isRoot && (
                        <button 
                            onClick={() => onDelete(node.id)} 
                            title="Elimina nodo"
                            className={`p-1.5 rounded-full shadow-md text-red-500 transition-all active:scale-95 ${
                                isDark ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-white border border-neutral-200 hover:bg-neutral-50'
                            }`}
                        >
                            <TrashIcon size={14} weight="bold" />
                        </button>
                    )}
                </div>
            </div>

            {/* Children container with connecting lines */}
            {node.children && node.children.length > 0 && (
                <ul>
                    {node.children.map((child) => (
                        <SchemaNode
                            key={child.id}
                            node={child}
                            onUpdate={onUpdate}
                            onAddChild={onAddChild}
                            onDelete={onDelete}
                            isDark={isDark}
                            isRoot={false}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

// --- 2. The Main Parent Component ---
const SchemaBuilder = () => {
    const { schema, setSchema } = useSchema();
    const { theme } = useAuth();
    const isDark = theme === 'dark';

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
                        { id: generateId(), title: '', description: '', children: [] }
                    ];
                }
            } else if (updatedNode.children.length > 0) {
                updatedNode.children = updateTree(updatedNode.children, id, action, payload);
            }

            acc.push(updatedNode);
            return acc;
        }, []);
    };

    const handleUpdate = (id: string, field: string, value: string) => {
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
            { id: generateId(), title: '', description: '', children: [] }
        ]);
    };

    return (
        <div className={`flex flex-col flex-1 h-full p-6 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            <div className="w-full flex-1 flex flex-col space-y-6 min-h-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Schema Builder</h2>
                    <button 
                        onClick={handleAddRoot} 
                        className={`text-sm px-4 py-2 rounded-xl font-bold transition-all ${
                            isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
                        }`}
                    >
                        + Add Root Node
                    </button>
                </div>
                
                <style>{`
                    .org-tree {
                        --line-color: ${isDark ? '#525252' : '#d4d4d4'};
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        padding: 2rem;
                    }
                    .org-tree ul {
                        padding-top: 2rem;
                        position: relative;
                        display: flex;
                        justify-content: center;
                        padding-left: 0;
                    }
                    .org-tree li {
                        text-align: center;
                        list-style-type: none;
                        position: relative;
                        padding: 2rem 0.5rem 0 0.5rem;
                    }
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
                `}</style>
                
                <div className={`w-full flex-1 h-full overflow-auto rounded-2xl border ${isDark ? 'bg-[#07070a] border-white/[0.08]' : 'bg-neutral-50 border-neutral-200'}`} style={{
                     backgroundImage: `radial-gradient(${isDark ? '#ffffff1a' : '#0000001a'} 1px, transparent 0)`,
                     backgroundSize: '30px 30px'
                }}>
                    {schema.length === 0 ? (
                        <div className={`flex items-center justify-center h-full ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Nessun nodo presente. Aggiungi una radice per iniziare.
                        </div>
                    ) : (
                        <div className="org-tree min-w-max">
                            <ul>
                                {schema.map((node) => (
                                    <SchemaNode
                                        key={node.id}
                                        node={node}
                                        onUpdate={handleUpdate}
                                        onAddChild={handleAddChild}
                                        onDelete={handleDelete}
                                        isDark={isDark}
                                        isRoot={true}
                                    />
                                ))}
                            </ul>
                        </div>
                    )}
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
