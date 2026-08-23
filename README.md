# PeachyPawz

**A clearer story for every paw.**

PeachyPawz is an independent mobile-first prototype for the PetOlife AI Code-a-Thon. It turns longitudinal pet-health records into explainable, evidence-backed change summaries instead of behaving like a generic record vault or an ungrounded chatbot.

## Product thesis

Pet health data is fragmented across vet notes, documents, measurements, medications, owner observations, reminders and devices. The core problem is not storage. It is understanding **what changed over time, how unusual that change is for this pet, what else happened nearby in time, and which records support the conclusion**.

PeachyPawz follows this loop:

```text
Raw pet data
  → normalized timeline
  → personal baseline
  → deterministic change detection
  → pattern detection
  → evidence bundle
  → AI explanation
  → responsible action
```

The timeline is the source of truth. The LLM is not.

## What is implemented

### Core MVP
- Max demo profile plus a second pet (Luna) for pet-isolation behavior
- 90-day synthetic health timeline with a deliberate story
- Mobile-first home screen and bottom navigation
- Weight and activity change calculations
- Emerging/reliable personal-baseline logic
- Multi-metric pattern detection
- “Why am I seeing this?” evidence drawer
- Timeline provenance and confidence labels
- Timeline search and event filters
- Manual event entry
- AI Health Story
- Timeline-aware “Ask about Max” chat
- Vet Visit preparation brief
- No-key deterministic AI fallback
- Server-side optional OpenAI adapter
- PDF/TXT document extraction
- Optional image document extraction when an AI key is present
- Review-before-save import workflow
- Wrong-pet confirmation during import
- Reduced-motion support and touch-friendly interactions

### Deliberately not overbuilt
- No arbitrary health score
- No diagnosis engine
- No medication/dosage recommendations
- No microservices
- No silent record imports
- No hidden automatic pet assignment
- No LLM arithmetic
- No vector database for simple structured filtering
- No production auth in the hackathon demo

## Five-minute judge flow

1. Open **Max** on Home.
2. Read **What changed?** — weight, activity and appetite.
3. Open **Why am I seeing this?** to inspect evidence and deterministic calculations.
4. Open **Insights** and generate **Max’s Health Story**.
5. Open **Ask** and ask: `When did activity decline begin?`
6. Open **Timeline** and inspect the source records.
7. Import `public/demo/Max_Vet_Report.pdf`.
8. Review pet assignment, date, clinic and weight before approving.
9. Confirm the new timeline entries appear.
10. Open **Prepare for Vet** for the 90-day factual brief.

## Tech stack

- Next.js App Router
- React
- TypeScript
- Tailwind pipeline + custom design system CSS
- Zod validation
- Optional OpenAI Responses API adapter on the server
- `pdf-parse` for text-layer PDFs
- Browser localStorage for resilient demo-state persistence

### Why localStorage in the demo?

For a code-a-thon live demo, the highest-risk failure is an external dependency breaking the primary product flow. The UI state therefore persists locally and remains fully functional without a database or AI key. The architecture documents show how the same domain model maps to MongoDB with owner/pet access control in production.

This is a demo reliability tradeoff, not the proposed production persistence strategy.

## Setup

Requirements:
- Node.js 20+
- npm

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The prototype works without environment variables.

### Optional AI configuration

```env
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-5
```

The key is read only inside server routes. Never expose it through `NEXT_PUBLIC_*` variables.

With no key, the app uses deterministic story/chat fallbacks built from the same evidence bundle. With a key, the LLM is used only for bounded narration and timeline Q&A.

## Document import

Supported demo types:
- PDF
- TXT
- JPG
- PNG

PDF/TXT extraction works without an AI key when the document contains machine-readable text. Image extraction uses the optional server-side AI adapter.

Every extraction is a **proposal**. The user must review and approve fields before timeline insertion.

A sample PDF is included:

```text
public/demo/Max_Vet_Report.pdf
```

## AI architecture

```text
Health events
   ↓
Pet-ID filter
   ↓
Deterministic analytics
   ↓
Evidence IDs
   ↓
Bounded evidence bundle
   ↓
AIService
   ├─ deterministic fallback
   └─ optional LLM provider
   ↓
Output validation / safety language filter
   ↓
UI with provenance
```

### AI is used for
- Narrative summarization
- Natural-language timeline Q&A
- Optional image-document extraction

