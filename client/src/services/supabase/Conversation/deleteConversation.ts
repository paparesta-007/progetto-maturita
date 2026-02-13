import supabase from "../../../library/supabaseclient";


const deleteConversation = async (userId: string, conversationId: string) => {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .delete()
            .eq('user_id', userId)
            .eq('id', conversationId);
            

        if (error) {
            console.error("Errore nella cancellazione della conversazione:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default deleteConversation;