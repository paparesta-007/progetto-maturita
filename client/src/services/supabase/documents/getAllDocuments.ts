import supabase from "../../../library/supabaseclient";;

const getDocumentsMetadata = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .rpc('get_distinct_metadata', { user_id_input: userId });

        if (error) {
            console.error("Errore RPC:", error);
            return null;
        }

        // Supabase restituisce un array di oggetti: [{ doc_metadata: {...} }, { doc_metadata: {...} }]
        // Dobbiamo estrarre il contenuto per avere un array pulito
        const cleanData = data.map((item: any) => item.doc_metadata);
        
        return cleanData;

    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default getDocumentsMetadata;