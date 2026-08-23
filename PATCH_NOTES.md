# PeachyPawz Conversational Memory Patch

Adds:
- per-user/per-pet persistent chat history in browser storage (up to 120 turns)
- recent-turn context for natural follow-ups
- relevance retrieval over older conversation turns
- pet-scoped timeline/document retrieval on every question
- document-memory events with up to 8,000 characters of reviewed extracted text
- New chat control
- deterministic fallback support for documents, appetite, symptoms, diet, vaccines, labs, medications, vet visits, weight and activity
- prompt rule that conversation memory is context only, never medical evidence

Apply over the current project root, then run `npm run dev` or push to GitHub for Vercel to rebuild.
