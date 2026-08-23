# Groq setup for PeachyPawz

In Vercel → PeachyPawz → Settings → Environment Variables, add:

- `AI_PROVIDER` = `groq`
- `GROQ_API_KEY` = your private Groq API key
- `GROQ_MODEL` = `llama-3.3-70b-versatile`
- `GROQ_VISION_MODEL` = `qwen/qwen3.6-27b`

Apply them to Production (and Preview/Development if desired), save, then redeploy.

Do not create `NEXT_PUBLIC_GROQ_API_KEY`. The key must remain server-side.

PeachyPawz automatically detects Groq if `GROQ_API_KEY` exists even when `AI_PROVIDER` is omitted, but setting `AI_PROVIDER=groq` makes the deployment explicit.
