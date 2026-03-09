import supabase from "../../../library/supabaseclient";

// ... imports

const getUserPreferences = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles').select('preferences')
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

export default getUserPreferences;