# MVP Pages Spec — Productized Digital Services Marketplace (Web)

**Language:** English (UI copy, labels, content).  
**i18n:** Language switcher must exist in UI, but English is the only implemented language for MVP.  
**Goal:** SEO-first marketplace-like site with productized marketing services, with a configurable service detail page and a catalog with filters.

---

## 1) Scope (Deliverables)

### Pages
1. Home page: `/`
2. Services catalog: `/services`
3. Service detail page: `/services/[slug]`

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
- Service catalog supports filtering.
- Service detail supports configuration and price calculation.
- Prepare UI for “cart-like” behavior (add selected modules/components), even if checkout is not implemented yet.

---

## 2) Information Architecture & Routing

- `/` — Home (selling)
- `/services` — Services catalog (cards in main area; filter in right sidebar)
- `/services/[slug]` — Service detail page (description + stats + reviews + FAQ + configurator in right sidebar)

---

## 3) Layout & Navigation

### 3.1 Left Sidebar (Nav + Language)
**Contents**
- Brand header
- Navigation links:
  - Home
  - Services
  - (Optional) How it works
  - (Optional) Contact
- Language switcher UI (EN active; other languages shown but disabled or “Coming soon”):
  - EN (active)
  - DE (disabled)
  - FR (disabled)
  - ES (disabled)

**Responsive**
- Wide: fixed visible sidebar
- Narrow: collapses to a left floating icon button; opens as drawer

### 3.2 Right Sidebar (Context Action Panel)
**Catalog page (`/services`)**
- Right sidebar is **Filters panel** (primary filter UI lives here).

**Service page (`/services/[slug]`)**
- Right sidebar is **Service Configurator** (pricing + options + “Add to cart” / “Request quote” actions).

**Home page (`/`)**
- Right sidebar is a compact **Lead/CTA panel**:
  - “Browse services”
  - “Request a quote” mini-form (name/email/message) OR “Book a call” CTA button

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

### 5.1 Core Requirement (Updated)
- **Main content area:** service cards grid/list
- **Right sidebar:** filters panel (always filters on this page)
- **Left sidebar:** navigation + language switcher

### 5.2 Catalog Data Strategy (MVP)
- Initial set: **9–12 core services**
- To support SEO scaling and marketplace feel, catalog should allow **rich facets**:
  - Industries (e.g., SaaS, eCommerce, FinTech, Games, Travel, Healthcare)
  - Languages/Countries/Regions (e.g., EN/DE/FR/ES; EU/US/APAC)
- **Optional MVP concept:** split services into “service components” (modules) so you can:
  - create more SEO pages
  - let users add components to a “cart” (like a real marketplace)

> Note: For MVP, implement the UI and data model to support both:
> - a) “single service = one product”
> - b) “components/modules = addable items”
> Checkout is not required, but the UX should feel marketplace-like.

### 5.3 Filters (Right Sidebar)
Filters apply instantly to the cards list.

**Minimum filters**
- Category: SEO / Content / PPC / Localization / Analytics
- Delivery mode: One-time / Ongoing
- Industry: multi-select
- Region/Country: multi-select (can be “Regions” in MVP)
- Language support: Monolingual / Multilingual
- Price range: slider or min/max inputs (based on “from price”)
- Sort: Popular / Rating / Price low→high / New

**UX**
- Show selected filters as chips
- “Reset all” button
- Collapsible filter sections

### 5.4 Service Cards (Main Content)
Each card shows:
- Service name
- 1-line value proposition
- Tags (Category + key traits)
- “From $X” (fromPrice)
- Rating + reviews count (mock)
- Orders count (mock)
- CTA button: “View service”

---

## 6) Service Detail Page (`/services/[slug]`)

### 6.1 Page Goals
- Explain the service as a **productized service**
- Provide trust: reviews, outcomes, process, FAQ
- Provide marketplace-like “product stats”
- Allow configuration of modules/options and show final price estimate
- Primary action: request quote / add configured package

### 6.2 Content Blocks (Main Content)
1. Hero (H1 + value proposition + primary CTA)
2. Marketplace stats (orders, experts, rating, total budget, avg delivery time)
3. What you get / deliverables
4. How it works (process steps)
5. Packages overview (high-level tiers)
6. Case highlights (mock)
7. Reviews
8. FAQ (include pricing references/notes)
9. Final CTA section

### 6.3 FAQ Pricing Note (Reference)
In FAQ we must support a block that can display:
- simple price table or price list for typical scenarios
- short explanation: “final quote depends on configuration”

For MVP:
- implement FAQ items and optionally allow an FAQ item to contain a small pricing table.

