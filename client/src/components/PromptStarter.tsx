import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { 
    MessageSquare, 
    Lightbulb, 
    PenTool, 
    Code2, 
    Plane, 
    BookOpen, 
    Music, 
    Utensils, 
    Dumbbell, 
    Briefcase, 
    Coffee, 
    Camera 
} from "lucide-react"; 
import { useChat } from "../context/ChatContext";

const PromptStarter = () => {
    const { setInputValue } = useChat();
    const { theme,user } = useAuth();
    const isDark = theme === 'dark';

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Buongiorno";
        if (hours < 18) return "Buon pomeriggio";
        return "Buonasera";
    };

    const allSuggestions = [
        { title: "Analisi", desc: "Riassumi i punti chiave di un testo.", icon: <MessageSquare size={20} />, prompt: "Analizza questo testo e riassumi i punti salienti: ", color: "#3ad333" },
        { title: "Email", desc: "Scrivi una risposta professionale.", icon: <PenTool size={20} />, prompt: "Scrivi un'email formale per richiedere un appuntamento.", color: "#404040" },
        { title: "Codice", desc: "Spiega o scrivi uno snippet.", icon: <Code2 size={20} />, prompt: "Spiegami come ottimizzare questa funzione in JS: ", color: "#d333d0" },
        { title: "Creatività", desc: "Genera idee per post o progetti.", icon: <Lightbulb size={20} />, prompt: "Dammi 5 idee creative per un post su Instagram.", color: "#dfd746" },
        { title: "Viaggi", desc: "Pianifica il tuo prossimo itinerario.", icon: <Plane size={20} />, prompt: "Crea un itinerario di 3 giorni a Parigi per un appassionato d'arte.", color: "#3b82f6" },
        { title: "Studio", desc: "Spiegazione semplice di concetti.", icon: <BookOpen size={20} />, prompt: "Spiegami la teoria della relatività come se avessi 5 anni.", color: "#ef4444" },
        { title: "Musica", desc: "Consigli e playlist personalizzate.", icon: <Music size={20} />, prompt: "Suggeriscimi 5 artisti jazz simili a Bill Evans.", color: "#8b5cf6" },
        { title: "Cucina", desc: "Ricette basate sui tuoi ingredienti.", icon: <Utensils size={20} />, prompt: "Cosa posso cucinare con zucchine, uova e pancetta?", color: "#f59e0b" },
        { title: "Fitness", desc: "Esercizi e piani di allenamento.", icon: <Dumbbell size={20} />, prompt: "Crea una routine di allenamento a casa di 15 minuti senza attrezzi.", color: "#10b981" },
        { title: "Lavoro", desc: "Preparazione colloqui o carriera.", icon: <Briefcase size={20} />, prompt: "Quali sono le domande più comuni per un colloquio da Web Developer?", color: "#6366f1" },
        { title: "Lifestyle", desc: "Migliora le tue abitudini quotidiane.", icon: <Coffee size={20} />, prompt: "Consigliami una routine mattutina per aumentare la produttività.", color: "#92400e" },
        { title: "Fotografia", desc: "Tecniche e consigli di scatto.", icon: <Camera size={20} />, prompt: "Quali sono le impostazioni migliori per fotografare la Via Lattea?", color: "#06b6d4" }
    ];

    // Seleziona 4 suggerimenti casuali ogni volta che il componente viene montato
    const randomSuggestions = useMemo(() => {
        return [...allSuggestions]
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);
    }, []);

    // Classi calcolate una volta per il tema
    const styles = {
        container: "flex flex-col items-center justify-center max-w-4xl mx-auto h-full px-4 text-center",
        title: `text-3xl font-bold mb-2 transition-colors ${isDark ? "text-white" : "text-neutral-900"}`,
        subtitle: `mb-10 transition-colors ${isDark ? "text-neutral-500" : "text-neutral-500"}`,
        grid: "grid grid-cols-1 md:grid-cols-2 gap-4 w-full",
        card: `flex flex-col text-left p-4 border rounded-xl transition-all group ${
            isDark 
                ? "bg-neutral-900/40 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700" 
                : "bg-white border-neutral-200 hover:bg-neutral-50 shadow-sm hover:shadow-md"
        }`,
        cardTitle: `font-semibold transition-colors ${isDark ? "text-neutral-200" : "text-neutral-900"}`,
        cardDesc: `text-sm transition-colors ${isDark ? "text-neutral-500" : "text-neutral-500"}`,
        iconWrapper: "mb-3  duration-200"
    };

    return (
        <div className={styles.container}>
            <header>
                <h1 className={styles.title}>
                    {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Utente'}!
                </h1>
                <p className={styles.subtitle}>
                    Come posso aiutarti oggi? Scegli un suggerimento o scrivi sotto.
                </p>
            </header>

            <div className={styles.grid}>
                {randomSuggestions.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => setInputValue(item.prompt)}
                        className={styles.card}
                    >
                        <div className={styles.iconWrapper} style={{ color: item.color }}>
                            {item.icon}
                        </div>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        <p className={styles.cardDesc}>{item.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PromptStarter;