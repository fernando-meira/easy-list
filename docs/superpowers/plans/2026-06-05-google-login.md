# Google Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth login to the existing NextAuth email/code authentication flow while preserving the current fallback flow.

**Architecture:** Add `GoogleProvider` to the existing `authOptions` in `src/lib/auth.ts`, using the existing `MongoDBAdapter` and JWT session strategy. Update the current login page to offer a Google sign-in action above the email form, handle OAuth errors generically, and leave the email magic-link/OTP flow unchanged.

**Tech Stack:** Next.js 15 App Router, React 19, NextAuth.js v4, MongoDBAdapter, Tailwind CSS, shadcn-style `Button`, TypeScript.

---

## File Structure

- Modify `src/lib/auth.ts`: owns NextAuth provider configuration. Add Google OAuth here and keep provider ordering explicit.
- Modify `src/app/(auth)/login/page.tsx`: owns login UI and client sign-in actions. Add Google button, Google loading state, OAuth error banner, and divider.
- No env example file exists in this repo. Do not create one in this implementation; document required Google env vars in the final handoff instead.
- Do not modify `.env.local`; it may contain secrets and should not be read or printed.

## Task 1: Configure Google Provider

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Confirm there is no automated test target for provider config**

Run: `npm run lint`

Expected: PASS with `No ESLint warnings or errors`. This is the available fast validation because the repo has no test runner configured.

- [ ] **Step 2: Add the Google provider import**

In `src/lib/auth.ts`, update the provider imports at the top from:

```ts
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
```

to:

```ts
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
```

- [ ] **Step 3: Add `GoogleProvider` before the email provider**

In `src/lib/auth.ts`, change the start of the `providers` array from:

```ts
  providers: [
    EmailProvider({
```

to:

```ts
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      // Google is treated as trusted for verified emails in this app.
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
```

This intentionally enables automatic account linking by email for Google, matching the approved spec.

- [ ] **Step 4: Run lint after provider config**

Run: `npm run lint`

Expected: PASS with `No ESLint warnings or errors`. If import ordering fails, run `npm run lint:fix`, then inspect the diff before continuing.

- [ ] **Step 5: Commit provider config**

Run:

```bash
git status --short
git diff -- src/lib/auth.ts
git add src/lib/auth.ts
git commit -m "feat: add google auth provider"
```

Expected: commit includes only `src/lib/auth.ts`.

## Task 2: Add Google Sign-In UI

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Add the Google icon import**

In `src/app/(auth)/login/page.tsx`, update the Lucide import from:

```ts
import { ArrowLeft, ArrowRight } from 'lucide-react';
```

to:

```ts
import { ArrowLeft, ArrowRight, Chrome } from 'lucide-react';
```

`Chrome` is used as the closest available icon in the current dependency set. Do not add a new icon package just for the Google logo.

- [ ] **Step 2: Replace the existing OAuth error banner component**

Replace the current `ExpiredLinkBanner` function in `src/app/(auth)/login/page.tsx`:

```tsx
function ExpiredLinkBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('error') !== 'Verification') return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      Seu link expirou ou já foi usado. Solicite um novo acesso.
    </div>
  );
}
```

with:

```tsx
function LoginErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (!error) return null;

  const message = error === 'Verification'
    ? 'Seu link expirou ou já foi usado. Solicite um novo acesso.'
    : 'Não foi possível entrar com Google. Tente novamente ou use seu email.';

  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
```

This keeps the existing expired magic-link handling and adds a generic OAuth error message without exposing provider details.

- [ ] **Step 3: Add Google loading state**

In `LoginPage`, change the state block from:

```tsx
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
```

to:

```tsx
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
```

- [ ] **Step 4: Add the Google sign-in handler**

Add this function after the `useForm<CodeFormData>` setup and before `sendLoginEmail`:

```tsx
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn('google', { callbackUrl: '/' });
    } catch {
      toast.error('Não foi possível entrar com Google. Tente novamente ou use seu email.');
      setIsGoogleLoading(false);
    }
  };
```

Do not set `isGoogleLoading` back to `false` after a successful `signIn`, because the browser will navigate away.

