# MVP Pages Spec — Productized Digital Services Marketplace (Web)

**Language:** English (UI copy, labels, content).
**i18n:** Language switcher must exist in UI, but English is the only implemented language for MVP.
**Goal:** SEO-first marketplace-like site with productized marketing services, using a task-based configurator with transparent pricing.

**Aligned with:** `docs/plans/2026-01-27-service-taxonomy-design.md` and `docs/plans/2026-01-27-web-strategy-framework.md`

---

## 1) Scope (Deliverables)

### Pages
1. Home page: `/`
2. Services catalog: `/services`
3. Service detail page: `/services/[slug]` (with embedded task-picker block + order-cart sidebar)
4. Specialist profile: `/team/[slug]`
5. Case study: `/cases/[slug]`
6. Pillar pages: `/categories/[slug]`, `/industries/[slug]`, `/countries/[slug]`, `/languages/[slug]`
7. Solution landing pages: `/solutions/[slug]`
8. Blog listing: `/blog`
9. Blog post: `/blog/[slug]` (Markdown with YAML frontmatter, entity type `blog-post`)

### Global UI
- Two sidebars layout:
  - **Left sidebar:** navigation + language switcher
  - **Right sidebar:** action panel (contextual)
- Responsive behavior:
  - **Wide screens:** both sidebars visible
  - **Narrow screens:** both sidebars collapse into icon buttons and open as drawers
- Style:
  - Modern **glassmorphism**
  - **Light/Dark theme toggle** (persisted)

### Marketplace behaviors (MVP-ready)
- Service catalog supports faceted filtering auto-generated from the entity graph (all 7 connected entity types).
- Service detail page: tasks are displayed inline via task-picker block; users select tasks, choose volume tiers, see live pricing in order-cart sidebar.
- Prepare UI for "cart-like" behavior (add selected tasks), even if checkout is not implemented yet.

---

## 2) Information Architecture & Routing

- `/` — Home (selling)
- `/services` — Services catalog (cards in main area; faceted filters in catalog block)
- `/services/[slug]` — Service detail (task-picker block in main content + order-cart in right sidebar)
- `/team` — All specialists
- `/team/[slug]` — Specialist profile (tasks, cases, languages)
- `/cases` — All case studies
- `/cases/[slug]` — Case study (results, services used, specialist)
- `/categories/[slug]` — Category pillar with door opener task
- `/industries/[slug]` — Industry pillar with relevant services/tasks
- `/countries/[slug]` — Country pillar
- `/languages/[slug]` — Language aggregator
- `/solutions/[slug]` — Problem-focused landing page
- `/blog` — Blog listing (catalog with static filters)
- `/blog/[slug]` — Blog post (Markdown content, entity type `blog-post`)

---

## 3) Layout & Navigation

### 3.1 Left Sidebar (Nav + Language)
**Contents**
- Brand header
- Navigation links:
  - Home
  - Services
  - Team
  - Cases
  - Industries
  - Countries
  - Languages
- Language switcher UI (EN active; other languages shown but disabled or "Coming soon"):
  - EN (active)
  - DE (disabled)
  - FR (disabled)
  - ES (disabled)

**Responsive**
- Wide: fixed visible sidebar
- Narrow: collapses to a left floating icon button; opens as drawer

### 3.2 Right Sidebar (Context Action Panel)

**Entity listing pages (`/services`, `/team`, `/cases`, `/solutions`)**
- Faceted filters are rendered in the **catalog block** (not sidebar) for mobile visibility.
- Right sidebar is **default CTA + contact form** (same as homepage).

**Service page (`/services/[slug]`)**
- Right sidebar is **Order Cart** (`type = "order-cart"`) — shows selected tasks summary, tier choices, order-level language/country modifiers, live total, "Add to Cart" / "Request Quote" buttons. Tasks are selected via the task-picker block in the main content area.

**Specialist page (`/team/[slug]`)**
- Right sidebar is **Contact/Book** CTA panel with availability info.

**Case page (`/cases/[slug]`)**
- Right sidebar is **Similar Services** panel with results summary.

**Home page (`/`)**
- Right sidebar is a compact **Lead/CTA panel**:
  - "Browse services"
  - "Request a quote" mini-form (name/email/message) OR "Book a call" CTA button

