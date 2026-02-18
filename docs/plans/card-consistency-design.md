# Card Consistency Design

> **Status: Partially Implemented** (as of 2026-02-18)
>
> - Change #1 (services-list full cards): **Not implemented** — `services-list.html` template does not exist yet.
> - Change #2 (cases listing page): **Implemented differently** — cases listing uses `[catalog]` block with `source = "cases"` instead of the proposed `[cases]` block.
> - Change #3 (process sidebar font/padding): **Implemented** — `process.html` already uses `var(--font-size-body)` and `var(--space-xl)` padding.

## Problem

Card implementations across pages are inconsistent with their dedicated block templates:

1. **Service cards on category/country/industry pages** use `services-list` block with simplified cards (title + description + 2 tags), while `/services/` catalog has full cards (categories, rating, description, industries, languages, price, CTA).
2. **Cases listing page** (`/cases/`) uses generic `[cards]` block instead of the dedicated `[cases]` block with image, client, results, and metadata.
3. **Process block sidebar** has narrow navigation and small font (13px `font-size-ui`), making it feel cramped.

## Solution

### 1. services-list.html — Full Service Cards

Update `renderCard()` in `services-list.html` to match `catalog.html` card format:

- Header: category badges + rating star
- Body: title (font-size-body, 600 weight) + description (font-size-ui)
- Industries row (font-size-caption tags)
- Languages row (uppercase code badges)
- Footer: price + "View →" CTA, separated by border-top

Copy `.service-card` CSS from `catalog.html` into `services-list.html` (scoped under `.services-list-grid`). Data fields already exist in `services-index.json`: `tags.categories`, `tags.industries`, `tags.languages`, `from_price`, `rating`.

Label maps for slug-to-display conversion (e.g., `digital-marketing` → `Digital Marketing`, `english` → `EN`) should be included in the JS.

### 2. Cases Listing Page — Use [cases] Block

Replace `[cards]` block in `content/cases/cases.en.toml` with `[cases]` block. Populate with full case data:

- `client`, `title`, `description`
- `results` array with `value` + `label`
- `service`, `service_label`, `industry`, `industry_label`, `language_codes`
- `url` pointing to case detail page
- Optional `image`

Add filter definitions (`services`, `industries`, `languages`) to enable the built-in filtering UI from the cases block template.

### 3. Process Block Sidebar — Font and Width

In `templates/blocks/process.html`:

- Change `.process-sidebar .process-btn` font-size from `var(--font-size-ui)` (13px) to `var(--font-size-body)` (14px) — uses existing variable, no new sizes
- Increase sidebar padding: `var(--space-md) var(--space-xl)` (was `var(--space-md) var(--space-lg)`)
- These changes make navigation labels more readable and sidebar slightly wider

## Files to Modify

| File | Change |
|------|--------|
| `templates/blocks/services-list.html` | Full card markup + CSS + updated renderCard() |
| `content/cases/cases.en.toml` | Switch from [cards] to [cases] block with full data |
| `templates/blocks/process.html` | Sidebar button font-size and padding |

## Non-Goals

- No changes to `catalog.html` (already correct)
- No changes to `cases.html` template (already correct)
- No new CSS variables or font sizes
