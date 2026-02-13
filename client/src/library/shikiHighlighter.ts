// library/shikiHighlighter.ts
import { createHighlighter, type Highlighter } from 'shiki';

let highlighterInstance: Highlighter | null = null;

// library/shikiHighlighter.ts
export const getHighlighter = async () => {
    if (highlighterInstance) return highlighterInstance;

    highlighterInstance = await createHighlighter({
        // Aggiungi qui tutti i temi che vuoi rendere disponibili
        themes: ['vitesse-dark', 'github-light', 'monokai'], 
        langs: ['javascript', 'typescript', 'python','tsx', 'jsx', 'python', 'html', 'css', 'json', 'bash', 'java', 'csharp', 'cpp', 'ruby', 'go', 'rust', 'kotlin', 'swift', 'php', 'sql', 'yaml', 'markdown', 'dockerfile', 'powershell', 'graphql', 'lua', 'scala', 'perl', 'haskell', 'elixir', 'clojure', 'fsharp', 'erlang'], // Aggiungi qui tutte le lingue che vuoi supportare
    });

    return highlighterInstance;
};