### AI is not used for
- Percentages
- Event ordering
- Baseline math
- Unit comparisons
- Pet selection
- Medication decisions
- Diagnosis

## Data model

The demo uses a normalized `HealthEvent` domain model:

```ts
{
  id,
  petId,
  type,
  date,
  title,
  summary,
  data,
  source,
  sourceLabel,
  sourceDocumentId,
  confidence,
  reviewStatus,
  createdAt,
  updatedAt
}
```

Production persistence can split high-value domains into specialized collections (`medications`, `labs`, `documents`, etc.) while retaining an appendable normalized timeline projection for rendering and retrieval.

## Safety model

- Pet-specific answers require pet-scoped timeline records.
- General knowledge must not be presented as a fact about the selected pet.
- Uploaded documents are treated as untrusted data, never as model instructions.
- Medication start/stop/dose-change language is blocked from generated advice.
- Emergency-like user wording returns short escalation guidance instead of a diagnostic essay.
- Claims of causation are avoided; temporal correlation is labelled explicitly.
- Missing data is not interpreted as normal.
- AI failure does not block record viewing, manual entry or deterministic analytics.

## Competitive differentiation

Current pet-health products already offer combinations of timelines, AI chat, record scanning, reminders and vet reports. PeachyPawz deliberately focuses the hero experience on:

1. **Personal baseline:** “Is this unusual for this pet?”
2. **Longitudinal change:** “What changed, and when?”
3. **Multi-signal context:** “What else happened during the same period?”
4. **Explainability:** every major insight opens into evidence.
5. **Responsible language:** correlation is not promoted to causation or diagnosis.

Research notes are in `docs/PRODUCT.md`.

## Repository map

```text
src/
  app/
    api/ai/                 AI story/chat/vet endpoint
    api/documents/extract/  document extraction endpoint
    globals.css             responsive product design system
    page.tsx
  components/
    PeachyApp.tsx           product shell + core screens
    EventIcon.tsx
    Sparkline.tsx
  lib/
    ai/
      service.ts            provider abstraction + fallback logic
      safety.ts             output/emergency safeguards
    analytics.ts            deterministic health analytics
    document-extraction.ts  structured extraction schema
    seed.ts                 90-day synthetic demo story
    types.ts                domain model

docs/
  PRODUCT.md
  ARCHITECTURE.md
  TEST_PLAN.md
  NATIVE_ROADMAP.md
  DEMO_SCRIPT.md
```

## Testing

A full test matrix is documented in `docs/TEST_PLAN.md`. High-priority automated tests for a production continuation should cover:
- percent change and baseline logic
- unit normalization
- missing-data behavior
- cross-pet isolation
- evidence-ID validation
- stale insight regeneration
- prompt-injection strings inside extracted documents
- unsafe medical-language rejection

## Deployment

Recommended hackathon deployment: Vercel.

```bash
npm run build
```

Set the optional `OPENAI_API_KEY` only in server-side deployment secrets.

Production evolution adds MongoDB/Object Storage and real authentication, but they are intentionally not required for the reliable judge demo.

## Product documentation

- [Product decisions, requirements and risks](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing & safety plan](docs/TEST_PLAN.md)
- [Android/iOS roadmap](docs/NATIVE_ROADMAP.md)
- [Five-minute demo script](docs/DEMO_SCRIPT.md)

## Limitations

- Demo state is browser-local, not account-synced.
- PDF extraction requires a text layer; scanned PDF OCR is a future adapter.
- Image OCR requires an AI key in this prototype.
- The heuristic PDF parser is intentionally narrow and exists for demo resilience, not clinical document coverage.
- Baselines are product analytics, not clinical reference ranges.
- Synthetic records are not medical advice or real patient data.

## Future roadmap

P1:
- MongoDB persistence + authentication
- versioned insight freshness
- stronger structured document extraction
- reminder engine
- richer multi-pet management

P2:
- Health Data Inbox
- connected sources with minimum OAuth scopes
- exportable vet PDF/JSON/CSV
- structured + semantic lifetime search
- family roles and sharing
- PWA offline queue

Native:
- Android/iOS camera scanning
- share sheet import
- local database and background sync
- push/local reminders
- biometric app lock
- voice notes
- wearable/device ingestion

---

PeachyPawz is a code-a-thon prototype, not a veterinary service.
