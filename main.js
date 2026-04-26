const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_THINKING = "disabled";
const REQUEST_URL = "https://api.deepseek.com/chat/completions";
const SYSTEM_PROMPT =
    "You are a professional translation engine. Translate the provided text accurately and naturally. Return translation only, without explanations, notes, or extra formatting.";
const SUPPORTED_MODELS = new Set(["deepseek-v4-flash", "deepseek-v4-pro"]);

function normalizeLanguage(language) {
    return language === "auto" ? "auto-detected source language" : language;
}

function extractTranslation(data) {
    const choice = data && data.choices && data.choices[0];
    const message = choice && choice.message;
    const content = message && message.content;

    if (typeof content !== "string" || !content.trim()) {
        throw new Error(`DeepSeek returned an unexpected response: ${JSON.stringify(data)}`);
    }

    return content.trim().replace(/^"|"$/g, "");
}

function resolveModel(selectedModel) {
    return SUPPORTED_MODELS.has(selectedModel) ? selectedModel : DEFAULT_MODEL;
}

function resolveThinking(selectedThinking) {
    if (selectedThinking === true || selectedThinking === "enabled") {
        return "enabled";
    }

    return DEFAULT_THINKING;
}

async function translate(text, from, to, options) {
    if (!text || !text.trim()) {
        return "";
    }

    const { config = {}, utils } = options;
    const { tauriFetch: fetch } = utils;
    const apiKey = (config.apiKey || "").trim();
    const model = resolveModel(config.model);
    const thinking = resolveThinking(config.thinking);

    if (!apiKey) {
        throw new Error("DeepSeek API Key is required.");
    }

    const response = await fetch(REQUEST_URL, {
        method: "POST",
        url: REQUEST_URL,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: {
            type: "Json",
            payload: {
                model,
                thinking: { type: thinking },
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT,
                    },
                    {
                        role: "user",
                        content: `Translate the following text from ${normalizeLanguage(from)} to ${to}:\n${text}`,
                    },
                ],
                max_tokens: 2000,
                ...(thinking === "disabled"
                    ? {
                          temperature: 0.1,
                          top_p: 0.95,
                          frequency_penalty: 0,
                          presence_penalty: 0,
                      }
                    : {}),
            },
        },
    });

    if (!response.ok) {
        throw new Error(
            `Http Request Error\nHttp Status: ${response.status}\n${JSON.stringify(response.data)}`
        );
    }

    return extractTranslation(response.data);
}
