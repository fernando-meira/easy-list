# Barcode Product Registration

**Date:** 2026-06-10
**Status:** Approved

## Problem

The current product flow requires manual entry through `ProductManagerSheet`. This is simple and reliable, but slow on mobile when the user wants to add packaged supermarket products while holding the phone.

The goal is to add a mobile-first barcode scanning flow that reads a product barcode with the camera, looks up the product in an external public database, and lets the user add the result to the current category with minimal typing.

## Decisions

- **Primary environment:** mobile browser with camera.
- **Main lookup source:** Open Food Facts through a server-side app route.
- **Scanner entry point:** a new **Escanear** action in `StickyFooter`, beside the existing **Adicionar produto** action on the category page.
- **Scanner library:** `@zxing/browser`, loaded only when the user starts scanning, using a reader that supports common 1D product barcode formats such as EAN and UPC.
- **Persistence:** add optional `barcode` to product data and save it in Firestore.
- **First-cut duplicate handling:** detect duplicate `barcode` inside the current category only.
- **Fallback:** when camera access, barcode lookup, or external data quality fails, continue through the existing manual product form.
- **Out of scope:** price lookup, global user history, native app integration, and a private shared product catalog.

## User Flow

### Product found

```text
Category page
  -> user taps Escanear
  -> scanner sheet opens
  -> camera reads barcode
  -> scanner stops
  -> frontend calls /api/barcode/[code]
  -> Open Food Facts returns product data
  -> preview displays name, brand, image, and code
  -> user taps Adicionar à lista
  -> app creates product in the selected category
```

Default created product values:

```ts
{
  name: result.name,
  barcode: result.barcode,
  categoryId: selectedCategoryId,
  quantity: '1',
  unit: UnitEnum.unit,
  addToCart: false,
}
```

### Product found but user wants to review first

```text
Preview
  -> user taps Editar antes
  -> ProductManagerSheet opens with name and barcode prefilled
  -> user edits optional details
  -> existing managerProduct flow creates the product
```

### Product not found

```text
Scanner reads barcode
  -> lookup returns found: false
  -> app opens ProductManagerSheet
  -> barcode is kept internally
  -> user enters product name manually
```

### Camera unavailable or denied

```text
Scanner sheet shows permission/error state
  -> user can type the barcode manually
  -> app runs the same lookup flow
```

## Architecture

### Client-side flow

The category page owns the high-level scanner state:

```text
idle
  -> scanning
  -> lookup-loading
  -> found
  -> creating
  -> success
```

Failure and fallback states:

```text
scanning
  -> permission-denied
  -> manual-code-entry

lookup-loading
  -> not-found
  -> manual-form

lookup-loading
  -> lookup-error
  -> manual-form
```

The scanner must ignore repeated reads while a lookup or create operation is already in progress. After the first successful barcode detection, scanning stops automatically.

### Server-side lookup route

Add an internal route:

```text
GET /api/barcode/[code]
```

Responsibilities:

- Validate that the user is authenticated.
- Validate that `code` is present and contains only barcode-safe characters.
- Query Open Food Facts using the barcode endpoint.
- Request only the fields needed by the app.
- Normalize the external response into the app contract.
- Return a controlled not-found response when Open Food Facts has no match.
- Return a controlled error response on timeout or network failure.

The route should not send user id, category id, list name, or any user-specific data to Open Food Facts. Only the barcode is sent to the external service.

Suggested normalized response:

```ts
type BarcodeLookupResult = {
  barcode: string;
  found: boolean;
  name?: string;
  brand?: string;
  imageUrl?: string;
};
```

Open Food Facts lookup endpoint:

```text
https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=code,product_name,brands,image_url
```

`status: 1` means product found. `status: 0` means no product match.

## Components

### `BarcodeScannerSheet`

Purpose: read a barcode from the mobile camera and emit the detected code.

Responsibilities:

- Open as a mobile-first sheet/modal.
- Request camera access only after the user opens the scanner.
- Render a live video preview.
- Prefer the rear camera by passing `undefined` device id to the scanner library, allowing browser default environment camera selection.
- Stop scanning after the first valid result.
- Stop camera tracks when closed or unmounted.
- Show manual-code fallback when permission is denied, no camera is found, or scanning fails.
- Expose callbacks such as `onDetected(code)` and `onManualSubmit(code)`.

