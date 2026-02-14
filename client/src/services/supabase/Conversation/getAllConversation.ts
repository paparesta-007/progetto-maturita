import supabase from "../../../library/supabaseclient";


const getAllConversation = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20); 
            

        if (error) {
            console.error("Errore nel recupero delle conversazioni:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default getAllConversation;