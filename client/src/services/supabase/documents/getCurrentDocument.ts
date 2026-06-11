import supabase from "../../../library/supabaseclient";;

const getCurrentDocument = async (userId: string,documentId: string) => {
   try {
        const { data, error } = await supabase
            .from('documents')
            .select('document_id, metadata')
            .eq('user_id', userId)      // Filtro di sicurezza per l'utente
            .eq('document_id', documentId) // Filtro sulla nuova colonna top-level
            .limit(1);

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Errore nel recupero del documento:", error);
        return null;
    }
}

export default getCurrentDocument;