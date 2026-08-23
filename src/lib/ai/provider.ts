import OpenAI from "openai";

export type AIProvider = "groq" | "openrouter" | "openai";

type AIClientConfig = {
  provider: AIProvider;
  client: OpenAI;
  textModel: string;
  visionModel: string;
};

function selectedProvider(): AIProvider | null {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq" || explicit === "openrouter" || explicit === "openai") return explicit;

  // Friendly hackathon defaults: prefer the free/low-cost providers when configured.
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function isAIConfigured() {
  const provider = selectedProvider();
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY);
  if (provider === "openrouter") return Boolean(process.env.OPENROUTER_API_KEY);
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return false;
}

export function getAIClient(): AIClientConfig | null {
  const provider = selectedProvider();

  if (provider === "groq" && process.env.GROQ_API_KEY) {
    return {
      provider,
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      textModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      visionModel: process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b",
    };
  }

  if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
    return {
      provider,
      client: new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://peachypawz.vercel.app",
          "X-Title": "PeachyPawz",
        },
      }),
      textModel: process.env.OPENROUTER_MODEL || "openrouter/free",
      visionModel: process.env.OPENROUTER_VISION_MODEL || process.env.OPENROUTER_MODEL || "openrouter/free",
    };
  }

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return {
      provider,
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      textModel: process.env.OPENAI_MODEL || "gpt-5",
      visionModel: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-5",
    };
  }

  return null;
}
