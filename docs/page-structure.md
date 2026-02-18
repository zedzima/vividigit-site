# Page Structure: Blocks & Sidebars

All page collections, their block order, and sidebar configuration.

---

## Listing Pages

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| Services | `/services/` | hero → catalog (source=services) → coverage | `filters` (categories, industries, languages, countries) + CTA |
| Team | `/team/` | hero → catalog (source=team) → cta | `filters` (categories, languages, countries) + CTA → services |
| Cases | `/cases/` | hero → catalog (source=cases) → cta | `filters` (categories, industries, languages, countries) + CTA → services |
| Blog | `/blog/` | hero → catalog (source=blog) → cta | `filters` (category, date, author, tags) + CTA → services |
| Categories | `/categories/` | hero → catalog (source=categories) → coverage | `filters` (industries, languages, countries) + CTA → services |
| Industries | `/industries/` | hero → catalog (source=industries) | `filters` (categories, languages, countries) + CTA → services |
| Countries | `/countries/` | hero → catalog (source=countries) | `filters` (categories, industries, languages) + CTA → services |
| Languages | `/languages/` | hero → catalog (source=languages) | `filters` (categories, industries, countries) + CTA → services |
| Solutions | `/solutions/` | hero → catalog (source=solutions) → coverage → logos | `filters` (categories, industries, languages, countries) + CTA → services |

---

## Service Detail (2 pages)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| Service | `/services/{slug}/` | hero → logos → features → task-picker → process → faq → testimonials → catalog-mini_team (source=team) → services_grid → cta | `order-cart` |

**order-cart sidebar**: price, "Request Quote" button, language fee ($200), country fee ($100).

---

## Specialist Detail (1 page)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| Specialist | `/team/{slug}/` | hero → features → cards → cta | `cta-contact` |

**cta-contact sidebar**: "Book Consultation" button + Quick Contact form (email, message).

---

## Case Detail (1 page)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| Case | `/cases/{slug}/` | hero → features → process → testimonials → cta | `cta-contact` |

**cta-contact sidebar**: "Book Consultation" button + Quick Contact form (email, message).

---

## Blog Post Detail (1 page)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| Blog post | `/blog/{slug}/` | hero → text → cta | `toc` |

**toc sidebar**: auto-generated table of contents from headings + Quick Contact form.

---

## Category Detail (14 pages)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| All categories | `/categories/{slug}/` | hero → features → text → catalog-mini (source=services) → pricing → testimonials → catalog-mini_specialists (source=team) → catalog-mini_cases (source=cases) → cta | `order-cart` |

**catalog-mini**: filters services by `dimension=categories`, `value={slug}`
**catalog-mini_specialists**: filters specialists by `dimension=categories`, `value={slug}`, `limit=4`
**catalog-mini_cases**: filters cases by `dimension=categories`, `value={slug}`, `limit=4`

---

## Industry Detail (4 pages)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| All industries | `/industries/{slug}/` | hero → features → text → catalog-mini (source=services) → testimonials → catalog-mini_specialists (source=team) → catalog-mini_cases (source=cases) → cta | `cta-contact` |

**catalog-mini**: filters services by `dimension=industries`, `value={slug}`
**catalog-mini_specialists**: filters specialists by `dimension=industries`, `value={slug}`, `limit=4`
**catalog-mini_cases**: filters cases by `dimension=industry`, `value={slug}`, `limit=4`

---

## Country Detail (5 pages)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| All countries | `/countries/{slug}/` | hero → features → text → catalog-mini (source=services) → testimonials → catalog-mini_specialists (source=team) → catalog-mini_cases (source=cases) → cta | `cta-contact` |

**catalog-mini**: filters services by `dimension=countries`, `value={slug}`
**catalog-mini_specialists**: filters specialists by `dimension=countries`, `value={slug}`, `limit=4`
**catalog-mini_cases**: filters cases by `dimension=country`, `value={slug}`, `limit=4`

---

## Language Detail (7 pages)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| All languages | `/languages/{slug}/` | hero → features → text → catalog-mini (source=services) → testimonials → catalog-mini_specialists (source=team) → catalog-mini_cases (source=cases) → cta | `cta-contact` |

**catalog-mini**: filters services by `dimension=languages`, `value={slug}`
**catalog-mini_specialists**: filters specialists by `dimension=languages`, `value={slug}`, `limit=4`
**catalog-mini_cases**: filters cases by `dimension=language`, `value={slug}`, `limit=4`

---

## Solution Detail (1 page)

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| SEO for E-commerce | `/solutions/seo-ecommerce/` | hero → text → pricing → catalog-mini (source=services) → catalog-mini_cases (source=cases) → catalog-mini_specialists (source=team) → cta | `order-cart` |

**catalog-mini**: filters services by `dimension=industries`, `value={industry_slug}`
**catalog-mini_cases**: filters cases by `dimension=industry`, `value={industry_slug}`, `limit=4`
**catalog-mini_specialists**: filters specialists by `dimension=industries`, `value={industry_slug}`, `limit=4`


---

## Standalone Pages

| Page | URL | Blocks | Sidebar |
|------|-----|--------|---------|
| Home | `/` | hero → logos → pillars → coverage → process_tabs → testimonials → services_grid → faq → stats → cta | Get Started + Quick Contact |
| Contact | `/contact/` | hero → cta | `full-form` |

---

## Catalog Block Reference

### `catalog` — Universal listing catalog

Full-featured catalog with toolbar (count + sort) and sidebar filter integration.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `source` | Data source: `services`, `team`, `cases`, `blog`, `categories`, `solutions`, `industries`, `countries`, `languages` | `services` |
| `count_label` | Text after count number ("X services found") | `services found` |
| `title` | Optional header title | — |
| `subtitle` | Optional subtitle | — |
| `tag` | Tag label above title | block type |

### `catalog-mini` — Simplified filtered catalog

Simplified catalog for non-listing pages. No toolbar, no sidebar filters. Supports multiple instances per page via `_suffix` naming.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `source` | Data source: `services`, `team`, `cases`, `blog`, `categories`, `solutions`, `industries`, `countries`, `languages` | `services` |
| `dimension` | JSON field to filter on (e.g. `categories`, `industries`) | — |
| `value` | Value to match in the dimension field | — |
| `limit` | Max number of items to show (0 = unlimited) | `0` |
| `title` | Optional header title | — |
| `subtitle` | Optional subtitle | — |
| `tag` | Tag label above title | block type |

**Multiple instances**: `[catalog-mini_specialists]`, `[catalog-mini_team]` — parser splits on `_`, uses `catalog-mini` template.

---

## Sidebar Types Reference

| Type | Description | Used by |
|------|-------------|---------|
| `filters` | Checkbox dropdowns for client-side filtering + optional CTA button | All listing pages |
| `order-cart` | Cart populated from task-picker or pricing block, language/country fees, quote button | Service detail, category detail, solution detail |
| `full-form` | Full contact form (name, phone, email, message, how did you hear) | Contact page |
| `cta-contact` | Book Consultation + Quick Contact form | Case, specialist, industry, country, language detail |
| `toc` | Auto-generated table of contents + Quick Contact | Blog posts |
| none (fallback) | Get Started + Quick Contact form | Home, blog listing, any page without sidebar config |
