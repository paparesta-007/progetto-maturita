import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    FileText, 
    Zap, 
    MessageSquare,
    Sparkles,
    Shield,
    Github,
    ExternalLink,
    ChevronRight,
    ChevronDown,
    Bot,
    BookOpen
} from 'lucide-react';

/* --- Effects & Utilities --- */

type TypewriterTextProps = {
    text: string;
    delay?: number;
    className?: string;
};

const TypewriterText = ({ text, delay = 0, className = "" }: TypewriterTextProps) => {
    const [display, setDisplay] = useState("");
    
    useEffect(() => {
        let current = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                if (current <= text.length) {
                    setDisplay(text.slice(0, current));
                    current++;
                } else {
                    clearInterval(interval);
                }
            }, 50);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timer);
    }, [text, delay]);
    
    return <span className={className}>{display}<span className="animate-pulse">_</span></span>;
};

/* --- Core Styles --- */
const SystemStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;800&display=swap');
        
        :root {
            --bg: #fafaf9;
            --fg: #1c1917;
            --accent: #f97316;
            --accent-light: #fff7ed;
            --border: #e7e5e4;
            --muted: #78716c;
        }
        
        body {
            background: var(--bg);
            color: var(--fg);
            font-family: 'Inter', sans-serif;
        }
        
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        
        .brutalist-border {
            border: 1.5px solid var(--fg);
        }
        
        .brutalist-shadow {
            box-shadow: 4px 4px 0px 0px var(--fg);
            transition: all 0.2s ease;
        }
        
        .brutalist-shadow:hover {
            box-shadow: 6px 6px 0px 0px var(--fg);
            transform: translate(-2px, -2px);
        }
        
        .brutalist-shadow-sm {
            box-shadow: 2px 2px 0px 0px var(--fg);
        }
        
        .text-gradient {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .grid-pattern {
            background-size: 40px 40px;
            background-image: 
                linear-gradient(to right, rgba(28, 25, 23, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(28, 25, 23, 0.05) 1px, transparent 1px);
        }
        
        .bento-card {
            background: white;
            border: 1.5px solid var(--border);
            transition: all 0.3s ease;
        }
        
        .bento-card:hover {
            border-color: var(--fg);
            box-shadow: 4px 4px 0px 0px var(--fg);
            transform: translate(-2px, -2px);
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.3); opacity: 0; }
        }
        
        .pulse-ring::before {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: inherit;
            border: 2px solid var(--accent);
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
    `}</style>
);

/* --- Components --- */

const TopNav = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isExploreOpen, setIsExploreOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const exploreLinks = [
        { label: 'Help Tickets', to: '/help' },
        { label: 'Roadmap', to: '/roadmap' },
        { label: 'Resources', to: '/resources' },
        { label: 'Changelog', to: '/changelog' }
    ];
    
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const onMouseDown = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsExploreOpen(false);
            }
        };

        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);
    
    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-stone-50/90 backdrop-blur-md border-b border-stone-200' : ''}`}>
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 brutalist-shadow-sm flex items-center justify-center">
                        <Sparkles size={18} className="text-white" />
                    </div>
                    <span className="font-mono font-bold text-lg tracking-tight">Smart AI</span>
                    <span className="hidden sm:inline-block px-2 py-0.5 bg-stone-200 text-stone-600 text-[10px] font-mono uppercase rounded-full">
                        v2.0
                    </span>
                </div>
                
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <a href="#features" className="hover:text-orange-600 transition-colors">Features</a>
                    <a href="#models" className="hover:text-orange-600 transition-colors">Models</a>
                    <a href="#capabilities" className="hover:text-orange-600 transition-colors">Capabilities</a>
                    <a href="#about" className="hover:text-orange-600 transition-colors">About</a>
                    <Link to="/help" className="hover:text-orange-600 transition-colors">Help Tickets</Link>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsExploreOpen((previous) => !previous)}
                            className="inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors"
                        >
                            Explore
                            <ChevronDown size={14} className={`transition-transform ${isExploreOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isExploreOpen && (
                            <div className="absolute top-full right-0 mt-2 min-w-[180px] bg-white border border-stone-200 rounded-lg p-1.5 shadow-lg">
                                {exploreLinks.map((route) => (
                                    <Link
                                        key={route.to}
                                        to={route.to}
                                        onClick={() => setIsExploreOpen(false)}
                                        className="block px-3 py-2 text-stone-700 hover:bg-stone-100 rounded-md"
                                    >
                                        {route.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>
                
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
                        <Github size={20} />
                    </button>
                    <Link
                        to="/login"
                        className="font-mono text-sm bg-stone-900 text-white px-4 py-2 brutalist-shadow hover:bg-orange-500 transition-colors"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </header>
    );
};

const Hero = () => {
    return (
        <section className="pt-32 pb-20 px-6 grid-pattern">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 border border-orange-200 rounded-full text-orange-700 text-xs font-mono font-medium mb-6"
                        >
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                            Progetto di Maturità 2025
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9]"
                        >
                            Multi-Model
                            <span className="block text-gradient">AI Interface</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-stone-600 font-mono leading-relaxed mb-8 max-w-lg"
                        >
                            A full-stack AI chat application with real-time streaming, 
                            PDF document intelligence, and multi-provider model support.
                            <span className="block mt-2 text-sm text-stone-400">
                                Built by Tommaso Paparesta
                            </span>
                        </motion.p>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-4"
                        >
                            <Link to="/login" className="bg-orange-500 text-white px-6 py-3 font-mono text-sm brutalist-shadow hover:bg-orange-600 flex items-center gap-2">
                                <ExternalLink size={16} />
                                Login
                            </Link>
                            <button className="bg-white border-2 border-stone-900 px-6 py-3 font-mono text-sm brutalist-shadow hover:bg-stone-100 flex items-center gap-2">
                                <Github size={16} />
                                Source Code
                            </button>
                        </motion.div>
                    </div>
                    
                    {/* Right Visual - Chat Interface Mockup */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="relative"
                    >
                        <div className="bg-white brutalist-border brutalist-shadow rounded-lg overflow-hidden">
                            {/* Chat Header */}
                            <div className="bg-stone-100 border-b border-stone-200 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <span className="font-mono text-xs text-stone-500">gpt-4o-mini • Streaming</span>
                                <div className="w-4" />
                            </div>
                            
                            {/* Chat Content */}
                            <div className="p-6 space-y-4 h-80 overflow-hidden bg-white">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold">U</span>
                                    </div>
                                    <div className="bg-stone-100 rounded-2xl rounded-tl-none px-4 py-2 text-sm max-w-[80%]">
                                        Analyze this PDF and create flashcards about neural networks
                                    </div>
                                </div>
                                
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                        <Bot size={16} className="text-orange-600" />
                                    </div>
                                    <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm max-w-[90%] shadow-sm">
                                        <div className="flex items-center gap-2 mb-2 text-xs text-stone-400 font-mono">
                                            <FileText size={12} />
                                            <span>Processing neural_networks.pdf...</span>
                                        </div>
                                        <TypewriterText 
                                            text="I'll analyze the PDF and generate structured flashcards for you. Based on the document, here are the key concepts:" 
                                            className="text-stone-700"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 pl-11">
                                    <div className="grid grid-cols-2 gap-2 w-full max-w-[90%]">
                                        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                            <div className="text-[10px] uppercase font-bold text-orange-600 mb-1">Q: Activation Function</div>
                                            <div className="text-xs text-stone-600">What introduces non-linearity?</div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                            <div className="text-[10px] uppercase font-bold text-blue-600 mb-1">Q: Backpropagation</div>
                                            <div className="text-xs text-stone-600">Algorithm for weight updates?</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Input */}
                            <div className="border-t border-stone-200 p-4 bg-stone-50">
                                <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-lg px-4 py-2">
                                    <span className="text-stone-400 text-sm flex-1">Type a message...</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-mono text-stone-400">Ready</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Floating Elements */}
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute -top-4 -right-4 bg-white brutalist-border brutalist-shadow-sm px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs font-mono">Latency: 45ms</span>
                        </motion.div>
                        
                        <motion.div 
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                            className="absolute -bottom-4 -left-4 bg-stone-900 text-white brutalist-border brutalist-shadow-sm px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Zap size={14} className="text-orange-400" />
                            <span className="text-xs font-mono">OpenRouter</span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const FeaturesBento = () => {
    const features = [
        {
            id: "chat",
            icon: MessageSquare,
            title: "Multi-Model Chat",
            description: "Seamlessly switch between GPT-4, Claude, Llama, Deepseek, and 20+ models via OpenRouter unified API.",
            className: "md:col-span-2",
            color: "bg-blue-50 border-blue-200"
        },
        {
            id: "pdf",
            icon: FileText,
            title: "PDF Intelligence",
            description: "RAG-powered document analysis with semantic search and automatic chunking.",
            className: "",
            color: "bg-orange-50 border-orange-200"
        },
        {
            id: "stream",
            icon: Zap,
            title: "Real-time Streaming",
            description: "Token-by-token SSE streaming for instant feedback.",
            className: "",
            color: "bg-green-50 border-green-200"
        },
        {
            id: "structured",
            icon: BookOpen,
            title: "Structured Output",
            description: "Generate flashcards & quizzes with Zod schema validation.",
            className: "md:col-span-2",
            color: "bg-purple-50 border-purple-200"
        },
        {
            id: "auth",
            icon: Shield,
            title: "Secure Auth",
            description: "Email/password authentication with Supabase Auth and protected routes.",
            className: "",
            color: "bg-stone-100 border-stone-300"
        }
    ];
    
    return (
        <section id="features" className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <span className="font-mono text-xs uppercase tracking-widest text-orange-600 mb-2 block">
                        Capabilities
                    </span>
                    <h2 className="text-4xl font-black tracking-tight">
                        Feature <span className="text-gradient">Registry</span>
                    </h2>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className={`bento-card rounded-xl p-6 ${feature.className} ${feature.color} group cursor-pointer`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 bg-white rounded-lg border border-current opacity-80 group-hover:scale-110 transition-transform`}>
                                    <feature.icon size={24} className="text-stone-800" />
                                </div>
                                <span className="font-mono text-[10px] opacity-50">0{i + 1}</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 font-mono">{feature.title}</h3>
                            <p className="text-sm text-stone-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ModelShowcase = () => {
    const models = [
        { name: "GPT-4o", provider: "OpenAI", color: "bg-green-100" },
        { name: "Claude 3.5", provider: "Anthropic", color: "bg-orange-100" },
        { name: "Llama 3", provider: "Meta", color: "bg-blue-100" },
        { name: "Deepseek", provider: "Deepseek", color: "bg-purple-100" },
        { name: "Gemini Pro", provider: "Google", color: "bg-yellow-100" },
        { name: "Grok", provider: "xAI", color: "bg-stone-200" }
    ];
    
    return (
        <section id="models" className="py-24 px-6 bg-stone-50 border-y border-stone-200">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black tracking-tight mb-4">
                        Supported <span className="text-gradient">Providers</span>
                    </h2>
                    <p className="text-stone-600 font-mono text-sm max-w-lg mx-auto">
                        Unified interface for the world's leading AI models via OpenRouter integration.
                        Switch models mid-conversation without losing context.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {models.map((model, i) => (
                        <motion.div
                            key={model.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            viewport={{ once: true }}
                            className="bg-white brutalist-border brutalist-shadow-sm p-4 rounded-lg text-center hover:shadow-md transition-shadow"
                        >
                            <div className={`w-12 h-12 ${model.color} rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg`}>
                                {model.name[0]}
                            </div>
                            <div className="font-bold text-sm mb-1">{model.name}</div>
                            <div className="text-[10px] font-mono text-stone-500 uppercase">{model.provider}</div>
                        </motion.div>
                    ))}
                </div>
                
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-4 bg-white brutalist-border px-6 py-3 rounded-full">
                        <span className="text-sm font-mono text-stone-600">+15 more models available</span>
                        <ChevronRight size={16} className="text-orange-500" />
                    </div>
                </div>
            </div>
        </section>
    );
};

