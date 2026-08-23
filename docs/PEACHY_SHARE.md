# Peachy Share — Mobile Capture Bridge

Peachy Share is the mobile companion to the desktop **Ask Peachy** browser extension.

Its purpose is simple:

```text
Health information already on the phone
        ↓
System Share Sheet
        ↓
PeachyPawz
        ↓
Staged capture
        ↓
Human review
        ↓
Timeline
```

## What is implemented now

### Android / compatible installed PWA

The repository now ships an installable PWA with a Web Share Target declaration.

Once PeachyPawz is installed from Chrome on Android, compatible Share Sheets can list **PeachyPawz** as a destination for:

- selected text
- URLs
- JPG / JPEG
- PNG
- WebP
- PDF

The Web Share Target API requires an installed PWA. File sharing uses `POST` + `multipart/form-data`.

References:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
- https://web.dev/articles/files/receive-shared-files

### User flow

```text
Vet portal / Files / Photos / browser
          ↓ Share
      PeachyPawz
          ↓
      Peachy Share sheet
          ↓
  [shared text / link / file]
          ↓
Ask or analyze
          ↓
wrong-pet + duplicate checks
          ↓
review
          ↓
approve
          ↓
health timeline
```

Shared data is **not** silently written into the timeline.

## How the handoff works

`public/manifest.webmanifest` declares the `share_target`.

`public/sw.js` intercepts the PWA share-target POST and stages the payload inside same-origin Cache Storage.

The service worker stores:

- share ID
- title
- text
- URL
- capture time
- supported files (temporary cache entries)

Then it redirects to:

```text
/?peachyShare=<capture-id>
```

The authenticated PeachyPawz client reads that pending share and opens the **Peachy Share** review drawer.

This design has an important benefit: if the user needs to sign in first, the staged share can survive the Google-auth redirect because it is still waiting in the same-origin PWA cache.

## File path

Shared image/PDF → existing document extraction pipeline:

```text
shared file
  ↓
/api/documents/extract
  ↓
extraction proposal
  ↓
wrong-pet / duplicate checks
  ↓
review
  ↓
user approval
  ↓
timeline
```

The same server-side AI consent and provider configuration apply.

## Text and link path

Shared text or a URL is converted into a temporary Peachy capture and uses the same **Ask / Analyze / Review** experience as the desktop extension.

PeachyPawz does **not** use the user's authenticated browser cookies to scrape private websites server-side.

For private portal content, the safer patterns are:

- share selected visible text
- share a screenshot
- share the downloaded PDF

## Limits in the prototype

- max 4 shared files per handoff
- max 8 MB per file
- supported file types: JPG/JPEG, PNG, WebP, PDF
- the first version processes one selected shared file at a time in the document review UI
- persistence is still browser-local after approval in this prototype

## iPhone / iOS

The current web MVP does **not** claim iOS PWA Share Target parity.

The production iOS path should use a native **Share Extension** (or a controlled Shortcut prototype) so Safari, Mail, Files, Photos and other apps can send content into the same ingestion pipeline.

The product architecture stays identical:

```text
iOS Share Extension
        ↓
secure app handoff
        ↓
PeachyPawz capture inbox
        ↓
review
        ↓
timeline
```

See `docs/NATIVE_ROADMAP.md`.

## Demo on Android

1. Deploy PeachyPawz over HTTPS (Vercel is fine).
2. Open the site in Chrome on Android.
3. Install it using **Add to Home screen / Install app**.
4. Open `https://peachypawz.vercel.app/demo/clinic-record.html` in Chrome.
5. Select some of Max's visible record text and tap **Share**.
6. Choose **PeachyPawz**.
7. Peachy Share opens with the staged text.
8. Choose **Ask or review shared text**.
9. Analyze and approve only after verifying the destination pet.

File demo:

1. Open/download `Max_Vet_Report.pdf` on Android.
2. Share the PDF from Files/Drive/Chrome.
3. Choose **PeachyPawz**.
4. Tap the shared file in Peachy Share.
5. Review extraction and approve.

## Security principles

- user-triggered sharing only
- no blanket browser-history access
- no background scraping of other apps/sites
- supported MIME-type validation
- size limits
- untrusted shared content remains data, not AI instructions
- review before timeline mutation
- pet ownership stays explicit
- duplicate checks are preserved

## Why this matters to PetOlife

Desktop and mobile use different operating-system primitives, but the trust model stays the same:

> **Capture mechanism changes by platform. The review-first ingestion pipeline does not.**
