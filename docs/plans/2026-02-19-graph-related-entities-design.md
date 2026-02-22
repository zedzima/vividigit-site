# Graph-Based Related Entities Design

**Date:** 2026-02-19
**Status:** Implemented (updated 2026-02-21)
**Approach:** Build-time Jinja2 rendering with JS progressive enhancement

---

## Goal

Fully leverage the graph architecture: every entity page automatically displays its connections to other entities via rich card blocks. Bidirectional — if Service → Specialist, then Specialist → Service.

## Decisions

| Decision | Choice |
|----------|--------|
| Rendering | Hybrid: build-time HTML (SEO) + JS progressive enhancement |
| Scope | All 9 entity types simultaneously (including `blog-post`) |
| Automation | Fully automatic — no TOML configuration needed |
| Relationship depth | Direct + reverse (1-hop), no chain traversal |
| Visual style | Same card designs as existing catalog-mini |

---

## 1. Relationship Matrix

Which related-entity sections appear on each page type:

| Page Type | Shows |
|-----------|-------|
| **Service** | Specialists, Cases, Categories\*, Industries\*, Countries\*, Languages\* |
| **Specialist** | Services (rev), Cases, Languages, Countries |
| **Case** | Services (rev), Specialists (rev), Industry, Country, Language |
| **Solution** | Service (rev), Industry (rev) |
| **Category** | Services (rev via tags), Specialists (rev), Cases (rev) |
| **Industry** | Services (rev via tags), Specialists (rev), Cases (rev), Solutions (rev) |
| **Country** | Services (rev via tags), Specialists (rev), Cases (rev) |
| **Language** | Services (rev via tags), Specialists (rev), Cases (rev) |

\* From `[tags]` section, not `[relationships]`

**Rule:** A section only renders if it has ≥1 related entity. Empty sections are omitted.

---

## 2. Card Contents

Each entity type has a card template with auto-populated fields:

| Card Type | Fields |
|-----------|--------|
| **Service** | Category chips, delivery badge, title, description, counters (industries/countries/languages/tasks), from-price |
| **Specialist** | Centered avatar, name, role, stats (projects/cases/articles), industries/languages/countries tags (no rating/hourly rate) |
| **Case** | Image/placeholder, scope chips (industry/country/language/client), title, description, primary result + timeline |
| **Solution** | Service/industry chips, title, description, counters (specialists/cases/countries/languages), starting price, no cover |
| **Category** | Icon (CSS mask), title, description, counters (services/specialists/industries/countries/languages), door-opener price |
| **Industry** | Icon/flag, title, description, service count |
| **Country** | Flag, title, description, market population, official language coverage, service count |
| **Language** | Code (EN/DE/FR), title, description, native speakers, official country footprint, service count |
| **Blog Post** | Type/category chips, title, excerpt, date, author |

All data sourced from TOML content at build time — no JSON fetch requests.

---

## 3. Build Pipeline

### Step 1: Parsing (existing)
Load all TOML files, extract `[relationships]` and `[tags]`.

### Step 2: Build bidirectional map (new in main.py)

```python
build_bidirectional_map(parsed_pages) → Dict[slug, Dict[entity_type, List[entity_data]]]
```

For each page, computes ALL related entities in both directions:
- **Direct:** specialist → cases (from specialist's `[relationships]`)
- **Reverse:** specialist → services (from service pages that list this specialist)
- **Via tags:** category → services (services tagged with this category)

Result structure:
```python
{
    "ivan-petrov": {
        "services": [{"slug": "technical-seo", "title": "...", "url": "...", ...}],
        "cases": [{"slug": "ecommerce-migration-2025", ...}],
        "languages": [{"slug": "english", ...}],
        ...
    }
}
```

### Step 3: Auto-inject blocks (new in main.py)

```python
inject_related_blocks(parsed_pages, bidirectional_map)
```

For each page, iterates over its relationships. If a list is non-empty, adds a `related-entities` block with the data. Blocks are inserted before the last block (typically CTA).

### Step 4: Rendering (existing generator.py)
The `related-entities` block renders via Jinja2 template `blocks/related-entities.html`.

### Step 5: JS progressive enhancement
If a section has >4 cards, show 4 with a "Show all (N)" button. Without JS, all cards are visible (graceful degradation).

---

## 4. Template Structure

### Block template: `blocks/related-entities.html`

Receives data:
```python
data = {
    "entity_type": "specialist",     # current page type
    "sections": [
        {"type": "services", "title": "Services", "items": [...]},
        {"type": "cases", "title": "Case Studies", "items": [...]},
    ]
}
```

Renders sections in a loop. Each section: heading + card grid. Cards selected via Jinja2 `include` by type:

```
blocks/cards/service-card.html
blocks/cards/case-card.html
blocks/cards/solution-card.html
blocks/cards/category-card.html
blocks/cards/dimension-card.html   (industry, country, language)
blocks/cards/blog-post-card.html
```

Specialist cards are rendered via a placeholder + shared JS renderer (`assets/js/cards.js`) so catalog and related-entities use identical specialist markup.

### CSS
Reuse existing card styles from `styles.css` (`.service-card`, `.specialist-card`, `.case-card`, etc.). New CSS only for section wrapper (heading + grid layout).

### Cleanup
- Remove manual `[catalog-mini]`, `[catalog-mini_specialists]`, `[catalog-mini_cases]` blocks from pillar page TOML files
- Keep `catalog-mini.html` and `catalog.html` templates — still needed for listing pages (`/categories/`, `/services/`, `/team/`, etc.)

---

## 5. Data Flow Summary

```
TOML [relationships] + [tags]
        ↓
    parse (existing)
        ↓
    build_bidirectional_map() ← NEW
        ↓
    inject_related_blocks()   ← NEW
        ↓
    render_page() (existing generator.py)
        ↓
    related-entities.html → cards/{type}-card.html  ← NEW templates
        ↓
    Static HTML with full card content (SEO-ready)
        ↓
    JS: "Show all" toggle for sections >4 cards
```
