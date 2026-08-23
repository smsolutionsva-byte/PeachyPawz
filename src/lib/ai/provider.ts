import OpenAI from "openai";

export type AIProvider = "groq" | "openai";

type AIClientConfig = {
  provider: AIProvider;
  client: OpenAI;
  textModel: string;
  visionModel: string;
};

function selectedProvider(): AIProvider | null {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq" || explicit === "openai") return explicit;

  // Friendly default for the hackathon: if a Groq key exists, use Groq.
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function isAIConfigured() {
  const provider = selectedProvider();
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY);
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
      // Separate vision model so JPG/PNG document extraction works too.
      visionModel: process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b",
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
