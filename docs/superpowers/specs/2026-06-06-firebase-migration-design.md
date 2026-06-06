# Firebase Migration Design

## Context

Easy List is a Next.js 15 App Router application that currently stores application data and auth-related records in MongoDB. Domain data uses Mongoose models for categories and products. Auth uses NextAuth with Google, email magic link, a custom verification-code credentials provider, and `MongoDBAdapter`.

The migration goal is to replace MongoDB with Firebase Firestore while preserving the existing login behavior: Google login, magic link login, and verification-code login remain available and continue using Resend for email delivery.

Existing data does not need to be migrated. The Firebase/Firestore deployment can start empty.

## Goals

- Replace MongoDB and Mongoose persistence with Firestore.
- Keep NextAuth and the current auth flows working.
- Keep Resend as the email provider for magic links and verification codes.
- Keep the existing client API contract as stable as possible.
- Support Firebase Emulator Suite for local development.
- Improve product ownership checks while migrating product routes.

## Non-Goals

- Do not migrate to Firebase Auth.
- Do not migrate existing MongoDB documents into Firestore.
- Do not redesign the UI or change the user-facing shopping-list flow.
- Do not replace Resend with a Firebase email service.
- Do not add a test framework as part of this migration.

## Recommended Approach

Use Firestore server-side through Firebase Admin SDK and use the official Auth.js Firebase adapter for NextAuth persistence.

This keeps the current architecture: client contexts continue calling the same API routes, and the API routes remain the ownership and validation boundary. Firestore is not accessed directly from browser code for categories or products.

Dependencies to add:

```text
firebase-admin
@auth/firebase-adapter
```

Dependencies to remove after migration:

```text
mongoose
@types/mongoose
@auth/mongodb-adapter
```

## Firebase Admin Setup

Create a server-only Firebase Admin module, likely `src/lib/firebase-admin.ts`, that initializes the default Firebase app once using `getApps()` as a singleton guard.

Production credentials come from environment variables:

```text
AUTH_FIREBASE_PROJECT_ID
AUTH_FIREBASE_CLIENT_EMAIL
AUTH_FIREBASE_PRIVATE_KEY
```

Local development uses Firebase Emulator Suite. The app should honor `FIRESTORE_EMULATOR_HOST` when it is set. The Firestore client should be initialized from Firebase Admin and shared by server route handlers.

The private key should normalize escaped newlines, because hosted environments often store it as a single-line variable.

## NextAuth Design

Keep the existing `authOptions` shape and providers:

- `GoogleProvider`
- `EmailProvider`
- `CredentialsProvider` with id `verification-code`
- `session: { strategy: 'jwt' }`
- existing callbacks for Google profile photo
- existing custom pages

Replace:

```ts
MongoDBAdapter(clientPromise)
```

With:

```ts
FirestoreAdapter(...)
```

The Firebase adapter stores NextAuth users, accounts, sessions, and verification tokens in Firestore. Since this app uses JWT sessions, the cookie/session behavior remains primarily JWT-based, but user/account/token persistence moves out of MongoDB.

## Resend And Email

Resend remains the email delivery provider. No Firebase email service is introduced.

Existing environment variables remain required:

```text
RESEND_API_KEY
EMAIL_FROM
NEXTAUTH_URL
```

The email flow changes only in its persistence layer:

- before sending an email, create the code/token record in Firestore instead of MongoDB;
- after a Resend failure, delete the just-created Firestore record as rollback;
- keep the current user-facing email copy unless a separate redesign is requested.

`NEXTAUTH_URL` remains required because magic links depend on the correct base URL.

## Firestore Data Model

### `categories/{categoryId}`

```text
name: string
userId: string
createdAt: Timestamp
updatedAt: Timestamp
```

Responses should continue exposing `_id` to avoid frontend churn:

```text
_id = document id
```

### `products/{productId}`

```text
name: string
price?: string | number
quantity?: string | number
unit?: string
categoryId: string
userId: string
addToCart: boolean
createdAt: Timestamp
updatedAt: Timestamp
```

Products should include both `categoryId` and `userId`. The current MongoDB product routes do not consistently validate product ownership; this migration should fix that without changing the UI.

### `verificationCodes/{codeRecordId}`

```text
email: string
code?: string
token?: string
expiresAt: Timestamp
createdAt: Timestamp
used: boolean
usedAt?: Timestamp
attempts: number
```

These records support the existing custom code and magic-link endpoints.

### NextAuth Collections

The `FirestoreAdapter` owns its auth collections. The custom verification-code flow is the only planned exception: it may upsert a user record in the same Firestore user collection so `CredentialsProvider.authorize` can return a stable `{ id, email, name }`. The implementation plan must define the exact user fields used for that upsert and avoid writing to adapter-owned account, session, or verification-token collections directly.

## Serialization Contract

The frontend currently expects Mongo-style objects with `_id`, `createdAt`, `updatedAt`, and sometimes embedded `category` objects.

Firestore route handlers should normalize responses into the current shape:

```text
document id -> _id
Timestamp -> ISO string
categoryId -> category reference field for writes
category -> embedded category object for product responses
```

This avoids broad changes in `CategoryContext`, `ProductContext`, and UI components.

## API Route Design

### `GET /api/categories`

- Require `getToken` with `authSecret`.
- Query categories where `userId == token.sub`.
- If none exist, create the default `Supermercado` category.
- Query products for the same `userId` and group by `categoryId`.
- Return categories with embedded `products`, matching the current API response shape.

