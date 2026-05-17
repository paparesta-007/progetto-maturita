# 09 - Strumenti di Apprendimento: Mindmap, Quiz, Flashcard e Diagrammi

Questo capitolo esplora la dimensione educativa di SmartAI, analizzando come l'architettura del sistema supporti metodi pedagogici moderni come l'**Apprendimento Costruttivista**. In questa visione, l'utente non è un fruitore passivo di contenuti, ma un partecipante attivo che costruisce la propria conoscenza interagendo con strumenti dinamici. SmartAI facilita questo processo riducendo il carico cognitivo e stimolando il pensiero critico.

---

## 9.1 Mappe Mentali e Strutturazione della Conoscenza

Secondo la teoria della doppia codifica di Paivio, l'informazione viene elaborata e memorizzata meglio quando è presentata contemporaneamente in formato verbale e visuale. Le mappe mentali sono il pilastro della visualizzazione concettuale in SmartAI: a differenza di una lettura lineare, permettono di cogliere immediatamente le relazioni gerarchiche e spaziali tra i concetti.

```mermaid
sequenceDiagram
    participant U as Utente
    participant C as Client (React)
    participant S as Server (Node.js)
    participant AI as LLM Engine
    participant DB as Vector DB (RAG)

    U->>C: "Crea una mappa concettuale"
    C->>S: Invio prompt e parametri
    S->>DB: Ricerca documenti correlati
    DB-->>S: Restituzione contesto (Chunks)
    S->>AI: Prompt: genera JSON gerarchico
    AI-->>S: JSON (nodi e relazioni)
    S-->>C: Payload strutturato
    C->>C: Rendering canvas (React Flow)
    C-->>U: Mappa interattiva visualizzata
    U->>C: Click su un nodo
    C-->>U: Animazione ed espansione dei sotto-nodi
```

---

## 9.2 Quiz Interattivi e Valutazione Formativa

Il modulo Quiz implementa la **Valutazione Formativa**: una valutazione continua che avviene durante il processo di apprendimento, pensata per identificare lacune in tempo reale, non per assegnare un voto finale.

### Tipologie di Domande e Feedback Adattivo

L'IA genera domande di tre tipologie:

- **Scelta Multipla**: per testare il riconoscimento di fatti e definizioni.
- **Vero/Falso**: per verificare la comprensione di concetti fondamentali.
- **Domande di Ragionamento**: in cui l'utente deve collegare due concetti tra loro.

Il feedback non si limita a "Corretto" o "Errato". SmartAI genera una **spiegazione contestuale** che chiarisce il perché una risposta sia sbagliata, citando direttamente i documenti caricati dall'utente tramite il sistema RAG.

```mermaid
sequenceDiagram
    participant U as Utente
    participant QM as Quiz Manager
    participant AI as AI Generator
    participant RAG as RAG System

    U->>QM: Inizio nuovo quiz
    QM->>RAG: Estrazione concetti chiave
    RAG-->>QM: Lista argomenti
    QM->>AI: Genera 5 domande + spiegazioni
    AI-->>QM: Quiz in formato JSON
    loop Per ogni domanda
        QM->>U: Mostra domanda
        U->>QM: Selezione risposta
        QM->>QM: Validazione interna
        alt Risposta corretta
            QM-->>U: Feedback positivo + punteggio
        else Risposta errata
            QM-->>U: Spiegazione dettagliata dell'errore
        end
    end
    QM->>U: Report finale e statistiche
```

---

## 9.3 Flashcard e Ripetizione Spaziata (SRS)

Le Flashcard di SmartAI si basano sul **Sistema Leitner**, una tecnica di studio che ottimizza il tempo di ripasso concentrandosi sui concetti più difficili da ricordare.

### Integrazione Algoritmica

Ogni interazione con una flashcard aggiorna i metadati della carta nel database:

- **Ease Factor**: Un moltiplicatore che determina l'intervallo di tempo prima del prossimo ripasso.
- **Interval**: Il numero di giorni tra una sessione di ripasso e la successiva.

```mermaid
sequenceDiagram
    participant U as Utente
    participant UI as Dashboard Studio
    participant SRS as SRS Engine
    participant DB as Supabase DB

    U->>UI: Apertura sessione Flashcard
    UI->>SRS: Richiesta carte in scadenza
    SRS->>DB: Query: cards.due_date <= today
    DB-->>SRS: Lista carte da ripassare
    SRS-->>UI: Deck filtrato
    loop Studio
        UI->>U: Mostra fronte della carta
        U->>UI: Click "Mostra risposta"
        UI-->>U: Mostra retro della carta
        U->>UI: Valutazione (Facile / Media / Difficile)
        UI->>SRS: Aggiornamento metadati difficoltà
        SRS->>DB: Update last_review e interval
    end
    UI-->>U: Sessione completata
```

---

## 9.4 Generazione e Rendering di Diagrammi UML

In ambito tecnico, saper visualizzare strutture logiche è essenziale. SmartAI funge da **traduttore semantico-grafico**: l'utente descrive un sistema in linguaggio naturale e il modello genera il diagramma corrispondente in sintassi Mermaid.js — diagrammi di classe, di flusso o di sequenza — con rendering in tempo reale.

```mermaid
sequenceDiagram
    participant U as Utente
    participant AI as AI Architect
    participant V as Syntax Validator
    participant R as Mermaid Renderer

    U->>AI: "Disegna il flusso di login OAuth2"
    AI->>AI: Generazione codice Mermaid
    AI->>V: Controllo errori sintattici
    alt Errore rilevato
        V-->>AI: Segnalazione errore
        AI->>AI: Auto-correzione
    end
    V-->>R: Codice validato
    R->>R: Rendering SVG
    R-->>U: Diagramma finale visualizzato
    U->>AI: "Aggiungi il passaggio di log"
    AI-->>U: Diagramma aggiornato
```

---

## 9.5 Impatto Didattico

L'integrazione di questi strumenti trasforma il rapporto tra studente e intelligenza artificiale. Non si tratta più di chiedere la risposta, ma di usare l'IA per costruire impalcature cognitive (**scaffolding**): strutture di supporto che rendono accessibili anche gli argomenti più complessi.

I vantaggi principali dell'approccio multimodale adottato sono:

1. **Personalizzazione Massima**: Tutti gli esercizi sono generati a partire dai propri appunti e documenti.
2. **Riduzione dell'Ansia da Studio**: Suddividere argomenti complessi in mappe e schemi rende il lavoro più gestibile e meno intimidatorio.
3. **Versatilità**: Gli strumenti si adattano a qualsiasi materia, dalla storia alla programmazione.

SmartAI si posiziona così non come un semplice generatore di risposte, ma come un catalizzatore tecnologico che rende accessibili metodi di apprendimento scientificamente fondati.