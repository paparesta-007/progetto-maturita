import express from "express";
import getSystemPrompt from "../static/prompt/systemPrompt.js";
import { OPENROUTER_KEY, ADMIN_ACCESS } from "../config/enviroments.js";
import { requireAuth } from "../middleware/auth.js";
import { applyPromptCaching } from "../utils/promptCaching.js";
import { BETTER_VIEW_JSON_SCHEMA, supportsStructuredOutput } from "../utils/betterViewSchema.js";
import { PDFParse } from "pdf-parse";
import * as xlsx from "xlsx";
import mammoth from "mammoth";

const router = express.Router();

async function processFilesForPrompt(attachedFiles: any[], message: string, supportsVision: boolean): Promise<any> {
	let textAttachments = "";
	const imageAttachments: any[] = [];

	if (attachedFiles && attachedFiles.length > 0) {
		for (const f of attachedFiles) {
			if (f.type === "image_url") {
				if (supportsVision) {
					imageAttachments.push({
						type: "image_url",
						image_url: { url: f.url }
					});
				} else {
					textAttachments += `\n\n[Allegato Immagine: ${f.name || "Immagine"} - Non visibile perché il modello selezionato non supporta l'analisi di immagini]`;
				}
			} else if (f.type === "file_url") {
				try {
					const matches = f.url.match(/^data:(.+);base64,(.+)$/);
					if (matches) {
						const mimeType = matches[1];
						const base64Data = matches[2];
						const dataBuffer = Buffer.from(base64Data, "base64");
						const fileName = f.name || "allegato";
						const fileExt = fileName.split('.').pop()?.toLowerCase();

						if (mimeType === "application/pdf" || fileExt === "pdf") {
							const parser = new PDFParse({ data: dataBuffer });
							const result = await parser.getText({ pageJoiner: "\n" });
							let extractedText = result.text || "";
							await parser.destroy();

							const MAX_CHARS = 150000;
							if (extractedText.length > MAX_CHARS) {
								extractedText = extractedText.substring(0, MAX_CHARS) + "\n... [Contenuto troncato per motivi di spazio] ...";
							}

							textAttachments += `\n\n--- INIZIO FILE PDF ALLEGATO: ${fileName} ---\n${extractedText}\n--- FINE FILE PDF ALLEGATO: ${fileName} ---\n`;
						} else if (fileExt === "docx") {
							const docxResult = await mammoth.extractRawText({ buffer: dataBuffer });
							let extractedText = docxResult.value || "";

							const MAX_CHARS = 150000;
							if (extractedText.length > MAX_CHARS) {
								extractedText = extractedText.substring(0, MAX_CHARS) + "\n... [Contenuto troncato per motivi di spazio] ...";
							}

							textAttachments += `\n\n--- INIZIO DOCUMENTO WORD ALLEGATO: ${fileName} ---\n${extractedText}\n--- FINE DOCUMENTO WORD ALLEGATO: ${fileName} ---\n`;
						} else if (fileExt === "xlsx" || fileExt === "xls") {
							const workbook = xlsx.read(dataBuffer, { type: "buffer" });
							let excelText = "";
							workbook.SheetNames.forEach(sheetName => {
								const worksheet = workbook.Sheets[sheetName];
								const sheetCsv = xlsx.utils.sheet_to_csv(worksheet);
								excelText += `\n[Foglio: ${sheetName}]\n${sheetCsv}\n`;
							});

							const MAX_CHARS = 150000;
							if (excelText.length > MAX_CHARS) {
								excelText = excelText.substring(0, MAX_CHARS) + "\n... [Contenuto troncato per motivi di spazio] ...";
							}

							textAttachments += `\n\n--- INIZIO FOGLIO DI CALCOLO ALLEGATO: ${fileName} ---\n${excelText}\n--- FINE FOGLIO DI CALCOLO ALLEGATO: ${fileName} ---\n`;
						} else {
							// Leggi come testo (UTF-8) per csv, json, txt, etc.
							let extractedText = dataBuffer.toString("utf-8");
							
							const MAX_CHARS = 150000;
							if (extractedText.length > MAX_CHARS) {
								extractedText = extractedText.substring(0, MAX_CHARS) + "\n... [Contenuto troncato per motivi di spazio] ...";
							}

							textAttachments += `\n\n--- INIZIO FILE ALLEGATO: ${fileName} ---\n${extractedText}\n--- FINE FILE ALLEGATO: ${fileName} ---\n`;
						}
					}
				} catch (err) {
					console.error("Errore durante l'estrazione del testo dal file allegato:", err);
					textAttachments += `\n\n[Errore: Impossibile leggere il contenuto del file ${f.name || "allegato"}]`;
				}
			}
		}
	}

	const finalMessage = message + textAttachments;

	if (imageAttachments.length > 0) {
		return [
			{ type: "text", text: finalMessage || "Immagine in allegato" },
			...imageAttachments
		];
	} else {
		return finalMessage;
	}
}