const ProductCapabilities = () => {
    const stack = [
        { category: "AI Chat", items: ["Model switch in one click", "Conversation memory", "Streaming responses", "Prompt shortcuts"] },
        { category: "Documents", items: ["PDF upload and parsing", "Semantic retrieval", "Focused document chat", "Context-aware answers"] },
        { category: "Productivity", items: ["Calendar companion", "Artifacts area", "Quiz generation", "Flashcard workflows"] },
        { category: "Support", items: ["Integrated help tickets", "User support history", "Status tracking", "Fast issue reporting"] }
    ];
    
    return (
        <section id="capabilities" className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div>
                        <span className="font-mono text-xs uppercase tracking-widest text-orange-600 mb-2 block">
                            Product
                        </span>
                        <h2 className="text-4xl font-black tracking-tight mb-6">
                            Webapp <span className="text-gradient">Features</span>
                        </h2>
                        <p className="text-stone-600 font-mono text-sm leading-relaxed mb-8">
                            Explore what Smart AI can do out of the box for students and creators.
                            These are the practical tools available in the app experience today.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                </div>
                                <span className="font-mono">Build study material from your conversations in seconds</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                </div>
                                <span className="font-mono">Keep learning workflows centralized in one workspace</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                </div>
                                <span className="font-mono">Get direct help through in-app support tickets</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stack.map((section) => (
                            <div key={section.category} className="bento-card p-6 rounded-xl bg-stone-50 border-stone-200">
                                <h3 className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-4">
                                    {section.category}
                                </h3>
                                <ul className="space-y-2">
                                    {section.items.map((item, j) => (
                                        <li key={j} className="text-sm font-medium flex items-center gap-2">
                                            <ChevronRight size={14} className="text-orange-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const About = () => {
    return (
        <section id="about" className="py-24 px-6 bg-stone-900 text-stone-100">
            <div className="max-w-4xl mx-auto text-center">
                <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-white brutalist-shadow">
                    TP
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-4">
                    Tommaso Paparesta
                </h2>
                <p className="text-stone-400 font-mono text-sm mb-6">
                    Progetto di Maturità • A.S. 2024/2025
                </p>
                <p className="text-lg leading-relaxed text-stone-300 mb-8 max-w-2xl mx-auto">
                    Smart AI represents the culmination of my high school journey in computer science. 
                    This capstone project explores the practical applications of Large Language Models 
                    in educational contexts, with a focus on document analysis and structured learning tools.
                </p>
                <div className="flex justify-center gap-4">
                    <button className="px-6 py-3 bg-stone-800 border border-stone-700 rounded-lg font-mono text-sm hover:bg-stone-700 transition-colors flex items-center gap-2">
                        <Github size={16} />
                        View on GitHub
                    </button>
                    <button className="px-6 py-3 bg-orange-500 text-white rounded-lg font-mono text-sm hover:bg-orange-600 transition-colors brutalist-shadow">
                        Contact
                    </button>
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-stone-100 border-t border-stone-200 py-12 px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-orange-500" />
                    <span className="font-mono font-bold">Smart AI</span>
                    <span className="text-stone-400 text-sm">• 2025</span>
                </div>
                
                <div className="flex items-center gap-8 text-sm text-stone-600 font-mono">
                    <a href="#" className="hover:text-orange-600 transition-colors">Documentation</a>
                    <a href="#" className="hover:text-orange-600 transition-colors">API</a>
                    <a href="#" className="hover:text-orange-600 transition-colors">Privacy</a>
                </div>
                
                <div className="text-xs text-stone-400 font-mono">
                    Multi-model assistant with documents, calendar, artifacts, and support
                </div>
            </div>
        </footer>
    );
};

export default function LandingPage() {
    return (
        <>
            <SystemStyles />
            <div className="min-h-screen bg-stone-50 selection:bg-orange-200 selection:text-orange-900">
                <TopNav />
                <main>
                    <Hero />
                    <FeaturesBento />
                    <ModelShowcase />
                    <ProductCapabilities />
                    <About />
                </main>
                <Footer />
            </div>
        </>
    );
}