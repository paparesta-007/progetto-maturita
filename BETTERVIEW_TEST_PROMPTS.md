# BetterView UI - Dynamic Test Prompts

This document is a direct, copy-pasteable list of highly dynamic test prompts for testing the **BetterView** (Generative UI) rendering engine. All prompts are designed to trigger interactive HTML, CSS, and JS compilation inside the sandbox iframe.

---

### 1. Compound Interest & Capital Growth Planner
*   **Goal**: Test real-time mathematical calculations updating a Chart.js canvas layout.
*   **Italian Version**:
    ```text
    Crea un pianificatore finanziario interattivo per il calcolo dell'interesse composto. Includi slider per impostare: Capitale Iniziale (0-100k€), Contributo Mensile (0-2k€), Rendimento Annuo Stimato (1-15%) e Orizzonte Temporale (1-40 anni). Mostra un grafico ad area di Chart.js che mostra la crescita del capitale divisa tra contributi versati e interessi accumulati, aggiornandolo in tempo reale al movimento degli slider.
    ```
*   **English Version**:
    ```text
    Create an interactive financial planner for calculating compound interest. Include sliders to adjust: Initial Capital (0-100k€), Monthly Contribution (0-2k€), Estimated Annual Return (1-15%), and Time Horizon (1-40 years). Display a Chart.js area chart showing capital growth split between contributions made and accumulated interest, updating in real-time as the sliders move.
    ```
*   **Expected Behavior**: Moving any slider recalculates values and updates the Chart.js dataset instantly without chart flicker or layout shifts.

---

### 2. Physics Gravity & Particle Simulator
*   **Goal**: Test HTML5 Canvas continuous animation loops (`requestAnimationFrame`), mouse clicks, and real-time gravity physics.
*   **Italian Version**:
    ```text
    Crea un simulatore fisico interattivo bidimensionale in HTML5 Canvas. Aggiungi slider per regolare la Gravità, il Rimbalzo (restituzione) e il Vento. L'utente deve poter cliccare sull'area del Canvas per generare delle palline colorate che cadono e rimbalzano contro i bordi del box seguendo i parametri impostati. Includi un pulsante per resettare la simulazione.
    ```
*   **English Version**:
    ```text
    Create a two-dimensional interactive physics simulator using HTML5 Canvas. Add sliders to adjust Gravity, Bounciness (restitution), and Wind speed. The user should be able to click on the Canvas area to spawn colored balls that fall and bounce off the edges according to the active parameters. Include a reset button.
    ```
*   **Expected Behavior**: Balls bounce smoothly inside the canvas borders. Adjusting gravity or wind dynamically alters the trajectories of existing and new balls instantly.

---

### 3. Italian Literature Quiz & Flashcards
*   **Goal**: Test state transitions (question indexing, score tracking, countdown timers).
*   **Italian Version**:
    ```text
    Crea un quiz interattivo a risposta multipla su Dante Alighieri e la Divina Commedia (5 domande). Mostra una barra di avanzamento, un feedback visivo immediato (verde/rosso) alla selezione della risposta, un piccolo timer da 15 secondi per domanda, ed un pannello dei risultati finale con il punteggio in percentuale e un riepilogo grafico delle risposte esatte.
    ```
*   **English Version**:
    ```text
    Create an interactive multiple-choice quiz about Dante Alighieri and the Divine Comedy (5 questions). Show a progress bar, instant visual feedback (green/red) when selecting an answer, a 15-second timer per question, and a final results card displaying the percentage score and a visual recap of correct answers.
    ```
*   **Expected Behavior**: Clicking choices updates progress, handles timer timeouts, and transitions to a summary screen upon completion.

---

### 4. CSS Flexbox Playground
*   **Goal**: Test direct DOM style updates using CSS classes and layout flex properties.
*   **Italian Version**:
    ```text
    Crea una guida interattiva per visualizzare le proprietà di CSS Flexbox. Includi controlli (pulsanti o dropdown) per cambiare: flex-direction, justify-content, align-items e gap. Sotto i controlli, mostra un contenitore flessibile con 4 box numerati colorati che si riposizionano istantaneamente in base alle proprietà selezionate, spiegando brevemente l'effetto pratico di ogni valore scelto.
    ```
