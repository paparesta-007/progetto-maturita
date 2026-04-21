import express from "express";
import { supabase } from "../services/supabase.js";
import { logSupabaseAction } from "../middleware/logging.js";

const router = express.Router();

router.post("/getUserTickets", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { userId } = req.body;
        if (!userId) throw new Error("userId mancante");

        logSupabaseAction("select_support_tickets", userId);
        const { data, error } = await supabase
            .from("support_tickets")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Errore recupero ticket di supporto:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, tickets: data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post("/submit", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { userId, email, problemType, subject, message } = req.body;
        /*
        -- Create support_tickets table
        CREATE TABLE support_tickets (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id),
            email TEXT NOT NULL,
            problem_type TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'open', -- 'open', 'in-progress', 'resolved', 'closed'
            admin_reply TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        */
        const { data, error } = await supabase
            .from('support_tickets')
            .insert([
                {
                    user_id: userId,
                    email: email,
                    problem_type: problemType,
                    subject: subject,
                    message: message,
                },
            ])
            .select();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
