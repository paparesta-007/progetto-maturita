import supabase from "../../../library/supabaseclient";

const deleteCurrentDocument = async (userId: string, documentId: string) => {
   try {
        const { data, error } = await supabase
            .from('documents')
            .delete()
            .eq('user_id', userId)      // Filtro di sicurezza: cancella solo se l'utente è proprietario
            .eq('document_id', documentId); // Target: cancella tutte le righe (chunk) associate a questo ID documento

        if (error) {
            throw error;
        }

        return true; // Ritorna true se l'operazione è andata a buon fine
    } catch (error) {
        console.error("Errore nell'eliminazione del documento:", error);
        return false;
    }
}

export default deleteCurrentDocument;