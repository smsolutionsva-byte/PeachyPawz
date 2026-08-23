# Groq Setup

Groq is the recommended low-cost/free-tier-friendly provider for the code-a-thon deployment.

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_private_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=qwen/qwen3.6-27b
```

Add these in Vercel → Project → Settings → Environment Variables and redeploy.

Never use `NEXT_PUBLIC_GROQ_API_KEY`.

For Groq, OpenRouter and OpenAI switching, see [`AI_PROVIDER_SETUP.md`](AI_PROVIDER_SETUP.md).
