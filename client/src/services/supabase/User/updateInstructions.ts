import supabase from "../../../library/supabaseclient";

// ... imports

const updateInstructions = async (userId: string, instructions: any) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ instructions: instructions })
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error("Errore nell'aggiornamento:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Errore imprevisto:", error);
        return null;
    }
}

export default updateInstructions;