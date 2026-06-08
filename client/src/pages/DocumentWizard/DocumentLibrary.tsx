import React, { useState, useMemo } from "react";
import { useDocument } from "../../context/DocumentContext";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FileText, 
    MagnifyingGlass, 
    Plus, 
    Clock, 
    Tag, 
    Trash,
    Calendar,
    CaretRight,
    FilePdf,
    FileDoc,
    FileTxt,
    Archive
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import deleteCurrentDocument from "../../services/supabase/documents/deleteCurrentDocument";

const DocumentLibrary = ({ onNewDocument }: { onNewDocument: () => void }) => {
    const { documentList, setDocumentList } = useDocument();
    const { user, theme } = useAuth();
    const { fetchUserDocuments } = useDocument();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const isDark = theme === "dark";

    const filteredDocuments = useMemo(() => {
        return documentList.filter(doc => 
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.category && doc.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [documentList, searchQuery]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user?.id || !window.confirm("Sei sicuro di voler eliminare questo documento e tutti i suoi vettori?")) return;
        
        try {
            await deleteCurrentDocument(user.id, id);
            setDocumentList(prev => prev.filter(d => d.document_id !== id));
        } catch (error) {
            console.error("Errore durante l'eliminazione:", error);
        }
    };

    const getFileIcon = (title: string) => {
        const ext = title.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FilePdf size={24} weight="duotone" className="text-red-500" />;
        if (ext === 'doc' || ext === 'docx') return <FileDoc size={24} weight="duotone" className="text-blue-500" />;
        if (ext === 'txt' || ext === 'md') return <FileTxt size={24} weight="duotone" className="text-neutral-500" />;
        return <FileText size={24} weight="duotone" className="text-orange-500" />;
    };

    return (
        <div className={`flex flex-col h-full w-full max-w-6xl mx-auto p-6 md:p-10 ${isDark ? "text-white" : "text-[#171717]"}`}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b08968]/10 border border-[#b08968]/20 text-[#b08968] text-[10px] font-bold uppercase tracking-widest mb-4"
                    >
                        <Archive size={12} /> Personal Knowledge Base
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-normal tracking-tight">
                        Your <span className="serif-accent italic text-[#b08968]">Knowledge</span> Library
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <input 
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-10 pr-4 py-2.5 rounded-2xl border text-sm w-64 transition-all outline-none 
                                ${isDark 
                                    ? "bg-white/5 border-white/10 focus:border-[#b08968]/50 focus:bg-white/10" 
                                    : "bg-white border-neutral-200 focus:border-[#b08968]/50 shadow-sm"
                                }`}
                        />
                        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                    
                    <button 
                        onClick={onNewDocument}
                        className="flex items-center gap-2 bg-[#171717] dark:bg-white dark:text-[#171717] text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-black/5 hover:scale-105 transition-all active:scale-95"
                    >
                        <Plus size={18} weight="bold" />
                        <span>Add Document</span>
                    </button>
                </div>
            </div>

            {/* Document Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {filteredDocuments.map((doc, idx) => (
                            <motion.div
                                key={doc.document_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => navigate(`/app/documents/${doc.document_id}`)}
                                className={`group p-6 rounded-[2.5rem] bg-white border border-neutral-200 hover:border-[#b08968]/50 hover:shadow-xl hover:shadow-black/[0.02] transition-all cursor-pointer relative overflow-hidden flex flex-col h-full ${isDark ? "bg-white/5 border-white/10" : "bg-white"}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-2xl ${isDark ? "bg-white/5" : "bg-[#fcfbf9]"} group-hover:bg-[#b08968]/10 transition-colors`}>
                                        {getFileIcon(doc.title)}
                                    </div>
                                    <button 
                                        onClick={(e) => handleDelete(doc.document_id, e)}
                                        className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-neutral-400 transition-all"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-normal mb-2 group-hover:text-[#b08968] transition-colors truncate pr-4">
                                        {doc.title}
                                    </h3>
                                    <p className="text-xs text-neutral-400 font-light mb-6 line-clamp-2 leading-relaxed">
                                        {doc.description || "No description provided. Start exploring this document to uncover insights."}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${isDark ? "bg-white/10 text-neutral-400" : "bg-neutral-100 text-neutral-500"}`}>
                                            {doc.category || "General"}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                                            <Calendar size={12} />
                                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Recent"}
                                        </div>
                                    </div>
                                    <CaretRight size={16} className="text-[#b08968] transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className={`w-20 h-20 rounded-[2rem] ${isDark ? "bg-white/5" : "bg-[#fcfbf9]"} flex items-center justify-center mb-8`}>
                            <Archive size={40} className="text-neutral-200" />
                        </div>
                        <h3 className="text-2xl font-normal mb-3">No documents found</h3>
                        <p className="text-neutral-400 font-light max-w-sm mx-auto mb-10">
                            {searchQuery ? `No results for "${searchQuery}". Try a different term.` : "Your library is empty. Start by adding your first document to build your knowledge base."}
                        </p>
                        <button 
                            onClick={onNewDocument}
                            className="warm-btn-primary !px-8 !py-3 !rounded-full"
                        >
                            Upload Document
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentLibrary;