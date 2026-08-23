# PeachyPawz Product Plan

## Product statement

**PeachyPawz turns fragmented pet-health records into an understandable, evidence-backed longitudinal health story.**

It is an independent prototype created for the **PetOlife AI Code-a-Thon**.

## Problem

Pet parents may have health information spread across:

- vet reports and discharge notes
- vaccination cards
- medication instructions
- lab results
- PDFs/images
- weight logs
- symptom notes
- diet changes
- activity data
- owner memory

The failure is not merely storage. The failure is **interpretation across time**.

A user can possess every record and still be unable to answer:

> What changed, when did it change, and what should I bring up at the next vet visit?

## Target user

Primary persona: a responsible pet parent managing ongoing preventive or episodic care who is not a veterinary professional.

They need:

- low-friction record capture
- confidence that data belongs to the right pet
- simple interpretation
- evidence behind interpretations
- a useful summary before a vet conversation

They do **not** need to operate a clinical EHR.

## Core user pains

1. Records are fragmented.
2. Longitudinal change is hard to notice manually.
3. Generic thresholds are less meaningful than “normal for my pet.”
4. AI answers can be hard to trust without provenance.
5. Re-uploading/correcting data can create contradictions.
6. Pet parents need help preparing questions, not a fake diagnosis.

## Product thesis

The timeline is the product's source of truth.

```text
Raw data
 → reviewed timeline
 → personal baseline
 → deterministic change detection
 → temporal / multi-metric patterns
 → evidence bundle
 → optional AI interpretation
 → responsible action
```

AI becomes useful when it reduces interpretation effort while remaining traceable.

## Primary user journey

### New user

```text
Google sign-in
 → create pet
 → choose AI consent
 → upload / manual / empty
 → reviewed timeline
```

### Returning user

```text
Home
 → What Changed?
 → Why am I seeing this?
 → evidence
 → ask follow-up
 → Prepare for Vet
```

### Document journey

```text
Choose document
 → extraction proposal
 → confidence/warnings
 → wrong-pet/duplicate check
 → user edits/reviews
 → approve
 → structured timeline
 → analytics update
```

## Information architecture

### Home

A fast answer to “what should I notice?”

- pet identity
- status / baseline readiness
- What Changed
- primary explainable insight
- personal-baseline trends
- recent timeline
- upcoming recorded care
- quick actions

### Timeline

Source-of-truth view:

- chronological events
- search/filter
- source/provenance
- confidence/review status
- correction/deletion

### Insights

- strongest current pattern
- evidence strength
- baseline deviations
- link to evidence / story

### Ask

- natural conversation
- pet-specific vs general-information distinction
- context memory
- fresh timeline/document grounding

### Prepare for Vet

- recent changes
- symptoms
- medications
- visits
- suggested factual questions

## AI approach

AI is not the calculator, database or diagnostic authority.

**Deterministic layer:**

- percentages
- dates
- unit normalization
- baseline calculations
- event ordering
- pet filter
- evidence IDs

**AI layer:**

- explain structured findings
- turn events into a concise story
- answer conversational timeline questions
- optionally extract text/fields from images

## Differentiation

PeachyPawz is not differentiated by “having AI.” Mature veterinary/pet platforms already have AI and record histories.

The prototype focuses on:

### 1. Personal longitudinal baseline

“Is this unusual for this pet?” rather than a mystery universal health score.

### 2. Evidence-first insights

Every important interpretation can be drilled into:

```text
Insight → calculation → evidence records → source timeline
```

### 3. Safe conversational continuity

Long-running chat can remember prior topics while re-retrieving current records before making pet-specific claims.

### 4. Human-controlled ingestion

AI discovers/proposes; humans verify; only approved data enters the source timeline.

## Safety principles

- no diagnosis engine
- no medication/dose change recommendations
- no arbitrary health score
- no causation from correlation
- no missing-data-as-normal
- no silent wrong-pet attachment
- no silent document extraction into timeline
- no ungrounded pet-specific answer
- urgent language receives short vet/emergency guidance

## MVP

### P0 implemented

- authentication
- pet profile
- mobile-first navigation
- structured timeline
- manual records
- weight/activity analytics
- personal baseline
- change detection
- evidence drawer
- health story
- safe fallback behavior
- README/product/technical documentation
- deployable Vercel build

### High-value P1 implemented

- document upload + review
- wrong-pet warning
- exact duplicate warning
- timeline-aware conversation + memory
- Vet Brief
- multi-pet switching/addition
- record correction/deletion
- search/filtering
- insight freshness through recomputation

## Deliberately deferred

- production MongoDB persistence
- private object-storage document archive
- connected vet/email/cloud sources
- Health Data Inbox
- full reminder engine + push notifications
- family/caregiver roles
- PDF/CSV/JSON export
- semantic/vector retrieval at lifetime scale
- wearable integrations
- offline sync

These are documented rather than simulated because they would add large infrastructure without improving the core code-a-thon proof.

## Product success metrics

### Understanding

- median time to correctly identify the main recent change
- percentage of users who open evidence after an insight

### Data quality

- extraction correction rate
- duplicate/wrong-pet prevention rate
- percentage of insights using reviewed records only

### AI trust/usefulness

- percentage of pet-specific claims with valid evidence IDs
- useful/not-useful rating on stories/answers
- fallback rate due to provider errors

### Vet preparation

- Vet Brief generation rate
- percentage of briefs opened after a detected change

Avoid vanity metrics such as raw chat-message count.

## Roadmap

### Next product iteration

- MongoDB + object storage
- server-side pet ownership authorization
- record conflict center
- reminder objects
- Vet Brief PDF
- richer labs/medication schema

### Connected intelligence

- Health Data Inbox
- explicit OAuth connectors
- structured + semantic hybrid retrieval
- insight lifecycle/versioning

### Native Android + iOS

- camera/document scanner
- share sheet
- offline local DB
- sync queue
- biometric lock
- local/push notifications
- wearables

See `NATIVE_ROADMAP.md`.
