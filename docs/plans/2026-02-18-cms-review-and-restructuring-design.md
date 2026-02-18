# CMS Review & Restructuring Design

**Date:** 2026-02-18
**Status:** Approved
**Approach:** Two phases — cleanup first, then modular restructuring

---

## Context

The CMS project has accumulated technical debt: outdated documentation, CSS embedded in HTML templates, hardcoded site-specific values in core code, and no clear separation between engine, theme, and content. This design addresses both cleanup and future extensibility for launching new sites on the same CMS.

## Audit Findings Summary

### What Works Well
- Clean file-based architecture: `src/`, `content/`, `templates/`, `assets/`, `public/`
- Strong documentation foundation (11 docs, ~6000 lines)
- Modular Python code (5 files, 2287 lines)
- Graph-based entity model with 8 primary types
- Comprehensive test coverage (718 lines, 6 test files)
- CI/CD pipeline (GitHub Actions → GitHub Pages)

### Problems Found

**Documentation:**
- `docs/services-catalog-design.md` — explicitly marked SUPERSEDED, contains Russian text
- `docs/card-consistency-design.md` — unclear if implemented or still a TODO
- CMS server port: GUIDE.md says 5001, CMSspec.md says 5000
- No timestamps on implementation status in TR.md

**Styles in HTML (30 blocks × 50-200 lines CSS each):**
- 30 block templates have embedded `<style>` sections
- ~60 inline `style=""` attributes (mostly in admin UI)
- CSS duplicated: `public/css/styles.css` + `public/assets/css/styles.css`

**Code Coupling (~70% site-specific):**
- `NAV_ORDER` hardcoded in main.py (lines 177-189)
- Entity types checked via string comparison (`type == "service"`)
- Facet dimensions (categories, industries, countries, languages) hardcoded
- JSON export logic specific to each entity type
- Language code map hardcoded
- ~30% of code reusable as-is, ~70% tied to current site

**Minor Issues:**
- `.DS_Store` files tracked in git
- 5 extra icons in `public/` not in source `assets/`
- `gtm-container-import.json` (21K) loose in project root
- `test-icons.html` in `public/` (test artifact)

---

## Phase 1: Cleanup (in current structure)

### 1.1 Documentation Cleanup

| Action | File | Result |
|--------|------|--------|
| Delete | `docs/services-catalog-design.md` | Superseded by web-strategy-framework.md |
| Review & update | `docs/card-consistency-design.md` | Verify implementation status, update or archive |
| Fix port number | `GUIDE.md` + `CMSspec.md` | Check actual port in cms_server.py, align all docs |
| Organize docs/ | All planning docs | Move all plans to `docs/plans/`, keep references in `docs/` |
| Update TR.md | Status section | Add last-updated timestamps |

Root documents (`CLAUDE.md`, `CMSspec.md`, `TR.md`, `GUIDE.md`, `DESIGN.md`) stay in root — correct location for project documentation.

### 1.2 CSS Consolidation

**Goal:** All CSS in `assets/css/styles.css`, no `<style>` blocks in HTML templates.

1. **Extract `<style>` from 30 block templates into `assets/css/styles.css`**
   - Each block gets a comment section: `/* === Block: hero === */`
   - File grows from ~2000 to ~5000-6000 lines (one HTTP request, easily searchable)
   - Remove `<style>` tags from all block templates

2. **Replace inline `style=""` with CSS classes**
   - `style="display:none"` → `.hidden` class
   - `style="margin-bottom: 2rem"` → utility class (`.mb-2xl`)
   - `style="color: var(--text-muted)"` → `.text-muted` class
   - Keep only dynamic styles (JS-driven CSS vars for icons in catalog/catalog-mini)

3. **Remove CSS duplication in `public/`**
   - Keep only `public/assets/css/styles.css` (as `copy_assets()` produces)
   - Remove `public/css/styles.css` if it's an artifact

### 1.3 Minor Technical Issues

| Problem | Action |
|---------|--------|
| `.DS_Store` files in git | Add to `.gitignore`, remove from tracking |
| 5 extra icons in `public/assets/icons/` | Check if build artifact, remove if not in source `assets/icons/` |
| `gtm-container-import.json` in root | Move to `docs/` or `config/` |
| `test-icons.html` in `public/` | Verify — remove if test artifact |
| `workers/checkout/` | Verify if Cloudflare Worker is still in use |

---

## Phase 2: Modular Restructuring (Core / Theme / Content)

### 2.1 Target Directory Structure