**Responsive**
- Wide: visible
- Narrow: collapses to right floating icon; opens as drawer

---

## 4) Visual Style

### 4.1 Glassmorphism
- Semi-transparent cards/panels with blur (`backdrop-filter`)
- Subtle borders, soft shadows
- Clean typography, generous spacing
- Dark mode: higher contrast, glowing accents
- Light mode: softer contrast, crisp outlines

### 4.2 Theme Toggle
- Toggle in header area (top center or left sidebar top)
- Persist selection (localStorage is enough)

### 4.3 Brand / Logo
- Logo centered in top header area: `V\V\D\G\T`
- Minimal, monochrome by default; can glow slightly in dark mode

---

## 5) Services Catalog Page (`/services`)

### 5.1 Core Requirement
- **Main content area:** service cards grid/list with faceted filter dropdowns above cards
- **Right sidebar:** default CTA + contact form
- **Left sidebar:** navigation + language switcher

### 5.2 Catalog Data Strategy (MVP)
- Initial set: **5-10 core services** (aligned with taxonomy: Technical SEO, On-Page SEO, AI Visibility, Content Strategy, Google Ads, etc.)
- Each service is a **task catalog** — it groups related tasks
- Services are tagged by 4 dimensions: categories, industries, countries, languages
- SEO scaling through faceted pillar-cluster model

### 5.3 Filters (Catalog Block)
Filters are rendered inside the catalog block (above cards) for mobile visibility.
Filters are **auto-generated from the entity graph** — no hardcoding in TOML.

**Entity listing filters** (services, team, cases, solutions):
- Up to 7 filter dimensions matching all connected entity types
- Filter options and labels derived from `bi_map` and `page_lookup`
- Applied via "Apply Filters" button, reset via "Reset Filters"

**Dimension listings** (categories, industries, countries, languages):
- No filters — sort dropdown only

**Blog listing** — static filters defined in `[[catalog.filters]]` in TOML:
- Category, Type (article/research/news/etc.), Date (year), Author

**Sort options** per source type (e.g., Popular, Rating, A-Z, Newest)

**UX**
- Multi-select checkbox dropdowns
- "Apply Filters" / "Reset Filters" button
- GTM events: `filter_apply` (with source, filters, result_count), `sort_change` (with source, sort_by)

### 5.4 Service Cards (Main Content)
Each card shows:
- Service name
- 1-line value proposition
- Category tag
- Number of available tasks
- Door opener price: "From $X"
- Rating + reviews count (mock)
- CTA button: "View service"

---

## 6) Service Detail Page (`/services/[slug]`)

### 6.1 Page Goals
- Present the service with embedded **task-picker block** for transparent pricing
- User selects tasks inline, chooses volume tiers, sees live price in order-cart sidebar
- Provide trust: cases, process, FAQ
- Primary action: add configured tasks to cart / request quote

### 6.2 Content Blocks (Main Content)
1. Hero (H1 + value proposition + primary CTA)
2. Door opener callout (featured entry-point task with price)
3. Available tasks grid (with tier/price summary for each)
4. How it works (process steps)
5. Case highlights
6. Specialists who deliver this service
7. FAQ (include pricing transparency notes)
8. Final CTA section

### 6.3 FAQ Pricing Note (Reference)
In FAQ we must support a block that can display:
- task pricing table with S/M/L/XL tiers
- short explanation: "select tasks and tiers above for exact pricing"

### 6.4 Task-Picker Block (Main Content)

Tasks are displayed inline in the main content area via the `task-picker` block.

**TOML schema:**
```toml
[task-picker]
tag = "tasks"                    # Tag label above title
title = "Available Tasks"        # Section heading
subtitle = "Select tasks..."     # Optional subtitle
anchor = "task-picker"           # Optional custom anchor id (default: "task-picker")

[[task-picker.tasks]]
slug = "site-audit"              # Unique task identifier
title = "Technical Site Audit"   # Display name
description = "..."              # Short description
delivery_type = "one-time"       # "one-time" | "monthly" | "both"
unit_type = "pages"              # Unit label for tiers (pages, clusters, campaigns, etc.)
door_opener = true               # Pre-selected + auto-expanded on load, added to cart
deliverables = [                 # Checklist shown in expanded details
    "Crawl report with 47+ technical checks",
    "Prioritized issues list"
]

[[task-picker.tasks.tiers]]      # Volume/price tiers (typically S/M/L/XL)
name = "S"                       # Tier code
label = "Up to 100 pages"        # Human-readable description
price = 500                      # Price in USD (0 = custom/contact us)
```

