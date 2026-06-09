# Shared Lists — Design & Implementation

**Goal:** Allow a list owner to share a category (shopping list) via a link. Anyone with the link can join and edit the list in real-time alongside the owner.

**Implemented:** 2026-06-09 — PR #80

---

## Overview

A user who owns a category can share it with a URL that contains a one-time-generated token. When another user opens that URL, they are added to the category's `sharedWith` array in Firestore and gain real-time read/write access to the list. Shared lists appear alongside owned lists in the UI, identified by a small icon.

---

## Data Model

No new collections were created. Two new fields were added to existing `categories` documents:

```
categories/{id}
  userId: string         // owner's UID (pre-existing)
  name: string           // (pre-existing)
  shareToken?: string    // UUID, generated lazily on first share request
  sharedWith?: string[]  // array of UIDs who have joined
```

Products are unchanged — they store the **owner's** `userId`, not the uid of whoever created them. This preserves the existing Firestore query invariant (`where('userId', '==', ownerId)`).

---

## Firestore Security Rules

Shared users need read/write access to products in a category they were added to. The relevant rules gate access through the category's `sharedWith` array:

```
match /categories/{categoryId} {
  allow read, write: if request.auth.uid == resource.data.userId
                     || request.auth.uid in resource.data.sharedWith;
}

match /products/{productId} {
  allow read, write: if request.auth.uid == resource.data.userId
                     || exists(.../categories/$(resource.data.categoryId))
                        && request.auth.uid in get(.../categories/$(resource.data.categoryId)).data.sharedWith;
}
```

---

## API Routes

### `GET /api/categories/[id]/share`

Generates (or returns cached) a share URL for the requesting user's category.

- Auth: required (owner only — `userId` must match)
- Calls `generateShareToken(userId, categoryId)` in `firestore-domain.ts`
- Token is generated once with `crypto.randomUUID()` and stored on the document
- Returns `{ shareUrl: "https://.../share/<token>" }`

### `POST /api/share/[token]`

Joins a shared list.

- Auth: required
- Calls `joinSharedList(token, requestingUserId)` in `firestore-domain.ts`
- Looks up the category by `shareToken`, then calls `arrayUnion(requestingUserId)` on `sharedWith`
- No-op (skips `arrayUnion`) if the requester is the category owner — prevents the owner from adding themselves to their own `sharedWith`
- Returns `{ categoryId, categoryName }` on success

---

## Landing Page — `/share/[token]`

A client component that:

1. Resolves the async `params` (Next.js 15 pattern)
2. POSTs to `/api/share/[token]`
3. On success: shows a toast and redirects to `/`
4. On failure: renders an inline error message

The page does not require auth — NextAuth will redirect the user to `/login?callbackUrl=/share/<token>` automatically if they're not signed in. After login, the redirect brings them back to the landing page, which then completes the join flow.

---

## Real-Time Sync Architecture

The existing sync used two Firestore `onSnapshot` listeners (Listener 1: owned categories, Listener 2: owned products). Shared lists add two more.

### Listener 1 — Owned categories
```
categories WHERE userId == currentUser
```
Counts toward `pendingInitialSnapshots`. Fires `handleSnapshotUpdate(isInitial)`.

### Listener 2 — Owned products
```
products WHERE userId == currentUser
```
Counts toward `pendingInitialSnapshots`. Fires `handleSnapshotUpdate(isInitial)`.

### Listener 3 — Shared categories
```
categories WHERE sharedWith array-contains currentUser
```
Does **not** count toward `pendingInitialSnapshots`. Always calls `handleSnapshotUpdate(true)` (silent, no toast). On every fire it tears down Listener 4, clears `latestSharedProductsRef`, then rebuilds Listener 4 with the new set of shared category IDs.

The teardown-before-render order is important: the ref must be cleared *before* calling `handleSnapshotUpdate` to avoid a render frame where new categories appear with stale products from the previous set.

### Listener 4 — Shared products (dynamic)
```
products WHERE categoryId in [sharedCategoryIds]
```
Created inside Listener 3's callback. Torn down and rebuilt whenever the shared category set changes. Limited to 30 IDs (Firestore `in` query limit); a `console.warn` is emitted if the user has more.

`isFirstFire` is tracked per-listener instance. The first snapshot calls `handleSnapshotUpdate(true)` (silent); subsequent calls use `handleSnapshotUpdate(false)` (shows toast if not a local mutation).

### Data merge in `buildCategoriesFromRefs`

Four refs are merged client-side before each render:

```
latestCategoriesRef       (owned)
latestProductsRef         (owned)
latestSharedCategoriesRef (shared)
latestSharedProductsRef   (shared)
```

Deduplication is by Firestore document ID using `Set`. Owned data takes precedence — shared entries with the same ID as an owned entry are dropped. This handles the edge case where the owner opens their own share link.

The merged result is sorted alphabetically by category name, then by product name within each category.

### Toast suppression for self-mutations

`markLocalMutation(count)` increments a counter before any write. When `handleSnapshotUpdate(false)` fires, if the counter is positive it decrements by one and skips the "Lista atualizada" toast. This works across all four listeners — no changes were needed to support shared lists.

---

## UI Changes

### `CategorySelect`
Shared categories show a `<Users>` icon (Lucide) next to the name. The icon has `aria-hidden="true"`.

### `ProductListHeader`
A **Compartilhar** button is shown only when `filteredCategory.isShared === false` (owner view). It fetches the share URL and copies it to the clipboard via `navigator.clipboard.writeText`.

### `CategoryCard`
The delete button (divider + trash icon) is hidden for shared categories. The server also rejects delete requests from non-owners.

### `ProductContext.removeAllProducts`
Filters out shared categories before collecting products to delete, preventing a shared user from deleting the owner's products via "remove all".

---

## `isShared` Flag

`CategoryProps.isShared?: boolean` is a client-only derived field — it is never stored in Firestore. It is set to `false` for owned categories and `true` for shared categories during the merge in `buildCategoriesFromRefs`.

---

## Login Page — Suspense Fix

`useSearchParams()` in the login page required a `<Suspense>` boundary for Next.js static prerendering. The component body was extracted into `LoginPageContent` and wrapped:

```tsx
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
```

`callbackUrl` is also validated to start with `/` to prevent open redirect attacks.

---

## Known Limitations

- **30 shared categories max** — Firestore `in` queries are limited to 30 values. Users with more than 30 shared categories will only see the first 30 synced in real-time (a console warning is emitted).
- **`shareToken` never expires** — The token is permanent. Revoking access requires manually removing a user from `sharedWith` (no UI for this yet).
- **No permission levels** — All shared users have full write access. There is no read-only mode.
