const deleteConversation = async (userId: string, conversationId: string) => {
    try {
        const response = await fetch("http://localhost:3000/api/conversations/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
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