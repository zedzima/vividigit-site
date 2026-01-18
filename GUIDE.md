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

## Deployment

### GitHub Pages (Automatic)

Push to `main` branch. GitHub Actions will:
1. Build the site with production `base_url`
2. Deploy to GitHub Pages

### Manual Deployment

```bash
# Build for production
python src/main.py

# The public/ folder contains the static site
# Upload public/ contents to any static host
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