**Behavior:**
- Each task is a card with checkbox, title, badges (door_opener, delivery_type), and expand toggle
- Expanded view shows deliverables checklist and tier selector buttons
- Door opener tasks: pre-checked, auto-expanded, immediately added to cart on page load
- Checkbox toggle dispatches `taskToggled` CustomEvent
- Tier button click dispatches `tierChanged` CustomEvent

### 6.5 Right Sidebar: Order Cart (`type = "order-cart"`)

The right sidebar shows a live order summary driven by events from the task-picker block.

**TOML schema:**
```toml
[sidebar]
title = "Your Order"                        # Widget heading
type = "order-cart"                         # Sidebar type identifier
button_label = "Request Quote"              # Primary CTA text
button_url = "contact/?service=technical-seo"  # CTA target
note = "Estimated pricing. Final quote after brief."
language_fee = 200                          # Per-language modifier cost
country_fee = 100                           # Per-country modifier cost
extra_languages = true                      # Show language counter
extra_countries = true                      # Show country counter
```

**Cart contents:**
- Selected tasks with chosen tiers and prices (line items)
- Remove button (×) per item — unchecks the task in task-picker
- Order-level modifiers (if enabled):
  - Languages: +/− counter, fee per additional language
  - Countries: +/− counter, fee per additional country
- Price breakdown: Subtotal | Modifier fees | Estimated Total
- Primary CTA button

### 6.6 Event System & Cart API

Task-picker block and order-cart sidebar communicate via CustomEvents on `document`.

**Events dispatched by task-picker block:**

| Event | Trigger | Payload |
|-------|---------|---------|
| `taskToggled` | Checkbox change | `{ slug, title, selected, tierName, tierLabel, price, custom }` |
| `tierChanged` | Tier button click | `{ taskSlug, tierName, tierLabel, price, custom }` |

**Cart object (`site.js`):**

```
cart.items = { [slug]: { title, tierName, tierLabel, price, custom } }
cart.add(slug, title, tierName, tierLabel, price, custom)  → add item, re-render
cart.remove(slug)                                          → delete item, uncheck checkbox, re-render
cart.updateTier(slug, tierName, tierLabel, price, custom)   → update existing item tier, re-render
cart.render()                                              → rebuild cart HTML, recalculate totals
```

**Initialization flow:**
1. Page loads → task-picker inline script expands door openers, sets checkboxes
2. `site.js` loads (end of `<body>`) → registers event listeners
3. `site.js` scans `.task-select-cb:checked` → calls `cart.add()` for each pre-checked task
4. User interactions dispatch events → cart updates in real time

**Pricing formula:**
```
Total = Σ(task tier prices) + (langCount × language_fee) + (countryCount × country_fee)
```

- If any task has `price = 0` (custom), total shows "From $X" prefix
- Show disclaimer: "Estimated. Final quote after brief."

---

## 8) Data Models

### 8.1 Service (catalog entry)
- slug
- title
- category (seo, aeo, content, etc.)
- tags: {categories[], industries[], countries[], languages[]}
- relationships: {available_tasks[], door_opener_task, specialists[], cases[]}
- fromPrice (door opener task price)
- rating
- reviewsCount
- ordersCount

### 8.2 Task (atomic product)
- slug
- title
- category
- delivery_type (one-time | monthly | both)
- unit_model:
  - unit_type (pages, keywords, campaigns, etc.)
  - tiers: {S: {max, price}, M: {max, price}, L: {max, price}, XL: {max, price}}
- door_opener (boolean)
- can_be_sold_standalone (boolean)
- deliverables[]
- dependencies[] (tasks that should precede this one)
- tags: {categories[], industries[]}
- relationships: {part_of_services[], specialists[], related_tasks[]}

