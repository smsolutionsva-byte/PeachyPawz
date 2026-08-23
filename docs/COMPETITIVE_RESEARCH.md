# Competitive Research & Positioning

Research checked on **2026-08-23**. This document uses competitors for category context only; PeachyPawz does not copy their branding, UI or proprietary workflows.

## Category signals

### PetDesk

PetDesk's pet-parent experience emphasizes pet profiles, health/reminder records, prescription history and past appointments/notes. This validates that **fast access to organized records and reminders is table stakes**, not enough differentiation by itself.

References:

- https://petdesk.com/products/veterinary-mobile-app
- PetDesk, “How to Use Your PetDesk App: A step-by-step guide for pet parents.”

### Digitail

Digitail offers a pet-parent app with access to records, appointments, reminders, visit summaries and communication, while its veterinary platform includes AI medical-record workflows and patient-history timelines.

This validates two things:

1. timeline/history is already an expected interaction model;
2. “we use AI” is not a unique product claim in veterinary software.

References:

- https://digitail.com/pet-parent-app/
- https://digitail.com/features/

Digitail also describes AI that draws from structured patient data already present in its system. That reinforces PeachyPawz's decision to make structured evidence the substrate beneath conversational AI rather than sending an unfiltered archive to a model.

Reference: https://digitail.com/blog/the-intelligent-pims-why-veterinary-ai-has-to-be-built-in-not-bolted-on/

## Design lessons extracted

Useful category patterns:

- pet profile context should always be obvious
- history should be chronological and easy to search
- reminders/next care should be visible without being alarmist
- document/record access should be fast
- pet parents benefit from a concise visit summary
- AI should be integrated into an existing data model rather than floating as a generic chatbot

## PeachyPawz differentiation

PeachyPawz concentrates on a narrower question:

> **What changed over time relative to this pet's own normal, and what evidence supports that interpretation?**

The key interaction is not merely “ask AI.” It is:

```text
change
  ↓
why?
  ↓
calculation
  ↓
linked evidence
  ↓
original timeline
```

## Competitive gap PeachyPawz explores

Rather than competing feature-for-feature with mature clinic platforms, the prototype explores an **explainable longitudinal intelligence layer for pet parents**:

- personal baseline, not generic health score
- correlation language, not manufactured causality
- evidence traceability
- record correction updates future interpretation
- long-running conversation that re-retrieves records rather than trusting old model text
- review-controlled ingestion

That scope is intentionally aligned to the PetOlife challenge instead of attempting to reproduce an entire veterinary practice-management system.