It should not create products, call Open Food Facts directly, or manage category state.

### `BarcodeProductPreview`

Purpose: confirm the product before adding it to the list.

Responsibilities:

- Show product name.
- Show brand when available.
- Show image when available.
- Show the barcode for transparency.
- Provide **Adicionar à lista**.
- Provide **Editar antes**.
- Handle image loading failure by hiding the broken image area or showing a neutral placeholder.

It should not own scanner state or perform the external lookup.

### `ProductManagerSheet` integration

The existing product form remains the source of truth for manual creation and editing.

Required change:

- Accept optional initial product values for add mode, including `barcode`, `name`, `quantity`, `unit`, and `categoryId`.

This allows scanner fallback and **Editar antes** to reuse the current form instead of creating a second product form.

### Category page integration

Add **Escanear** beside the existing **Adicionar produto** action in `StickyFooter` on the category page.

Visibility rules:

- Show only when there is a selected category.
- Show for owned and shared categories, matching the current product creation route behavior that allows accessible shared categories to receive products under the owner list.

## Data Model

Add optional `barcode` to `ProductProps`:

```ts
export interface ProductProps {
  _id?: string;
  name: string;
  barcode?: string;
  unit?: string;
  price?: string;
  quantity?: string;
  categoryId?: string;
  addToCart?: boolean;
  updatedAt: string;
  createdAt: string;
  category?: CategoryProps;
}
```

Update Firestore domain mapping:

- `productFromDoc` returns `barcode: data.barcode` when present.
- `createProduct` saves `barcode: product.barcode ?? null`.
- `updateProduct` saves `barcode: product.barcode ?? null`.

No migration is required for existing products because `barcode` is optional.

## Duplicate Handling

Before creating a scanner result, check products in the selected category for the same `barcode`.

If a duplicate exists, show a lightweight confirmation:

```text
Este produto parece já estar nesta lista.

[Editar produto existente]
[Adicionar mesmo assim]
```

This first version only checks the current category. It does not search all user categories or shared lists.

## Error Handling

- **Permission denied:** explain that camera access is needed and show manual barcode input.
- **No camera found:** show manual barcode input.
- **Scanner failure:** show retry and manual barcode input.
- **Product not found:** open manual product form with `barcode` preserved.
- **Lookup timeout/network error:** show a retry action and manual form fallback.
- **Create failure:** reuse existing `managerProduct` error handling and toast behavior.
- **External image failure:** keep the preview usable without the image.

## Privacy

The external Open Food Facts request contains only the barcode. The app must not send user id, category id, list names, product notes, or authentication data to the external provider.

Barcode values are stored with products in Firestore so future app behavior can detect duplicates and support product history.

## Performance

The scanner library should be loaded dynamically only after the user starts scanning. The product list should not pay the scanner bundle cost on initial page load.

The barcode lookup route should request only the fields needed for the preview to keep response payloads small.

## Accessibility

- The scanner sheet needs a clear title and description.
- The video preview should have accessible instructions outside the video element.
- Loading and error states should use text, not only visual indicators.
- Manual barcode entry must be keyboard accessible.
- Buttons must preserve Portuguese labels consistent with the rest of the app.

## Verification

Automated verification available in this repo:

- `npm run lint`
- `npx tsc --noEmit`

Manual verification cases:

- Mobile camera permission granted and product found.
- Camera permission denied.
- No product match in Open Food Facts.
- Open Food Facts timeout or network error.
- Duplicate barcode in current category.
- Add product immediately from preview.
- Edit product before adding.
- Close scanner while camera is active.
- External image fails to load.

## Risks And Limitations

- Open Food Facts is strongest for food products and may miss cleaning, hygiene, local, or non-food supermarket items.
- Product names from Open Food Facts can be incomplete, localized differently, or poorly formatted.
- Browser camera behavior differs between iOS Safari, Android Chrome, and installed PWA contexts.
- Torch control may not be available everywhere and is not part of the required first version.
- The first version does not implement offline scanning or a private product database.

## Implementation Notes

- Place the **Escanear** trigger in `StickyFooter` on the category page.
- Use **Escanear** as the primary button copy unless layout constraints require **Scan**-style icon-only treatment on very narrow screens; if icon-only is used, keep an accessible label of **Escanear produto**.
- Use the existing Portuguese-facing tone in all user-visible scanner messages.
