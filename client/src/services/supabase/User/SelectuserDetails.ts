import supabase from "../../../library/supabaseclient";

// In-memory cache for user details
// Uses userId as the key to store the promise or resolved data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userDetailsCache = new Map<string, { data: any | Promise<any>, timestamp: number }>();

const CACHE_TTL_MS = 60000; // 1 minute TTL

const selectUserDetails = async (userId: string) => {
    const now = Date.now();
    const cached = userDetailsCache.get(userId);

    // Check if the details are already cached or currently being fetched and not expired
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
        return await cached.data;
    }

    const fetchPromise = (async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, birthday, avatar_url')
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
    })();

    // Store the promise in the cache immediately to prevent concurrent requests
    userDetailsCache.set(userId, { data: fetchPromise, timestamp: now });

    // Wait for the promise to resolve, then update the cache with actual data
    const result = await fetchPromise;
    userDetailsCache.set(userId, { data: result, timestamp: now });

    return result;
}

export default selectUserDetails;
