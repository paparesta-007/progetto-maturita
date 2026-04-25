# 00 - Indice della Tesina

Questo documento delinea la struttura completa della tesina per il progetto **Smart AI**, una piattaforma avanzata che integra intelligenza artificiale generativa, analisi documentale semantica (RAG) e interfacce utente dinamiche.

---

## Struttura dell'Elaborato

1.  **[Capitolo 1: Introduzione](01_introduzione.md)** (2 pp)
    *   Contesto tecnologico AI 2025-26.
    *   Obiettivi del progetto Smart AI.
    *   Stack tecnologico: React 19, Express 5, Supabase, OpenRouter.
2.  **[Capitolo 2: Architettura Generale](02_architettura_generale.md)** (2 pp)
    *   Struttura Monorepo e gestione dei processi simultanei.
    *   Flusso dati: Client ↔ Middleware ↔ Server ↔ Database/LLM.
    *   Gestione degli errori e logging centralizzato.
3.  **[Capitolo 3: Autenticazione e Sicurezza](03_autenticazione.md)** (2 pp)
    *   Integrazione Supabase Auth e sessioni JWT.
    *   Gestione token OAuth per servizi terzi (Google Calendar).
    *   Middleware di protezione delle rotte server.
4.  **[Capitolo 4: Chat e Interazione con LLM](04_chat_multi_modello.md)** (3 pp)
    *   Motore di prompt di sistema dinamico.
    *   Streaming NDJSON delle risposte e gestione della latenza.
    *   Integrazione multi-modello tramite OpenRouter.
5.  **[Capitolo 5: Gestione della Persistenza](05_gestione_conversazioni.md)** (1.5 pp)
    *   Ciclo di vita delle conversazioni e dei messaggi.
    *   Generazione automatica dei titoli e suggerimenti intelligenti.
6.  **[Capitolo 6: RAG - Retrieval Augmented Generation](06_rag_vector_search.md)** (3 pp)
    *   Pipeline di analisi e chunking dei documenti PDF.
    *   Database Vettoriale e Ricerca Semantica (Cosine Similarity).
    *   Integrazione del contesto nelle risposte del modello.
7.  **[Capitolo 7: Generative UI](07_generative_ui.md)** (2 pp)
    *   Parser per componenti UI strutturati.
    *   Sistema Dynamic Canvas e Sandbox per visualizzazioni interattive.
8.  **[Capitolo 8: Integrazione Calendario](08_calendario.md)** (1.5 pp)
    *   Interazione con Google Calendar API tramite Function Calling.
    *   Visualizzazione settimanale e assistente floating.
9.  **[Capitolo 9: Strumenti di Apprendimento: Mindmap](09_schema_mindmap.md)** (1.5 pp)
    *   Generazione e manipolazione di mappature concettuali ricorsive.
10. **[Capitolo 10: Strumenti di Apprendimento: Quiz](10_quiz_generator.md)** (1 pp)
    *   Generazione di test di autovalutazione tramite JSON Schema.
11. **[Capitolo 11: Supporto e Manutenibilità](11_support_logging_altro.md)** (1 pp)
    *   Sistema di ticketing e audit logs integrati.
12. **[Capitolo 12: Infrastruttura e Database](12_infrastruttura_deploy.md)** (1.5 pp)
    *   Schema del database Supabase e configurazione ambienti.
13. **[Capitolo 13: Analisi delle Performance](13_metriche_performance.md)** (1 pp)
    *   Benchmark di latenza, throughput e costi dei token.
14. **[Capitolo 14: Conclusioni e Sviluppi Futuri](14_conclusioni.md)** (1 pp)
    *   Riflessioni finali e roadmap evolutiva.

---

![Diagramma Architetturale Placeholder](https://placehold.co/600x400?text=Architettura+Generale+Smart+AI)
