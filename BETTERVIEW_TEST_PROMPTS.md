# BetterView UI - Prompt di Test Dinamici

Questo documento contiene una raccolta di prompt di test dinamici in lingua italiana per testare l'engine di rendering **BetterView** (Generative UI) dell'applicazione. Tutti i prompt sono progettati per attivare visualizzazioni HTML, CSS e logiche JS interattive all'interno del sandbox iframe, focalizzandosi sulla comprensione teorica unita alla simulazione pratica ("capire non fare").

---

### 1. Spiegazione e Simulatore di Interesse Composto (Finanza)
*   **Obiettivo**: Testare calcoli matematici in tempo reale che aggiornano un canvas Chart.js, preceduti da una spiegazione dei concetti.
*   **Prompt**:
    ```text
    Spiegami come funziona l'interesse composto con una descrizione dettagliata ed illustrativa dei concetti teorici (capitale iniziale, contributi mensili, rendimento, orizzonte temporale). Includi poi un pianificatore finanziario interattivo (mini-simulatore) con slider per impostare tali parametri e un grafico ad area Chart.js che mostri la crescita del capitale in tempo reale.
    ```

---

### 2. Spiegazione e Simulatore Fisico di Gravità e Rimbalzo (Fisica)
*   **Obiettivo**: Testare loop di animazione Canvas HTML5 (`requestAnimationFrame`), eventi mouse click e fisica gravitazionale guidati da nozioni teoriche.
*   **Prompt**:
    ```text
    Spiegami i concetti fisici di gravità, rimbalzo (restituzione) e vento/attrito dell'aria. Associa alla spiegazione teorica un simulatore fisico bidimensionale interattivo in HTML5 Canvas, dove l'utente può cliccare per generare palline colorate che risentono dei parametri impostati tramite gli slider in tempo reale.
    ```

---

### 3. Struttura della Divina Commedia e Quiz Letterario (Gamification)
*   **Obiettivo**: Testare la spiegazione schematica di un'opera letteraria e transizioni di stato di un quiz (domande successive, punteggio corrente, timer di scadenza).
*   **Prompt**:
    ```text
    Presenta una spiegazione interattiva su Dante Alighieri e la struttura della Divina Commedia, descrivendo l'Inferno, il Purgatorio e il Paradiso. Aggiungi poi un mini-quiz interattivo a risposta multipla (5 domande) con barra di avanzamento, feedback visivo immediato (verde/rosso), timer di 15 secondi per domanda e pannello riepilogativo dei risultati finale.
    ```

---

### 4. Spiegazione CSS Flexbox e Playground Visuale (Design)
*   **Obiettivo**: Spiegare le proprietà fondamentali di Flexbox e testare aggiornamenti diretti del DOM e modifiche delle proprietà flex.
*   **Prompt**:
    ```text
    Spiegami il funzionamento di CSS Flexbox, descrivendone i concetti cardine (asse principale, asse secondario, allineamento e distribuzione dello spazio). Integra una guida interattiva (playground) con controlli per modificare flex-direction, justify-content, align-items e gap, mostrando in tempo reale il comportamento di 4 box numerati con una spiegazione dell'effetto pratico di ogni valore.
    ```

---

### 5. Sicurezza delle Password ed Entropia Crittografica (Utility)
*   **Obiettivo**: Fornire una descrizione teorica dell'entropia e testare input testuali, calcoli logici sulle stringhe e copia negli appunti.
*   **Prompt**:
    ```text
    Spiegami come viene valutata la sicurezza di una password e cos'è l'entropia crittografica. Sotto la spiegazione concettuale, includi un mini-generatore interattivo con slider di lunghezza (8-32 caratteri), checkbox per Maiuscole, Numeri, Simboli e un valutatore di forza in tempo reale (barra colorata, bit di entropia e pulsante copia).
    ```

---

### 6. Analisi Climatica Italiana e Mappa Meteo Interattiva (Dati/SVG)
*   **Obiettivo**: Spiegare la climatologia regionale e testare nodi SVG interattivi e sincronizzazione dello stato con pannelli laterali e grafici.
*   **Prompt**:
    ```text
    Illustra il clima delle principali città italiane (Milano, Roma, Napoli, Palermo, Cagliari) spiegando le differenze geografiche e climatiche tra Nord, Centro, Sud e Isole. Aggiungi una mappa interattiva stilizzata (in SVG o griglia) in cui, cliccando su una città, viene visualizzata una scheda con i dettagli meteo correnti e un grafico Chart.js con le previsioni orarie per le successive 12 ore.
    ```

