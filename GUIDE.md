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

## Faceted Catalog Architecture

Services are tagged by 4 dimensions (many-to-many relationships):

```
/services/                    ← catalog with filters
/services/[service]/          ← service pillar page

/categories/[category]/       ← category pillar + service list
/industries/[industry]/       ← industry pillar + service list
/countries/[country]/         ← country pillar + service list
/languages/[language]/        ← language pillar + service list
```

### Tagging Services

Add `[tags]` section to any service page:

```toml
[config]
lang = "en"
url = "/services/seo"
slug = "seo"
collection = "services"

[tags]
categories = ["digital-marketing", "content-marketing"]
industries = ["ecommerce", "saas", "fintech"]
countries = ["germany", "france", "usa"]
languages = ["english", "german", "french"]
```

**Tags = slugs of pillar pages.** The generator auto-builds links and filter index.

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

[services-list]
filter_type = "industries"
filter_value = "ecommerce"
```

The `[services-list]` block auto-populates with matching services.

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

### Filter Index

Build generates `public/data/services-index.json` for client-side filtering:

```json
{
  "services": [
    {
      "slug": "seo",
      "title": "SEO Services",
      "url": "/services/seo/",
      "tags": {
        "categories": ["digital-marketing"],
        "industries": ["ecommerce", "saas"]
      }
    }
  ],
  "filters": {
    "categories": [{"slug": "digital-marketing", "title": "Digital Marketing", "count": 5}],
    "industries": [...]
  }
}
```

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