- [ ] **Step 5: Render the new banner component**

Change this JSX:

```tsx
        <Suspense fallback={null}>
          <ExpiredLinkBanner />
        </Suspense>
```

to:

```tsx
        <Suspense fallback={null}>
          <LoginErrorBanner />
        </Suspense>
```

- [ ] **Step 6: Add the Google button and divider above the email form**

In the `!showCodeForm` branch, immediately after the title/subtitle block:

```tsx
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Acesse sua conta</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Digite seu email para continuar
                </p>
              </div>
```

insert:

```tsx
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || isGoogleLoading}
                  onClick={handleGoogleSignIn}
                >
                  {isGoogleLoading ? (
                    <>Conectando <LoadingSpinner /></>
                  ) : (
                    <>Continuar com Google <Chrome className="ml-1 h-4 w-4" /></>
                  )}
                </Button>

                <div className="relative text-center text-xs text-muted-foreground">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-card px-2">ou continue com email</span>
                </div>
              </div>
```

The existing email form remains immediately below this block.

- [ ] **Step 7: Disable email actions while Google sign-in is pending**

In the email submit button, change:

```tsx
                <Button type="submit" className="w-full" disabled={isLoading}>
```

to:

```tsx
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
```

In the email input, add `disabled={isGoogleLoading}` so the input becomes:

```tsx
                  <Input
                    autoFocus
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    disabled={isGoogleLoading}
                    {...registerEmail('email')}
                  />
```

- [ ] **Step 8: Run lint after UI change**

Run: `npm run lint`

Expected: PASS with `No ESLint warnings or errors`. If import ordering or line wrapping fails, run `npm run lint:fix`, then inspect the diff before continuing.

- [ ] **Step 9: Commit UI change**

Run:

```bash
git status --short
git diff -- src/app/(auth)/login/page.tsx
git add "src/app/(auth)/login/page.tsx"
git commit -m "feat: add google login button"
```

Expected: commit includes only `src/app/(auth)/login/page.tsx`.

## Task 3: Verify Environment Documentation And Full Build

**Files:**
- No code file required unless a tracked env example is added before implementation starts.

- [ ] **Step 1: Confirm env example status**

Run: `git ls-files "*.example" ".env*"`

Expected: no tracked env example containing public placeholder values. If `.env.local` appears, do not read it and do not commit it.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS. If it fails because `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing, do not print local env values. First verify the failure is caused by Google provider configuration. If so, stop and ask the user to provide local Google OAuth credentials before changing the provider design.

- [ ] **Step 4: Manual validation checklist**

With Google OAuth credentials configured locally, run: `npm run dev`

Expected manual results:

- `/login` shows `Continuar com Google` above the email form.
- Clicking `Continuar com Google` starts the NextAuth Google OAuth flow.
- Successful Google login redirects to `/`.
- Google login with an email already used by email/código reaches the same existing user's data.
- Email/código login still sends email and verifies OTP.
- Visiting `/login?error=OAuthSignin` shows `Não foi possível entrar com Google. Tente novamente ou use seu email.`
- Visiting `/login?error=Verification` still shows `Seu link expirou ou já foi usado. Solicite um novo acesso.`

- [ ] **Step 5: Final commit if verification-only fixes were needed**

If Task 3 required code or docs changes, run:

For a documentation-only change, run:

```bash
git status --short
git diff -- README.md RESEND_DOMAIN_SETUP.md RESEND_DEBUG.md MONGODB_FIX.md UNIFIED_LOGIN.md
git add README.md
git commit -m "docs: document google auth environment"
```

Expected: no commit is created if Task 3 only ran verification commands. Only run this commit if `README.md` was actually changed for public Google OAuth setup notes.

## Final Handoff Notes

Tell the user that Google OAuth requires these values outside git:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Tell the user to configure these redirect URIs in Google Cloud Console:

- `http://localhost:3000/api/auth/callback/google`
- production `${NEXTAUTH_URL}/api/auth/callback/google`

Before handing off, run:

```bash
git status --short
```

Expected: only unrelated pre-existing worktree changes remain, or no changes remain if the workspace was clean.
