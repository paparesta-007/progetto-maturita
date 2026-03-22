const updateConversationTitle = async (conversationId: string, newTitle: string,user_id: string) => {
    try {
        const response = await fetch("http://localhost:3000/api/conversations/update-title", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
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