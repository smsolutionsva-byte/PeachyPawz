# Native Android + iOS Roadmap

## Product evolution

The mobile web MVP proves the core intelligence loop. Native apps should not simply wrap the website; they should remove capture friction and improve reliability.

## UX

Native navigation:
- Home / Timeline / Insights / Ask bottom tabs
- prominent contextual Add action
- native document scanner
- offline/sync status surfaced near timeline changes
- system share sheet as a primary import path

## Device capabilities

### Camera and scanning

`Camera → crop/deskew → local preview → secure upload → extraction → review → timeline`

### Share Sheet

```text
Mail / Files / WhatsApp / Vet portal
          ↓ Share
      PeachyPawz
          ↓
      choose pet
          ↓
  extraction + review
          ↓
       timeline
```

This is one of the highest-value native advantages because it converts existing digital paperwork into the timeline with very little re-navigation.

### Notifications

Use local notifications when the reminder is fully known on device. Use push for server-side changes such as connected-source imports or shared-care updates.

Notification controls:
- per category
- quiet hours
- snooze
- dismiss
- explain why notification was sent
- aggregate related changes

## Offline

Recommended local store: SQLite/Room on Android and SQLite/Core Data equivalent on iOS, behind a shared repository abstraction if using React Native/Flutter/KMP.

```text
local mutation
 → local event ID + revision
 → sync queue
 → server mutation
 → server revision returned
 → local commit
```

Conflict handling:
- field-level merge for non-overlapping edits
- explicit conflict UI for same medical value/date
- never silently overwrite a reviewed record
- deduplicate retry-created events using idempotency keys

## Authentication

Native capabilities:
- platform secure storage for refresh tokens
- optional biometric app lock
- universal/app links for family invitations
- device/session management

## Background sync

Appropriate for:
- reminder refresh
- connected-source inbox metadata
- small timeline updates

Large OCR jobs should run server-side. Mobile background execution limits make continuous local AI pipelines unreliable.

## AI services

Keep clinical/health interpretation server-controlled to preserve:
- policy versioning
- auditability
- secret protection
- consistent provider switching
- output validation

On-device AI may later assist with non-authoritative UX tasks such as image quality checks or document edge detection.

## Wearables/devices

Device readings enter as source-labelled measurements. A device drop should generate “activity is lower than your recorded baseline,” not “your pet is sick.”

## Scalability

Native clients use the same versioned API and domain model as web. Do not fork business logic across platforms; keep analytics formulas shared or server-authoritative with deterministic fixtures for parity tests.
