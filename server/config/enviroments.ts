import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverDir = path.resolve(__dirname, "..");

const candidateRoots = [
	serverDir,
	process.cwd(),
	path.resolve(process.cwd(), ".."),
];

const uniqueRoots = Array.from(new Set(candidateRoots));

const envCandidates = uniqueRoots.flatMap((root) => [
	path.resolve(root, ".env"),
	path.resolve(root, ".env.local"),
]);

const existingEnvFiles = envCandidates.filter((p) => fs.existsSync(p));

for (const envFile of existingEnvFiles) {
	dotenv.config({ path: envFile, override: true });
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		const lookedUp = existingEnvFiles.length > 0
			? existingEnvFiles.join(", ")
			: "nessun file .env trovato";
		throw new Error(`[ENV] Variabile obbligatoria mancante: ${name}. File caricati: ${lookedUp}`);
	}
	return value;
}

export const PORT = Number(process.env.PORT || 3000);
export const SUPABASE_URL = requireEnv("SUPABASE_URL");
export const SUPABASE_KEY = requireEnv("SUPABASE_SERVICE_KEY");
export const OPENROUTER_KEY = requireEnv("VITE_OPENROUTER_API_KEY");
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const ADMIN_ACCESS = process.env.ADMIN_ACCESS || "";