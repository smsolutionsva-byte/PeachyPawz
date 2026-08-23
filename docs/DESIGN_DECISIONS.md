# Design Decisions

## Timeline first, chatbot second

A health chatbot without a reliable record model can sound confident while losing chronology. PeachyPawz makes the timeline the source of truth and lets chat retrieve from it.

## No health score

A single 0–100 score hides uncertainty and invites false reassurance/alarm. The UI instead exposes concrete deviations, evidence strength and why they matter.

## Personal baseline over universal threshold

The challenge emphasizes personalization. PeachyPawz asks “is this unusual for this pet?” before trying to generalize from species/breed.

## Progressive disclosure

The mobile hierarchy is:

```text
what changed → why → evidence → detailed records
```

Users who only need a quick understanding are not forced into a clinical-looking database.

## Review before save

Document AI proposes fields but cannot silently mutate the health timeline. This protects against OCR errors, wrong-pet matches and malformed documents.

## AI consent is a product choice, not an API-key form

The deployment owner manages server credentials. Pet parents decide whether submitted records may be processed by the optional AI layer.

## Graceful AI failure

The product remains useful when a provider is unavailable. This also keeps a hackathon demo from depending on one external call.

## Browser-local persistence for MVP

This is a conscious demo tradeoff, not the production architecture. It reduces deployment dependencies while the docs clearly define the authorized server-storage migration.
