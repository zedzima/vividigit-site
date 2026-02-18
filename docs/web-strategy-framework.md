# Vividigit Web Strategy Framework - Content graph architecture

**Date:** 2026-01-27
**Status:** Strategic framework for decision-making
**Purpose:** Define how the website scales through entities, relationships, and intersections

---

## 1. Core Principle

> **Transparency creates trust. Structure creates scale.**

The website is a **graph of connected entities**. Each entity is a node. Relationships are edges. Intersections of entities generate pages. More entities + more relationships = more pages = more entry points = more organic traffic.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Entities (Nodes)  ───────►  Relationships (Edges)         │
│         │                            │                      │
│         ▼                            ▼                      │
│   Pillar Pages      ───────►   Intersection Pages           │
│         │                            │                      │
│         └────────────┬───────────────┘                      │
│                      ▼                                      │
│              Internal Linking Graph                         │
│                      │                                      │
│                      ▼                                      │
│               Topical Authority                             │
│                      │                                      │
│                      ▼                                      │
│                Organic Growth                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 Graph Terminology

| Term | Definition | Example |
|------|------------|---------|
| **Node** | Entity | Ivan Petrov, Site Audit, Germany |
| **Edge** | Relationship between entities | "Ivan CAN_PERFORM task Site Audit" |
| **Page** | Visual representation of a node | `/team/ivan-petrov/` |
| **Link** | Visual representation of an edge | `<a href="/services/technical-seo/">` |

**Edge** is the relationship itself between two entities:

```
[Ivan Petrov] ———PERFORMS———→ [Site Audit]
      ↑                            ↑
    node          edge            node
```

### 1.2 Two Types of Attributes

Each entity has two types of attributes:

| Type | Definition | Example | Storage |
|------|------------|---------|---------|
| **Simple** | Value (string, number) | `name: "Ivan"`, `rating: 4.9` | Field in TOML |
| **Reference** | Link to another entity | `tasks: [site-audit]` | Slug of another Entity |

**Reference attributes = graph edges.** They create connections between nodes.

```yaml
# Example: specialist/ivan-petrov.toml

# Simple attributes (values)
name: "Ivan Petrov"
rating: 4.9
hourly_rate: 75

# Reference attributes (edges → other Entities)
tasks: [site-audit, schema-markup, cwv-optimization]  # → 3 edges to /tasks/*
languages: [english, german]                           # → 2 edges to /languages/*
countries: [germany, austria]                          # → 2 edges to /countries/*
```

### 1.3 How Graph Becomes a Website

```
        GRAPH (data)                     WEBSITE (pages)

   [Specialist]                      /team/ivan/
        │                                 │
        │ PERFORMS (edge)                 │ <a href> link
        ▼                                 ▼
      [Task]         ──────────→      (embedded in Service page via task-picker)
        │                                 │
        │ PART_OF (edge)                  │ displayed within
        ▼                                 ▼
    [Service]       ──────────→      /services/technical-seo/
```

| In Graph | On Website |
|----------|------------|
| Node (Entity) | Page (`/team/ivan/`) |
| Edge (relationship) | Internal link (`<a href>`) |
| Intersection (filter by 2+ dimensions) | Intersection page (`/industries/ecommerce/seo/`) |

**Intersection page** is not an edge, but a query result from the graph: "show all Services where Industry=ecommerce AND Category=seo".

---

## 2. Entity Types (Nodes)

### 2.1 Primary Entities (have dedicated pages)

| Entity | URL Pattern | Description |
|--------|-------------|-------------|
| **Specialist** | `/team/{slug}/` | Person who performs tasks |
| **Service** | `/services/{slug}/` | Task catalog (configurator page for a domain) |
| **Solution** | `/solutions/{slug}/` | Problem-focused entry point |
| **Category** | `/categories/{slug}/` | Service grouping pillar (SEO, Content, PPC...) |
| **Industry** | `/industries/{slug}/` | Vertical market |
| **Country** | `/countries/{slug}/` | Geographic market |
| **Language** | `/languages/{slug}/` | Linguistic capability |
| **Case** | `/cases/{slug}/` | Proof of results |

**Note:** Tasks are embedded data within Service pages, displayed via the task-picker block. They don't generate standalone pages.

### 2.2 Secondary Entities (attributes, no dedicated pages)

| Entity | Description |
|--------|-------------|
| **Problem** | Client pain point (used in Solutions) |
| **Result** | Outcome/metric (used in Cases) |
| **Delivery Type** | one-time / monthly / both |
| **Unit Type** | Variable unit (pages, keywords, campaigns, ad_spend, etc.) |
| **Tier** | Volume limit (S/M/L/XL) |
| **Price** | Cost structure |
| **Duration** | Time to deliver |

---

## 3. Entity Attributes

> In examples below: **simple attributes** = values, **reference attributes** = graph edges (marked with `# → EDGE`)

### Specialist
```yaml
slug: "ivan-petrov"
name: "Ivan Petrov"
role: "Technical SEO Specialist"
photo: "team/ivan.jpg"
bio: "8 years in technical SEO..."
projects_count: 47
rating: 4.9
hourly_rate: 75

# Reference attributes (graph edges)
tasks: [site-audit, schema-markup, cwv-optimization]      # → EDGE to /tasks/*
languages: [english, german, russian]                     # → EDGE to /languages/*
countries: [germany, austria, usa]                        # → EDGE to /countries/*
cases: [case-ecommerce-migration]                         # → EDGE to /cases/*
```

### Task
```yaml
slug: "site-audit"
name: "Technical Site Audit"
category: "seo"
description: "Comprehensive crawl analysis, technical issues identification, prioritized fix roadmap"
purpose: "Identify and prioritize technical SEO issues blocking indexing and rankings"

# Delivery type
delivery_type: "one-time"             # one-time | monthly | both

# Deliverables
deliverables:
  - "Crawl report with 47+ technical checks"
  - "Prioritized issues list with severity levels"
  - "Action plan with effort estimates"
  - "30-minute walkthrough call"

# Unit model (volume tiers)
unit_model:
  unit_type: "pages"                  # pages/keywords/templates/campaigns/etc.
  tiers:
    S: { max: 100, price: 500 }
    M: { max: 1000, price: 1200 }
    L: { max: 10000, price: 2500 }
    XL: { max: null, price: "custom" }

# Task properties
can_be_sold_standalone: true          # can be purchased separately
dependencies: []                       # tasks that should precede this one (optional)
door_opener: true                      # recommended entry point for category

# Reference attributes (graph edges)
part_of_services: [technical-seo, ecommerce-seo]       # → EDGE to /services/*
specialists: [ivan-petrov, maria-schmidt]               # → EDGE to /team/*
related_tasks: [schema-markup, cwv-optimization]        # → EDGE to /tasks/*
problems_solved: [crawl-errors, indexing-issues]        # simple (Problem has no page)
```

### Task (monthly example)
```yaml
slug: "google-ads-management"
name: "Google Ads Management"
category: "ppc"
description: "Ongoing Google Ads optimization, bid management, and performance reporting"

# Delivery type
delivery_type: "monthly"              # recurring billing

# Deliverables (per month)
deliverables:
  - "Weekly bid optimization"
  - "New ad copy testing"
  - "Monthly performance report"
  - "Strategy call"

# Unit model (based on ad spend)
unit_model:
  unit_type: "ad_spend"               # pricing based on managed spend
  tiers:
    S: { max: 5000, price: 500 }      # <$5k spend = $500/mo
    M: { max: 20000, price: 900 }     # $5-20k spend = $900/mo
    L: { max: 50000, price: 1400 }    # $20-50k spend = $1400/mo
    XL: { max: null, price: "custom" }

# Task properties
can_be_sold_standalone: true
dependencies: [google-ads-setup]       # requires setup first
door_opener: false

# Reference attributes (graph edges)
part_of_services: [google-ads]
specialists: [anna-mueller, max-bauer]
related_tasks: [google-ads-setup, conversion-tracking]
problems_solved: [low-roas, wasted-spend]
```

### Service
```yaml
slug: "technical-seo"
name: "Technical SEO"
category: "seo"
description: "Technical SEO audit, optimization, and ongoing maintenance"

# Service = Task catalog (configurator)
# User selects any tasks + units, adds to cart
available_tasks: [site-audit, schema-markup, cwv-optimization, site-architecture, migration-support]

# Door opener for category page
door_opener_task: site-audit          # "Start with Site Audit — $500"

# Reference attributes (graph edges)
specialists: [ivan-petrov, maria-schmidt]              # → EDGE to /team/*
industries: [ecommerce, saas, fintech]                 # → EDGE to /industries/*
countries: [germany, usa, uk]                          # → EDGE to /countries/*
languages: [english, german]                           # → EDGE to /languages/*
cases: [case-ecommerce-migration]                      # → EDGE to /cases/*

# Simple attributes
solves: [crawl-errors, slow-site, indexing-issues]     # Problem has no page
```

### Order / Cart (runtime, not stored)
```yaml
# User builds an order by selecting tasks from service catalog
# Languages + Countries apply to ENTIRE ORDER, not per-task

items:
  - task: site-audit
    tier: M                           # 1000 pages
    price: 1200
  - task: schema-markup
    tier: S                           # 5 templates
    price: 200

# Order-level modifiers
languages: [german, french]           # +$200 per language
countries: [germany, austria]         # +$100 per country

# Pricing calculation
subtotal: 1400                        # sum of tasks
language_fee: 400                     # 2 languages × $200
country_fee: 200                      # 2 countries × $100
total: 2000
```

### Solution
```yaml
slug: "not-ranking-google"
name: "Site Not Ranking on Google"
problem: "Your site doesn't appear in search results"
causes:
  - "Technical SEO issues"
  - "Thin or duplicate content"
  - "No backlinks"
diagnosis: "Free SEO health check..."

# Reference attributes (graph edges)
recommended_services: [technical-seo, content-audit]   # → EDGE to /services/*
recommended_tasks: [site-audit, keyword-research]      # → EDGE to /tasks/* (door openers)
related_cases: [case-startup-seo]                      # → EDGE to /cases/*
```

### Industry
```yaml
slug: "ecommerce"
name: "E-commerce"
description: "Online retail and marketplaces"
common_problems: [product-page-seo, faceted-navigation]  # simple (Problem has no page)

# Reference attributes (graph edges)
relevant_services: [technical-seo, ecommerce-seo]        # → EDGE to /services/*
relevant_tasks: [site-audit, product-optimization]       # → EDGE to /tasks/*
specialists: [ivan-petrov, anna-mueller]                 # → EDGE to /team/*
cases: [case-shopify-store, case-marketplace]            # → EDGE to /cases/*
```

### Country
```yaml
slug: "germany"
name: "Germany"
flag: "🇩🇪"
market_notes: "GDPR-strict, German-language preference..."

# Reference attributes (graph edges)
languages: [german, english]                             # → EDGE to /languages/*
specialists: [maria-schmidt, klaus-weber]                # → EDGE to /team/*
services_available: [local-seo, german-content]          # → EDGE to /services/*
```

### Language
```yaml
slug: "german"
name: "German"
native_name: "Deutsch"

# Reference attributes (graph edges)
specialists: [maria-schmidt, klaus-weber]                # → EDGE to /team/*
services: [content-creation, localization]               # → EDGE to /services/*
tasks: [translation, localization]                       # → EDGE to /tasks/*
countries: [germany, austria, switzerland]               # → EDGE to /countries/*
```

