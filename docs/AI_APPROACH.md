# AI Approach

## Goal

AI should reduce cognitive effort, not replace source data or veterinary judgment.

The system follows this hierarchy:

```text
Database / reviewed timeline
        ↓
Deterministic analytics
        ↓
Relevant-record retrieval
        ↓
Evidence bundle
        ↓
Optional LLM
        ↓
Validation + safety
        ↓
UI
```

## Why deterministic analytics comes first

LLMs are useful at explanation but poor choices for authoritative arithmetic and mutable longitudinal state. PeachyPawz therefore computes in TypeScript:

- percentage changes
- baseline ranges
- event ordering
- canonical weight-unit normalization
- evidence IDs
- pet filtering
- timeline search/filtering

The model receives these results rather than being asked to rediscover them.

## Personal baseline

A baseline is explicitly stateful:

- **Insufficient:** too few records
- **Emerging:** early history exists
- **Reliable:** enough earlier records exist for the prototype heuristic

The UI never presents false precision such as “94.731% confidence.” Confidence is qualitative and tied to evidence quantity/context.

## Evidence bundles

Every pet-specific answer may cite only event IDs that exist in the retrieved records for the selected pet.

Conceptual bundle:

```json
{
  "petId": "max",
  "question": "When did activity decline begin?",
  "analytics": {
    "activityChangePercent": -23.2
  },
  "evidence": [
    { "id": "activity-01", "date": "2026-06-03", "value": 82 },
    { "id": "activity-12", "date": "2026-08-04", "value": 63 }
  ]
}
```

Unknown model-generated evidence IDs are rejected/removed.

## Conversation routing

The chat distinguishes three scopes:

1. **Conversation** — greetings, thanks and casual interaction. No health-record retrieval is needed.
2. **General information** — educational questions that are not facts about the selected pet.
3. **Pet records** — claims must be grounded in the selected pet's timeline.

This avoids dragging sensitive pet data into irrelevant small talk and reduces token cost.

## Conversational memory

A useful assistant must understand follow-ups without treating previous model output as truth.

The prototype uses:

- recent turns for local continuity
- keyword/relevance recall of older turns
- persistent per-user/per-pet browser chat history
- fresh timeline/document retrieval on pet-specific turns

**Memory resolves references; evidence establishes facts.**

An earlier assistant answer cannot become medical evidence merely because it is remembered.

## Document memory

Approved imports create structured events plus a bounded searchable document-memory event. This lets later questions recover relevant reviewed content without resending every historical document on every turn.

Imported text is treated as untrusted **data**, never instructions.

## Provider abstraction

`src/lib/ai/provider.ts` supports:

- Groq
- OpenRouter
- OpenAI

The rest of the application calls the same service layer. Provider selection is controlled by environment variables.

This matters because model economics, availability and capabilities change faster than the product domain model should.

## Failure behavior

If the AI service is disabled, rate-limited or unavailable:

- authentication still works
- timeline still works
- manual entry still works
- deterministic trends and baselines still work
- evidence still works
- Vet Brief still works
- conversational health fallback answers common timeline questions

The product degrades gracefully instead of making the LLM a single point of failure.

## Safety validation

Outputs are constrained against:

- unsupported diagnosis language
- medication start/stop/dose changes
- unsupported causal claims
- evidence IDs outside the retrieved bundle

Urgent user-described language is intercepted before ordinary LLM narration.

## Cost control

The MVP avoids “LLM on every page load.”

AI calls are reserved for explicit narrative/chat/import actions. Production evolution would add:

- event-triggered summary regeneration
- cached summaries with data-version hashes
- queued extraction
- semantic retrieval only when structured filters are insufficient
- per-user/provider rate limits

## What AI does not do

- invent a health score
- diagnose disease
- prescribe medication
- silently modify health records
- infer missing values as normal
- decide which pet owns a document without user review
