import supabase from "../../../library/supabaseclient";

const createMessage = async (response: any, conversation_id: any, model: any, user_id: any) => {
    let content = response.content;
    let sender = response.sender;
    let usage = response.usage;
    let renderMode = response.renderMode;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch("http://localhost:3000/api/conversations/messages/create", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                conversation_id: conversation_id,
                sender: sender,
                content: content,
                usage: usage,
                model: model.name_id,
                render_mode: renderMode,
                reasoning_text: response.reasoning || "none",
                user_id: user_id,
            }),
        });

        if (!res.ok) {
            console.error("Error creating message:", res.statusText);
            return [];
        }

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error creating message:", error);
        return [];
    }
}

export default createMessage;
