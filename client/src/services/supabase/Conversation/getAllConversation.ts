import supabase from "../../../library/supabaseclient";

const getAllConversation = async (userId: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations/list?user_id=${encodeURIComponent(userId)}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error("Errore nel recupero delle conversazioni:", response.statusText);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default getAllConversation;