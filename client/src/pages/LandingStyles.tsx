import {
  MessageSquare, FileText, Zap, BookOpen, Shield,
  PanelTopOpen, Layers3, FileSearch,
} from 'lucide-react';

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const slideIn = {
  hidden: { opacity: 0, x: -20 },
  show: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function LandingStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');

      html {
        scroll-behavior: smooth;
      }
      
      .landing-page {
        --cream: #fcfbf9;
        --cream2: #f9f8f6;
        --warm-border: #e5e5e5;
        --warm-text: #171717;
        --warm-muted: #737373;
        --warm-accent: #b08968;
        --accent-light: #dbc1ac;
      }

      .landing-page {
        background: var(--cream);
        color: var(--warm-text);
        font-family: 'Inter', sans-serif;
      }

      .landing-page h1, .landing-page h2, .landing-page h3 {
        font-family: 'Instrument Serif', serif;
      }

      .warm-card {
        background: white;
        border: 1px solid var(--warm-border);
        border-radius: 1rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        transition: all 0.3s ease;
      }
      .warm-card:hover {
        box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        transform: translateY(-2px);
      }

      .warm-glass {
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--warm-border);
      }

      .warm-chip {
        background: var(--cream2);
        color: var(--warm-text);
        border: 1px solid var(--warm-border);
      }

      .serif-accent {
        font-family: 'Instrument Serif', serif;
        font-style: italic;
      }

      .warm-section-label {
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--warm-muted);
      }

      .warm-btn-primary {
        background: var(--warm-text);
        color: white;
        border-radius: 0.5rem;
        padding: 0.875rem 1.75rem;
        font-size: 0.95rem;
        font-weight: 500;
        transition: all 0.2s ease;
        border: none;
      }
      .warm-btn-primary:hover {
        background: #000000;
        transform: translateY(-1px);
      }

      .warm-btn-ghost {
        background: transparent;
        border-radius: 0.5rem;
        padding: 0.875rem 1.75rem;
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--warm-text);
        transition: all 0.2s ease;
      }
      .warm-btn-ghost:hover {
        background: var(--cream2);
      }

      .bg-grid-pattern {
        background-image: radial-gradient(var(--warm-border) 1px, transparent 1px);
        background-size: 40px 40px;
      }

      .editorial-shadow {
        box-shadow: 0 4px 24px -4px rgba(0,0,0,0.02), 0 12px 32px -8px rgba(0,0,0,0.04);
      }

      .floating-element {
        animation: floating 6s ease-in-out infinite;
      }

      @keyframes floating {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .landing-page ::selection {
        background: rgba(176,137,104,0.15);
        color: var(--warm-text);
      }
    `}</style>
  );
}

export const featureDeck = [
  { icon: MessageSquare, title: 'Chat multi-modello', text: 'Un hub unico per passare tra modelli diversi senza rompere il contesto.' },
  { icon: FileText, title: 'PDF intelligence', text: 'Caricamento documenti, ricerca semantica e risposte ancorate al contenuto.' },
  { icon: Zap, title: 'Streaming immediato', text: 'Risposte token-by-token per dare la sensazione di sistema vivo.' },
  { icon: BookOpen, title: 'Output strutturati', text: 'Flashcard, quiz e sintesi generate con schemi coerenti e leggibili.' },
  { icon: Shield, title: 'Accesso protetto', text: 'Autenticazione sicura e route riservate per mantenere ordine e controllo.' },
];

export const modelCaps = [
  { name: 'GPT-4o', provider: 'OpenAI' },
  { name: 'Claude 3.5', provider: 'Anthropic' },
  { name: 'Llama 3', provider: 'Meta' },
  { name: 'DeepSeek', provider: 'DeepSeek' },
  { name: 'Gemini', provider: 'Google' },
  { name: 'Grok', provider: 'xAI' },
];

export const workflow = [
  { step: '01', title: 'Carica', description: 'Carica un PDF o apri una conversazione con il modello preferito.', icon: PanelTopOpen },
  { step: '02', title: 'Analizza', description: 'Il sistema estrae passaggi rilevanti e li inserisce nel contesto.', icon: FileSearch },
  { step: '03', title: 'Trasforma', description: 'Trasforma le idee in schede, quiz e materiali pronti per lo studio.', icon: Layers3 },
];

export const faqs = [
  { q: 'Serve un modello specifico?', a: "No. L'interfaccia è pensata per orchestrare più provider in modo uniforme." },
  { q: 'I PDF sono davvero centrali?', a: 'Sì, il progetto ruota attorno alla lettura e al riuso del contenuto documentale.' },
  { q: 'Posso tenere la UI leggera?', a: 'Sì: il layout è modulare e puoi rimuovere o sostituire blocchi senza rompere il resto.' },
  { q: "È pensata per un landing page o dashboard?", a: 'Funziona come landing, ma il linguaggio visivo richiama un prodotto operativo reale.' },
];
