import supabase from "../../../library/supabaseclient";


const getMessages = async (convId: string) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(20); 
            

        if (error) {
            console.error("Errore nel recupero dei messaggi:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default getMessages;