### Case
```yaml
slug: "ecommerce-migration-2025"
name: "E-commerce Platform Migration"
client: "Fashion Retailer"
problem: "Losing 40% traffic after platform migration"
testimonial: "..."

results:
  - metric: "Traffic recovery"
    value: "120%"
    timeframe: "3 months"

# Reference attributes (graph edges)
industry: ecommerce                                      # → EDGE to /industries/*
country: germany                                         # → EDGE to /countries/*
language: german                                         # → EDGE to /languages/*
services_used: [technical-seo]                           # → EDGE to /services/*
tasks_used: [site-audit, redirect-mapping]               # → EDGE to /tasks/*
specialists: [ivan-petrov]                               # → EDGE to /team/*
```

---

## 4. Relationships (Edges)

### Relationship Matrix

| From | Relation | To |
|------|----------|-----|
| Specialist | PERFORMS | Task |
| Specialist | SPEAKS | Language |
| Specialist | SERVES | Country |
| Specialist | WORKED_ON | Case |
| Task | PART_OF | Service |
| Task | REQUIRES | Task (dependency) |
| Task | SOLVES | Problem |
| Service | CONTAINS | Task |
| Service | SOLVES | Problem |
| Service | FOR | Industry |
| Service | IN | Language |
| Service | FOR | Country |
| Service | DEMONSTRATED_IN | Case |
| Solution | ADDRESSES | Problem |
| Solution | RECOMMENDS | Service |
| Solution | RECOMMENDS | Task (door opener) |
| Industry | HAS_PROBLEMS | Problem |
| Case | PROVES | Service |
| Case | DEMONSTRATES | Task |
| Case | IN | Industry |
| Case | FOR | Country |

### Relationship Rules

1. **Bidirectional linking**: If Service → Industry, then Industry page lists that Service
2. **Task → Specialist derivation**: If Specialist performs Tasks, and Service contains Tasks, Specialist is linked to Service
3. **Aggregation**: Industry page aggregates all Services, Tasks, Specialists, Cases for that industry

---

## 5. Page Generation Rules

### 5.1 Pillar Pages (Entity Pages)

Each primary entity gets a dedicated page:

```
/team/ivan-petrov/           → Specialist profile
/services/technical-seo/     → Service as Task configurator (catalog)
/solutions/not-ranking/      → Problem + recommended services/tasks
/categories/seo/             → Category pillar (service grouping)
/industries/ecommerce/       → Industry hub
/countries/germany/          → Country hub
/languages/german/           → Language hub
/cases/ecommerce-migration/  → Case study
```

### 5.2 Intersection Pages (Combinations)

**Rule: Generate intersection page when there are 3+ services at that intersection.**

| Intersection | URL | Content |
|--------------|-----|---------|
| Category + Industry | `/industries/ecommerce/seo/` | SEO services for E-commerce |
| Category + Country | `/countries/germany/seo/` | SEO services in Germany |
| Category + Language | `/languages/german/content/` | Content services in German |
| Industry + Country | `/industries/ecommerce/germany/` | E-commerce marketing in Germany |

### 5.3 Listing Pages

```
/team/                → All specialists (filterable)
/services/            → All services (filterable catalog)
/categories/          → All categories (service groupings)
/solutions/           → All problem-focused pages
/industries/          → All industries
/countries/           → All countries
/languages/           → All languages
/cases/               → All case studies (filterable)
```

---

## 6. Internal Linking Strategy

### Link Flow Diagram

