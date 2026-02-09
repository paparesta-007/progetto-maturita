import { useAuth } from "../context/AuthContext";
import { MessageSquare, Lightbulb, PenTool, Code2 } from "lucide-react"; // Esempio con Lucide-React
import { useChat } from "../context/ChatContext";

const PromptStarter = ({  }) => {
    const {setInputValue}=useChat()
    const getGreeting = () => {
        const hours = new Date().getHours();
        
        let message = "";
        if (hours < 12) message = "Buongiorno";
        else if (hours < 18) message = "Buon pomeriggio";
        else message = "Buonasera";

        return `${message}!`;
    };

    const suggestions = [
        {
            title: "Analisi approfondita",
            desc: "Analizza questo documento e riassumi i punti chiave.",
            icon: <MessageSquare className="w-5 h-5" color="#3ad333" />,
            prompt: "Aiutami a pianificare la mia giornata lavorativa."
        },
        {
            title: "Scrivi un'email",
            desc: "Redigi una risposta professionale e concisa.",
            icon: <PenTool className="w-5 h-5" color="black" />,
            prompt: "Scrivi un'email professionale per declinare un invito."
        },
        {
            title: "Spiega codice",
            desc: "Analizza uno snippet di codice complesso.",
            icon: <Code2 className="w-5 h-5" color="#d333d0" />,
            prompt: "Spiegami come funziona questo blocco di codice: "
        },
        {
            title: "Idee Creative",
            desc: "Genera concept per un nuovo progetto.",
            icon: <Lightbulb className="w-5 h-5" color="#dfd746" />,
            prompt: "Dammi 5 idee creative per un post su Instagram."
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center max-w-4xl mx-auto h-full px-4 text-center">
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    {getGreeting()}
                </h1>
                <p className="text-neutral-500">
                    Scegli un suggerimento o scrivi un messaggio per iniziare.
                </p>
            </header>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {suggestions.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => setInputValue(item.prompt)}
                        className="flex flex-col text-left p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all group"
                    >
                        <div className="text-neutral-400 group-hover:text-neutral-900 transition-colors mb-2">
                            {item.icon}
                        </div>
                        <h3 className="font-semibold text-neutral-900">
                            {item.title}
                        </h3>
                        <p className="text-sm text-neutral-500">
                            {item.desc}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PromptStarter;