### `GET /api/categories?id=<categoryId>`

- Require authentication.
- Fetch the category by document ID.
- Return `404` if missing or if `userId` does not match `token.sub`.
- Query products by `userId` and `categoryId`.
- Return the category with embedded products.

### `POST /api/categories`

- Require authentication.
- Validate `name`.
- Create the category with `userId`, `createdAt`, and `updatedAt`.
- Return `{ data: category }` with `_id` and ISO timestamps.

### `DELETE /api/categories?id=<categoryId>`

- Require authentication.
- Validate category ownership.
- Delete associated products and the category in a batch.
- Return `204` on success.

### `GET /api/products`

- Require authentication and return only products for `token.sub`.
- Preserve response compatibility by embedding each product's category.

### `POST /api/products`

- Require authentication.
- Validate `categoryId` belongs to `token.sub`.
- Create product with `userId`, `categoryId`, `addToCart`, `createdAt`, and `updatedAt`.
- Return product with embedded `category`.

### `GET /api/products/[id]`

- Require authentication.
- Fetch product by ID.
- Return `404` if missing or if `userId` does not match `token.sub`.
- Return product with embedded `category`.

### `PUT /api/products/[id]`

- Require authentication.
- Fetch product by ID and validate `userId`.
- If `categoryId` changes, validate the new category belongs to the same user.
- Update fields and `updatedAt`.
- Return product with embedded `category`.

### `DELETE /api/products/[id]`

- Require authentication.
- Fetch product by ID and validate `userId`.
- Delete the product.
- Return the current success response shape.

## Auth Code And Magic Link Routes

### `POST /api/auth/request-code`

- Validate email with Zod.
- Count recent Firestore `verificationCodes` for that email within the last hour.
- Enforce the current max-attempts rule.
- Create a code record in Firestore.
- Send the code via Resend.
- If Resend fails, delete the Firestore record and return the existing user-facing error style.

### `POST /api/auth/verify-code`

- Validate email and code.
- Find an unused, unexpired matching Firestore code record.
- Increment attempts for invalid known records.
- Upsert the user record in the Firestore user collection used by NextAuth, preserving a stable user id for the credentials login.
- Return `{ success: true, email }` so the frontend can continue signing in through the existing credentials provider flow.

### `CredentialsProvider.authorize`

- Replace MongoDB lookups with Firestore lookups.
- Validate unused, unexpired code and attempts.
- Mark the record as used.
- Return `{ id, email, name }` using the Firestore-backed NextAuth user identity.

### `POST /api/auth/send-login`

- Create both code and magic-link token records in Firestore.
- Send the existing combined login email with Resend.
- Roll back the Firestore record if Resend fails.

### `GET /api/auth/callback/email`

The current implementation manually creates a session record and cookie while `session.strategy` is `jwt`. For this migration, remove the database-session insert from this custom route. After validating the Firestore magic-link token and upserting the user, issue a NextAuth-compatible JWT session cookie using the existing auth secret and redirect to `/`.

The migration must preserve user behavior: clicking the magic link should authenticate and redirect to `/`.

## Error Handling

Keep Portuguese user-facing errors in API responses and toasts.

Map Firestore/Admin errors to generic user-facing messages similar to the current MongoDB error handling. Avoid leaking Firebase credentials, project IDs, stack traces, or raw service errors to the client.

## Indexes

Expected Firestore query patterns:

- `categories`: `userId`
- `categories`: `userId`, `name` if category name uniqueness or sorted server queries are added later
- `products`: `userId`, `categoryId`
- `verificationCodes`: `email`, `createdAt`
- `verificationCodes`: `email`, `code`, `used`, `expiresAt`
- `verificationCodes`: `email`, `token`, `used`, `expiresAt`

Implementation should start with the indexes required by Firestore errors during local/prod verification. Do not add unnecessary composite indexes preemptively beyond queries actually used.

## Local Development

Use Firebase Emulator Suite for Firestore in development.

The implementation plan should add clear setup notes for:

- installing or using Firebase CLI;
- starting the Firestore emulator;
- setting `FIRESTORE_EMULATOR_HOST`;
- preserving Resend variables for real email delivery unless mocked manually by the developer.

## Verification Plan

Automated verification commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Manual verification checklist:

- Google login works.
- Magic link email is sent by Resend and authenticates the user.
- Verification-code email is sent by Resend and authenticates the user.
- `Supermercado` is created automatically for a new authenticated user.
- Category creation, listing, and deletion work.
- Deleting a category deletes its products.
- Product creation, edit, category move, cart toggle, single deletion, and delete-all flow work.
- One user's categories/products are not visible or mutable by another user.

## Risks

- The custom magic-link callback currently mixes manual session handling with JWT session strategy. This is the highest-risk part of the migration.
- Firestore timestamps and document IDs require response normalization to avoid frontend regressions.
- Firestore query restrictions may require composite indexes discovered during verification.
- The Firebase adapter's auth collection shape should be treated as adapter-owned to avoid coupling custom code to internals.

## Acceptance Criteria

- The app no longer requires `MONGODB_URI` at module load or runtime.
- MongoDB and Mongoose imports are removed from application code.
- NextAuth login via Google, magic link, and code still works.
- Resend remains responsible for all login emails.
- Categories and products are persisted in Firestore.
- Local development can run against Firebase Emulator Suite.
- Lint, typecheck, and production build pass.
