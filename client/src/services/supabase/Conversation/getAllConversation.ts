const getAllConversation = async (userId: string) => {
    try {
        const response = await fetch(`http://localhost:3000/api/conversations/list?user_id=${encodeURIComponent(userId)}`);

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