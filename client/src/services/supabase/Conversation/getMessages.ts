import supabase from "../../../library/supabaseclient";

const getMessages = async (convId: string) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            // 1. Manteniamo questo per prendere gli ULTIMI 20 messaggi inseriti
            .order('created_at', { ascending: false }) 
            .limit(20); 
            
        if (error) {
            console.error("Errore nel recupero dei messaggi:", error);
            return null;
        }

        // 2. MODIFICA QUI: Invertiamo l'array
        // Ora l'ordine diventa: [Vecchio ... Nuovo] -> Il nuovo va in basso nella chat
        return data ? data.reverse() : [];
        
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default getMessages;