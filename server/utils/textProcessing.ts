export function normalizeText(text: string): string {
    return text
        .normalize('NFC')
        .replace(/\0/g, '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/[\t ]{2,}/g, ' ')
        .replace(/\n{4,}/g, '\n\n\n')
        .trim();
}

// ─── HELPER: Rileva heading/titoli di sezione nel testo ───
export function detectHeadings(text: string): Array<{ position: number; heading: string }> {
    const headings: Array<{ position: number; heading: string }> = [];
    const lines = text.split('\n');
    let charPos = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        // Rileva heading: linee corte (<120 char), non vuote,
        // che sono TUTTE MAIUSCOLE, oppure iniziano con numeri tipo "1.", "1.2", "Capitolo"
        // oppure sono seguite da una riga vuota (tipico dei titoli in PDF)
        const isHeading =
            trimmed.length > 0 &&
            trimmed.length < 120 &&
            (
                trimmed === trimmed.toUpperCase() && trimmed.length > 3 ||   // TUTTO MAIUSCOLO
                /^(\d+\.)+\s/.test(trimmed) ||                                // 1. 1.2. 3.1.4.
                /^(capitolo|cap\.|sezione|sez\.|parte|appendice)\s/i.test(trimmed) // Parole chiave italiane
            );

        if (isHeading) {
            headings.push({ position: charPos, heading: trimmed });
        }
        charPos += line.length + 1; // +1 per il \n
    }
    return headings;
}

// ─── HELPER: Trova l'heading più vicino che precede una posizione ───
export function getNearestHeading(position: number, headings: Array<{ position: number; heading: string }>): string | null {
    let nearest: string | null = null;
    for (const h of headings) {
        if (h.position <= position) {
            nearest = h.heading;
        } else {
            break; // Headings sono ordinati per posizione
        }
    }
    return nearest;
}

