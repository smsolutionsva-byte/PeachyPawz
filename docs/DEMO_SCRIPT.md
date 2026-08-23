# Five-Minute Demo Script

## Goal

Make the evaluator remember one sentence:

> **PeachyPawz does not just store Max's records — it explains what changed and proves why.**

## 0:00–0:30 — Product framing

Open the live app on a phone-sized viewport.

Say:

> “Pet health data is usually fragmented. My core design decision was to make the timeline the source of truth and use AI only after deterministic analytics build evidence.”

If starting with a fresh account, briefly show that no Max data is invented.

## 0:30–1:15 — Load the intentional demo story

Use the clearly labelled synthetic Max demo.

Point out:

- Max identity is explicit
- timeline spans stable → diet change → activity decline → weight increase → vet visit
- the app uses Max's own earlier history as context

## 1:15–2:00 — “What Changed?”

On Home show:

- weight change
- activity change
- appetite change where available
- personal baseline readiness

Say:

> “These numbers are calculated in TypeScript. The model does not do the arithmetic.”

Tap **Why am I seeing this?**

Show:

- linked records
- source/provenance
- confidence language
- deterministic explanation

Say:

> “The insight is not a mystery score. The user can drill from conclusion back to evidence.”

## 2:00–2:50 — Conversational intelligence

Open Ask.

Ask:

> **Explain all unusual changes.**

Then:

> **Which happened first?**

Then:

> **What did the vet say about it?**

Explain:

> “The assistant remembers conversational context, but old assistant text is not allowed to become health evidence. Pet-specific claims are re-grounded in the current timeline.”

Optional small-talk proof:

> “hi”

Show that it does not unnecessarily query/display Max's health data.

## 2:50–3:45 — Document ingestion

Upload `public/demo/Max_Vet_Report.pdf`.

Show:

1. extraction is a proposal
2. pet assignment is explicit
3. confidence/warnings
4. review-before-save
5. approve

If possible, upload the same file again to show duplicate warning.

Say:

> “AI discovers and proposes; the human verifies; only then does the timeline change.”

## 3:45–4:15 — Data correction

Open a detailed timeline record → correction action.

Change a value and save.

Show **Corrected** provenance and refreshed insight.

Say:

> “AI conclusions are downstream of mutable source data. Correcting evidence changes future interpretation immediately.”

## 4:15–4:40 — Prepare for Vet

Open **Prepare for Vet**.

Show:

- recent changes
- relevant symptoms/visits/medications
- suggested factual questions
- responsible disclaimer

Say:

> “The goal is to improve the pet parent–vet conversation, not replace clinical judgment.”

## 4:40–5:00 — Native roadmap

Close with:

> “Web proves the intelligence layer. Native Android/iOS removes capture friction through camera scanning, Share Sheet, offline local storage, background sync, local/push reminders and optional biometric locking. The interpretation service stays server-controlled and auditable.”

## If AI provider fails during demo

Do not panic.

Say:

> “The product is useful without an LLM. Timeline, analytics, evidence and Vet Brief are deterministic; the provider failure only reduces the narrative layer.”

That failure mode is an intentional architecture decision.

## Likely evaluator questions

### Why not use an LLM for everything?

Because arithmetic, chronology, units and source selection need deterministic reproducibility. AI is strongest at explanation.

### Why not a health score?

An arbitrary score hides uncertainty and can create false reassurance/alarm. Explainable deviations are more defensible.

### Why localStorage?

For code-a-thon demo resilience only. Production migration is documented as authorized server persistence + private object storage.

### How does this scale to 10 years of records?

Structured metadata filtering first, bounded temporal retrieval, then optional semantic/vector retrieval. Never send a lifetime archive blindly to the model.

### What would you build next?

Production persistence, conflict center, Vet Brief export, Health Data Inbox/connectors, notification engine, then native capture/offline workflows.


## Optional 30-second “one more thing” — Ask Peachy extension

Do this only after the core five-minute flow is already proven.

1. Open the included synthetic page: `/demo/clinic-record.html`.
2. Click **Ask Peachy** in the browser toolbar.
3. Choose **Send to timeline**.
4. Show that PeachyPawz opens a review panel with the source domain, wrong-pet/duplicate protection and an approval step.
5. Approve, then ask about the imported record later in the normal conversation.

Say:

> “The same intelligence layer can reduce capture friction. On web, this can be a user-triggered browser companion; on native, the same pattern becomes Share → PeachyPawz. In both cases AI proposes and the human approves.”

Do not make the evaluator install the extension unless there is time. A short screen recording is an acceptable backup for this bonus feature.


## Optional 30-second mobile “one more thing” — Peachy Share

If an Android phone is available and PeachyPawz is installed as a PWA:

1. Open the included synthetic clinic portal or the sample Max PDF.
2. Use Android **Share**.
3. Choose **PeachyPawz**.
4. Show the Peachy Share staging drawer.
5. Explain that the payload is still unverified.
6. Continue to Ask / Analyze / Review and approve only after the pet check.

Say:

> “Desktop uses an explicit browser companion; Android uses the operating system Share Sheet. The capture surface changes, but both feed the same human-reviewed health-data pipeline.”

Do not claim the PWA Share Target works identically on iOS. The iOS native roadmap uses a Share Extension.
