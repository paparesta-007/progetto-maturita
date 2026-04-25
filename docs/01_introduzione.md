# 01 - Introduzione

Benvenuti nel progetto **Smart AI**, un ecosistema avanzato progettato per ridefinire il modo in cui interagiamo con l'informazione e gli strumenti digitali. Questo capitolo delinea il contesto tecnologico in cui nasce la piattaforma, gli obiettivi prefissati e le tecnologie che ne costituiscono le fondamenta.

---

## Il Contesto Tecnologico (2025-2026)

Il biennio 2025-2026 segna una transizione fondamentale nella storia dell'informatica: il passaggio dai semplici chatbot ai **Sistemi Agentici**. Non siamo più di fronte a strumenti che si limitano a rispondere a domande, ma a entità capaci di pianificare, ragionare e agire in modo semi-autonomo.

In questo scenario, tre tendenze chiave hanno guidato lo sviluppo di **Smart AI**:

> [!NOTE]
> **L'Evoluzione del RAG**: La ricerca vettoriale semplice è stata superata da sistemi di "Hybrid Retrieval" che combinano grafi di conoscenza e database vettoriali per una precisione semantica senza precedenti.

1.  **Generative UI (GenUI)**: Le interfacce statiche sono un ricordo del passato. Oggi l'interfaccia si adatta in tempo reale all'intento dell'utente, generando componenti visuali (grafici, tabelle, mappe concettuali) dinamici.
2.  **Multi-Model Orchestration**: La dipendenza da un singolo modello (LLM) è terminata. Le applicazioni moderne orchestrano decine di modelli specializzati, scegliendo il migliore per ogni micro-task in termini di costo e performance.
3.  **Integrazione Agente-Utente**: L'AI non è più un'appendice, ma un collaboratore integrato che ha accesso al calendario, ai documenti e alle preferenze dell'utente, agendo come un vero e proprio "copilota" della produttività.

---

## Visione e Obiettivi di Smart AI

Il progetto **Smart AI** nasce con la missione di centralizzare queste innovazioni in un'unica piattaforma coerente, accessibile e altamente personalizzabile. Gli obiettivi principali sono:

-   **Efficienza Operativa**: Ridurre il tempo necessario per l'analisi documentale e la gestione dei task quotidiani (es. calendari e scadenze).
-   **Personalizzazione Dinamica**: Creare un'esperienza utente che non sia solo "responsive" ma "generativa", visualizzando le informazioni nel formato più utile al momento (testo, codice, diagrammi).
-   **Apprendimento Potenziato**: Fornire strumenti per lo studio assistito, come la generazione automatica di quiz e mappe concettuali a partire da documenti complessi.

---

## I Pilastri dell'Innovazione

Il successo di Smart AI si basa su tre pilastri tecnologici fondamentali, descritti dettagliatamente nei capitoli successivi:

| Pilastro | Descrizione | Impatto |
| :--- | :--- | :--- |
| **Generative UI** | Parser intelligente che trasforma l'output dell'AI in componenti React interattivi. | Esperienza utente immersiva e visuale. |
| **Multi-Model** | Integrazione con OpenRouter per l'accesso a GPT-4, Claude 3.5, Gemini 1.5 e modelli Open Source. | Ottimizzazione dei costi e delle capacità di ragionamento. |
| **RAG Evoluto** | Pipeline di analisi PDF con database vettoriale per la ricerca semantica locale. | Risposte basate su fatti reali e documenti personali. |

---

## Lo Stack Tecnologico

Per supportare queste ambizioni, è stata selezionata una suite di tecnologie all'avanguardia che garantisce scalabilità, velocità e manutenibilità.

### Frontend & UI
*   **React 19**: L'ultima evoluzione della libreria di Meta, scelta per la gestione ottimizzata del rendering e dei componenti server-side.
*   **Vite**: Tool di build ultra-veloce per garantire un ciclo di sviluppo fluido.
*   **CSS Moderno**: Uso di variabili CSS e design system personalizzati per un'estetica premium.

### Backend & Orchestrazione
*   **Express 5 (Node.js)**: Middleware robusto per la gestione delle API e del flusso streaming NDJSON verso il client.
*   **OpenRouter**: Gateway universale che ci permette di dialogare con oltre 100 modelli di linguaggio tramite un'unica interfaccia.

### Infrastruttura & Dati
*   **Supabase**: Una piattaforma BaaS (Backend as a Service) basata su PostgreSQL, fondamentale per:
    *   **Autenticazione**: Gestione sicura delle sessioni utente.
    *   **Vector Store**: Memorizzazione degli embeddings per la ricerca semantica (pgvector).
    *   **Database**: Persistenza delle conversazioni e dei metadati.

---

## Struttura dell'Elaborato

Questa documentazione esplorerà ogni aspetto del progetto, dall'architettura software alla gestione della sicurezza, fino all'analisi delle performance e dei costi. Ogni capitolo è progettato per mostrare come la teoria dell'intelligenza artificiale si traduca in codice pratico e soluzioni reali.

> [!TIP]
> Per una visione d'insieme dei moduli, consultare il capitolo **[00 - Indice della Tesina](00_indice_tesina.md)**.
