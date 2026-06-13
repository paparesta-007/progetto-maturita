# BetterView UI - Prompt di Test Dinamici

Questo documento contiene una raccolta di prompt di test dinamici in lingua italiana per testare l'engine di rendering **BetterView** (Generative UI) dell'applicazione. Tutti i prompt sono progettati per attivare visualizzazioni HTML, CSS e logiche JS interattive all'interno del sandbox iframe.

---

### 1. Pianificatore Interattivo di Interesse Composto (Finanza)
*   **Obiettivo**: Testare calcoli matematici in tempo reale che aggiornano un canvas Chart.js.
*   **Prompt**:
    ```text
    Crea un pianificatore finanziario interattivo per il calcolo dell'interesse composto. Includi slider per impostare: Capitale Iniziale (0-100k€), Contributo Mensile (0-2k€), Rendimento Annuo Stimato (1-15%) e Orizzonte Temporale (1-40 anni). Mostra un grafico ad area di Chart.js che mostra la crescita del capitale divisa tra contributi versati e interessi accumulati, aggiornandolo in tempo reale al movimento degli slider.
    ```

---

### 2. Simulatore Fisico di Gravità e Rimbalzo (Fisica)
*   **Obiettivo**: Testare loop di animazione Canvas HTML5 (`requestAnimationFrame`), eventi mouse click e fisica gravitazionale.
*   **Prompt**:
    ```text
    Crea un simulatore fisico interattivo bidimensionale in HTML5 Canvas. Aggiungi slider per regolare la Gravità, il Rimbalzo (restituzione) e il Vento. L'utente deve poter cliccare sull'area del Canvas per generare delle palline colorate che cadono e rimbalzano contro i bordi del box seguendo i parametri impostati. Includi un pulsante per resettare la simulazione.
    ```

---

### 3. Quiz Letterario Interattivo (Gamification)
*   **Obiettivo**: Testare transizioni di stato (domande successive, punteggio corrente, timer di scadenza).
*   **Prompt**:
    ```text
    Crea un quiz interattivo a risposta multipla su Dante Alighieri e la Divina Commedia (5 domande). Mostra una barra di avanzamento, un feedback visivo immediato (verde/rosso) alla selezione della risposta, un piccolo timer da 15 secondi per domanda, ed un pannello dei risultati finale con il punteggio in percentuale e un riepilogo grafico delle risposte esatte.
    ```

---

### 4. Playground Visuale CSS Flexbox (Design)
*   **Obiettivo**: Testare aggiornamenti diretti del DOM e modifiche delle proprietà flex di allineamento.
*   **Prompt**:
    ```text
    Crea una guida interattiva per visualizzare le proprietà di CSS Flexbox. Includi controlli (pulsanti o dropdown) per cambiare: flex-direction, justify-content, align-items e gap. Sotto i controlli, mostra un contenitore flessibile con 4 box numerati colorati che si riposizionano istantaneamente in base alle proprietà selezionate, spiegando brevemente l'effetto pratico di ogni valore scelto.
    ```

---

### 5. Generatore di Password e Valutatore di Entropia (Utility)
*   **Obiettivo**: Testare input testuali, calcoli logici sulle stringhe e copia negli appunti.
*   **Prompt**:
    ```text
    Crea un generatore di password interattivo con annesso valutatore di sicurezza. Includi slider per la lunghezza (8-32 caratteri), checkbox per includere Maiuscole, Numeri e Simboli, e un box di input in cui l'utente può anche digitare una password personalizzata. Mostra in tempo reale la forza stimata (debole/media/forte) tramite una barra colorata, i bit di entropia calcolati e un pulsante copia-negli-appunti.
    ```

---

### 6. Dashboard e Mappa Meteo Interattiva (Dati/SVG)
*   **Obiettivo**: Testare nodi SVG interattivi e sincronizzazione dello stato con pannelli laterali e grafici.
*   **Prompt**:
    ```text
    Disegna una mappa interattiva stilizzata (in SVG o layout a griglia) delle principali città italiane (Milano, Roma, Napoli, Palermo, Cagliari). Cliccando su una città, mostra una scheda meteo dettagliata sul lato destro con la temperatura attuale, vento, umidità, e un grafico Chart.js con le previsioni orarie delle successive 12 ore.
    ```

