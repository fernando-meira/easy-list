# Pencil Collapsible Category Hero Design

## Context

The Pencil file `EasyList.pen` contains a category page hero card in light mode (`zt4EJ`), a matching dark mode hero card (`qklHM`), and a reusable component sample in `Category Page - Reusable Components` (`E1xhtT`). The collapsed state should show only the information currently present in `m3lcaq`: title, subtitle, and cart summary badge.

## Approved Approach

Keep the expanded hero card in the page flow, add a clear collapse affordance to the hero header, and update the reusable components frame with a collapsed variant that documents the closed state.

## Design Requirements

- The expanded hero remains visually compatible with the current mobile category page.
- The closed state contains only the `m3lcaq` information: category title, product count subtitle, and cart badge.
- The collapse affordance is visible in light and dark mode.
- The reusable components frame includes the updated expandable hero component and a closed-state variant.
- Existing spacing, typography, Portuguese-facing copy, and current visual language are preserved.

## Validation

- Check light and dark page layouts for clipping or broken alignment.
- Check the reusable components frame for visible updated component examples.
- Ensure text contrast remains sufficient in both themes.