### 8.3 Specialist
- slug
- name
- role
- photo
- bio
- projects_count
- rating
- hourly_rate
- relationships: {tasks[], languages[], countries[], cases[]}

### 8.4 Case
- slug
- name
- client
- problem
- results: [{metric, value, timeframe}]
- testimonial
- relationships: {industry, country, language, services_used[], tasks_used[], specialists[]}

### 8.5 Blog Post (entity type `blog-post`)
- slug
- title
- content_type (article, research, guide, news, etc.) — preserved in `config.content_type` for catalog display
- date
- author (specialist slug — via `data.relationships.author`)
- categories (category entity slugs — via `data.tags.categories`)
- body (Markdown content)
- Content format: Markdown (`.md`) with flat YAML frontmatter (not TOML)
- Normalization: `normalize_blog_entities()` in main.py bridges flat frontmatter to graph-compatible `data.tags` and `data.relationships`
- Card template: `blocks/cards/blog-post-card.html`

### 8.6 Order Cart Options (Service Sidebar, `type = "order-cart"`)
- Selected tasks from task-picker block
- Per-task: tier choice (S/M/L/XL)
- Order-level: languages[] (+$200 each), countries[] (+$100 each)

---

## 9) Acceptance Criteria
1. `/services` shows service cards in main area with faceted filters in catalog block.
2. Filters update visible cards without page reload (client-side).
3. `/services/[slug]` shows full service page with task-picker block in main content and order-cart in right sidebar.
4. Task-picker block shows available tasks with tier selectors; order-cart sidebar shows live price calculation.
5. `/team/[slug]` shows specialist profile with tasks, languages, countries.
7. `/cases/[slug]` shows case study with results, services used.
8. Theme toggle works and persists.
9. Language switcher exists; EN works; other languages visible but not implemented.
10. Glassmorphism style is consistently applied across pages.
11. Layout works:
    - Wide: both sidebars visible
    - Narrow: sidebars collapse to icon buttons and open drawers

---

## 10) Implementation Status

Last updated: 2026-02-20

### Completed

**CMS Infrastructure:**
- File-based CMS with TOML content format
- 30 block templates (hero, features, pricing, faq, testimonials, catalog, catalog-mini, task-picker, related-entities, etc.)
- Jinja2 template rendering
- Auto-generated sitemap.xml and robots.txt
- SEO: Open Graph, Twitter Cards, canonical URLs
- GitHub Actions deployment to GitHub Pages

**CMS Web Interface:**
- Dashboard with page listing
- Form-based page editor
- New page creation from block templates
- Media library with upload
- Build and preview functionality
- Local development mode (`--local` flag)

**Content Graph:**
- Full bidirectional entity graph (9 primary entities including Blog Post)
- Auto-generated `related-entities` blocks with contextual headings
- Auto-generated faceted filters from entity graph (in catalog block, not sidebar)
- JSON exports with `facets` and `labels` for client-side filtering
- Graph export (`graph.json`) for visualization

**Faceted Architecture:**
- Tag-based and relationship-based entity connections
- Pillar pages (categories, industries, countries, languages)
- Solution landing pages
- 9 JSON index files for client-side filtering and cross-entity navigation

**Pages:**
- Home page (`/`)
- Blocks library (`/blocks/*`) — demos for all block types
- 2 service pages: technical-seo, ai-optimisation (with task-picker + order-cart)
- 1 specialist profile: ivan-petrov
- 1 case study: ecommerce-migration-2025
- 1 solution: seo-ecommerce
- 14 category pages, 4 industry pages, 5 country pages, 7 language pages
- Blog section with article support and 4-filter catalog (category, type, date, author)

**Task-picker & Order Cart:**
- Task-picker block with interactive task selection
- Order-cart sidebar with live pricing, modifiers, and event-driven updates
- Cart JavaScript module with CustomEvent API

**GTM Analytics Events:**
- `filter_apply` — catalog_source, filters, result_count
- `sort_change` — catalog_source, sort_by
- `contact` — form_type, page
- `generate_lead` — cart_items, cart_total, email

### Not Started
- Intersection page generation (e.g., `/industries/ecommerce/seo/`)
- Full deployment of 13 categories with all services and tasks

### Live Site
https://vividigit.com/