type BetterViewRenderMode = "html" | "markdown";

let cachedModels: any[] = [];
let lastFetchTime = 0;

async function getOpenRouterModels(): Promise<any[]> {
	const now = Date.now();
	if (cachedModels.length > 0 && (now - lastFetchTime < 3600000)) {
		return cachedModels;
	}
	try {
		const res = await fetch("https://openrouter.ai/api/v1/models");
		if (res.ok) {
			const data = await res.json();
			cachedModels = data.data || [];
			lastFetchTime = now;
		}
	} catch (e) {
		console.error("Errore recupero info modelli da OpenRouter:", e);
	}
	return cachedModels;
}

async function checkModelPriceAccess(modelName: string, userPassword?: string, webSearch?: boolean): Promise<boolean> {
	if (webSearch) {
		if (!userPassword || userPassword !== ADMIN_ACCESS) {
			return false;
		}
	}

	const models = await getOpenRouterModels();
	const modelInfo = models.find(m => m.id === modelName);
	if (!modelInfo) {
		return true;
	}

	const costInput = Number(modelInfo.pricing?.prompt || 0) * 1000000;
	const costOutput = Number(modelInfo.pricing?.completion || 0) * 1000000;
	const totalCost = costInput + costOutput;

	if (totalCost > 2) {
		if (!userPassword || userPassword !== ADMIN_ACCESS) {
			return false;
		}
	}
	return true;
}

