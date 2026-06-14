export const BETTER_VIEW_JSON_SCHEMA = {
    type: "object",
    properties: {
        sections: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: { type: "string", enum: ["markdown", "html"] },
                    content: { type: "string" }
                },
                required: ["type", "content"],
                additionalProperties: false
            }
        }
    },
    required: ["sections"],
    additionalProperties: false
};

export function supportsStructuredOutput(modelId: string): boolean {
    if (!modelId) return false;
    const lower = modelId.toLowerCase();
    
    // Modelli principali che supportano structured output (json_schema) su OpenRouter
    if (lower.includes("gpt-4o") || lower.includes("gpt-4-o") || lower.includes("o1-") || lower.includes("o3-")) return true;
    if (lower.includes("gemini-2.0") || lower.includes("gemini-2.5") || lower.includes("gemini-exp")) return true;
    if (lower.includes("claude-3-5") || lower.includes("claude-3.5") || lower.includes("claude-3-7") || lower.includes("claude-3.7")) return true;
    if (lower.includes("mistral-large") || lower.includes("codestral")) return true;
    if (lower.includes("mimo-v2.5")) return true;
    
    return false;
}
