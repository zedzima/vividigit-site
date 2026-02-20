# CMS Project Instructions

## Language Convention

- **Communication**: Russian (with the user)
- **Code, documentation, comments**: Always English

This applies to all files: TOML, HTML, JS, CSS, Markdown, etc.

## Before Git Push

## Build Commands

```bash
# Build site (default site: vividigit)
.venv/bin/python core/src/main.py --site vividigit

# Build for local development
.venv/bin/python core/src/main.py --site vividigit --local

# Build all languages
.venv/bin/python core/src/main.py --site vividigit --all

# Run dev server
.venv/bin/python -m http.server 8000 --directory public

# Run CMS admin server
.venv/bin/python core/src/cms_server.py --site vividigit
```

## Custom Domain

Site is deployed to GitHub Pages with custom domain `vividigit.com`. The `CNAME` file from `sites/vividigit/CNAME` is copied to `public/` during CI build.

## Project Structure

```
CMS/
├── core/src/          — Python source (main.py, generator.py, parser.py, cms_server.py)
├── core/templates/cms/ — Admin panel templates (Flask)
├── themes/vividigit/
│   ├── templates/layouts/ — Jinja2 page layouts
│   ├── templates/blocks/  — Jinja2 block templates
│   ├── assets/css|js|icons|images|logos/ — Theme assets
│   └── theme.yml          — Theme metadata
├── sites/vividigit/
│   ├── content/           — TOML/MD content files
│   ├── site.yml           — Site config (theme, navigation, facets, exports)
│   └── CNAME              — GitHub Pages custom domain
└── public/                — Build output (deployed to GitHub Pages)
```

### Content directories (inside `sites/vividigit/content/`):
- `services/` — Service pages (with embedded task-picker blocks)
- `_tasks/` — Task data archive (not a routable collection)
- `team/` — Specialist profiles
- `cases/` — Case studies
- `categories/` — Category pillars
- `industries/` — Industry pillars
- `countries/` — Country pillars
- `languages/` — Language aggregators
- `solutions/` — Problem-focused landing pages
- `blog/` — Blog articles

## Block Naming

Block section name in TOML determines template: `[hero]` uses `themes/vividigit/templates/blocks/hero.html`

## URL Rules (CRITICAL)

**All URLs must be relative (no leading `/`)** to work with `<base href>` tag.

```toml
# Correct
url = "industries/ecommerce"
button_url = "contact"

# Wrong - bypasses base tag
url = "/industries/ecommerce"
button_url = "/contact"
```

Templates use `.lstrip('/')` to strip leading slashes. For JavaScript, use `.replace(/^\//, '')`.

## Content Graph Architecture

The website is a **graph of connected entities**. Each entity is a node. Relationships are edges. Pages are visual representations of nodes. Internal links represent edges.

### Entity Types (8 Primary)

| Entity | URL Pattern | Description |
|--------|-------------|-------------|
| **Service** | `/services/{slug}/` | Service page with embedded task-picker block |
| **Specialist** | `/team/{slug}/` | Person who performs tasks |
| **Case** | `/cases/{slug}/` | Proof of results (case study) |
| **Solution** | `/solutions/{slug}/` | Problem-focused entry point |
| **Category** | `/categories/{slug}/` | Marketing direction (SEO, AEO, etc.) |
| **Industry** | `/industries/{slug}/` | Vertical market |
| **Country** | `/countries/{slug}/` | Geographic market |
| **Language** | `/languages/{slug}/` | Linguistic capability |

> **Note:** Tasks still exist as data but do not have their own URL pattern or collection. They are embedded within service pages via the `task-picker` block.

### Secondary Entities (attributes, no dedicated pages)

Problem, Result, Delivery Type, Unit Type, Tier, Price, Duration.

## Taxonomy Model

Three-level hierarchy: **Category -> Service -> Task**

- **Category** = Marketing direction (SEO, AEO, Content, PPC, etc.) with door opener Task
- **Service** = Service page with embedded task-picker block for selecting tasks
- **Task** = Atomic execution unit (data embedded in service pages, not a standalone page)

13 Categories: SEO, AEO, Content Marketing, Social Media, PPC, Email Marketing, Analytics & Data, CRO, Video Marketing, PR, Marketing Automation, E-commerce, Affiliate Marketing.

Each Category has a **door opener** task — a low-risk entry point (e.g., SEO: Site Audit $500).

See `docs/plans/2026-01-27-service-taxonomy-design.md` for full taxonomy.

## E-commerce Model

### Order Cart Model

Service pages use a `task-picker` block to display available tasks inline. The right sidebar uses `type = "order-cart"` to show the live order summary.

**Task attributes (data only, no standalone pages):**
- `delivery_type`: one-time | monthly | both
- `unit_model`: unit_type (pages, keywords, campaigns, etc.) + tiers (S/M/L/XL)
- `door_opener`: boolean — recommended entry point for category

**Pricing formula:**
```
Total = Σ(task tier prices) + (extra_languages × $200) + (extra_countries × $100)
```

Languages and countries are **order-level modifiers** (apply to entire order, not per-task).

## Faceted Architecture

Services use tags for filtering:
```toml
[tags]
categories = ["seo"]
industries = ["ecommerce", "saas"]
countries = ["germany"]
languages = ["english", "german"]
```

Entities use `[relationships]` for graph edges (references to other entities):
```toml
[relationships]
part_of_services = ["technical-seo", "ecommerce-seo"]
specialists = ["ivan-petrov"]
related_tasks = ["schema-markup-setup"]
cases = ["ecommerce-migration-2025"]
```

Pillar pages use `collection` and listing pages use `is_listing = true`. See GUIDE.md for details.

### Auto-Generated Filters

Entity listings (services, team, cases, solutions) get faceted filters **auto-generated from the entity graph** at build time. Filters are rendered inside the `catalog` block (not sidebar) for mobile visibility. Each entity gets up to 7 filter dimensions matching connected entity types.

Dimension listings (categories, industries, countries, languages) have sort-only, no filters.

Blog uses static `[[catalog.filters]]` in TOML (category, type, date with `match = "startsWith"`, author).

**All listing sidebars** show the default CTA + contact form (no `[sidebar]` in TOML).

### JSON Exports

Entity JSON indexes include:
- `facets` — per-item dict of connected entity slugs by type (from `bi_map`)
- `labels` — top-level dict mapping slugs to display names (from `page_lookup`)

These are used by catalog.html JS for unified `matchFilter()` and dynamic label rendering.

## Reference Documents

- `docs/plans/2026-01-27-web-strategy-framework.md` — Content graph architecture
- `docs/plans/2026-01-27-service-taxonomy-design.md` — Category/Service/Task hierarchy
