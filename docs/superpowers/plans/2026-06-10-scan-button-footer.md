# Scan Button Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the scan action to the right of the add-product action and style it like the circular product row action buttons.

**Architecture:** Keep the existing `StickyFooter` API and event handlers. Change only the footer button layout/classes so the primary add button remains wide and the scan action becomes a compact icon-only action.

**Tech Stack:** React, TypeScript, Tailwind CSS classes, Lucide icons, Next.js.

---

## File Structure

- Modify `src/components/sticky-footer.tsx`: update the action row grid and scan button classes/content.

## Task 1: Update Footer Scan Button

**Files:**
- Modify: `src/components/sticky-footer.tsx`

- [ ] **Step 1: Replace the action button grid**

In `src/components/sticky-footer.tsx`, replace the current action grid with:

```tsx
        <div className="grid grid-cols-[1fr_48px] gap-2">
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onAddProduct();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)]"
          >
            <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
            <span className="text-[14px] font-semibold text-[var(--color-on-primary)]">
              Adicionar produto
            </span>
          </button>

          <button
            type="button"
            aria-label="Escanear produto"
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onScanProduct();
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-card)]"
          >
            <ScanLine className="h-[15px] w-[15px] text-[var(--color-ink)]" />
          </button>
        </div>
```

- [ ] **Step 2: Verify**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands pass.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-06-10-scan-button-footer-design.md docs/superpowers/plans/2026-06-10-scan-button-footer.md src/components/sticky-footer.tsx
git commit -m "refactor(scan-button): alinha ação ao padrão de produto" -m "Alterações:" -m "- move botão Escanear para a direita do Adicionar produto" -m "- transforma escanear em ação circular icon-only" -m "- documenta spec e plano do ajuste visual"
```
