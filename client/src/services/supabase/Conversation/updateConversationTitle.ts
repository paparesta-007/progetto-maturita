const updateConversationTitle = async (conversationId: string, newTitle: string, user_id: string, token: string) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations/update-title`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ conversation_id: conversationId, new_title: newTitle, user_id: user_id }),
        });

        if (!response.ok) {
            console.error("Errore nell'aggiornamento del titolo della conversazione:", response.statusText);
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default updateConversationTitle;