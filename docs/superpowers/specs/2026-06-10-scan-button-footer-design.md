# Scan Button Footer Design

**Date:** 2026-06-10
**Status:** Approved

## Problem

The current **Escanear** action in `StickyFooter` is a secondary rectangular button placed to the left of **Adicionar produto**. It does not match the compact circular action style used by product edit/delete buttons in `ProductRow`.

## Decision

- Keep **Adicionar produto** as the primary wide action.
- Move **Escanear** to the right of **Adicionar produto**.
- Render **Escanear** as an icon-only circular button.
- Match the product row action pattern: circular shape, centered icon, neutral surface background, and accessible `aria-label`.

## Target Layout

```text
[ Adicionar produto                    ] [ scan ]
```

## Files

- Modify `src/components/sticky-footer.tsx` only.

## Verification

- Run `npm run lint`.
- Run `npx tsc --noEmit`.
