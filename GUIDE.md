# CMS User Guide

## Quick Start

### Start the CMS

```bash
cd "/Users/dima/Work AI/CMS"
.venv/bin/python src/cms_server.py
```

Open in browser:
- **Site:** http://127.0.0.1:5001/
- **CMS Admin:** http://127.0.0.1:5001/admin

### Build Commands

```bash
# Build for local preview (base_url="/")
python src/main.py --local

# Build for production/GitHub Pages (uses base_url from site.toml)
python src/main.py
```

---

## Workflow

### Production Workflow (Recommended)

```
Edit content (TOML/MD) → Push to main → GitHub Actions builds → Site deployed
```

1. Edit content files directly or via local CMS
2. Commit and push to `main` branch
3. GitHub Actions automatically builds the site
4. Result deployed to GitHub Pages

**No local build required** — `public/` is in `.gitignore`, GitHub Actions generates it fresh.

### Development Workflow

Use local build when:
- Developing new blocks/templates
- Testing changes before push
- Using CMS web interface for preview

```bash
# Start CMS with live preview
.venv/bin/python src/cms_server.py

# Or just build once
.venv/bin/python src/main.py
```

### What Gets Committed

```
✓ content/      — TOML content files
✓ templates/    — Jinja2 templates
✓ src/          — Python build scripts
✓ assets/       — Images, CSS, JS
✗ public/       — Generated output (gitignored)
✗ .venv/        — Python environment (gitignored)
```

---

## Using the Web Interface

### Dashboard (http://127.0.0.1:5001/admin)

The dashboard shows all content pages. From here you can:
- Click **Edit** to modify a page
- Click **View** to preview a page
- Click **+ New Page** to create a page
- Click **Rebuild Site** to regenerate all pages

### Creating a New Page

1. Click **+ New Page**
2. Enter the URL path (e.g., `services/new-service`)
3. Enter the page title
4. Select which blocks to include
5. Click **Create Page**

The page is created with placeholder content from block demos. Edit to replace with real content.

### Editing a Page

1. Click **Edit** on any page
2. Modify fields in the form
3. Click **Save** to save changes
4. Click **Preview** to see the result
5. Click **Rebuild Site** when ready

### Blocks Library (http://127.0.0.1:5001/admin/blocks)

Browse all available block types. Click **View Demo** to see how each block looks.

### Media Library (http://127.0.0.1:5001/admin/media)

View and upload media files. Files are organized by folder:
- `images/site/` — logo, favicon, og-image
- `images/services/` — service page images
- `logos/` — client logos

---

## Editing Content Directly (TOML)

You can edit TOML files directly instead of using the web interface.

### File Location

Pages are stored in `content/`:
```
content/
├── home.en.toml              → /
├── services/
│   ├── services.en.toml      → /services
│   └── seo/
│       └── seo.en.toml       → /services/seo
└── blog/
    └── blog.en.toml          → /blog
```

### Page Structure

```toml
[config]
lang = "en"
url = "/services/seo"
menu = "SEO"

[meta]
title = "SEO Services"
description = "Professional SEO services."

[hero]
h1 = "SEO Services"
subtitle = "Grow your organic traffic"
button_label = "Get Started"
button_url = "#contact"

[features]
title = "What We Offer"
items = [
    { title = "Keyword Research", text = "Find the right keywords" },
    { title = "On-Page SEO", text = "Optimize your content" }
]
```

### Block Reference

See block demos in `content/blocks/` for all available fields. Each block's demo file shows every supported parameter.

---

## Content Graph Architecture

The site is a graph of connected entities. Each entity type has its own collection:

```
/services/                    ← service catalog
/services/[service]/          ← service page (task-picker block + order-cart sidebar)

/team/                        ← all specialists
/team/[specialist]/           ← specialist profile

/cases/                       ← all case studies
/cases/[case]/                ← case study with results

/categories/[category]/       ← category pillar + door opener task
/industries/[industry]/       ← industry pillar + service list
/countries/[country]/         ← country pillar + service list
/languages/[language]/        ← language aggregator + service list
/solutions/[solution]/        ← problem-focused landing page
```

### Tagging Services

Add `[tags]` section to any service page:

```toml
[config]
lang = "en"
url = "/services/technical-seo"
slug = "technical-seo"
collection = "services"
type = "service"

[tags]
categories = ["seo"]
industries = ["ecommerce", "saas", "fintech"]
countries = ["germany", "france", "usa"]
languages = ["english", "german", "french"]

[relationships]
available_tasks = ["site-audit", "schema-markup-setup", "site-speed-optimization"]
door_opener_task = "site-audit"
specialists = ["ivan-petrov"]
cases = ["ecommerce-migration-2025"]
```

**Tags = slugs of pillar pages.** The generator auto-builds links and filter index.
**Relationships = slugs of pages in other collections.** They create graph edges for cross-entity linking.

### Adding Tasks to a Service Page

Tasks are not standalone pages. They are embedded within service pages via the `task-picker` block.
The right sidebar uses `type = "order-cart"` to show a live order summary.

**Step 1: Add the task-picker block** (in the service TOML, after features or pricing):

