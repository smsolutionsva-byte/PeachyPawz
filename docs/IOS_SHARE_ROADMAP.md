# iOS Peachy Share Roadmap

The Android web MVP can use the installed-PWA Web Share Target API. iOS should not be presented as having the same PWA capability.

## Native target

Build a PeachyPawz Share Extension that accepts:

- Safari webpage URL / selected text
- PDF
- image / screenshot
- Files attachments
- Mail attachments

The extension should stage the content in an App Group container and open the main application into a review flow.

```text
Other iOS app
   ↓ Share
PeachyPawz Share Extension
   ↓
App Group staging area
   ↓
Main PeachyPawz app
   ↓
choose / verify pet
   ↓
extract
   ↓
review
   ↓
approve
```

## Security requirements

- no automatic timeline mutation inside the extension
- no model/provider keys in the extension
- secure upload only after the user explicitly continues
- delete staged files after import/cancel/expiry
- App Group data protected with appropriate iOS file-protection class
- pet selection is explicit when ownership cannot be inferred safely

## Shortcut prototype

A Shortcut can be used as a lightweight concept demo for text/URL handoff, but it should not be presented as the production security model. A native Share Extension gives stronger authentication, file handling, lifecycle management and offline behavior.
