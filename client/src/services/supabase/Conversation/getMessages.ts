import supabase from "../../../library/supabaseclient";

const getMessages = async (convId: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations/messages?conversation_id=${encodeURIComponent(convId)}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error("Errore nel recupero dei messaggi:", response.statusText);
            return null;
        }

        // Il server restituisce già i messaggi in ordine cronologico (vecchio → nuovo)
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default getMessages;