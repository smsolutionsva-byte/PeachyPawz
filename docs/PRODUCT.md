# PeachyPawz Product Document

## Product definition

**PeachyPawz turns fragmented pet-health records into an understandable, evidence-backed longitudinal story.**

Target user: a pet parent who has records but cannot quickly answer what changed recently, when the change began, whether it differs from their pet’s usual pattern, and what to bring to a veterinarian.

## Problem

Pet-health data is spread across paper/PDF vet records, weight measurements, medication notes, vaccination cards, symptoms, activity trackers and owner memory. A folder can preserve records while still failing to create understanding.

The product therefore optimizes for four questions:
1. What happened?
2. What changed?
3. What patterns exist?
4. What may be worth timely attention or discussion?

## Primary journey

```text
Open Max
→ see Changes Detected
→ inspect What Changed
→ open Why am I seeing this?
→ inspect evidence
→ read Health Story
→ ask a timeline question
→ import/review a new record
→ generate Vet Brief
```

## Information architecture

- Home: high-signal summary and personal baseline
- Timeline: source of truth, search, filters, provenance
- Insights: ranked explainable patterns
- Ask: bounded timeline-grounded conversational layer
- Prepare for Vet: factual communication artifact
- Add/Import: controlled data entry with explicit review

## MVP priorities

### P0
- Pet profile
- Structured timeline
- Mobile-first UI
- Weight/activity tracking
- Personal baseline
- Change detection
- Evidence-backed insight
- Health Story
- Responsible AI behavior
- Documentation and deployability

### P1 included because it materially improves the demo
- Timeline-aware chat
- Document upload
- Review-before-save
- Vet Visit Mode
- Basic multi-pet isolation

### Deferred
- Real connected sources
- Family sharing
- Offline sync queue
- wearables ingestion
- full reminder engine
- export formats
- production authentication/database

## Risks, Edge Cases & Proposed Improvements

| Problem | Why it matters | Priority | Proposed solution | Tradeoff |
|---|---|---:|---|---|
| Too little history | False precision destroys trust | MVP | Baseline states: insufficient, emerging, reliable | Less “magical” early experience |
| Missing data mistaken for normal | Produces unsafe reassurance | MVP | Preserve missing/unknown as a distinct state | More incomplete-looking UI |
| Wrong pet assignment | Cross-pet medical contamination | MVP | `petId` filtering everywhere + explicit import assignment | One extra review step |
| Contradictory same-day values | Silent winner could be wrong | P1 | Conflict object + choose/keep/merge flow | More data-model/UI work |
| Duplicate document upload | Creates duplicated events and false trends | P1 | file hash + field similarity warning | Hashing/storage metadata |
| OCR uncertainty | Incorrect facts become longitudinal “truth” | MVP | confidence + review-before-save | Slower import flow |
| Prompt injection in documents | Document text could attack model controls | MVP | treat extracted text only as quoted/untrusted data; system policy outside data | Requires strict prompting and validation |
| Unsupported medical claims | High-stakes AI harm | MVP | LLM receives evidence only; block diagnosis/medication language | Responses are more cautious |
| Correlation presented as causation | Misleads owners | MVP | temporal-language templates and explicit causation disclaimer | Less dramatic insights |
| Stale insight after correction | Old conclusions survive corrected data | P1 | version insight against event revision hash | Requires recomputation lifecycle |
| Unit mismatch | 18 kg vs 18 lb can create catastrophic calculations | MVP architecture | canonical internal units + display preference | More normalization logic |
| Date-only records shifted by timezone | Vaccination/visit date can change incorrectly | MVP architecture | store date-only separately from timestamp | More temporal types |
| AI provider outage | Demo or product becomes unusable | MVP | deterministic analytics and fallback narratives | Less fluent fallback text |
| Model cost explosion | Opening dashboard should not call LLM | MVP | event-triggered/cached narratives, deterministic home analytics | Insight may refresh slightly later |
| Notification fatigue | Users disable the whole system | P2 | aggregate related changes into a single pattern notification | More ranking/grouping logic |
| Emergency wording | Long chatbot answer delays care | MVP | short emergency escalation guard before LLM | False positives need tuning |
| Shared device/privacy | Sensitive household data exposure | Future production | session expiry, biometric native lock, account controls | Adds friction |
| OAuth overreach | Privacy and platform risk | P2 | minimum scopes, explicit source management, revocation | Some sources become less automatic |
| Malicious/oversized uploads | Security and cost abuse | MVP | MIME allow-list, file-size cap, isolated parsing | Legit large files may require compression |
| Large lifetime timeline | Slow mobile render/retrieval | P2 | pagination/virtualization + structured date filters | More state complexity |
| Accessibility through color only | Status inaccessible to some users | MVP | icons + text labels + semantic controls | Slightly denser UI |
| Animation sensitivity | Motion may cause discomfort | MVP | `prefers-reduced-motion` support | Less flourish for some users |
| Offline edits conflict | Native sync can overwrite history | Future native | local IDs, revision numbers, conflict queue | Significant sync complexity |
| Breed-based overreach | Can turn broad risk knowledge into pseudo-diagnosis | MVP policy | breed/life-stage for context only, not diagnosis | Less “personalized” marketing copy |