*   **English Version**:
    ```text
    Create an interactive playground to visualize CSS Flexbox properties. Include controls (buttons or dropdowns) to change: flex-direction, justify-content, align-items, and gap. Below the controls, show a flex container with 4 numbered, colored boxes that reposition instantly as properties are clicked, along with a short text explanation of the active property.
    ```
*   **Expected Behavior**: Preview boxes instantly change alignment, sorting, or margins depending on selected controls.

---

### 5. Password Generator & Entropy Evaluator
*   **Goal**: Test real-time text input calculations, string manipulations, and copying to clipboard.
*   **Italian Version**:
    ```text
    Crea un generatore di password interattivo con annesso valutatore di sicurezza. Includi slider per la lunghezza (8-32 caratteri), checkbox per includere Maiuscole, Numeri e Simboli, e un box di input in cui l'utente può anche digitare una password personalizzata. Mostra in tempo reale la forza stimata (debole/media/forte) tramite una barra colorata, i bit di entropia calcolati e un pulsante copia-negli-appunti.
    ```
*   **English Version**:
    ```text
    Create an interactive password generator and security strength evaluator. Include a slider for length (8-32 characters), checkboxes for Uppercase, Numbers, and Symbols, and a text input box where the user can type custom text. Show in real-time the estimated strength (weak/medium/strong) via a colored progress bar, calculated entropy bits, and a copy-to-clipboard button.
    ```
*   **Expected Behavior**: Typing characters dynamically scales the strength progress bar. The copy button writes the password string to the system clipboard.

---

### 6. Weather Map Dashboard
*   **Goal**: Test interactive SVG clicks, layer toggling, and layout state synchronization.
*   **Italian Version**:
    ```text
    Disegna una mappa interattiva stilizzata (in SVG o layout a griglia) delle principali città italiane (Milano, Roma, Napoli, Palermo, Cagliari). Cliccando su una città, mostra una scheda meteo dettagliata sul lato destro con la temperatura attuale, vento, umidità, e un grafico Chart.js con le previsioni orarie delle successive 12 ore.
    ```
*   **English Version**:
    ```text
    Draw an interactive stylized map (using SVG or grid layout) of main Italian cities (Milan, Rome, Naples, Palermo, Cagliari). Clicking on a city must load a detailed weather card on the right-hand panel with current temperature, wind, humidity, and a Chart.js forecast graph for the next 12 hours.
    ```
*   **Expected Behavior**: Clicking weather nodes updates the right-hand panel and redraws the forecast Chart.js values corresponding to the selected city.

---

### 7. Virtual Audio Synthesizer (Web Audio API)
*   **Goal**: Test API access (AudioContext) and canvas visualizers inside the sandbox.
*   **Italian Version**:
    ```text
    Crea una tastiera musicale/sintetizzatore virtuale interattivo a 8 tasti (un'ottava). Consenti di selezionare il tipo di onda dell'oscillatore (Sine, Square, Triangle, Sawtooth) tramite pulsanti, regolare il volume con uno slider, e suonare le note cliccando sui tasti grafici del pianoforte. Includi una piccola animazione Canvas che mostra una visualizzazione elementare delle onde sonore quando si preme un tasto.
    ```
*   **English Version**:
    ```text
    Create an interactive virtual musical keyboard/synthesizer with 8 keys (one octave). Allow selection of the oscillator wave type (Sine, Square, Triangle, Sawtooth) via buttons, volume adjustment with a slider, and note playing by clicking the graphic piano keys. Include a simple Canvas animation visualizing the sound wave when a key is pressed.
    ```
*   **Expected Behavior**: AudioContext initializes properly. Clicking keys generates sound tones. The visualizer animates corresponding to the sound played.

---

### 8. Markdown Live Editor & Previewer
*   **Goal**: Test string compilation, rich-text rendering, and structural layouts.
*   **Italian Version**:
    ```text
    Crea un editor Markdown interattivo in tempo reale con layout diviso in due pannelli. A sinistra una textarea dove scrivere codice markdown (supportando intestazioni, elenchi puntati, tabelle e grassetti), a destra un'anteprima HTML renderizzata all'istante durante la digitazione. Aggiungi un pulsante per caricare un testo di esempio predefinito.
    ```
*   **English Version**:
    ```text
    Create an interactive real-time Markdown editor with a split-pane layout. On the left, a textarea to type markdown code (supporting headers, bullet points, tables, and bold formatting); on the right, an instant rendered HTML preview as you type. Add a button to load pre-defined template markdown.
    ```
