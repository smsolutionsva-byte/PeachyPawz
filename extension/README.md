# Ask Peachy browser companion

A Manifest V3 Chrome/Edge extension for the PeachyPawz prototype.

## What it does

1. The user opens a page containing a pet-health record.
2. They click the **Ask Peachy** extension.
3. The extension reads only visible page text from the active tab.
4. The capture is handed to `https://peachypawz.vercel.app/`.
5. PeachyPawz shows a review surface where the user can either ask about the captured page or analyze/import it.
6. Nothing becomes part of the pet timeline until the user approves it.

## Privacy model

- Uses `activeTab`, not `<all_urls>`.
- Access is granted only after the user clicks the extension.
- Does not read password fields or typed form values; capture is based on rendered `innerText`.
- Captures at most 20,000 characters of visible text and 5,000 characters of explicit selection.
- The temporary handoff expires after 10 minutes and is deleted after PeachyPawz acknowledges receipt.
- Captured page text is treated as untrusted data. Text such as “ignore previous instructions” must never override PeachyPawz system rules.
- Import remains review-before-save.

## Load unpacked in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `extension/` directory.
5. Pin **Ask Peachy** to the toolbar.

For local web-app development, the bridge also matches `http://localhost:3000/*`. To make the popup open localhost instead of production, change `PEACHY_URL` in `popup.js`.

## Why this is a bonus, not a dependency

The core PeachyPawz challenge flow does not require the extension. The extension demonstrates a future ingestion pattern analogous to connected sources and native share sheets while preserving user review and explicit consent.
