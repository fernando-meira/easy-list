# Leave Shared Category — Design Spec

**Date:** 2026-06-16
**Branch:** feat/category-collapsible-grouping
**Status:** Approved

## Overview

Allow users to remove a shared category from their view. Clicking the trash button on a shared category card triggers a confirmation drawer; confirming removes the user from the category's `sharedWith` array in Firestore without deleting the category for its owner.

## Data Layer

### `firestore-domain.ts`

New function `leaveSharedList(categoryId: string, userId: string)`:
- Updates the category document using `FieldValue.arrayRemove(userId)` on the `sharedWith` field
- Does not modify any other field on the category

### API Endpoint

New file: `src/app/api/categories/[id]/leave/route.ts`

`DELETE /api/categories/[id]/leave`:
1. Authenticates the requesting user via session
2. Verifies the user is present in the category's `sharedWith` array (i.e. not the owner)
3. Calls `leaveSharedList(categoryId, userId)`
4. Returns `204 No Content` on success
5. Returns `403` if the user is the owner or not in `sharedWith`
6. Returns `404` if category does not exist

## Context Layer

### `CategoryContext.tsx`

New action `leaveSharedCategory(categoryId: string)`:
- Makes `DELETE /api/categories/[id]/leave`
- On success, removes the category from local state immediately to avoid visual delay (the Firestore `onSnapshot` listener will eventually sync the same result)
- Exposes the action via context

## UI Layer

### `category-card.tsx`

Shared categories (`isShared: true`) currently render without action buttons. Add a trash button to the shared category section:
- Style: `w-[34px] h-[34px]` rounded circle, `bg-[var(--color-surface-card)]`
- Icon: `Trash2`, `w-[15px] h-[15px]`, `text-[var(--color-error)]`
- On click: opens `ConfirmLeaveCategoryDrawer` with the category id and name

### `confirm-leave-category-drawer.tsx` (new)

Bottom drawer following the same structure as `confirm-remove-category-drawer.tsx`:

- **Title:** "Sair da lista"
- **Description:** "Você vai sair de '[Nome da lista]'. Você não perderá os itens adicionados, mas deixará de ter acesso a ela."
- **Destructive button:** "Sair da lista" — calls `leaveSharedCategory(categoryId)` from context; shows loading state during the request
- **Secondary button:** "Cancelar" — closes the drawer

## File Summary

| File | Change |
|------|--------|
| `src/lib/firestore-domain.ts` | Add `leaveSharedList(categoryId, userId)` |
| `src/app/api/categories/[id]/leave/route.ts` | New — DELETE handler |
| `src/context/CategoryContext.tsx` | Add `leaveSharedCategory(categoryId)` action |
| `src/components/category-card.tsx` | Add trash button to shared category section |
| `src/components/confirm-leave-category-drawer.tsx` | New — confirmation drawer |

## Out of Scope

- Removing user-added products when leaving (products belong to the category owner)
- Owner-initiated removal of other members
- Any changes to the category view (`category-client.tsx`)
