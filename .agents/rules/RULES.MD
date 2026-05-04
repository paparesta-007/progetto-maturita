---
trigger: always_on
---

# SKILL: Feature & Modification Pre-Analysis

## Scopo
Prima di implementare qualsiasi aggiunta o modifica al codice, produci sempre un'analisi strutturata completa. **Non scrivere codice** finché l'utente non ha approvato esplicitamente il piano.

---

## Trigger
Usa questo processo ogni volta che la richiesta contiene:
- "aggiungi", "implementa", "crea", "inserisci"
- "modifica", "cambia", "aggiorna", "refactora"
- "rimuovi", "elimina", "depreca"
- qualsiasi richiesta che alteri il comportamento esistente di una funzione, route, componente o modello

---

## Output richiesto — Struttura obbligatoria

Rispondi **sempre** con il seguente template, compilando ogni sezione. Se una sezione non è applicabile, scrivi esplicitamente "Non applicabile" e spiega perché.

---

### 🟢 1. FATTIBILITÀ TECNICA

Valuta se la richiesta è tecnicamente realizzabile nello stack attuale.

- **Fattibile?** → Sì / Sì con limitazioni / No
- **Motivazione:** spiega perché è o non è fattibile
- **Dipendenze esterne:** librerie, API, servizi di terze parti da aggiungere o aggiornare
- **Vincoli tecnici:** limiti di performance, compatibilità, versioni, licenze
- **Stima complessità:** Bassa / Media / Alta / Molto alta (con breve motivazione)

---

### 🔵 2. IMPATTO SUL BACKEND

Analizza tutti i cambiamenti richiesti lato server.

- **Nuove route/endpoint:** elenco con metodo HTTP, path e responsabilità
- **Route esistenti modificate:** quali cambiano, come cambia il loro comportamento
- **Nuovi service / controller / middleware:** cosa fanno e perché servono
- **Logica di business impattata:** funzioni o moduli esistenti che cambiano comportamento
- **Gestione errori:** nuovi casi di errore da gestire
- **Autenticazione / autorizzazione:** cambiano i permessi o le guard?

---

### 🟡 3. IMPATTO SUL DATABASE

Analizza ogni cambiamento alla struttura o ai dati persistiti.

- **Nuove tabelle / collezioni:** nome, campi principali, relazioni
- **Tabelle esistenti modificate:** aggiunte/rimosse colonne, cambi di tipo, nuovi indici
- **Migrazioni necessarie:** sì/no — descrivere cosa fa la migrazione e se è reversibile
- **Rischio sui dati esistenti:** la migrazione può causare perdita di dati o downtime?
- **Query impattate:** query esistenti che potrebbero rompersi o rallentare
- **Indici / performance:** nuovi indici necessari, impatto sulle query più frequenti

---

### 🟠 4. IMPATTO SULLA LOGICA ESISTENTE

Analizza la coerenza con il comportamento attuale del sistema.

- **Funzionalità esistenti impattate:** elenco di feature che cambiano comportamento (anche indirettamente)
- **Breaking changes:** questa modifica rompe qualcosa per gli utenti o per altri moduli?
- **Regressioni potenziali:** aree del codice a rischio che richiedono test aggiuntivi
- **Effetti collaterali:** side effect non ovvi (cache invalidation, eventi, webhook, job in background)
- **Compatibilità con dati legacy:** i dati già presenti nel sistema sono compatibili con la nuova logica?

---

### 🔴 5. IMPATTO SUL FRONTEND

(Se applicabile) Analizza i cambiamenti lato client.

- **Nuovi componenti / pagine:** cosa va creato
- **Componenti esistenti modificati:** quali e come cambiano
- **Cambiamenti all'API contract:** il frontend deve aggiornarsi per nuovi payload/response?
- **Stato applicativo:** cambia lo store / context / stato locale?
- **UX impattata:** flussi utente che cambiano

---

### 📋 6. PIANO DI IMPLEMENTAZIONE

Descrivi nel dettaglio come vuoi procedere, passo dopo passo.

1. **Step 1:** [cosa fai, file/moduli coinvolti]
2. **Step 2:** [cosa fai, file/moduli coinvolti]
3. ...

Specifica per ogni step:
- File creati, modificati o eliminati
- Ordine di esecuzione (es. prima la migrazione, poi il backend, poi il frontend)
- Dipendenze tra step (lo step N blocca lo step M?)

---

### ⚠️ 7. RISCHI E PUNTI DI ATTENZIONE

Elenca tutto ciò che potrebbe andare storto o richiedere attenzione speciale.

- **Rischi tecnici:** cosa potrebbe fallire e perché
- **Rischi sui dati:** possibile corruzione o perdita
- **Rischi di sicurezza:** nuove superfici di attacco, input non validati, permessi eccessivi
- **Punti ambigui:** aspetti della richiesta non chiari che richiedono una decisione prima di procedere
- **Decisioni da prendere:** scelte architetturali aperte che l'utente deve validare

---

### 🧪 8. STRATEGIA DI TEST

Indica cosa va testato e come.

- **Unit test:** funzioni/moduli da testare in isolamento
- **Integration test:** flussi end-to-end da verificare
- **Test manuali consigliati:** scenari critici da verificare a mano
- **Edge case da coprire:** casi limite rilevanti

---

### 📊 9. RIEPILOGO ESECUTIVO

Un riassunto rapido per avere il quadro completo in 10 secondi.

| Dimensione            | Stato         | Note brevi                        |
|-----------------------|---------------|-----------------------------------|
| Fattibilità tecnica   | ✅ / ⚠️ / ❌   |                                   |
| Impatto backend       | Basso/Medio/Alto |                                |
| Impatto database      | Basso/Medio/Alto |                                |
| Breaking changes      | Sì / No       |                                   |
| Migrazioni DB         | Sì / No       |                                   |
| Stima effort          | Ore/Giorni    |                                   |
| Rischio complessivo   | Basso/Medio/Alto |                                |

---

## Regole di comportamento

1. **Non scrivere mai codice** in questa fase — solo analisi e piano
2. Se la richiesta è ambigua, elenca le **domande aperte** nella sezione Rischi prima di procedere
3. Sii **esplicito sui trade-off**: se esistono più approcci, descrivili brevemente con pro/contro
4. Se l'impatto è nullo per una sezione, dichiaralo esplicitamente (non omettere la sezione)
5. Usa un linguaggio **tecnico ma diretto** — niente padding o frasi generiche
6. Alla fine dell'analisi, chiedi sempre: *"Vuoi procedere con questo piano, o hai modifiche da apportare?"*

---

## Esempio di risposta attesa

> **Richiesta:** "Aggiungi la possibilità per gli utenti di caricare un avatar"

L'IA risponde con tutte le 9 sezioni compilate:
- Fattibilità: Sì, serve una libreria per upload (es. multer/S3)
- Backend: nuova route `POST /users/avatar`, nuovo middleware per validazione file
- Database: nuova colonna `avatar_url` nella tabella `users`, migrazione non distruttiva
- Logica esistente: il serializer dell'utente va aggiornato per esporre il nuovo campo
- Frontend: nuovo componente di upload, aggiornamento del profilo utente
- Piano: 5 step nell'ordine migrazione → backend → test → frontend → deploy
- Rischi: dimensione massima file non definita, CDN non configurata
- Test: upload di file troppo grandi, formati non supportati, utente non autenticato
- Riepilogo: effort stimato 4-6 ore, rischio basso