import supabase from "../../library/supabaseclient";
const getModels = async () => {
    try {
        const response = await supabase.from("models").select("*").order("provider", { ascending: true }).order("cost_per_output_token", { ascending: true });
        if (response.error) {
            console.error("Error fetching models:", response.error);
            return []; // Return an empty array on error
        }
        return response.data || []; // Return the data or an empty array if data is null
    } catch (error) {
        console.error("Error fetching models:", error);
        return []; // Return an empty array on error
    }
}

export default getModels;