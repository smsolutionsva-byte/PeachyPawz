# AI Provider Setup

PeachyPawz is designed to work without an LLM. When configured, the same AI service layer can use Groq, OpenRouter or OpenAI.

## Groq (recommended hackathon setup)

```env
AI_PROVIDER=groq
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=qwen/qwen3.6-27b
```

## OpenRouter

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/free
OPENROUTER_VISION_MODEL=openrouter/free
NEXT_PUBLIC_APP_URL=https://peachypawz.vercel.app
```

Free-router model availability/capabilities can change. If image extraction is unavailable for the selected route, users can still import text-based PDF/TXT records and manually review data.

## OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5
OPENAI_VISION_MODEL=gpt-5
```

## Security

Never use:

```env
NEXT_PUBLIC_GROQ_API_KEY=...
NEXT_PUBLIC_OPENROUTER_API_KEY=...
NEXT_PUBLIC_OPENAI_API_KEY=...
```

`NEXT_PUBLIC_` variables are exposed to browser bundles.

## Graceful degradation

Provider failure affects optional language/vision features, not the deterministic health timeline.
