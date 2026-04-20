import express from 'express';

// ────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ────────────────────────────────────────────────────────────────

export interface ServerLogEntry {
    type: 'HTTP' | 'SYSTEM';
    timestamp: string;
    date: string;
    // Fields for HTTP
    requestId?: string;
    method?: string;
    url?: string;
    params?: any;
    response?: any;
    status?: number;
    error?: boolean;
    durationMs?: number;
    clientIp?: string;
    userAgent?: string;
    // Fields for SYSTEM
    level?: string;
    message?: string;
}

export interface ClientLogEntry {
    type: string;
    message: string;
    stack: string | null;
    source: string | null;
    lineno: number | null;
    colno: number | null;
    url: string;
    timestamp: string;
    clientIp: string;
    userAgent: string;
}

// ────────────────────────────────────────────────────────────────
// STATE & CONSTANTS
// ────────────────────────────────────────────────────────────────

export const auditLogs: ServerLogEntry[] = [];
export const MAX_AUDIT_LOGS = 500;

export const clientLogs: ClientLogEntry[] = [];
export const MAX_CLIENT_LOGS = 100;

// Salva i riferimenti originali a console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// ────────────────────────────────────────────────────────────────
// SYSTEM LOGGING FUNCTIONS
// ────────────────────────────────────────────────────────────────

/**
 * Aggiunge un log di sistema (SYSTEM) all'audit log
 */
export function addSystemLog(level: string, ...args: any[]) {
    const message = args.map(arg => {
        if (arg instanceof Error) {
            return arg.stack || arg.message;
        }
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.stringify(arg, null, 2);
            } catch (e) {
                return String(arg);
            }
        }
        return String(arg);
    }).join(' ');

    const now = new Date();
    const log: ServerLogEntry = {
        type: 'SYSTEM',
        level,
        message,
        date: now.toLocaleDateString('it-IT'),
        timestamp: now.toLocaleTimeString('it-IT', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    };

    auditLogs.unshift(log);
    if (auditLogs.length > MAX_AUDIT_LOGS) {
        auditLogs.pop();
    }
}

// ────────────────────────────────────────────────────────────────
// CONSOLE MONKEY PATCHING
// ────────────────────────────────────────────────────────────────

/**
 * Intercetta i console.log() e aggiunge al sistema di logging
 */
export function setupConsoleLogging() {
    console.log = (...args) => {
        originalConsoleLog.apply(console, args);
        addSystemLog('INFO', ...args);
    };

    console.error = (...args) => {
        originalConsoleError.apply(console, args);
        addSystemLog('ERROR', ...args);
    };

    console.warn = (...args) => {
        originalConsoleWarn.apply(console, args);
        addSystemLog('WARN', ...args);
    };
}

// ────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLERS
// ────────────────────────────────────────────────────────────────

/**
 * Imposta i global error handlers
 */
export function setupGlobalErrorHandlers() {
    process.on('uncaughtException', (err) => {
        addSystemLog('CRITICAL', 'Uncaught Exception:', err.message, err.stack);
        originalConsoleError('CRITICAL: Uncaught Exception', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
        addSystemLog('CRITICAL', 'Unhandled Rejection at:', promise, 'reason:', reason);
        originalConsoleError('CRITICAL: Unhandled Rejection', reason);
    });
}

// ────────────────────────────────────────────────────────────────
// SUPABASE ACTION LOGGING
// ────────────────────────────────────────────────────────────────

/**
 * Registra un'azione di Supabase nel sistema di logging
 */
export async function logSupabaseAction(action: string, userId: string = "unknown") {
    const maskedUserId = userId.length > 4 ? userId.substring(0, 4) + "****" : "****";
    try {
        await fetch("http://localhost:3000/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "SUPABASE_ACTION",
                message: `Action: ${action} | User: ${maskedUserId}`,
                url: "localhost:3000"
            })
        });
    } catch (err) {
        originalConsoleError("Error logging supabase action:", err);
    }
}

// ────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ────────────────────────────────────────────────────────────────

/**
 * Middleware di logging per ogni richiesta HTTP
 * Registra le richieste e le risposte nell'audit log
 */
export const httpLoggingMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const start = Date.now();
    let responseBody = '';

    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = function (...args: any[]) {
        if (args[0] && (typeof args[0] === 'string' || Buffer.isBuffer(args[0]))) {
            responseBody += args[0].toString('utf8');
        }
        return (originalWrite as any)(...args);
    };

    res.end = function (...args: any[]) {
        if (args[0] && (typeof args[0] === 'string' || Buffer.isBuffer(args[0]))) {
            responseBody += args[0].toString('utf8');
        }
        return (originalEnd as any)(...args);
    };

    // Intercettiamo la fine della risposta per loggare lo stato
    res.on('finish', () => {
        // Evitiamo di loggare le chiamate agli endpoint di log stessi (evita loop e rumore)
        const logEndpoints = ['/api/logs', '/api/client-logs', '/api/internal-logs'];
        if (logEndpoints.some(e => req.originalUrl.startsWith(e))) {
            return;
        }

        const duration = Date.now() - start;
        let finalResponse: any = responseBody;
        try {
            if (responseBody) finalResponse = JSON.parse(responseBody);
        } catch (e) {
            // Ignora errore di parsing
        }

        const now = new Date();
        const clientIp = (
            req.ip ||
            req.connection.remoteAddress ||
            req.headers['x-forwarded-for'] ||
            'unknown'
        ) as string;

        const logEntry: ServerLogEntry = {
            type: 'HTTP',
            requestId: crypto.randomUUID(),
            date: now.toLocaleDateString('it-IT'),
            timestamp: now.toLocaleTimeString('it-IT', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            method: req.method,
            url: req.originalUrl,
            params: ['POST', 'PUT', 'PATCH'].includes(req.method)
                ? req.body
                : req.query,
            response: finalResponse,
            status: res.statusCode,
            error: res.statusCode >= 400,
            durationMs: duration,
            clientIp: clientIp,
            userAgent: req.headers['user-agent'] || 'unknown'
        };

        auditLogs.unshift(logEntry);
        if (auditLogs.length > MAX_AUDIT_LOGS) {
            auditLogs.pop();
        }
    });

    next();
};

// ────────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ────────────────────────────────────────────────────────────────

/**
 * Converte l'array dei log in formato JSON per l'API
 */
export function getAuditLogs() {
    return auditLogs;
}

/**
 * Converte l'array dei log del client in formato JSON per l'API
 */
export function getClientLogs() {
    return clientLogs;
}

/**
 * Svuota tutti i log
 */
export function clearAllLogs() {
    auditLogs.length = 0;
    clientLogs.length = 0;
}

/**
 * Aggiunge un log del client manualmente
 */
export function addClientLog(
    type: string,
    message: string,
    stack: string | null,
    source: string | null,
    lineno: number | null,
    colno: number | null,
    url: string,
    clientIp: string,
    userAgent: string
) {
    const log: ClientLogEntry = {
        type,
        message,
        stack,
        source,
        lineno,
        colno,
        url,
        timestamp: new Date().toISOString(),
        clientIp,
        userAgent
    };

    clientLogs.unshift(log);
    if (clientLogs.length > MAX_CLIENT_LOGS) {
        clientLogs.pop();
    }
}