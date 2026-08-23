# PeachyPawz

**A clearer story for every paw.**

PeachyPawz is a mobile-first prototype for the PetOlife AI Code-a-Thon. It turns pet-health records into an explainable longitudinal timeline: what happened, what changed, what patterns exist, what evidence supports them, and what may be worth discussing with a veterinarian.

## First-run experience

A real user no longer lands inside synthetic Max data.

```text
Google sign-in
   ↓
Create pet
   ↓
Name + small optional pet details
   ↓
Choose whether to allow AI analysis
   ↓
Upload a health document / add manually / start empty
   ↓
Timeline begins from user-approved data
```

Synthetic Max/Luna records are still included for the hackathon demo, but they are loaded only when the user explicitly chooses the clearly labelled demo option.

## Product thesis

Pet-health data is fragmented across vet notes, measurements, medications, documents, owner observations and devices. The core problem is not storage. It is understanding **what changed over time, how unusual it is for this pet, what else happened nearby in time, and which records support the conclusion**.

```text
Raw pet data
  → normalized timeline
  → personal baseline
  → deterministic change detection
  → pattern detection
  → evidence bundle
  → optional AI explanation
  → responsible action
```

The timeline is the source of truth. The LLM is not.

## Implemented

- Google OAuth with Auth.js
- Protected AI/document API routes
- First-run pet onboarding
- Zero fabricated health records for new users
- Explicit AI-processing consent in onboarding
- Empty-state flow with upload/manual entry
- Optional, clearly labelled synthetic judge demo
- Mobile-first home/timeline/insights/chat UX
- Weight and activity trend calculations
- Personal-baseline logic
- Multi-metric pattern detection
- Explainable “Why am I seeing this?” evidence drawer
- Timeline provenance and confidence labels
- Timeline search and filters
- Manual health-event entry
- Timeline-grounded Health Story
- Timeline-aware pet Q&A
- Vet Visit preparation brief
- Deterministic fallback when AI is disabled/unavailable
- PDF/TXT document extraction
- Optional AI image extraction when configured + consented
- Review-before-save document workflow
- Wrong-pet mismatch warning
- Reduced-motion and responsive support

## Important prototype persistence note

Google OAuth authenticates the user, while health records are currently stored in **browser localStorage scoped to the signed-in account**. This keeps the code-a-thon demo resilient and avoids making the main flow depend on a database.

That means health data does **not yet sync across devices/browsers**. The production path is MongoDB/object storage with owner + pet authorization. `MONGODB_URI` remains reserved for that next step.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind pipeline + custom CSS
- Auth.js / NextAuth v5 beta
- Google OAuth
- Zod
- OpenAI Responses API (optional, server-side)
- `pdf-parse`
- localStorage prototype persistence

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm exec auth secret
npm run dev
```

`npm exec auth secret` writes a secure `AUTH_SECRET` for Auth.js.

### Google OAuth

Create a Google OAuth **Web application** and add this local callback URI:

```text
http://localhost:3000/api/auth/callback/google
```

Put the credentials into `.env.local`:

```env
AUTH_SECRET=generated_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
```

Then restart `npm run dev`.

## Optional AI

Do **not** ask end users to paste an OpenAI key into the browser. The deployment owner configures it server-side:

```env
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-5
```

The onboarding then asks the pet parent whether they consent to AI analysis of submitted health records. If they decline, deterministic timeline analytics continue to work and AI calls are not made for story/chat/image extraction.

## Document import

Supported prototype types:

- PDF
- TXT
- JPG
- PNG

PDF/TXT uses deterministic extraction where possible. Image extraction uses the optional server-side AI adapter only when the user enabled AI analysis.

Every extraction is a proposal. Nothing enters the health timeline until the user reviews and approves it.

A synthetic demo report remains available at:

```text
public/demo/Max_Vet_Report.pdf
```

## AI architecture

```text
Reviewed health events
   ↓
Pet-ID filter
   ↓
Deterministic analytics
   ↓
Evidence IDs
   ↓
Bounded evidence bundle
   ↓
AI allowed by user?
   ├─ no  → deterministic explanation
   └─ yes → server-side AIService
                 ↓
        validation + safety filter
                 ↓
              UI
```

AI is used for explanation, bounded timeline Q&A, and optional image-document extraction. It is not used for percentages, event ordering, baseline math, pet selection, medication decisions, or diagnosis.

## Five-minute judge flow

1. Sign in with Google.
2. Create a pet profile.
3. Show that the timeline is genuinely empty.
4. Choose **Upload a health document**.
5. Review extracted fields before approval.
6. Add a few manual measurements or explicitly load the synthetic Max demo story.
7. Open **What changed?**.
8. Open **Why am I seeing this?** and inspect evidence.
9. Generate the Health Story.
10. Ask a timeline question.
11. Open Prepare for Vet.

For the full synthetic storyline, choose **“Explicitly load the synthetic Max demo story”** during onboarding or from the empty state.

## Deploy

The easiest production demo host is Vercel because this is a Next.js app.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for GitHub → Vercel → Google OAuth setup.

## Repository map

```text
src/
  auth.ts                         Auth.js + Google provider
  app/
    api/auth/[...nextauth]/       OAuth route
    api/ai/                       protected story/chat/vet endpoint
    api/documents/extract/        protected document extraction
    page.tsx                      authentication gate
    globals.css
  components/
    LoginScreen.tsx               Google sign-in screen
    PeachyApp.tsx                 onboarding + application UX
    EventIcon.tsx
    Sparkline.tsx
  lib/
    ai/service.ts
    ai/safety.ts
    analytics.ts
    document-extraction.ts
    seed.ts                       optional synthetic judge data
    types.ts
```

## Documentation

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/TEST_PLAN.md`
- `docs/NATIVE_ROADMAP.md`
- `docs/DEMO_SCRIPT.md`
- `docs/DEPLOYMENT.md`

## Safety model

- Pet-specific answers require pet-scoped records.
- Imported documents are treated as untrusted data.
- AI processing requires explicit onboarding consent in the prototype.
- Medication-change and diagnostic language is restricted.
- Missing data is never interpreted as “normal.”
- Temporal correlation is not presented as causation.
- AI failure does not block manual records, timelines or deterministic analytics.
- API routes require an authenticated session.