```toml
[task-picker]
tag = "tasks"
title = "Available Tasks"
subtitle = "Select tasks and choose the volume tier that fits your needs."

[[task-picker.tasks]]
slug = "site-audit"
title = "Technical Site Audit"
description = "Comprehensive crawl analysis and prioritized fix roadmap."
delivery_type = "one-time"
unit_type = "pages"
door_opener = true
deliverables = [
    "Crawl report with 47+ technical checks",
    "Prioritized issues list with severity levels",
    "Action plan with effort estimates",
    "30-minute walkthrough call"
]

[[task-picker.tasks.tiers]]
name = "S"
label = "Up to 100 pages"
price = 500

[[task-picker.tasks.tiers]]
name = "M"
label = "Up to 1,000 pages"
price = 1200

[[task-picker.tasks.tiers]]
name = "L"
label = "Up to 10,000 pages"
price = 2500

[[task-picker.tasks.tiers]]
name = "XL"
label = "50,000+ pages"
price = 0
```

**Step 2: Set the sidebar to order-cart** (replaces any existing sidebar config):

```toml
[sidebar]
title = "Your Order"
type = "order-cart"
button_label = "Request Quote"
button_url = "contact/?service=technical-seo"
note = "Estimated pricing. Final quote after brief."
language_fee = 200
country_fee = 100
extra_languages = true
extra_countries = true
```

**How it works:**
- `door_opener = true` tasks are pre-checked and appear in the cart on page load
- Users can check/uncheck tasks, expand details, and switch tiers
- The cart sidebar updates live — no page reload needed
- Tier with `price = 0` shows "Custom" instead of a dollar amount
- Reference data for tasks is archived in `content/_tasks/` for consistency

### Creating Specialist Pages

```toml
[config]
lang = "en"
url = "/team/ivan-petrov"
slug = "ivan-petrov"
collection = "team"
type = "specialist"

[relationships]
tasks = ["site-audit", "schema-markup-setup"]
languages = ["english", "german", "russian"]
countries = ["germany", "austria", "usa"]
cases = ["ecommerce-migration-2025"]

[hero]
h1 = "Ivan Petrov"
subtitle = "Technical SEO Specialist"

[[hero.stats]]
value = "47"
label = "Projects completed"
```

### Creating Case Studies

```toml
[config]
lang = "en"
url = "/cases/ecommerce-migration-2025"
slug = "ecommerce-migration-2025"
collection = "cases"
type = "case"

[relationships]
industry = "ecommerce"
country = "germany"
services_used = ["technical-seo"]
tasks_used = ["site-audit"]
specialists = ["ivan-petrov"]

[hero]
h1 = "E-commerce Platform Migration"
subtitle = "Fashion Retailer — Germany"

[[hero.stats]]
value = "120%"
label = "Traffic recovery"
```

### Creating Pillar Pages

Pillar pages aggregate services by dimension:

```toml
# content/industries/ecommerce/ecommerce.en.toml
[config]
lang = "en"
url = "/industries/ecommerce"
slug = "ecommerce"
collection = "industries"

[meta]
title = "E-commerce Services"

[hero]
h1 = "E-commerce Marketing"
# ... expert content

[catalog-mini]
source = "services"
dimension = "industries"
value = "ecommerce"
```

The `[catalog-mini]` block fetches services from `services-index.json` and filters by dimension/value.

### Creating Listing Pages

Listing pages show all items in a collection with navigation cards:

```toml
# content/industries/industries.en.toml
[config]
lang = "en"
url = "/industries"
slug = "industries"
collection = "industries"
is_listing = true
menu = "Industries"

[hero]
h1 = "Services by Industry"

[cards]
columns = 2

[[cards.cards]]
title = "E-commerce"
description = "Online retail and marketplace solutions"
url = "industries/ecommerce"
```

### Filter & Graph Indexes

Build generates JSON indexes for client-side filtering and cross-entity navigation:

- `public/data/services-index.json` — services with tags for catalog filtering
- `public/data/team.json` — specialists with tasks, languages, countries
- `public/data/cases.json` — case studies with results, services used

---

## URL Guidelines

**IMPORTANT:** All URLs in content and templates must be relative (no leading `/`).

```toml
# ✅ Correct - relative URLs
url = "industries/ecommerce"
button_url = "contact"
cta_url = "services"

# ❌ Wrong - absolute URLs bypass <base> tag
url = "/industries/ecommerce"
button_url = "/contact"
```

The `<base href="{{ site.base_url }}">` tag in HTML head handles path prefixing:
- **Local:** `base_url = "/"` → `services/` → `/services/`
- **GitHub Pages:** `base_url = "/vividigit-site/"` → `services/` → `/vividigit-site/services/`

Templates use `.lstrip('/')` to ensure URLs are relative.

---

## Deployment

### GitHub Pages (Automatic)

Push to `main` branch — that's it. GitHub Actions will:
1. Install Python dependencies
2. Run `python src/main.py` with production `base_url`
3. Deploy generated `public/` to GitHub Pages

**Note:** Local `public/` folder is gitignored. Each deployment builds fresh from source.

### Manual Deployment (Alternative)

For other hosting (Netlify, Vercel, any static host):

```bash
# Build for production
python src/main.py

# Upload public/ contents to your host
```

---

## Project Structure

```
├── content/           # Content files (TOML)
│   ├── _global/       # Global config (site.toml)
│   ├── blocks/        # Block demos (schema reference)
│   └── ...            # Page content
├── templates/
│   ├── blocks/        # Block templates (HTML)
│   ├── layouts/       # Page layouts
│   └── cms/           # CMS admin templates
├── assets/            # Media files
├── public/            # Generated site output
└── src/
    ├── main.py        # Build script
    ├── generator.py   # HTML generator
    ├── parser.py      # TOML parser
    └── cms_server.py  # Web interface
```
