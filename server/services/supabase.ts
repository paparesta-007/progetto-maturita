import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../config/enviroments.js";

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase URL or Key in environment configurations.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
