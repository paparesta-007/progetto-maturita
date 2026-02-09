
import Textbar from "../components/Textbar";
import { ChatProvider, useChat } from "../context/ChatContext";
import BotMessage from "../components/other/BotMessage";
import UserMessage from "../components/other/UserMessage";
import { convertLatexInMarkdown } from "../library/latextToMarkdown";
import { marked } from "marked";
import  DOMPurify  from "dompurify";
import BotLoading from "../components/other/BotLoading";
import PromptStarter from "../components/PromptStarter";
// 1. Crea un componente "interno" che gestisce l'UI
// Questo componente sarà FIGLIO del Provider, quindi può usare useChat
const ChatContent = () => {
    const { inputValue, clearInput, messageHistory,loading } = useChat();
    const lorem = 'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.'

    const MarkdownRenderer = ({ text }: { text: string }) => {
        const safe = text || "";
        const withLatex = convertLatexInMarkdown(safe);
        const rawHtml = marked.parse(withLatex) as string;
        // SANITIZZAZIONE
        const cleanHtml = DOMPurify.sanitize(rawHtml);

        return (
            <div
                className="renderChat"
                dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
        );
    };
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">

            {messageHistory.length !== 0 ? (
            <main className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Chat</h1>
                    <div className="space-y-4">
                        {messageHistory.map((msg, index) => {
                            if (msg.role === 'user') {
                                return <UserMessage key={index} i={index} htmlContent={msg.content}></UserMessage>;
                            } else {
                                return <BotMessage key={index} i={index} usage={msg.usage}><MarkdownRenderer text={msg.content} /></BotMessage>;
                            }
                        })}
                        {loading && (
                            <BotLoading />
                        )}
                    </div>
                </div>

            </main>) : (
                <PromptStarter />
            )}

            {/* FOOTER / TEXTBAR */}
            <footer className="flex-shrink-0 w-full bg-white pt-0 px-4 pb-4">
                {/* Contenitore centrato con larghezza massima */}
                <div className="max-w-3xl mx-auto mt-4 flex justify-center">
                    <div className="w-full flex items-center justify-center"> {/* Forza il componente a usare lo spazio del max-w-3xl */}
                        <Textbar />
                    </div>
                </div>

                <p className="text-center text-[10px] text-neutral-400 mt-2">
                    IA can make mistakes. Please verify the information provided.
                </p>
            </footer>
        </div>
    );
};

// 2. Il componente principale esportato serve SOLO a fornire il contesto
const ChatPage = () => {
    return (
        <ChatProvider>
            <ChatContent />
        </ChatProvider>
    );
};

export default ChatPage;