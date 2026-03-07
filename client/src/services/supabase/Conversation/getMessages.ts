const getMessages = async (convId: string) => {
    try {
        const response = await fetch(`http://localhost:3000/api/conversations/messages?conversation_id=${encodeURIComponent(convId)}`);

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