# CMS Project Instructions

## Language Convention

- **Communication**: Russian (with the user)
- **Code, documentation, comments**: Always English

This applies to all files: TOML, HTML, JS, CSS, Markdown, etc.

## Before Git Push

**IMPORTANT:** Before committing/pushing, always check for and remove the symlink:

```bash
rm -f public/vividigit-site
```

This symlink (`public/vividigit-site -> .`) is created by the dev server for local testing but causes infinite loops during GitHub Pages deployment.

## Build Commands

```bash
# Build site
.venv/bin/python src/main.py

# Run dev server (creates symlink for local /vividigit-site/ paths)
.venv/bin/python -m http.server 8000 --directory public
```

## Project Structure

- `content/` — TOML content files
  - `content/services/` — Service pages (with embedded task-picker blocks)
  - `content/_tasks/` — Task data archive (not a routable collection)
  - `content/team/` — Specialist profiles
  - `content/cases/` — Case studies
  - `content/categories/` — Category pillars
  - `content/industries/` — Industry pillars
  - `content/countries/` — Country pillars
  - `content/languages/` — Language aggregators
  - `content/solutions/` — Problem-focused landing pages
  - `content/blog/` — Blog articles
- `templates/blocks/` — Jinja2 block templates
- `assets/icons/` — SVG icons (use `{{ icon('name', size) }}` in templates)
- `public/` — Generated output (deployed to GitHub Pages)

## Block Naming

Block section name in TOML determines template: `[hero]` uses `templates/blocks/hero.html`

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

## Reference Documents

- `docs/plans/2026-01-27-web-strategy-framework.md` — Content graph architecture
- `docs/plans/2026-01-27-service-taxonomy-design.md` — Category/Service/Task hierarchy
