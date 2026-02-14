import supabase from "../../../library/supabaseclient";

const createMessage = async (response:any, conversation_id:any) => {
    let content=response.content;
    let sender=response.sender;
    let usage=response.usage;
    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversation_id,
            created_at: new Date(),
            sender: sender,
            content: content,
            usage: usage,
        });

    if (error) {
        console.error("Error creating message:", error);
        return [];
    }
    return data;
}

export default createMessage;



