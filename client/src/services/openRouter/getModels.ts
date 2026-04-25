const ALLOWED_PROVIDERS = [
    "anthropic",
    "openai",
    "google",
    "deepseek",
    "minimax",
    "mistralai",
    "xiaomi"
];

const PROVIDER_NAMES: Record<string, string> = {
    "google": "Google",
    "openai": "OpenAI",
    "anthropic": "Anthropic",
    "mistralai": "Mistral AI",
    "deepseek": "DeepSeek",
    "minimax": "MiniMax",
    "xiaomi": "Xiaomi"
};

const getModels = async () => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        if (!response.ok) {
            console.error("Error fetching models:", response.statusText);
            return [];
        }
        
        const data = await response.json();
        const models = data.data || [];

        const filteredAndMapped = models
            .filter((m: any) => {
                const providerId = m.id.split("/")[0];
                return ALLOWED_PROVIDERS.includes(providerId);
            })
            .map((m: any) => {
                const providerId = m.id.split("/")[0];
                const rawName = m.name || "";
                const cleanName = rawName.includes(": ") ? rawName.split(": ")[1] : rawName;
                return {
                    model_id: m.id,
                    name_id: m.id,
                    name: cleanName,
                    provider: PROVIDER_NAMES[providerId] || providerId,
                    cost_per_input_token: Number(m.pricing?.prompt || 0) * 1000000,
                    cost_per_output_token: Number(m.pricing?.completion || 0) * 1000000
                };
            });

        return filteredAndMapped;
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
}

export default getModels;