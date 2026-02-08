import supabase from "../../../library/supabaseclient";

// ... imports

const insertUserDetails = async (userId: string, fullName: string, birthday: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                birthday: birthday
            })
            .eq('user_id', userId); // <--- CAMBIATO QUI: usa 'user_id', non 'id'

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

export default insertUserDetails;