---

### 7. Fisica del Suono e Sintetizzatore Audio Virtuale (Web Audio API)
*   **Obiettivo**: Spiegare le onde sonore e testare l'utilizzo di API multimediali del browser (AudioContext) e oscillatori.
*   **Prompt**:
    ```text
    Spiegami come funziona il suono dal punto di vista fisico (frequenze, ampiezza, tipi di onde sonore come Sine, Square, Triangle, Sawtooth). Sotto la spiegazione teorica, aggiungi un sintetizzatore virtuale interattivo a 8 tasti (un'ottava) che consenta di modificare il tipo di onda, regolare il volume e visualizzare l'oscillazione su un Canvas quando si suona.
    ```

---

### 8. Filosofia di Markdown e Live Previewer (Utility)
*   **Obiettivo**: Descrivere come funziona la conversione in HTML e testare la compilazione real-time di stringhe in layout split-pane.
*   **Prompt**:
    ```text
    Spiegami la sintassi e la filosofia di Markdown e come viene convertito in HTML. Includi un editor Markdown interattivo in tempo reale con layout a due pannelli (input a sinistra, anteprima HTML renderizzata a destra) e un pulsante per caricare un testo di esempio.
    ```

---

### 9. Storia del Piatto e Scalatore Dinamico di Ricette (Utility)
*   **Obiettivo**: Presentare cenni storici/teorici di una ricetta e testare moltiplicazioni aritmetiche su variabili di stato e interazione con checklist.
*   **Prompt**:
    ```text
    Presenta la ricetta del Tiramisù o delle Lasagne spiegandone l'origine e i passaggi fondamentali. Sotto la guida, aggiungi una scheda interattiva per scalare dinamicamente le porzioni (da 1 a 20 persone) aggiornando le dosi in tempo reale e una checklist degli ingredienti interattiva.
    ```

---

### 10. Accessibilità e Tester di Contrasto Colore HSL (Accessibilità)
*   **Obiettivo**: Fornire nozioni sulle normative di accessibilità WCAG 2.1 e testare formule matematiche di contrasto colore.
*   **Prompt**:
    ```text
    Spiegami i criteri di accessibilità del contrasto colore WCAG 2.1 e perché sono fondamentali per le persone con disabilità visiva. Aggiungi poi un tester interattivo di contrasto HSL con slider per regolare Hue, Saturation e Lightness del background, calcolando in tempo reale il contrasto rispetto al testo bianco e nero con l'esito dei requisiti AA/AAA.
    ```

---

### 11. Crittografia Classica e Macchina Cifrante Cesare/Atbash (Crittografia)
*   **Obiettivo**: Spiegare i concetti teorici della crittografia simmetrica e testare cifratura su caratteri e logiche di codifica in tempo reale.
*   **Prompt**:
    ```text
    Spiegami la crittografia classica e il funzionamento del Cifrario di Cesare e del Cifrario Atbash. Aggiungi una macchina cifrante interattiva con una textarea per il testo in chiaro, uno slider per la chiave di Cesare (1-25), opzioni radio per l'algoritmo, e il risultato cifrato in tempo reale insieme ad una rappresentazione visiva dell'alfabeto traslato.
    ```

---

### 12. Architettura Web e Mappa Concettuale con Albero D3.js (Grafica/Librerie)
*   **Obiettivo**: Spiegare i concetti di architettura a tre livelli e testare il caricamento asincrono di D3 da CDN e mutazione dinamica di nodi SVG.
*   **Prompt**:
    ```text
    Spiegami la struttura logica e le relazioni delle tecnologie web (Frontend, Backend, Database). Rappresenta questa gerarchia attraverso una mappa concettuale interattiva ad albero usando D3.js, dove i nodi possono essere espansi o contratti al click e l'utente può inserire dinamicamente nuovi nodi tramite un form.
    ```