---

### 7. Sintetizzatore Audio Virtuale (Web Audio API)
*   **Obiettivo**: Testare l'utilizzo di API multimediali del browser (AudioContext) e oscillatori.
*   **Prompt**:
    ```text
    Crea una tastiera musicale/sintetizzatore virtuale interattivo a 8 tasti (un'ottava). Consenti di selezionare il tipo di onda dell'oscillatore (Sine, Square, Triangle, Sawtooth) tramite pulsanti, regolare il volume con uno slider, e suonare le note cliccando sui tasti grafici del pianoforte. Includi una piccola animazione Canvas che mostra una visualizzazione elementare delle onde sonore quando si preme un tasto.
    ```

---

### 8. Live Previewer e Editor Markdown (Utility)
*   **Obiettivo**: Testare la compilazione real-time di stringhe in layout split-pane.
*   **Prompt**:
    ```text
    Crea un editor Markdown interattivo in tempo reale con layout diviso in due pannelli. A sinistra una textarea dove scrivere codice markdown (supportando intestazioni, elenchi puntati, tabelle e grassetti), a destra un'anteprima HTML renderizzata all'istante durante la digitazione. Aggiungi un pulsante per caricare un testo di esempio predefinito.
    ```

---

### 9. Scalatore Dinamico di Porzioni Alimentari (Utility)
*   **Obiettiv o**: Testare moltiplicazioni aritmetiche su variabili di stato e interazione con checklist.
*   **Prompt**:
    ```text
    Crea una scheda ricetta interattiva per il Tiramisù o le Lasagne. Aggiungi un selettore numerico (+/-) o uno slider per indicare le porzioni (da 1 a 20 persone). Moltiplica dinamicamente le dosi di tutti gli ingredienti in tempo reale. Includi una lista di controllo degli ingredienti interattiva dove l'utente può sbarrare le voci comprate/utilizzate con un'animazione.
    ```

---

### 10. Tester di Contrasto Colore HSL (Accessibilità)
*   **Obiettivo**: Testare formule matematiche di accessibilità WCAG 2.1 (rapporto di contrasto colore).
*   **Prompt**:
    ```text
    Crea uno strumento interattivo per la verifica del contrasto colore HSL. Inserisci slider per regolare Hue, Saturation e Lightness del colore di sfondo. Calcola e mostra dinamicamente il rapporto di contrasto (contrast ratio) rispetto al testo nero ed al testo bianco secondo gli standard WCAG 2.1 (indicando se supera le soglie AA o AAA). Mostra un'anteprima visiva del testo sullo sfondo selezionato.
    ```

---

### 11. Macchina Cifrante Enigma (Crittografia)
*   **Obiettivo**: Testare cifratura su caratteri, slider chiave e logiche di codifica in tempo reale.
*   **Prompt**:
    ```text
    Crea una macchina cifrante interattiva (Cifrario di Cesare e Cifrario Atbash). Includi una textarea per il testo in chiaro, uno slider per selezionare la chiave di spostamento (da 1 a 25 per Cesare), pulsanti radio per selezionare l'algoritmo, e una textarea disabilitata per mostrare il testo cifrato aggiornato in tempo reale. Mostra una griglia visiva dell'alfabeto traslato in base alla chiave inserita.
    ```

---

### 12. Mappa Concettuale con Albero D3.js (Grafica/Librerie)
*   **Obiettivo**: Testare il caricamento asincrono di D3 da CDN e mutazione dinamica di nodi SVG.
*   **Prompt**:
    ```text
    Crea una mappa concettuale interattiva delle tecnologie web (Frontend, Backend, Database) usando D3.js. L'utente deve poter cliccare sui nodi principali per espandere o contrarre i sotto-nodi (es. cliccando su Frontend appaiono HTML, CSS, JS) con transizioni fluide, e poter inserire un nuovo sotto-nodo personalizzato tramite un campo di input e un pulsante.
    ```
