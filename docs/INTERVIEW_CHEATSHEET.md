# Interview / Walkthrough Cheat Sheet

## 20-second pitch

“PeachyPawz is an explainable longitudinal pet-health timeline. Instead of just storing records or attaching a generic chatbot, it learns a pet-specific baseline, detects meaningful change deterministically, bundles the evidence, and then uses AI only to explain that evidence conversationally. The goal is better understanding and better vet conversations — not diagnosis.”

## Three strongest technical decisions

### 1. Deterministic analytics before AI

Why: reproducible math, chronology, units and evidence IDs should not depend on model behavior.

### 2. Human review before timeline mutation

Why: OCR/vision can be wrong, and wrong-pet attachment is a serious data-integrity problem.

### 3. Conversation memory is not evidence

Why: long-running chat should feel coherent, but earlier AI text must never silently become a medical fact. Every pet-specific follow-up re-checks current records.

## Why personal baseline?

Generic thresholds can miss the product question. PetOlife asks for personalization; PeachyPawz first asks whether a change is unusual relative to this pet's recorded history.

## Why no health score?

A score hides assumptions and uncertainty. PeachyPawz shows actual changes, confidence/evidence and responsible action.

## Why localStorage?

Hackathon reliability and scope. Authentication/API protection is real, but production persistence would be MongoDB + private object storage + pet-level authorization. The limitation is intentionally documented rather than hidden.

## What would you build with two more weeks?

1. authorized MongoDB/object-storage persistence
2. conflict/duplicate data-quality center
3. Vet Brief PDF export
4. reminders
5. Health Data Inbox + one explicit connector
6. automated tests/observability

## Native evolution

- camera scan
- share sheet
- offline local DB
- sync queue + idempotency/conflicts
- biometric lock
- local/push reminders
- wearables

Keep server-side health interpretation consistent across web/iOS/Android.

## If asked “Where is the AI value?”

Not in arithmetic. AI value appears in:

- turning a multi-event timeline into a coherent story
- answering temporal follow-ups naturally
- recovering relevant older document context
- reducing manual document transcription

## If asked “How do you prevent hallucinations?”

You cannot guarantee a model never hallucinates, so the architecture reduces impact:

- bounded evidence
- pet-scoped retrieval
- deterministic facts
- evidence-ID validation
- cautious language
- fallback
- user review for data ingestion
