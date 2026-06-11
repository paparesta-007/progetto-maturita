import supabase from "../../../library/supabaseclient";

const deleteConversation = async (userId: string, conversationId: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations/delete`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, conversation_id: conversationId }),
        });

        if (!response.ok) {
            console.error("Errore nella cancellazione della conversazione:", response.statusText);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default deleteConversation;