function isCodeOrDebugIntent(message: string): boolean {
	if (!message || typeof message !== "string") return false;

	const normalized = message.trim();

	// Strong signals: actual code blocks, file paths with extensions, explicit coding requests,
	// or clear programming syntax patterns. Avoids matching generic words like "class", "import", "bug"
	// that appear in everyday conversation.
	const strongCodeSignals = [
		/```[\s\S]+?```/,                                                           // code blocks in input
		/\.(py|js|ts|tsx|jsx|cpp|java|cs|go|rs|html|css|sh|sql|rb|php|swift|kt)\b/i, // file extensions
		/\b(codice sorgente|scrivi codice|scrivi una funzione|implementa una classe)\b/i,
		/\b(write code|write a function|write a script|generate code|code snippet)\b/i,
		/\b(debuggare|fixare il codice|risolvi l'errore|stacktrace|traceback|stack trace)\b/i,
		/\b(debug this|fix this code|fix the bug|refactor this|compile error|build failed|runtime error|syntax error)\b/i,
		// Actual programming syntax patterns (not plain words)
		/\b(public\s+class|private\s+class|def\s+\w+\s*\(|function\s+\w+\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|import\s+\w+\s+from)\b/,
		/=>\s*\{/,                                                                   // arrow function
		/\b(npm|pip|cargo|gradle|maven|docker)\s+(install|run|build|start)\b/i
	];

	return strongCodeSignals.some((rx) => rx.test(normalized));
}

router.post("/api/completion/chat", requireAuth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
	try {
		const { message, history: rawHistory, modelName, systemPromptUser, personalInfo, tone, allowedCustomInstructions, reasoning, isBetterView, temperature, webSearch, adminPassword } = req.body;
		const history = Array.isArray(rawHistory) ? rawHistory : [];

		const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";

		const allowed = await checkModelPriceAccess(selectedModel, adminPassword, webSearch);
		if (!allowed) {
			res.status(403).json({ error: "Accesso negato: Il modello selezionato o la ricerca web richiedono privilegi di amministratore. Inserisci la password corretta." });
			return;
		}
		const betterViewRenderMode: BetterViewRenderMode = isBetterView && !isCodeOrDebugIntent(message || "") ? "html" : "markdown";
		const systemPrompt = getSystemPrompt({ selectedModel, systemPromptUser, personalInfo, tone, allowedCustomInstructions, isBetterView, betterViewRenderMode } as any);

		const reasoningEffortMap: Record<string, string> = {
			fast: "minimal",
			standard: "medium",
			accurate: "high"
		};
		const reasoningEffort = reasoning ? reasoningEffortMap[reasoning] || "medium" : "medium";

		const models = await getOpenRouterModels();
		const modelInfo = models.find(m => m.id === selectedModel);
		const supportsVision = modelInfo?.architecture?.input_modalities?.includes("image") ?? true;

		const userContent = await processFilesForPrompt(req.body.attachedFiles, message, supportsVision);

		const rawMessages = [
			{ role: "system", content: systemPrompt },
			...history,
			{ role: "user", content: userContent }
		];
		const messages = applyPromptCaching(rawMessages);

		const startTime = Date.now();

		// Configure plugins if webSearch is active (OpenRouter Web Search Plugin)
		const plugins = webSearch ? [
			{
				id: "web",
			}
		] : undefined;

		const isStructured = isBetterView && betterViewRenderMode === 'html' && supportsStructuredOutput(selectedModel);

		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${OPENROUTER_KEY}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "http://localhost:3000/completion",
				"X-Title": "NomeTuaApp",
				"X-OpenRouter-Cache": "true"
			},
			body: JSON.stringify({
				model: selectedModel,
				messages: messages,
				stream: false,
				temperature: temperature ?? 1.0,
				reasoning: { effort: reasoningEffort },
				provider: { allow_fallbacks: false },
				plugins: plugins,
				...(isStructured ? {
					response_format: {
						type: "json_schema",
						json_schema: {
							name: "better_view_sections",
							strict: true,
							schema: BETTER_VIEW_JSON_SCHEMA
						}
					}
				} : {})
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();

		const text = data.choices[0]?.message?.content || "";
		const reasoningContent = data.choices[0]?.message?.reasoning || null;
		const usage = {
			...data.usage,
			prompt_tokens: data.usage?.prompt_tokens || 0,
			completion_tokens: data.usage?.completion_tokens || 0,
			total_tokens: data.usage?.total_tokens || 0,
			cost: data.usage?.cost || data.cost || 0
		};

		const endTime = Date.now();

		const latencyMs = endTime - startTime;
		const latencySec = latencyMs / 1000;

		const throughput = latencySec > 0 && usage.outputTokens
			? (usage.outputTokens / latencySec)
			: 0;

		console.log("******TEST COMPLETATO: METRICHE******");
		console.log("Usage:", usage);
		console.log(`Latenza: ${latencyMs} ms, Throughput: ${throughput.toFixed(2)} t/s`);
		if (reasoningContent) console.log(`Reasoning presente: ${reasoningContent.length} caratteri`);

		let sections = null;
		let finalRenderMode = betterViewRenderMode;
		if (isStructured) {
			try {
				const parsed = JSON.parse(text);
				if (parsed && Array.isArray(parsed.sections)) {
					sections = parsed.sections;
					finalRenderMode = "structured" as any;
				}
			} catch (err) {
				console.warn("Failing parsing structured output JSON:", err);
			}
		}

		res.send({
			text,
			sections,
			renderMode: finalRenderMode,
			usage,
			suggestedQuestions: [],
			reasoning: reasoningContent,
			metrics: {
				latencyMs: Math.round(latencyMs),
				throughput: parseFloat(throughput.toFixed(2))
			}
		});

	} catch (error) {
		next(error);
	}
});

router.post("/api/streamingOutput", requireAuth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
	try {

		const { message, history, modelName, systemPromptUser, personalInfo,
			tone, allowedCustomInstructions, reasoning, isBetterView, temperature, webSearch, adminPassword } = req.body;
		const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";

		const allowed = await checkModelPriceAccess(selectedModel, adminPassword, webSearch);
		if (!allowed) {
			res.status(403).json({ error: "Accesso negato: Il modello selezionato o la ricerca web richiedono privilegi di amministratore. Inserisci la password corretta." });
			return;
		}
		const betterViewRenderMode: BetterViewRenderMode = isBetterView && !isCodeOrDebugIntent(message || "") ? "html" : "markdown";

		console.log("Received reasoning level from client:", reasoning);
		const reasoningEffortMap: Record<string, string> = {
			fast: "minimal",
			standard: "medium",
			accurate: "high"
		};
		const reasoningEffort = reasoning ? reasoningEffortMap[reasoning] || "medium" : "medium";

		const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
		console.log("Custom User Instruction:", systemPromptUser);

		const systemPrompt = getSystemPrompt({
			selectedModel,
			systemPromptUser,
			personalInfo,
			tone,
			allowedCustomInstructions,
			isBetterView,
			betterViewRenderMode
		} as any);

		const models = await getOpenRouterModels();
		const modelInfo = models.find(m => m.id === selectedModel);
		const supportsVision = modelInfo?.architecture?.input_modalities?.includes("image") ?? true;

		const userContent = await processFilesForPrompt(req.body.attachedFiles, message, supportsVision);

		const rawMessages = [
			{ role: "system", content: systemPrompt },
			...history,
			{ role: "user", content: userContent }
		];
		const messages = applyPromptCaching(rawMessages);

		const controller = new AbortController();
		req.on("close", () => {
			console.log("Client disconnesso prima della fine. Aborto richiesta a OpenRouter.");
			controller.abort();
		});

		const isStructured = isBetterView && betterViewRenderMode === 'html' && supportsStructuredOutput(selectedModel);

		// Configure plugins if webSearch is active (OpenRouter Web Search Plugin)
		const plugins = webSearch ? [
			{
				id: "web",
			}
		] : undefined;

		let response;
		if (isStructured) {
			response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
				method: "POST",
				signal: controller.signal,
				headers: {
					"Authorization": `Bearer ${OPENROUTER_KEY}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "http://localhost:3000/streamingOutput",
					"X-Title": "NomeTuaApp",
					"X-OpenRouter-Cache": "true"
				},
				body: JSON.stringify({
					model: selectedModel,
					messages: messages,
					stream: false,
					temperature: temperature ?? 1.0,
					reasoning: { effort: reasoningEffort },
					provider: { allow_fallbacks: false },
					plugins: plugins,
					response_format: {
						type: "json_schema",
						json_schema: {
							name: "better_view_sections",
							strict: true,
							schema: BETTER_VIEW_JSON_SCHEMA
						}
					}
				})
			});
		} else {
			response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
				method: "POST",
				signal: controller.signal,
				headers: {
					"Authorization": `Bearer ${OPENROUTER_KEY}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "http://localhost:3000/streamingOutput",
					"X-Title": "NomeTuaApp",
					"X-OpenRouter-Cache": "true"
				},
				body: JSON.stringify({
					model: selectedModel,
					messages: messages,
					stream: true,
					stream_options: { include_usage: true },
					temperature: temperature ?? 1.0,
					reasoning: { effort: reasoningEffort },
					provider: { allow_fallbacks: false },
					plugins: plugins
				})
			});
		}

		if (isStructured) {
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`OpenRouter Streaming Error (Structured): ${response.status} - ${errorText}`);
			}

			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Transfer-Encoding", "chunked");
			res.setHeader("X-Accel-Buffering", "no");
			res.flushHeaders();

			const data = await response.json();
			const text = data.choices[0]?.message?.content || "";
			const reasoningContent = data.choices[0]?.message?.reasoning || null;
			const usage = data.usage || {};

			let sections = [];
			try {
				const parsed = JSON.parse(text);
				sections = parsed.sections || [];
			} catch (e) {
				sections = [{ type: "markdown", content: text }];
			}

			res.write(JSON.stringify({ type: "meta", renderMode: "structured" }) + "\n");
			
			if (reasoningContent) {
				res.write(JSON.stringify({ type: "reasoning", content: reasoningContent }) + "\n");
			}
			
			res.write(JSON.stringify({ type: "text", content: text }) + "\n");
			res.write(JSON.stringify({ type: "structured", sections }) + "\n");

			if (Object.keys(usage).length > 0) {
				res.write(JSON.stringify({ type: "usage", content: usage }) + "\n");
			}
			res.end();
			return;
		}

		if (!response.ok || !response.body) {
			const errorText = await response.text();
			throw new Error(`OpenRouter Streaming Error: ${response.status} - ${errorText}`);
		}

		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.setHeader("Transfer-Encoding", "chunked");
		res.setHeader("X-Accel-Buffering", "no");
		res.flushHeaders();
		res.write(JSON.stringify({ type: "meta", renderMode: betterViewRenderMode }) + "\n");

		const reader = response.body.getReader();
		const decoder = new TextDecoder("utf-8");
		let buffer = "";

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					const trimmedLine = line.trim();
					if (trimmedLine.startsWith("data: ")) {
						const dataStr = trimmedLine.slice(6);
						if (dataStr === "[DONE]") continue;

						try {
							const parsed = JSON.parse(dataStr);
							const reasoningPart = parsed.choices?.[0]?.delta?.reasoning;
							const textPart = parsed.choices?.[0]?.delta?.content;
							const usagePart = parsed.usage;

							if (reasoningPart) {
								res.write(JSON.stringify({ type: "reasoning", content: reasoningPart }) + "\n");
							}

							if (textPart) {
								res.write(JSON.stringify({ type: "text", content: textPart }) + "\n");
								await delay(3);
							}

							if (usagePart && Object.keys(usagePart).length > 0) {
								res.write(JSON.stringify({ type: "usage", content: usagePart }) + "\n");
								console.log("OpenRouter Stream Usage:", usagePart);
							}
						} catch (parseError) {
							console.warn("⚠️ Errore nel parsing del chunk JSON:", parseError);
						}
					}
				}
			}
		} catch (streamError: any) {
			console.error("Errore durante lo streaming nativo:", streamError);
			try {
				res.write(JSON.stringify({ type: "error", error: streamError.message || "Errore durante lo streaming dei dati." }) + "\n");
			} catch (writeErr) {
				console.error("Impossibile trasmettere l'errore al client:", writeErr);
			}
		} finally {
			res.end();
		}

		res.on("close", () => {
			console.log("Client disconnesso dalla stream.");
			reader.cancel().catch(() => { });
		});

	} catch (error) {
		next(error);
	}
});

export default router;
