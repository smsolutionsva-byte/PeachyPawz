# Submission Checklist

## Links

- [ ] GitHub repository is public/accessible to evaluator
- [ ] Live Vercel URL opens in an incognito window
- [ ] README begins with live demo + problem + differentiator

## Authentication

- [ ] Google sign-in succeeds on production domain
- [ ] Production callback is exactly `/api/auth/callback/google`
- [ ] No secret is committed to GitHub

## First-run integrity

- [ ] Brand-new account does not automatically contain Max
- [ ] New pet starts with zero records
- [ ] AI consent can be turned off
- [ ] Demo dataset is explicitly labelled synthetic

## Core challenge flow

- [ ] Timeline visible
- [ ] What Changed visible
- [ ] personal baseline states visible
- [ ] Why am I seeing this opens evidence
- [ ] Health Story works or deterministic fallback appears
- [ ] “Explain all unusual changes” works
- [ ] follow-up “Which happened first?” keeps context
- [ ] Prepare for Vet generates

## Documents

- [ ] bundled Max PDF uploads
- [ ] extraction requires review
- [ ] wrong-pet mismatch is visible when applicable
- [ ] approving creates timeline records
- [ ] reuploading identical file warns about duplicate

## Data integrity

- [ ] edit a timeline record → marked Corrected
- [ ] corrected value changes analytics
- [ ] delete a record → it disappears from future evidence
- [ ] Max and Luna do not share records/chat history

## Mobile

Test at:

- [ ] 320px
- [ ] 375px
- [ ] 390px
- [ ] 430px

Verify:

- [ ] no accidental horizontal page scroll
- [ ] bottom nav does not cover content
- [ ] inputs do not trigger iOS zoom
- [ ] drawers remain usable
- [ ] upload review remains readable
- [ ] touch targets are comfortable

## AI provider

- [ ] `AI_PROVIDER=groq` or chosen provider
- [ ] key is server-side only
- [ ] provider failure does not break timeline

## Repository quality

- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] no TypeScript build failure
- [ ] no security-blocked Next.js version
- [ ] docs links work

## Interview preparation

Be ready to explain:

1. Why deterministic analytics precede the LLM.
2. Why personal baseline is safer/more personalized than an arbitrary score.
3. Why extraction is review-before-save.
4. Why conversational memory is separate from medical evidence.
5. Why localStorage is acceptable for the demo but not production.
6. How Android/iOS improves capture through camera, share sheet, offline DB and notifications.
7. What you would build next with another two weeks.