```
CMS/
├── core/                          # CMS Engine (reusable)
│   ├── src/
│   │   ├── main.py               # Build orchestrator (refactored)
│   │   ├── generator.py          # Jinja2 renderer
│   │   ├── parser.py             # TOML/MD parser
│   │   ├── cms_server.py         # Flask admin UI
│   │   └── toml_writer.py        # TOML serializer
│   ├── templates/cms/            # Admin UI templates (6 files)
│   └── requirements.txt
│
├── themes/vividigit/             # Theme (visual design)
│   ├── templates/
│   │   ├── layouts/base.html     # Master layout
│   │   └── blocks/               # 30 block templates (HTML only, no CSS)
│   ├── assets/
│   │   ├── css/styles.css        # All CSS (global + blocks)
│   │   ├── js/site.js            # Site JavaScript
│   │   ├── icons/                # SVG icons
│   │   ├── images/               # Site images
│   │   └── logos/                # Client logos
│   └── theme.yml                 # Theme metadata
│
├── sites/vividigit/              # Site-specific content + config
│   ├── content/                  # All TOML/MD content files
│   │   ├── _global/site.toml     # Site globals (domain, analytics)
│   │   ├── _tasks/               # Task definitions
│   │   ├── services/
│   │   ├── categories/
│   │   └── ...
│   ├── site.yml                  # Site config (theme, nav, entities, facets)
│   ├── CNAME                     # GitHub Pages domain
│   └── workers/                  # Cloudflare Workers
│
├── docs/                         # Project documentation (shared)
├── tests/                        # Tests (shared)
├── public/                       # Build output (generated)
└── CLAUDE.md, TR.md, etc.        # Project docs (root)
```

### 2.2 Configuration Format Convention

**YAML** (`.yml`) for configuration — distinguishes config from content at a glance:
- `sites/vividigit/site.yml` — site configuration
- `themes/vividigit/theme.yml` — theme metadata

**TOML** (`.toml`) for content only:
- `content/**/*.en.toml` — page content
- `content/_global/site.toml` — site globals (domain, analytics IDs)

### 2.3 Site Configuration (`sites/vividigit/site.yml`)

```yaml
site:
  theme: vividigit
  language: en

navigation:
  order:
    - "/"
    - services
    - categories
    - solutions
    - cases
    - team
    - industries
    - countries
    - languages
    - blog
    - contact

entities:
  types:
    - service
    - specialist
    - case
    - solution
    - category
    - industry
    - country
    - language

facets:
  dimensions:
    - categories
    - industries
    - countries
    - languages
```

### 2.4 Theme Configuration (`themes/vividigit/theme.yml`)

```yaml
name: Vividigit Glassmorphism
version: "1.0"
description: Dark glassmorphism theme with neon accents
```

### 2.5 Code Changes Required

**`main.py` refactoring (~1000 lines of changes):**

1. **Navigation** — `NAV_ORDER` read from `site.yml` instead of hardcoded list
2. **Entity types** — driven by `site.yml` `entities.types` instead of string checks
3. **Facet dimensions** — from `site.yml` `facets.dimensions`
4. **Template search path** — `themes/{theme}/templates/` first, then `core/templates/`
5. **Asset path** — `themes/{theme}/assets/` instead of hardcoded `assets/`
6. **Content path** — `sites/{site}/content/` instead of hardcoded `content/`
7. **Export logic** — generalized per-entity export driven by config

**New build command:**
```bash
python core/src/main.py --site vividigit
```

### 2.6 Effort Estimate

| Task | Complexity | Scope |
|------|-----------|-------|
| File moves (templates, assets, content) | Low | Mechanical, ~100 files |
| Create site.yml and theme.yml | Low | New config files |
| Refactor main.py (remove hardcoding) | Medium-High | ~1000 lines changed |
| Update generator.py (template paths) | Low | ~20 lines |
| Update tests (new paths) | Medium | ~200 lines |
| Update CI/CD (deploy.yml) | Low | Path changes |
| Update documentation | Medium | All docs need path updates |

---

## Implementation Order

1. **Phase 1.1** — Documentation cleanup (safe, no code changes)
2. **Phase 1.2** — CSS consolidation (visual-only, testable)
3. **Phase 1.3** — Minor fixes (.DS_Store, duplicates, etc.)
4. **Phase 2.1** — File moves to target structure
5. **Phase 2.2** — Create YAML configs
6. **Phase 2.3** — Refactor main.py to use configs
7. **Phase 2.4** — Update tests
8. **Phase 2.5** — Update CI/CD and documentation

Each step is independently deployable and testable.
