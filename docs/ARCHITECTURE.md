# Architecture

## Prototype architecture

```text
Next.js mobile web UI
       │
       ├── Local demo event store
       │      └── browser localStorage
       │
       ├── Deterministic analytics
       │      ├── baseline
       │      ├── percent change
       │      ├── trend / overlap
       │      └── evidence IDs
       │
       └── Server routes
              ├── /api/ai
              │     ├── deterministic fallback
              │     └── optional LLM provider
              │
              └── /api/documents/extract
                    ├── MIME/size validation
                    ├── PDF text extraction
                    ├── heuristic structured parser
                    └── optional image AI extraction
```

## Production target

```text
Web / Android / iOS
        │
      API/BFF
        │
 ┌──────┼──────────┬──────────────┐
 │      │          │              │
Auth   Pets     Documents      Notifications
 │      │          │              │
 │   Health Events │              │
 │      │       OCR/Extraction    │
 │      └──────┬───┘              │
 │             ↓                  │
 │       Timeline Projection      │
 │             ↓                  │
 │        Analytics Engine        │
 │             ↓                  │
 │       Evidence Builder         │
 │             ↓                  │
 │         AI Service             │
 │             ↓                  │
 └──────── MongoDB / Object Storage / Queue
```

## Database design

Recommended collections:

- `users`
- `pets`
- `health_events`
- `measurements`
- `medications`
- `vaccinations`
- `symptoms`
- `vet_visits`
- `lab_results`
- `documents`
- `document_extractions`
- `insights`
- `reminders`
- `ai_reports`
- `connected_sources`
- `sync_jobs`
- `audit_events`

### Key isolation rule

Every health-domain query must include both authenticated `ownerId` access and target `petId`.

Never retrieve broad household records and ask the LLM to separate pets later.

## Event model

Use a stable normalized timeline record plus specialized data where structure matters.

```ts
type HealthEvent = {
  id: string
  ownerId: string
  petId: string
  type: EventType
  eventDate: string       // date-only when appropriate
  occurredAt?: Date       // precise timestamp only when known
  data: Record<string, unknown>
  source: SourceType
  sourceDocumentId?: string
  confidence?: Confidence
  reviewStatus: ReviewStatus
  revision: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### Unit strategy

Measurements should store:
- original value/unit
- canonical value/unit
- display preference

Example: weight canonicalized to kilograms.

## Insight lifecycle

```text
Event mutation
  → analytics input hash changes
  → dependent insight marked stale
  → deterministic analytics recalculated
  → evidence bundle rebuilt
  → narrative regenerated if required
  → prior insight superseded, not silently overwritten
```

Suggested insight fields:
- ID
- pet ID
- type
- created timestamp
- time range
- evidence IDs
- evidence hash
- confidence label
- status (`generated`, `dismissed`, `superseded`, `stale`)
- model/provider/version for AI text

## AI service boundary

```ts
interface AIService {
  extractDocument(...): Promise<DocumentExtraction>
  summarizeTimeline(...): Promise<HealthStory>
  answerTimelineQuestion(...): Promise<GroundedAnswer>
  generateVetSummary(...): Promise<VetBrief>
}
```

Provider-specific code must stay behind this interface.

## Retrieval design

1. Authorize owner/pet.
2. Parse question intent.
3. Apply structured filters first: `petId`, event type, date range, source.
4. Retrieve bounded records.
5. Optionally semantic-rank free-text notes/documents inside the already authorized subset.
6. Build evidence bundle with stable event IDs.
7. Generate text.
8. Validate output evidence IDs and safety language.

This avoids sending a pet’s complete lifetime archive to a model for every question.

## Document security

Uploads are untrusted.

Required production controls:
- allow-listed MIME types
- magic-byte verification
- upload size/page limits
- malware scan/sandboxed parsing
- no executable rendering
- object storage with private signed URLs
- OCR/document text inserted only into a data channel
- explicit user approval before normalized records are committed
- hash/similarity duplicate checks
- extraction model/version and confidence stored

## Authentication and authorization

Production:
- OIDC/auth provider or platform identity
- short-lived sessions
- row/document-level owner checks
- pet-sharing ACLs with explicit roles
- audit log for create/edit/delete/share/import

The code-a-thon prototype intentionally does not pretend its demo session is production auth.

## Connected sources

```text
Connect source
  → explicit OAuth consent
  → minimum scope
  → encrypted token storage
  → discover candidate records
  → classify/extract
  → Health Data Inbox
  → user reviews
  → timeline commit
```

Disconnect should revoke local tokens and clearly define whether imported historical records remain.

## Performance / scale

- Cursor-paginate timeline records.
- Precompute common rolling aggregates.
- Do not LLM-generate on every page open.
- Recompute only metrics affected by changed event types/time ranges.
- Cache reports by evidence hash.
- Background queues for large documents and connected-source sync.
- Virtualize large timeline lists on mobile.
