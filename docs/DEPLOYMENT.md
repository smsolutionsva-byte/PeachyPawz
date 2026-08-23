# PeachyPawz Deployment — GitHub + Vercel + Google OAuth

## 1. Install the new authentication dependency

After updating to this version:

```bash
npm install
```

The project uses Auth.js / `next-auth` v5 beta with the Google provider.

## 2. Create local environment variables

Copy the template:

```bash
cp .env.example .env.local
```

Generate the authentication secret:

```bash
npm exec auth secret
```

Your local environment needs:

```env
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

# Optional
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5
```

Never commit `.env.local`.

## 3. Configure Google OAuth

In Google Auth Platform / Google Cloud Console:

1. Configure the OAuth consent screen.
2. Create an OAuth Client.
3. Choose **Web application**.
4. Add the local redirect URI exactly:

```text
http://localhost:3000/api/auth/callback/google
```

5. Copy the Client ID into `AUTH_GOOGLE_ID`.
6. Copy the Client Secret into `AUTH_GOOGLE_SECRET`.

For local development, you can also add this origin:

```text
http://localhost:3000
```

The callback URI must match exactly, including protocol, hostname, port and path.

## 4. Test locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Expected first-run flow:

```text
Login → Google → Create pet → AI consent → Upload/manual/empty → app
```

A new account must not receive synthetic Max records automatically.

## 5. Push to GitHub

If the folder is not already a Git repository:

```bash
git init
git add .
git commit -m "Build PeachyPawz health intelligence timeline"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If it is already connected:

```bash
git add .
git commit -m "Add Google auth and first-run onboarding"
git push
```

## 6. Import the GitHub repository into Vercel

1. Sign in to Vercel.
2. Choose **Add New → Project**.
3. Import the GitHub repository.
4. Vercel should detect **Next.js** automatically.
5. Keep the normal build command: `next build`.
6. Add Production environment variables:

```text
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
OPENAI_API_KEY       # optional
OPENAI_MODEL         # optional
```

Do not prefix secrets with `NEXT_PUBLIC_`.

Deploy the project.

## 7. Add the production Google callback

Suppose Vercel gives you:

```text
https://peachypawz.vercel.app
```

Go back to the Google OAuth client and add this authorized redirect URI:

```text
https://peachypawz.vercel.app/api/auth/callback/google
```

Also add the production origin if you configured JavaScript origins:

```text
https://peachypawz.vercel.app
```

If you later connect a custom domain such as `https://peachypawz.com`, add:

```text
https://peachypawz.com/api/auth/callback/google
```

## 8. Redeploy after environment changes

If you add or change environment variables after a Vercel deployment, redeploy so the new values are available to the application.

## 9. Production-demo checklist

Before submission, test in an incognito/private browser:

- Google sign-in opens and returns successfully.
- Brand-new user sees onboarding, not Max.
- Pet profile saves.
- Empty timeline contains zero invented records.
- Manual record persists after refresh.
- PDF import requires review before save.
- AI toggle off prevents optional AI narration/image extraction.
- AI toggle on works if the server key is present.
- `/api/ai` returns 401 when called without a session.
- `/api/documents/extract` returns 401 when called without a session.
- Mobile layout works at ~375px width.

## Prototype persistence limitation

Authentication is real, but pet health records are currently browser-local for demo reliability. A production implementation should move workspace persistence to MongoDB/object storage and enforce owner/pet authorization server-side.
