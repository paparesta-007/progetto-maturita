import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase.js";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Missing Authorization header" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Missing Bearer token" });
        }

        // Verifica il token con Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error("Auth Error:", error?.message);
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        // Aggiungi l'utente all'oggetto Request per gli endpoint successivi
        (req as any).user = user;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error in Auth Middleware" });
    }
};