*   **Expected Behavior**: Typing in the textarea renders formatting on the right pane.

---

### 9. Dynamic Recipe Portion Scaler
*   **Goal**: Test arithmetic multiplications of dynamic state variables and item check-offs.
*   **Italian Version**:
    ```text
    Crea una scheda ricetta interattiva per il Tiramisù o le Lasagne. Aggiungi un selettore numerico (+/-) o uno slider per indicare le porzioni (da 1 a 20 persone). Moltiplica dinamicamente le dosi di tutti gli ingredienti in tempo reale. Includi una lista di controllo degli ingredienti interattiva dove l'utente può sbarrare le voci comprate/utilizzate con un'animazione.
    ```
*   **English Version**:
    ```text
    Create an interactive recipe card for Tiramisu or Lasagna. Add a numerical selector (+/-) or a slider for servings (from 1 to 20 people). Dynamically multiply all ingredient quantities in real-time. Include an interactive checklist where items fade/strike-through when clicked.
    ```
*   **Expected Behavior**: Ingredient amounts scale accurately when servings are changed. Checkbox state scales cleanly.

---

### 10. HSL Color Contrast Tester
*   **Goal**: Test math checks, contrast ratios calculation (WCAG 2.1 formulas), and colors.
*   **Italian Version**:
    ```text
    Crea uno strumento interattivo per la verifica del contrasto colore HSL. Inserisci slider per regolare Hue, Saturation e Lightness del colore di sfondo. Calcola e mostra dinamicamente il rapporto di contrasto (contrast ratio) rispetto al testo nero ed al testo bianco secondo gli standard WCAG 2.1 (indicando se supera le soglie AA o AAA). Mostra un'anteprima visiva del testo sullo sfondo selezionato.
    ```
*   **English Version**:
    ```text
    Create an interactive HSL color contrast checker. Insert sliders to adjust Hue, Saturation, and Lightness of a background color. Dynamically calculate and display the contrast ratio against black and white text based on WCAG 2.1 standards (indicating if it passes AA or AAA thresholds). Show a visual preview of text on the selected background.
    ```
*   **Expected Behavior**: Sliding colors computes correct mathematical contrast calculations (1:1 to 21:1) and alerts the user of accessibility conformance updates.

---

### 11. Cipher Machine (Cryptography)
*   **Goal**: Test character code shifting, input updates, and cipher key logic.
*   **Italian Version**:
    ```text
    Crea una macchina cifrante interattiva (Cifrario di Cesare e Cifrario Atbash). Includi una textarea per il testo in chiaro, uno slider per selezionare la chiave di spostamento (da 1 a 25 per Cesare), pulsanti radio per selezionare l'algoritmo, e una textarea disabilitata per mostrare il testo cifrato aggiornato in tempo reale. Mostra una griglia visiva dell'alfabeto traslato in base alla chiave inserita.
    ```
*   **English Version**:
    ```text
    Create an interactive cipher machine (supporting Caesar Cipher and Atbash Cipher). Include a textarea for plaintext, a slider for the shift key (1 to 25 for Caesar), radio buttons to select the algorithm, and a disabled textarea showing the ciphertext in real-time. Show a visual grid mapping the shifted alphabet.
    ```
*   **Expected Behavior**: String characters shift mathematically on inputs. Changing ciphers updates the output box immediately.

---

### 12. D3.js Interactive Concept Map / Tree
*   **Goal**: Test external library script loaders (D3.js) and DOM tree mutations.
*   **Italian Version**:
    ```text
    Crea una mappa concettuale interattiva delle tecnologie web (Frontend, Backend, Database) usando D3.js. L'utente deve poter cliccare sui nodi principali per espandere o contrarre i sotto-nodi (es. cliccando su Frontend appaiono HTML, CSS, JS) con transizioni fluide, e poter inserire un nuovo sotto-nodo personalizzato tramite un campo di input e un pulsante.
    ```
*   **English Version**:
    ```text
    Create an interactive concept map of web technologies (Frontend, Backend, Database) using D3.js. The user should be able to click main nodes to expand or collapse sub-nodes (e.g. clicking Frontend expands HTML, CSS, JS) with smooth transitions, and add a custom sub-node using a text input field and button.
    ```
*   **Expected Behavior**: D3 loads from CDN, rendering SVG circles and lines. Clicking nodes toggles active visual states.
