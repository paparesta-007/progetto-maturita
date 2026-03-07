const createConversation = async (uuid: any, title: any) => {
    try {
        const response = await fetch("http://localhost:3000/api/conversations/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: uuid, title: title }),
        });

        if (!response.ok) {
            console.error("Error creating conversation:", response.statusText);
            return [];
        }

        const data = await response.json();
        return data; // data sarà un array [{ id: ..., title: ... }]
    } catch (error) {
        console.error("Error creating conversation:", error);
        return [];
    }
}

export default createConversation;