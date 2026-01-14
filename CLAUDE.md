# CMS Project Instructions

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
- `templates/blocks/` — Jinja2 block templates
- `assets/icons/` — SVG icons (use `{{ icon('name', size) }}` in templates)
- `public/` — Generated output (deployed to GitHub Pages)

## Block Naming

Block section name in TOML determines template: `[hero]` uses `templates/blocks/hero.html`