// ─── HELPER: Splitta un blocco di testo in frasi ───
export function splitIntoSentences(text: string): string[] {
    // Regex che splitta dopo . ! ? ; seguiti da spazio o fine stringa
    // Evita split su abbreviazioni comuni (es. "dott.", "pag.", "fig.", "es.", "ecc.")
    const sentences = text.split(/(?<=[.!?;])\s+(?=[A-Z\d"«(])/g);
    return sentences.filter(s => s.trim().length > 0);
}

// ─── CHUNKING ENGINE: Recursive Paragraph → Sentence → Word splitting ───
export function splitTextIntoChunks(
    text: string,
    chunkSize: number = 1500,
    overlap: number = 300,
    options: {
        respectSentences?: boolean;
        respectParagraphs?: boolean;
        minChunkSize?: number;
    } = {}
): Array<{ content: string; metadata: { startChar: number; endChar: number; order: number; length: number; sectionHeading: string | null; page: number } }> {

    const { minChunkSize = 100 } = options;

    // 1️⃣ Normalizza line endings
    const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n');

    // 2️⃣ Rileva gli heading del documento
    const headings = detectHeadings(cleanedText);

    // 2.5️⃣ Mappa delle pagine (se presenti marker)
    // Cerchiamo i marker tipo [[PAGE_BREAK:N]]
    const pageMarkers: Array<{ pos: number; page: number }> = [];
    const pageRegex = /\[\[PAGE_BREAK:(\d+)\]\]/g;
    let match;
    while ((match = pageRegex.exec(cleanedText)) !== null) {
        pageMarkers.push({ pos: match.index, page: parseInt(match[1]) });
    }

    function getPageAt(pos: number): number {
        if (pageMarkers.length === 0) return 1;
        for (const marker of pageMarkers) {
            if (pos < marker.pos) {
                return marker.page;
            }
        }
        return pageMarkers[pageMarkers.length - 1].page;
    }

    // 3️⃣ Livello 1: splitta per paragrafi (doppio newline)
    const paragraphs: Array<{ text: string; startChar: number }> = [];
    let currentSearchPos = 0;
    
    // Usiamo un metodo più robusto per trovare le posizioni dei paragrafi
    const paragraphTexts = cleanedText.split(/\n\n+/);
    for (const para of paragraphTexts) {
        const trimmed = para.trim();
        if (trimmed.length > 0) {
            // Troviamo l'indice reale nel testo originale (o cleanedText)
            const actualPos = cleanedText.indexOf(para, currentSearchPos);
            if (actualPos !== -1) {
                paragraphs.push({ text: trimmed, startChar: actualPos });
                currentSearchPos = actualPos + para.length;
            }
        }
    }

    // 4️⃣ Assembla i chunk combinando paragrafi fino a raggiungere chunkSize
    const chunks: Array<{ content: string; metadata: any }> = [];
    let currentContent = '';
    let currentStartChar = paragraphs.length > 0 ? paragraphs[0].startChar : 0;
    let chunkOrder = 0;

    function pushChunk(content: string, startChar: number, endChar: number) {
        // Rimuoviamo i marker di pagina dal contenuto finale del chunk per non sporcare il testo
        const finalContent = content.replace(/\[\[PAGE_BREAK:\d+\]\]/g, '').trim();
        
        if (finalContent.length >= minChunkSize) {
            // Determiniamo la pagina basandoci sulla posizione centrale del chunk
            // per evitare offset causati da chunk che iniziano o finiscono a cavallo di un cambio pagina.
            const middleChar = Math.floor((startChar + endChar) / 2);
            const page = getPageAt(middleChar);

            chunks.push({
                content: finalContent,
                metadata: {
                    startChar,
                    endChar,
                    order: chunkOrder++,
                    length: finalContent.length,
                    sectionHeading: getNearestHeading(startChar, headings),
                    page: page
                }
            });
        }
    }

    // Funzione per spezzare un blocco troppo grande in sotto-frasi
    function splitLargeBlock(blockText: string, blockStart: number) {
        const sentences = splitIntoSentences(blockText);

        let sentenceBuffer = '';
        let bufferStart = blockStart;

        for (const sentence of sentences) {
            if (sentenceBuffer.length + sentence.length + 1 > chunkSize && sentenceBuffer.length > 0) {
                // Salva il buffer corrente come chunk
                pushChunk(sentenceBuffer, bufferStart, bufferStart + sentenceBuffer.length);
                // Overlap: mantieni le ultime N chars
                const overlapText = sentenceBuffer.slice(-overlap);
                bufferStart = bufferStart + sentenceBuffer.length - overlapText.length;
                sentenceBuffer = overlapText;
            }
            sentenceBuffer += (sentenceBuffer.length > 0 ? ' ' : '') + sentence;
        }

        // Flush buffer rimanente
        if (sentenceBuffer.trim().length > 0) {
            pushChunk(sentenceBuffer, bufferStart, bufferStart + sentenceBuffer.length);
        }
    }

    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];

        // Se il singolo paragrafo è già più grande di chunkSize, spezzalo per frasi
        if (para.text.length > chunkSize) {
            // Prima salva ciò che abbiamo accumulato
            if (currentContent.length > 0) {
                pushChunk(currentContent, currentStartChar, currentStartChar + currentContent.length);
                currentContent = '';
            }
            // Splitta il paragrafo grande
            splitLargeBlock(para.text, para.startChar);
            currentStartChar = para.startChar + para.text.length;
            continue;
        }

        // Se aggiungere questo paragrafo supera chunkSize, salva il chunk corrente
        if (currentContent.length + para.text.length + 2 > chunkSize && currentContent.length > 0) {
            pushChunk(currentContent, currentStartChar, currentStartChar + currentContent.length);

            // Overlap: prendi le ultime N chars del chunk salvato
            const overlapText = currentContent.slice(-overlap);
            currentContent = overlapText + '\n\n' + para.text;
            currentStartChar = currentStartChar + currentContent.length - overlapText.length - para.text.length - 2;
        } else {
            // Aggiungi il paragrafo al chunk corrente
            if (currentContent.length > 0) {
                currentContent += '\n\n' + para.text;
            } else {
                currentContent = para.text;
                currentStartChar = para.startChar;
            }
        }
    }

    // Flush dell'ultimo chunk
    if (currentContent.trim().length > 0) {
        pushChunk(currentContent, currentStartChar, currentStartChar + currentContent.length);
    }

    return chunks;
}

// ─── HELPER: Validazione dei chunk ───
export function validateChunks(chunks: Array<any>): { isValid: boolean; gaps: number[]; overlaps: number[] } {
    const gaps: number[] = [];
    const overlaps: number[] = [];

    for (let i = 0; i < chunks.length - 1; i++) {
        const currentEnd = chunks[i].metadata.endChar;
        const nextStart = chunks[i + 1].metadata.startChar;

        if (nextStart > currentEnd) {
            gaps.push(nextStart - currentEnd);
        } else if (nextStart < currentEnd) {
            overlaps.push(currentEnd - nextStart);
        }
    }

    return {
        isValid: gaps.length === 0,
        gaps,
        overlaps
    };
}