# Risks, Edge Cases & Proposed Improvements

This document intentionally separates what is handled in the prototype from what belongs in later phases.

| Problem | Why it matters | Priority | Current / proposed solution | Tradeoff |
|---|---|---:|---|---|
| Too little history for a baseline | False precision destroys trust | MVP | `insufficient` / `emerging` / `reliable` baseline states | Less dramatic early insights, more honest product |
| Missing record interpreted as normal | Creates false reassurance | MVP | Missing remains missing | Some cards remain sparse |
| kg vs lb | Can create completely false trends | MVP | Normalize weight to canonical kg before analytics | Display-preference layer still future |
| Wrong pet document | Cross-pet contamination is high-risk | MVP | Destination pet explicit + extracted-name mismatch warning | User must resolve ambiguity |
| Duplicate document | Double-counting can create fake patterns | MVP | SHA-256 exact-file warning | Similar-but-not-identical duplicate detection remains future |
| OCR error | Bad extraction can poison analytics | MVP | Proposal → user review → approval; editable records | Adds one confirmation step |
| User corrects a value | Cached insight can become stale | MVP | Analytics is recomputed from current timeline; corrected state shown | Production should add insight version history |
| User deletes evidence | Old conclusion may no longer be valid | MVP | Deletion removes record from future analytics | Audit soft-delete is future |
| AI unavailable/rate-limited | Demo/core product should not fail | MVP | Deterministic fallback | Narration is less flexible |
| Prompt injection inside PDF | Retrieved text may contain hostile instructions | MVP | Treat document as untrusted data; secrets never enter context | Requires disciplined prompt boundaries |
| AI diagnosis/medication instruction | Potentially unsafe | MVP | Safety sanitizer + responsible-language constraints | Can make answers more conservative |
| Casual chat retrieves health data | Privacy/cost waste and feels robotic | MVP | Three-way scope routing; normal conversation skips health retrieval | Intent router adds complexity |
| Long conversations lose context | Assistant feels “dead” | MVP | Recent turns + older-turn recall + fresh record retrieval | Prototype recall is lexical, not vector-based |
| Old AI answer becomes “fact” | Hallucinations can compound | MVP | Chat memory resolves references only; claims re-ground in records | More retrieval work per health turn |
| Conflicting measurements same date | Choosing silently can be wrong | P1 | Detect same-date/type conflicts and let user choose authority | Requires explicit conflict model/UI |
| Similar duplicate scans | Same report may have different filename/image bytes | P1 | Perceptual/document similarity + extracted-field comparison | More compute/storage |
| Reminder spam | Users disable all notifications | P1/native | Aggregation, snooze, quiet hours, user-controlled categories | More notification state |
| Date/timezone shift | Vaccine date can move a day | MVP architecture | Clinical date-only fields are stored as date-only strings | Precise timestamp events need a separate type |
| Cross-device sync | Browser-local data is not durable | P1 production | MongoDB + object storage + authenticated API | Adds backend ops and migrations |
| Offline edits | Native users may edit without connectivity | Native | Local DB + sync queue + idempotency keys + conflict UI | Significant synchronization complexity |
| Family/caregiver access | Shared pet care is common | P2 | Pet memberships with explicit roles | Authorization surface grows |
| Deceased/archived/transferred pet | Delete is emotionally/legally wrong model | P2 | Archive/transfer state and controlled deletion | More lifecycle states |
| Connected email/cloud sources | Overbroad permissions undermine trust | P2 | OAuth least privilege + Health Data Inbox + explicit import | Connector-specific maintenance |
| Wearable activity anomaly | Device drop ≠ illness | Future | Source-labelled measurements; descriptive deviation only | Requires device-quality context |
| Model/provider changes | Model economics and behavior shift | MVP architecture | Provider abstraction | Capability parity differs across models |
| Large lifetime timeline | Sending everything is slow/expensive | P1 production | Structured filters, pagination, hybrid retrieval | Retrieval infrastructure required |
| Accessibility/motion sensitivity | Medical UX must work for everyone | MVP | semantic controls, reduced motion, large targets, text labels | Visual effects intentionally restrained |

## Product opportunities

### 1. Health Data Inbox

Connected sources should propose records rather than silently importing them.

```text
Found records → classify → assign confidence → user review → timeline
```

### 2. Conflict center

A future quality layer can collect:

- possible duplicate
- same-date conflicting value
- missing unit
- impossible/outlier value
- uncertain OCR field

instead of hiding data-quality problems across individual screens.

### 3. Insight lifecycle

Production insights should have a `dataVersion` hash and states such as:

- generated
- dismissed
- stale
- superseded

A newly corrected/deleted record can then visibly explain why an insight changed.

### 4. Vet-share artifact

Generate a factual 30/60/90-day PDF with evidence references and zero diagnostic language.