```
                    ┌─────────────┐
                    │  Solution   │
                    │ (Problem)   │
                    └──────┬──────┘
                           │ recommends
                           ▼
┌──────────┐        ┌─────────────┐        ┌──────────┐
│   Task   │◄───────│   Service   │───────►│   Case   │
│          │contains└──────┬──────┘proves  │          │
└────┬─────┘               │               └────┬─────┘
     │                     │ for                │
     │ performs       ┌────┴────┐               │ in
     ▼                ▼         ▼               ▼
┌──────────┐    ┌─────────┐ ┌─────────┐   ┌──────────┐
│Specialist│    │Industry │ │ Country │   │ Industry │
└──────────┘    └─────────┘ └─────────┘   └──────────┘
```

### Linking Rules

1. **Every page links to related entities** (automatic via tags)
2. **Service pages link to**: Embedded tasks (via task-picker), Specialists, Industries, Cases
3. **Specialist pages link to**: Services (via tasks performed), Cases, Languages, Countries
4. **Industry pages link to**: Services, Specialists, Cases in that industry
5. **Case pages link to**: Services used, Specialists, Industry, Country

---

## 7. Scaling Mechanism

### How the system grows:

| Add... | Creates... | SEO Opportunity |
|--------|------------|-----------------|
| +1 Specialist | 1 profile page + links to tasks | Long-tail: specialist name |
| +1 Task | Embedded in service page task-picker | Enriches service page content |
| +1 Service | 1 service page (task catalog) + intersections | Transactional keywords |
| +1 Industry | 1 pillar + all service/task intersections | Industry-specific searches |
| +1 Country | 1 pillar + all service/task intersections | Geo-specific searches |
| +1 Language | 1 pillar + all service/task intersections | Language-specific searches |
| +1 Case | 1 case page + proof links everywhere | Social proof, trust |
| +1 Solution | 1 problem page + service/task recommendations | Problem-aware searches |

### Growth Formula

```
Pages = Entities + Intersections

Intersections =
  (Categories × Industries) +
  (Categories × Countries) +
  (Categories × Languages) +
  (Industries × Countries) +
  ...
```

---

## 8. Content Strategy Per Page Type

| Page Type | Primary Goal | Content Focus | CTA |
|-----------|--------------|---------------|-----|
| **Service** | Convert | Task catalog, configurator (tasks embedded via task-picker) | Add to cart |
| **Solution** | Educate → Convert | Problem diagnosis, options | Explore services/tasks |
| **Specialist** | Trust | Tasks performed, cases | Contact / Book |
| **Industry** | Relevance | Industry-specific pain points | View services/tasks |
| **Country** | Localization | Market-specific info | View services |
| **Case** | Proof | Results, process, testimonial | Similar services |

---

## 9. E-commerce Model

### Service Page = Task Configurator

```
┌─────────────────────────────────────────────────────────────┐
│  Technical SEO                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Available Tasks:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ Site Audit          [S ▼]  100 pages    $500      │   │
│  │ ☐ Schema Markup       [S ▼]  5 templates  $200      │   │
│  │ ☐ Core Web Vitals     [M ▼]  1000 pages   $600      │   │
│  │ ☐ Site Architecture   [S ▼]  100 pages    $400      │   │
│  │ ☐ Migration Support   [M ▼]  1000 pages   $2500     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Order Modifiers (apply to entire order):                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Languages: ☐ English ☐ German (+$200) ☐ French      │   │
│  │ Countries: ☐ USA ☐ Germany (+$100) ☐ Austria (+$100)│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Subtotal:     $1,700                                │   │
│  │ Languages:    +$200 (German)                        │   │
│  │ Countries:    +$200 (Germany, Austria)              │   │
│  │ ─────────────────────────────────                   │   │
│  │ Total:        $2,100        [Add to Cart]           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Category Page with Door Opener

```
┌─────────────────────────────────────────────────────────────┐
│  SEO Services                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🚀 Start with Site Audit — $500                     │   │
│  │    Identify and prioritize your SEO issues          │   │
│  │                              [Get Started]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Services in this category:                                 │
│  • Technical SEO (5 tasks)                                  │
│  • On-Page SEO (4 tasks)                                    │
│  • Link Building (5 tasks)                                  │
│  • Local SEO (4 tasks)                                      │
│  • E-commerce SEO (4 tasks)                                 │
│  • International SEO (3 tasks)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Transparency Elements

