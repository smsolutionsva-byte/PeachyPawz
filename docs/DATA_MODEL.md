# Data Model

## MVP event model

The prototype uses a flexible timeline event with typed categories.

```ts
type HealthEvent = {
  id: string;
  petId: string;
  type: "weight" | "activity" | "appetite" | "diet" | "symptom" |
        "medication" | "vaccine" | "vet" | "lab" | "note" | "document";
  date: string;
  title: string;
  summary: string;
  data: Record<string, string | number | boolean | null>;
  source: "manual" | "document_ai" | "vet" | "device" | "imported";
  sourceDocumentId?: string | null;
  confidence?: "high" | "moderate" | "limited";
  reviewStatus: "approved" | "pending" | "corrected";
  createdAt: string;
  updatedAt: string;
};
```

## Why a flexible event plus specialized data

The timeline needs one sortable/searchable source of truth, while each event type still requires specialized fields. A production database would keep a common `health_events` envelope and typed payload/schema validation for domain-specific data.

## Core invariants

- every event belongs to exactly one `petId`
- pending AI extraction is not trusted timeline data
- reviewed/corrected events participate in analytics
- source and timestamps are retained
- original units may be stored, but numeric comparisons use canonical units
- date-only clinical events remain date-only rather than being shifted by timezone conversion

## Unit policy

Canonical internal comparison:

- weight: kg
- activity: min/day

Display preferences can later convert canonical values back to lb or other user-preferred units.

## Document lineage

A reviewed import can generate:

```text
document-memory event
   ├─ sourceDocumentId
   ├─ filename
   ├─ bounded reviewed extraction text
   ├─ fileHash
   └─ confidence

plus structured events
   ├─ weight
   ├─ vet visit
   ├─ vaccine
   └─ ...
```

This enables traceability from derived event back to source document.

## Production schema

Recommended collections/tables:

- users
- pets
- pet_memberships
- health_events
- measurements
- medications
- vaccinations
- symptoms
- vet_visits
- lab_results
- documents
- document_extractions
- insights
- reminders
- ai_reports
- connected_sources
- sync_jobs
- audit_events

The flexible event remains the timeline projection; specialized tables/collections support richer validation and querying.

## Data correction

Corrections are not hidden from downstream intelligence.

```text
reviewed value
  ↓ user edits
corrected value + updatedAt
  ↓
analytics recompute
  ↓
new evidence / insight
```

Production should additionally keep an immutable audit trail with before/after values.

## Deletion policy

Prototype deletion removes the event from the browser timeline and downstream analytics after explicit confirmation.

Production policy should distinguish:

- delete derived event only
- delete source document + derived records
- soft delete / retention window
- legal/audit retention requirements

The UI should make those consequences explicit rather than silently leaving stale derived conclusions.
