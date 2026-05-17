# 01 - Introduzione

**SmartAI** è una piattaforma pensata per semplificare il lavoro con informazioni, documenti e strumenti digitali. In questo capitolo vengono presentati il contesto in cui nasce il progetto, i suoi obiettivi e le tecnologie usate per realizzarlo.

---

## 1.1 Contesto tecnologico

Negli ultimi anni, l’intelligenza artificiale sta passando dai semplici chatbot a sistemi più completi, capaci non solo di rispondere, ma anche di eseguire azioni e supportare l’utente in modo più attivo.

Tre tendenze hanno influenzato lo sviluppo di SmartAI:

1. **Generative UI**
   
   Le interfacce non restano fisse, ma possono cambiare in base al tipo di contenuto richiesto, mostrando tabelle, grafici o diagrammi quando serve.

2. **Multi-Model Orchestration**
   
   Non si usa un solo modello AI, ma più modelli diversi scelti in base al compito da svolgere, così da bilanciare qualità, velocità e costi.

3. **Integrazione con gli strumenti dell’utente**
   
   L’AI può interagire con calendario, documenti e preferenze personali, diventando un supporto concreto nelle attività quotidiane.

> [!NOTE]
> **Evoluzione del RAG**: oggi la ricerca nei documenti non si basa solo sulle parole chiave, ma anche sulla ricerca semantica, che permette di trovare informazioni più pertinenti.

---

## 1.2 Obiettivi di SmartAI

SmartAI nasce con l’obiettivo di unire queste funzioni in un’unica piattaforma semplice da usare e personalizzabile.

Gli obiettivi principali sono:

- **Ridurre i tempi di lavoro** nella lettura dei documenti e nella gestione delle attività.
- **Adattare l’interfaccia** al tipo di contenuto richiesto, mostrando il formato più utile.
- **Supportare lo studio**, ad esempio con quiz automatici e mappe concettuali create a partire dai documenti.

---

## 1.3 I tre pilastri del progetto

Il progetto si basa su tre elementi principali:

| Pilastro | Descrizione | Risultato |
| :--- | :--- | :--- |
| **Generative UI** | Trasforma l’output dell’AI in componenti visivi interattivi. | Interfaccia più chiara e dinamica. |
| **Didactic Engine** |Mappe concettuali, Schemi, Quiz, Flashcards, Riassunti | Strumenti di studio avanzati. |
| **RAG evoluto** | Analizza PDF e documenti con ricerca semantica. | Risposte più precise e legate ai contenuti reali. |

---

## 1.4 Stack tecnologico

Per costruire SmartAI sono state usate tecnologie moderne, scelte per garantire velocità, stabilità e facilità di manutenzione.

### Frontend e interfaccia
- **React 19**: usato per creare l’interfaccia utente.
- **Vite**: serve per uno sviluppo rapido e fluido.
- **CSS moderno**: usato per definire uno stile personalizzato e ordinato.

### Backend e gestione delle richieste
- **Express 5 (Node.js)**: gestisce le API e il flusso dei dati tra client e server.
- **OpenRouter**: permette di usare diversi modelli AI tramite una sola interfaccia.

### Dati e infrastruttura
- **Supabase**: usato per:
  - autenticazione degli utenti,
  - salvataggio dei dati,
  - gestione delle conversazioni,
  - supporto alla ricerca semantica tramite `pgvector`.