## Improvements to the original specification

### 1. Make evidence the interaction model, not a secondary detail
Instead of a long dashboard, every high-level insight follows progressive disclosure:

`simple change → why → calculation → records → responsible action`

### 2. Optimize the hackathon demo for reliability
A production app should use server persistence and authentication. The prototype keeps demo state locally and makes AI optional so the core story works even when external services fail.

### 3. Avoid vector search until it earns its complexity
Most timeline questions can be solved with pet ID, event type and date filters. Semantic retrieval becomes useful for free-text notes and long documents later. Structured health metadata should remain the first filter.

### 4. Treat baseline as descriptive, not clinical
“Max’s normal” is a statistical description of his recorded behavior. It is not a healthy range, diagnosis threshold or veterinary reference interval.

### 5. Separate proactive “change detected” from urgent care
Magnitude/persistence can prioritize insights, but urgent symptom escalation should be a separate safety path based on the current user description and/or verified clinical rules.

## Competitive research

Current products already demonstrate that the market values pet timelines, scanning and AI assistance:

- Tamadoggo presents a single pet timeline, AI vet-document scanning, user review before save, and background pattern/letter features.
  - https://tamadoggo.com/pet-journal-app
- PawLife markets health diary tracking, AI chat, report scanning, weight trends, reminders and AI-generated veterinary reports.
  - https://apps.apple.com/in/app/pet-care-tracker-dog-cat/id6760197595
- PawPrint Health combines document upload, chronological records, record-grounded chat and sharing.
  - https://pawprinthealth.io/
- PawsDoc includes smart scan, medical-history summarization, reminders and AI chat.
  - https://apps.apple.com/in/app/pawsdoc-pet-health-passport/id6759815752

### Competitive conclusion

“AI + pet records” is not enough differentiation. PeachyPawz should own **understanding longitudinal change**:

- personal baseline
- clear start of change
- multi-metric overlap
- evidence coverage
- confidence in human terms
- explicit “why” interaction

## Success metrics

- Time to understand the primary recent change
- % of surfaced insight claims with evidence IDs
- document extraction correction rate
- “Why?” evidence-open rate
- Health Story usefulness rating
- Vet Brief generation rate
- wrong-pet assignment correction rate
- unsafe-output validation failure rate
- stale-insight regeneration success rate

## Responsible product language

Preferred:
- recorded
- observed
- appears
- may
- occurred during the same period
- worth monitoring
- consider discussing with a veterinarian

Avoid without verified clinical evidence:
- caused
- definitely
- your pet has
- guaranteed
- stop/start/increase/decrease medication
