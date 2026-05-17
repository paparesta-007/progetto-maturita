import express from "express";
import getSystemPrompt from "../static/prompt/systemPrompt.js";
import { OPENROUTER_KEY } from "../config/enviroments.js";
import { requireAuth } from "../middleware/auth.js";
import { applyPromptCaching } from "../utils/promptCaching.js";

const router = express.Router();

type BetterViewRenderMode = "html" | "markdown";

function isCodeOrDebugIntent(message: string): boolean {
	if (!message || typeof message !== "string") return false;

	const normalized = message.toLowerCase();
	const codeSignals = [
		/```[\s\S]*?```/,
		/\b(debug|bug|errore|error|stack trace|traceback|exception|fix|refactor|compile|build failed)\b/,
		/\b(function|class|interface|import|export|const|let|var|return|async|await|sql|query|regex)\b/,
		/\bjavascript|typescript|python|java|c\+\+|c#|php|go|rust|html|css|react|node\b/,
		/\bwrite code|scrivi codice|generate code|genera codice|implement|implementa\b/
	];

	return codeSignals.some((rx) => rx.test(normalized));
}

router.post("/api/completion/chat", requireAuth, async function (req: express.Request, res: express.Response, next: express.NextFunction) {
	try {
		const { message, history, modelName, systemPromptUser, personalInfo, tone, allowedCustomInstructions, reasoning, isBetterView } = req.body;

		const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";
		const betterViewRenderMode: BetterViewRenderMode = isBetterView && !isCodeOrDebugIntent(message || "") ? "html" : "markdown";
		const systemPrompt = getSystemPrompt({ selectedModel, systemPromptUser, personalInfo, tone, allowedCustomInstructions, isBetterView, betterViewRenderMode } as any);

		const reasoningEffortMap: Record<string, string> = {
			fast: "minimal",
			standard: "medium",
			accurate: "high"
		};
		const reasoningEffort = reasoning ? reasoningEffortMap[reasoning] || "medium" : "medium";

		let userContent: any = message;
		if (req.body.attachedFiles && req.body.attachedFiles.length > 0) {
			userContent = [{ type: "text", text: message || "Immagine in allegato" }];
			req.body.attachedFiles.forEach((f: any) => {
				if (f.type === "image_url") {
					userContent.push({
						type: "image_url",
						image_url: { url: f.url }
					});
				}
			});
		}

		const rawMessages = [
			{ role: "system", content: systemPrompt },
			...history,
			{ role: "user", content: userContent }
		];
		const messages = applyPromptCaching(rawMessages);

		const startTime = Date.now();

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
				reasoning: { effort: reasoningEffort },
				provider: { allow_fallbacks: false }
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

		res.send({
			text,
			renderMode: betterViewRenderMode,
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
			tone, allowedCustomInstructions, reasoning, isBetterView } = req.body;
		const selectedModel = modelName ? modelName : "google/gemini-2.0-flash-001";
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

		let userContent: any = message;
		if (req.body.attachedFiles && req.body.attachedFiles.length > 0) {
			userContent = [{ type: "text", text: message || "Immagine in allegato" }];
			req.body.attachedFiles.forEach((f: any) => {
				if (f.type === "image_url") {
					userContent.push({
						type: "image_url",
						image_url: { url: f.url }
					});
				}
			});
		}

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

		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
				reasoning: { effort: reasoningEffort },
				provider: { allow_fallbacks: false }
			})
		});

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
		} catch (streamError) {
			console.error("Errore durante lo streaming nativo:", streamError);
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
