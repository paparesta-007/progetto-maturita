export function applyPromptCaching(messages: any[]): any[] {
    // 1. Rimuoviamo eventuali cache_control esistenti per evitare il limite di 4 breakpoint
    const cleanMessages = messages.map(msg => {
        if (Array.isArray(msg.content)) {
            return {
                ...msg,
                content: msg.content.map((block: any) => {
                    const { cache_control, ...rest } = block;
                    return rest;
                })
            };
        } else if (typeof msg.content === 'string') {
            return { ...msg }; // copia superficiale
        }
        return msg;
    });

    // 2. Aggiungiamo cache_control al system prompt (se esiste ed è il primo)
    if (cleanMessages.length > 0 && cleanMessages[0].role === 'system') {
        const sysMsg = cleanMessages[0];
        if (typeof sysMsg.content === 'string') {
            cleanMessages[0].content = [
                { type: "text", text: sysMsg.content, cache_control: { type: "ephemeral" } }
            ];
        } else if (Array.isArray(sysMsg.content) && sysMsg.content.length > 0) {
            // Applica il cache_control all'ultimo blocco del system prompt
            const lastBlockIndex = sysMsg.content.length - 1;
            sysMsg.content[lastBlockIndex].cache_control = { type: "ephemeral" };
        }
    }

    // 3. Aggiungiamo cache_control all'ultimo messaggio della history (il penultimo dell'array totale)
    // Questo assicura che l'intero contesto della conversazione precedente venga cachato.
    if (cleanMessages.length > 2) {
        // Cerca l'ultimo messaggio prima di quello attuale dell'utente
        const lastHistoryMsgIndex = cleanMessages.length - 2;
        const lastHistoryMsg = cleanMessages[lastHistoryMsgIndex];
        
        if (typeof lastHistoryMsg.content === 'string') {
            cleanMessages[lastHistoryMsgIndex].content = [
                { type: "text", text: lastHistoryMsg.content, cache_control: { type: "ephemeral" } }
            ];
        } else if (Array.isArray(lastHistoryMsg.content) && lastHistoryMsg.content.length > 0) {
            const lastBlockIndex = lastHistoryMsg.content.length - 1;
            lastHistoryMsg.content[lastBlockIndex].cache_control = { type: "ephemeral" };
        }
    }

    return cleanMessages;
}