### 6.4 Right Sidebar: Service Configurator (Mandatory)
Configurator lives in the right sidebar (and can optionally be duplicated as a small “sticky summary” in main content).

**Configurator inputs**
- Modules (multi-select):
  - Preliminary audit
  - Strategy development
  - Execution / Management
  - Data analysis & reporting
- Scope/Tariff (single select):
  - Starter / Growth / Scale
- Languages/Regions (multi-select):
  - languages: EN, DE, FR, ES (EN default)
  - regions: EU, US, APAC, LATAM
- Speed (single select):
  - Standard / Fast / Rush
- Mode (single select):
  - One-time project
  - Ongoing monthly

**Output**
- Live price estimate: “Total: $X” (or “From $X” + breakdown)
- Small breakdown summary (modules, languages, speed, mode)
- Primary CTA:
  - MVP option A: “Request quote” (opens a form)
  - MVP option B: “Add to plan” (cart-like behavior) + “Request quote”

**Form (modal/drawer)**
- Name
- Email
- Company / Website (optional)
- Notes
- Include configuration summary in submission payload (mock is fine)

### 6.5 Pricing Logic (MVP Rules)
Implement a deterministic formula (simple, explainable):

- Base price by tariff:
  - Starter: 1000
  - Growth: 2500
  - Scale: 5000

- Modules add-ons:
  - Audit: +500
  - Strategy: +1200
  - Execution: +2000
  - Analysis: +800

- Languages:
  - 1 language included
  - each additional language: +25% of (base + modules subtotal)

- Speed multiplier:
  - Standard: x1.0
  - Fast: x1.25
  - Rush: x1.5

- Mode:
  - One-time: total = calculated
  - Ongoing monthly: show:
    - Setup fee = calculated * 0.6
    - Monthly retainer = calculated * 0.5
  (Values can be adjusted; must be consistent in UI)

Show a short disclaimer: “Estimated. Final quote after brief.”

---

## 7) Home Page (`/`)

### 7.1 Messaging (Updated)
Home must sell the model: user orders outcomes, we assemble the team.

Core themes (use as headline sections):
- **Market visibility**
- **Decision intelligence**
- **Growth efficiency**
- **Productized services**
- **International / global / multilingual team**  
  (Prefer phrasing: “global team” + “multilingual execution” to avoid vagueness.)

### 7.2 Required Blocks
1. Hero: “Buy outcomes, not freelancers” + CTAs (Browse services / Request quote)
2. 3 Pillars: Market visibility / Decision intelligence / Growth efficiency
3. How it works: request → scope → team assembly → delivery → reporting
4. Featured services grid (6–9)
5. Proof metrics (mock stats)
6. Final CTA

---

## 8) Data Models (Mock-First)

### 8.1 Service (catalog)
- slug
- title
- category
- tags[]
- industries[]
- regions[]
- languagesSupported[]
- deliveryMode (one-time/ongoing)
- fromPrice
- rating
- reviewsCount
- ordersCount
- expertsCount
- totalBudget (aggregate)

### 8.2 Service Detail
- all Service fields
- description blocks content
- packages (starter/growth/scale descriptions)
- reviews[]
- faq[] (supports optional pricing table content)

### 8.3 Configurator Options
- tariffs[]
- modules[]
- languages[]
- regions[]
- speeds[]
- modes[]
- pricing rules constants

---

## 9) Acceptance Criteria
1. `/services` shows cards in main area and filters in right sidebar.
2. Filters update visible cards without page reload (client-side mock ok).
3. `/services/[slug]` shows full service page with right sidebar configurator.
4. Configurator updates price estimate live and shows a breakdown.
5. Theme toggle works and persists.
6. Language switcher exists; EN works; other languages visible but not implemented.
7. Glassmorphism style is consistently applied across pages.
8. Layout works:
   - Wide: both sidebars visible
   - Narrow: sidebars collapse to icon buttons and open drawers

---

## 10) Implementation Status

### Completed

**CMS Infrastructure:**
- File-based CMS with TOML content format
- 27 block templates (hero, features, pricing, faq, testimonials, etc.)
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

**Pages:**
- Home page (`/`)
- Blocks library (`/blocks/*`) — demos for all block types
- AI Optimisation service page (`/services/ai-optimisation`)
- Blog section with article support

### In Progress
- Services catalog page with filters
- Service configurator (pricing calculator)

### Not Started
- Right sidebar layout
- Glassmorphism styling
- Mobile responsive sidebars
- Service detail page template
- Shopping cart behavior

### Live Site
https://zedzima.github.io/vividigit-site/