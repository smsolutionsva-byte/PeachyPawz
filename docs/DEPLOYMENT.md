# Deployment — GitHub + Vercel + Google OAuth

## 1. Install and verify locally

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## 2. Local environment

```bash
cp .env.example .env.local
npm exec auth secret
```

Required:

```env
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Recommended AI configuration:

```env
AI_PROVIDER=groq
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=qwen/qwen3.6-27b
```

Never commit `.env.local` and never prefix provider secrets with `NEXT_PUBLIC_`.

## 3. Google OAuth — local

Create a Google OAuth **Web application**.

Authorized JavaScript origin:

```text
http://localhost:3000
```

Authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

## 4. Push to GitHub

```bash
git add .
git commit -m "Prepare PeachyPawz PetOlife submission"
git push
```

## 5. Vercel

Import the GitHub repository. Vercel should detect Next.js automatically.

Add production variables:

```text
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AI_PROVIDER
the selected provider key/model variables
NEXT_PUBLIC_APP_URL=https://peachypawz.vercel.app
```

## 6. Google OAuth — production

Authorized JavaScript origin:

```text
https://peachypawz.vercel.app
```

Authorized redirect URI:

```text
https://peachypawz.vercel.app/api/auth/callback/google
```

Google redirect URIs must match exactly.

## 7. Redeploy

Environment changes apply to new deployments. Redeploy after changing credentials/provider variables.

## 8. Production smoke test

Use an incognito/private window.

- Google OAuth completes
- new account sees onboarding, not Max
- create pet
- start empty
- manual record persists after refresh
- add second pet and verify isolation
- synthetic demo can be explicitly loaded
- evidence drawer works
- Ask handles both “hi” and pet-specific questions
- document extraction works
- correction/delete works
- Vercel logs show no secrets

## 9. Current prototype persistence

Google authentication is production-like; health-record persistence remains browser-local for the code-a-thon.

Do not present this as production storage. The documented next step is MongoDB/object storage with explicit pet authorization.
