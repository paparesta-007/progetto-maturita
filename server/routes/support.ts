import express from "express";
import { supabase } from "../services/supabase.js";
import { logSupabaseAction } from "../middleware/logging.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "t.paparesta@gmail.com",
        pass: "bgre xhjf zoat gfhn"
    }
});

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

// Admin endpoint: Fetch all tickets
router.get("/admin/tickets", async (req: express.Request, res: express.Response) => {
    try {
        const { data, error } = await supabase
            .from("support_tickets")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ success: true, tickets: data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin endpoint: Reply to ticket
router.post("/admin/reply", async (req: express.Request, res: express.Response) => {
    try {
        const { ticketId, reply, email, subject, status, originalMessage } = req.body;
        if (!ticketId || !reply || !email) throw new Error("Dati mancanti per la risposta");

        const targetStatus = status || "resolved";

        // 1. Send Email with History
        const mailOptions = {
            from: "t.paparesta@gmail.com",
            to: email,
            subject: `Re: ${subject || 'Support Request'}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="color: #f97316; margin-top: 0;">Support Response</h2>
                    <div style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        ${reply}
                    </div>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f5f5f5; color: #666;">
                        <p style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; color: #999;">Original Request History</p>
                        <div style="padding: 15px; background: #fafafa; border-radius: 8px; font-size: 14px;">
                            <strong style="display: block; margin-bottom: 5px;">Subject: ${subject}</strong>
                            <p style="margin: 0; white-space: pre-wrap;">${originalMessage || 'No original message provided.'}</p>
                        </div>
                    </div>
                    
                    <p style="font-size: 11px; color: #aaa; margin-top: 30px; text-align: center;">
                        This is an automated reply from Gemini Support. Please do not reply directly to this email.
                    </p>
                </div>`
        };

        await transporter.sendMail(mailOptions);

        // 2. Update Supabase
        const { error } = await supabase
            .from("support_tickets")
            .update({ 
                admin_reply: reply, 
                status: targetStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", ticketId);

        if (error) throw error;

        res.json({ success: true, message: "Email sent and ticket updated" });
    } catch (error: any) {
        console.error("Error in admin/reply:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
