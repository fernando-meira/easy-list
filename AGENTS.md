# AGENTS.md

## Commands

- Use npm; this repo has `package-lock.json` and no other package-manager lockfile.
- Install: `npm install`.
- Dev server: `npm run dev`.
- Lint: `npm run lint`.
- Auto-fix lint/import formatting: `npm run lint:fix`; Husky pre-commit runs this exact command.
- Typecheck: no package script exists; use `npx tsc --noEmit`.
- Production verification: `npm run build` runs Next build plus lint/type checks.
- There is no test script or test framework configured in `package.json`.

## Environment

- Local env is expected in `.env.local`; do not read or print it unless explicitly needed.
- Required/used env vars inferred from code: `MONGODB_URI`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXTAUTH_URL`.
- `MONGODB_URI` is required at module load by both Mongoose and the MongoDB adapter.
- Email/login flows validate Resend config; `EMAIL_FROM` must be a valid sender, and `NEXTAUTH_URL` is required for magic-link email generation.

## App Shape

- This is a single Next.js App Router app under `src/app`, not a monorepo.
- Root providers are wired in `src/app/layout.tsx` in this order: `ThemeProvider` -> `AuthProvider` -> `UserContextProvider` -> `CategoriesContextProvider` -> `ProductsContextProvider`.
- `ProductsContext` depends on `CategoriesContext`; keep that provider order if changing layout/providers.
- Auth middleware in `src/middleware.ts` protects every non-API route except `/login` and `/verify-request`; authenticated users are redirected away from those public routes to `/`.
- Main UI flow: `/` lists categories with `CategoryCard`; `/category?id=<categoryId>` shows products for the selected category.
- API routes live in `src/app/api`: auth/email code flows, categories, and products.

## Data Model Notes

- Categories are user-scoped by `userId`; category APIs use `next-auth/jwt` token ownership checks.
- Products reference `Category` by ObjectId and are embedded into category responses by manual queries, not Mongoose populate in the categories route.
- `GET /api/categories` creates a default `Supermercado` category when the authenticated user has none.
- Deleting a category also deletes all products associated with it.

## Style And UI Conventions

- Use `@/*` imports for `src/*` paths; this is configured in `tsconfig.json` and `components.json`.
- ESLint enforces single quotes, semicolons, 2-space indentation, sorted imports via `eslint-plugin-perfectionist`, and custom import line wrapping at 100 chars.
- UI primitives are shadcn-style components in `src/components/ui`; `components.json` uses `new-york`, CSS variables, and Lucide icons.
- Tailwind dark mode uses the `class` strategy; theme tokens are CSS variables in `src/app/globals.css`.
- The app is Portuguese-facing (`pt-BR` in layout); preserve Portuguese user-facing copy unless asked otherwise.

## Verification Notes

- For ordinary code changes, run `npm run lint` and `npx tsc --noEmit`; run `npm run build` when touching routing, auth, env-sensitive code, or server/API behavior.
- `npm run build` was verified in this workspace and loads `.env.local`.
- Avoid introducing tests unless you also add the missing test tooling/scripts.
