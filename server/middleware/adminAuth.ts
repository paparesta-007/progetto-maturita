import { Request, Response, NextFunction } from "express";
import { ADMIN_PASSWORD } from "../config/enviroments.js";
import crypto from "crypto";

/**
 * Middleware to protect admin routes using a simple password-based auth.
 * The password should be hashed/encrypted or checked against a secure secret.
 */
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("AdminBearer ")) {
        return res.status(401).json({ error: "Missing Admin Authorization" });
    }

    const providedPassword = authHeader.split(" ")[1];

    if (!providedPassword || !ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Simple comparison for now, but ensure ADMIN_PASSWORD is kept secret.
    // For enhanced security, you could use a hash comparison here.
    if (providedPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Forbidden: Incorrect Admin Password" });
    }

    next();
};
