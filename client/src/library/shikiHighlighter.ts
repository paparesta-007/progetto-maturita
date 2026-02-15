import { createHighlighter, type Highlighter } from 'shiki';

let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

export async function getHighlighter(): Promise<Highlighter> {
    if (highlighterInstance) return highlighterInstance;

    // Evita race condition: se due chiamate arrivano contemporaneamente,
    // entrambe riceveranno la stessa Promise
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: ['github-light', 'vitesse-dark'], // Assicurati di avere questi temi disponibili
            langs: [
                'javascript', 'typescript', 'python', 'bash', 'json', 'csharp', 'ruby', 'php', 'rust', 'kotlin', 'swift',
                'html', 'css', 'sql', 'text', 'java', 'c', 'cpp', 'go', 'ruby', 'php', 'rust', 'kotlin', 'swift',
                'markdown', 'yaml', 'dockerfile', 'powershell', 'graphql', 'lua', 'scala', 'perl', 'r', 'objective-c',
            ]
        }).then(h => {
            highlighterInstance = h;
            return h;
        });
    }

    return highlighterPromise;
}