### Pricing Transparency
- Task prices visible with unit tiers (S/M/L/XL)
- Language and country modifiers clearly shown
- Real-time total calculation in configurator
- "Why this price" breakdown available

### Team Transparency
- Real photos and names
- Tasks specialist can perform
- Languages and countries served
- Project count and rating

### Process Transparency
- Step-by-step delivery process on each task
- Timeline expectations per tier
- Deliverables clearly listed
- Communication channels

### Results Transparency
- Cases with real metrics
- Before/after comparisons
- Tasks and services used in each case
- Client attribution (when permitted)

---

## 11. Decision Framework

When adding new content, ask:

1. **Is this a Task or Service?**
   - Task = atomic execution unit with deliverables and unit tiers
   - Service = catalog of related tasks (configurator page)

2. **Can it be sold standalone?**
   - Yes → Task appears in Service page task-picker block with full configurator (units + languages + countries)
   - No → Task only appears as embedded data within Service page
   - Note: Tasks never generate standalone pages; they are always displayed within Service pages via the task-picker block

3. **Is it a door opener?**
   - Low-risk entry point → Mark as `door_opener: true`
   - Feature on category page

4. **What relationships does it have?**
   - Map all connections
   - Create bidirectional links

5. **Does it create new intersections?**
   - Check if 3+ services exist at intersection
   - If yes → Create intersection page

6. **What search intent does it serve?**
   - Problem-aware → Solution page
   - Task-aware → Service page (tasks embedded via task-picker block)
   - Category-aware → Category pillar page / Service page (task catalog)
   - Trust-seeking → Case/Specialist page

---

## 12. Implementation Priority

### Phase 1: Foundation
- [ ] Define categories and tasks taxonomy
- [ ] Create 5-10 service pages (task catalogs with embedded task-picker blocks)
- [ ] Implement cart/configurator functionality
- [ ] Add 2-3 specialist profiles

### Phase 2: Depth
- [ ] Add more task data to service pages (high-value tasks in task-picker blocks)
- [ ] Create solution pages for top problems
- [ ] Add case studies (1 per service minimum)
- [ ] Create industry pillar pages

### Phase 3: Scale
- [ ] Generate intersection pages
- [ ] Add more specialists
- [ ] Expand to more countries/languages
- [ ] Create content for long-tail intersections

### Phase 4: Optimization
- [ ] Analyze traffic patterns
- [ ] A/B test configurator UX
- [ ] Optimize conversion funnel
- [ ] Double down on winning tasks/services

---

## 13. Success Metrics

| Metric | What it measures |
|--------|------------------|
| **Pages indexed** | System scale |
| **Organic traffic per page type** | Which entities drive traffic |
| **Add-to-cart rate** | Configurator effectiveness |
| **Cart completion rate** | Checkout conversion |
| **Average order value** | Task bundling success |
| **Language/country modifier usage** | International demand |

---

## Summary

This framework defines:
- **8 primary entity types** with clear attributes (pages)
- **Task as embedded data** within Service pages (via task-picker block) with:
  - **delivery_type**: one-time | monthly | both
  - **unit_model**: unit type + tiers (S/M/L/XL)
- **Service as task catalog** (configurator page with embedded task-picker)
- **E-commerce model** with cart and order modifiers
- **Languages + Countries as order-level modifiers** (not per-task)
- **Door opener pattern** for category entry points
- **Relationship rules** between entities
- **Page generation logic** for pillars and intersections

**Key insight:** Services are central. Tasks are the products (embedded in Service pages via task-picker blocks). Everything else exists to help users discover, trust, and purchase tasks through different entry points.

---

*Next steps: Define tasks taxonomy, implement configurator, build cart system.*
