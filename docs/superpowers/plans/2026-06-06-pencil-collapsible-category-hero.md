# Pencil Collapsible Category Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Pencil category hero to communicate an expandable/collapsible state and add the collapsed variant to the reusable components frame.

**Architecture:** Make the smallest visual edits directly in `EasyList.pen`: add collapse affordances to existing light and dark hero cards, then update the reusable component sample and add a closed-state reusable variant. Pencil has no runtime interaction, so the design documents the interaction through visible expanded and collapsed states.

**Tech Stack:** Pencil MCP, `.pen` design schema, existing EasyList design components.

---

### Task 1: Update Page Hero Cards

**Files:**
- Modify: `/C:/Users/ThomW/OneDrive/Documentos/Design Pencil/EasyList/EasyList.pen`

- [ ] **Step 1: Add a collapse affordance to light mode**

Use `batch_design` to insert a small circular chevron-up control into `m3lcaq`, preserving title, subtitle, and cart badge.

- [ ] **Step 2: Add a collapse affordance to dark mode**

Use `batch_design` to insert the matching dark-mode chevron-up control into `aufqa`.

- [ ] **Step 3: Verify page layouts**

Run `snapshot_layout` on `b397K` and `aPIpx`; expected result: no clipping, hero card remains aligned, and content below shifts consistently if card height changes.

### Task 2: Update Reusable Components Frame

**Files:**
- Modify: `/C:/Users/ThomW/OneDrive/Documentos/Design Pencil/EasyList/EasyList.pen`

- [ ] **Step 1: Update the expanded reusable hero component sample**

Replace `E1xhtT` with a structure matching the current expanded hero model: title row, cart badge, collapse affordance, stats, and selector field.

- [ ] **Step 2: Add a collapsed reusable hero variant**

Insert a new reusable component below `E1xhtT` in `Category Page - Reusable Components`. The variant shows only the title, subtitle, cart badge, and a chevron-down affordance.

- [ ] **Step 3: Verify reusable components layout**

Run `snapshot_layout` on `m58G8L`; expected result: both hero examples are visible and the frame is tall enough for the new component.

### Task 3: Visual QA

**Files:**
- Modify: `/C:/Users/ThomW/OneDrive/Documentos/Design Pencil/EasyList/EasyList.pen`

- [ ] **Step 1: Check layout problems**

Run `snapshot_layout` with `problemsOnly: true` on `b397K`, `aPIpx`, and `m58G8L`; expected result: no clipped or collapsed nodes caused by the update.

- [ ] **Step 2: Inspect screenshots if needed**

Use `get_screenshot` only if layout data suggests a visual issue.
