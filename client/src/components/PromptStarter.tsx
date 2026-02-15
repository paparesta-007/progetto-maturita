import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { AtomIcon, ChartAreaIcon, HistoryIcon, LaughIcon, Microchip, StarsIcon } from "lucide-react";
import { BookIcon, DogIcon, DressIcon, EngineIcon, FilmStripIcon, GameControllerIcon, GraduationCapIcon, HeartbeatIcon, HeartIcon, HouseIcon, InstagramLogoIcon, KeyboardIcon, LightbulbIcon, MapPinAreaIcon, MoneyIcon, MusicNoteIcon, OpenAiLogoIcon, PaintBrushIcon, TentIcon, TreeIcon, TrendUpIcon, TrophyIcon, VideoCameraIcon } from "@phosphor-icons/react";

const PromptStarter = () => {
    const { theme, user } = useAuth();
    const isDark = theme === 'dark';

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Buongiorno";
        if (hours < 18) return "Buon pomeriggio";
        return "Buonasera";
    };

    const allSuggestions = [
        {
            "title": "Automobile",
            "desc": "Spiegazioni e curiosità sui veicoli",
            "icon": <EngineIcon size={20} />,
            "prompt": "Cosa rende un'auto F1 competitiva al livello attuale?",
            "color": "#2c7c54"
        },
        {
            "title": "Cinema",
            "desc": "Analisi e consigli su film e serie TV",
            "icon": <FilmStripIcon size={20} />,
            "prompt": "Quali sono i film migliori per imparare la storia italiana?",
            "color": "#5f6368"
        },
        {
            "title": "Tecnologia",
            "desc": "Spiegazioni tecniche e tendenze emergenti",
            "icon": <Microchip size={20} />,
            "prompt": "Come funzionano i chip di intelligenza artificiale?",
            "color": "#424242"
        },
        {
            "title": "Social Media",
            "desc": "Strategie e creatività per piattaforme digitali",
            "icon": <InstagramLogoIcon size={20} />,
            "prompt": "Come creare un video TikTok virale per una serie TV?",
            "color": "#9e9cb3"
        },
        {
            "title": "Sviluppo",
            "desc": "Crescita personale e professionale",
            "icon": <ChartAreaIcon size={20} />,
            "prompt": "Come gestire lo stress da lavoro a casa?",
            "color": "#e0e0e0"
        },
        {
            "title": "Viaggio",
            "desc": "Itinerari e guide turistiche",
            "icon": <MapPinAreaIcon size={20} />,
            "prompt": "Itinerario di 5 giorni a Tokyo per appassionati di manga",
            "color": "#64ffda"
        },
        {
            "title": "Letteratura",
            "desc": "Recensioni e analisi di libri",
            "icon": <BookIcon size={20} />,
            "prompt": "Quali romanzi noir devono leggere i fan di film come Blade Runner?",
            "color": "#c2c2c2"
        },
        {
            "title": "Gaming",
            "desc": "Giochi e strategie per appassionati",
            "icon": <GameControllerIcon size={20} />,
            "prompt": "Suggerisci giochi simili a Cyberpunk 2077?",
            "color": "#875ea6"
        },
        {
            "title": "Scienza",
            "desc": "Concetti scientifici semplificati",
            "icon": <AtomIcon size={20} />,
            "prompt": "Come funziona la fusione nucleare in termini semplici?",
            "color": "#ff7200"
        },
        {
            "title": "Moda",
            "desc": "Consigli di stile e look unici",
            "icon": <DressIcon size={20} />,
            "prompt": "Come creare un look coordinato per un concerto live?",
            "color": "#ffa726"
        },
        {
            "title": "Sviluppo Software",
            "desc": "Suggerimenti per programmatori",
            "icon": <KeyboardIcon size={20} />,
            "prompt": "Qual è la differenza tra Python e JavaScript?",
            "color": "#6366f1"
        },
        {
            "title": "Marketing",
            "desc": "Strategie per piattaforme digitali",
            "icon": <MoneyIcon size={20} />,
            "prompt": "Come aumentare il traffico Instagram con Reels?",
            "color": "#e8e8e8"
        },
        {
            "title": "Musica",
            "desc": "Consigli e analisi musicale",
            "icon": <MusicNoteIcon size={20} />,
            "prompt": "Come iniziare a produrre beat come DJ Khaled?",
            "color": "#ff1744"
        },
        {
            "title": "Salute",
            "desc": "Benessere fisico e mentale",
            "icon": <HeartbeatIcon size={20} />,
            "prompt": "Quali alimenti migliorano la concentrazione?",
            "color": "#f98373"
        },
        {
            "title": "Educazione",
            "desc": "Consigli per studenti e apprendenti",
            "icon": <GraduationCapIcon size={20} />,
            "prompt": "Migliori app per imparare il giapponese?",
            "color": "#9c27b0"
        },
        {
            "title": "Arte",
            "desc": "Creatività e progetti artistici",
            "icon": <PaintBrushIcon size={20} />,
            "prompt": "Come dipingere un ritratto realistico?",
            "color": "#ffcc28"
        },
        {
            "title": "Finanza",
            "desc": "Investimenti e gestione economica",
            "icon": <TrendUpIcon size={20} />,
            "prompt": "Come iniziare a investire in borsa?",
            "color": "#ffab91"
        },
        {
            "title": "Relazioni",
            "desc": "Consigli per comunicare e connettersi",
            "icon": <HeartIcon size={20} />,
            "prompt": "Come gestire un conflitto con un collega?",
            "color": "#827717"
        },
        {
            "title": "Filosofia",
            "desc": "Riflessioni su temi astratti",
            "icon": <LightbulbIcon size={20} />,
            "prompt": "Qual è il significato del nichilismo?",
            "color": "#49d190"
        },
        {
            "title": "Ecologia",
            "desc": "Suggerimenti per stili di vita sostenibili",
            "icon": <TreeIcon size={20} />,
            "prompt": "Come ridurre la plastica in casa?",
            "color": "#45aaf2"
        },
        {
            "title": "E-sport",
            "desc": "Strategie per giocatori competitivi",
            "icon": <TrophyIcon size={20} />,
            "prompt": "Quali sono le combo migliori in Street Fighter?",
            "color": "#ff1744"
        },
        {
            "title": "Editing Video",
            "desc": "Tecniche di montaggio professionale",
            "icon": <VideoCameraIcon size={20} />,
            "prompt": "Come creare un intro accattivante per YouTube?",
            "color": "#26c6da"
        },
        {
            "title": "Commedia",
            "desc": "Racconti e battute intelligenti",
            "icon": <LaughIcon size={20} />,
            "prompt": "Quali sono le battute divertenti per un karaoke?",
            "color": "#bbcddc"
        },
        {
            "title": "Cultura Pop",
            "desc": "Tendenze e meme attuali",
            "icon": <StarsIcon size={20} />,
            "prompt": "Quali sono i meme virali di TikTok 2023?",
            "color": "#ff5733"
        },
        {
            "title": "Attività Outdoor",
            "desc": "Avventure nella natura",
            "icon": <TentIcon size={20} />,
            "prompt": "Migliori escursioni in Italia per famiglie",
            "color": "#9cccdc"
        },
        {
            "title": "Architettura",
            "desc": "Stili e progetti urbani",
            "icon": <HouseIcon size={20} />,
            "prompt": "Come riconoscere l'arte deco",
            "color": "#ff9e80"
        },
        {
            "title": "Intelligenza Artificiale",
            "desc": "Applicazioni e spiegazioni tecniche",
            "icon": <OpenAiLogoIcon size={20} />,
            "prompt": "Come funziona l'apprendimento automatico?",
            "color": "#3042f8"
        },
        {
            "title": "Pet Care",
            "desc": "Consigli per gli amici a quattro zampe",
            "icon": <DogIcon size={20} />,
            "prompt": "Quali sono i migliori accessori per un cagnicello?",
            "color": "#ff9e80"
        },
        {
            "title": "Storia",
            "desc": "Eventi e curiosità storiche",
            "icon": <HistoryIcon size={20} />,
            "prompt": "Eventi storici più influenti del XX secolo",
            "color": "#e76f51"
        }
    ]

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
        card: `flex flex-col text-left p-4 border rounded-xl transition-all group ${isDark
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