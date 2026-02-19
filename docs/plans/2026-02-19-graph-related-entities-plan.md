# Graph-Based Related Entities — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically display bidirectional relationship blocks on all entity pages, rendering rich cards at build time with JS progressive enhancement.

**Architecture:** New `build_bidirectional_map()` computes all forward+reverse relationships per slug. New `inject_related_blocks()` auto-adds `related-entities` blocks to pages. Jinja2 templates render cards at build time. JS adds "Show all" toggle for sections >4 cards.

**Tech Stack:** Python (main.py), Jinja2 templates, CSS, vanilla JS

**Design doc:** `docs/plans/2026-02-19-graph-related-entities-design.md`

---

### Task 1: Build bidirectional relationship map — tests

**Files:**
- Modify: `tests/test_main.py`

**Step 1: Write tests for `build_bidirectional_map()`**

Add to `tests/test_main.py`:

```python
from main import build_bidirectional_map

def test_bidirectional_map_forward_relationships():
    """Forward relationships are included in the map."""
    pages = [
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist", "url": "/team/ivan"},
                  "meta": {"title": "Ivan", "description": "Specialist"},
                  "sidebar": {"role": "SEO", "rating": 4.9, "projects": 47, "hourly_rate": 75},
                  "relationships": {"cases": ["case-1"], "languages": ["english"]}}},
        {"url": "/cases/case-1", "collection": "cases", "is_listing": False,
         "data": {"config": {"slug": "case-1", "type": "case", "url": "/cases/case-1"},
                  "meta": {"title": "Case 1", "description": "A case study"},
                  "sidebar": {}, "relationships": {"specialists": ["ivan"]}}},
        {"url": "/languages/english", "collection": "languages", "is_listing": False,
         "data": {"config": {"slug": "english", "type": "language", "url": "/languages/english"},
                  "meta": {"title": "English", "description": "English language"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result = build_bidirectional_map(pages)
    # Ivan has forward link to case-1
    assert any(e["slug"] == "case-1" for e in result["ivan"]["cases"])


def test_bidirectional_map_reverse_relationships():
    """Reverse relationships are computed from other pages."""
    pages = [
        {"url": "/services/seo", "collection": "services", "is_listing": False,
         "data": {"config": {"slug": "seo", "type": "service", "url": "/services/seo"},
                  "meta": {"title": "SEO", "description": "SEO service"},
                  "sidebar": {}, "relationships": {"specialists": ["ivan"]},
                  "tags": {"categories": ["seo-cat"]}}},
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist", "url": "/team/ivan"},
                  "meta": {"title": "Ivan", "description": "Specialist"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result = build_bidirectional_map(pages)
    # Ivan gets reverse link to SEO service
    assert any(e["slug"] == "seo" for e in result["ivan"]["services"])


def test_bidirectional_map_via_tags():
    """Tag-based relationships (service tagged with category) create reverse links."""
    pages = [
        {"url": "/services/seo", "collection": "services", "is_listing": False,
         "data": {"config": {"slug": "seo", "type": "service", "url": "/services/seo"},
                  "meta": {"title": "SEO", "description": "SEO service"},
                  "sidebar": {}, "relationships": {},
                  "tags": {"categories": ["seo-cat"]}}},
        {"url": "/categories/seo-cat", "collection": "categories", "is_listing": False,
         "data": {"config": {"slug": "seo-cat", "type": "category", "url": "/categories/seo-cat"},
                  "meta": {"title": "SEO Category", "description": "SEO"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result = build_bidirectional_map(pages)
    # Category gets reverse link from service tag
    assert any(e["slug"] == "seo" for e in result["seo-cat"]["services"])


def test_bidirectional_map_skips_listing_pages():
    """Listing pages are excluded from the map."""
    pages = [
        {"url": "/services", "collection": "services", "is_listing": True,
         "data": {"config": {"slug": "services", "type": "service", "url": "/services"},
                  "meta": {"title": "Services", "description": "All services"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result = build_bidirectional_map(pages)
    assert "services" not in result


def test_bidirectional_map_empty_relations_omitted():
    """Entity types with no relations are not keys in the map entry."""
    pages = [
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist", "url": "/team/ivan"},
                  "meta": {"title": "Ivan", "description": "Specialist"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result = build_bidirectional_map(pages)
    assert result["ivan"] == {}
```

**Step 2: Run tests to verify they fail**

Run: `.venv/bin/python -m pytest tests/test_main.py -k "bidirectional" -v`
Expected: FAIL (ImportError — `build_bidirectional_map` doesn't exist yet)

**Step 3: Commit**

```bash
git add tests/test_main.py
git commit -m "test: add tests for build_bidirectional_map"
```

---

### Task 2: Implement `build_bidirectional_map()`

**Files:**
- Modify: `core/src/main.py` (add function after `build_relationship_graph`, ~line 822)

**Step 1: Implement the function**

Add after `build_relationship_graph()` (line 822) in `core/src/main.py`:

```python
def build_bidirectional_map(parsed_pages: List[Dict]) -> Dict[str, Dict[str, List[Dict]]]:
    """
    Build bidirectional relationship map for all entity pages.

    For each entity slug, returns a dict of entity_type → list of related entity data.
    Computes forward relationships, reverse relationships, and tag-based relationships.

    Returns:
        {
            "ivan-petrov": {
                "services": [{"slug": "technical-seo", "title": ..., "url": ..., ...}],
                "cases": [{"slug": "ecommerce-migration-2025", ...}],
            }
        }
    """
    # Build lookup: slug → full page data (for entity cards)
    page_lookup = {}
    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        slug = config.get("slug", "")
        if not slug or page.get("is_listing"):
            continue
        page_lookup[slug] = {
            "slug": slug,
            "type": config.get("type", config.get("collection", "")),
            "collection": config.get("collection", ""),
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "menu": config.get("menu", ""),
            "sidebar": data.get("sidebar", {}),
            "relationships": data.get("relationships", {}),
            "tags": data.get("tags", {}),
            "config": config,
        }

    # Initialize result: slug → {entity_type: [entity_data]}
    result = {slug: {} for slug in page_lookup}

    # Collection-to-entity-type mapping for reverse lookups
    collection_type_map = {
        "services": "services", "team": "specialists", "cases": "cases",
        "solutions": "solutions", "categories": "categories",
        "industries": "industries", "countries": "countries", "languages": "languages",
    }

    # Relationship key → target collection mapping
    rel_target_collection = {
        "specialists": "team", "cases": "cases", "languages": "languages",
        "countries": "countries", "services_used": "services", "tasks_used": None,
        "door_opener_task": None, "available_tasks": None, "tasks": None,
    }

    def add_relation(source_slug, target_type, target_data):
        """Add a relation, avoiding duplicates."""
        if source_slug not in result:
            return
        if target_type not in result[source_slug]:
            result[source_slug][target_type] = []
        # Avoid duplicates by slug
        if not any(e["slug"] == target_data["slug"] for e in result[source_slug][target_type]):
            result[source_slug][target_type].append(target_data)

    def entity_card(slug):
        """Extract card-level data for an entity."""
        p = page_lookup.get(slug)
        if not p:
            return None
        return {
            "slug": p["slug"],
            "type": p["type"],
            "collection": p["collection"],
            "url": p["url"],
            "title": p["title"],
            "description": p["description"],
            "menu": p["menu"],
            "sidebar": p["sidebar"],
            "config": p["config"],
            "tags": p["tags"],
        }

    # Pass 1: Forward relationships
    for slug, page in page_lookup.items():
        rels = page.get("relationships", {})
        for rel_key, targets in rels.items():
            if isinstance(targets, str):
                targets = [targets]

            for target_slug in targets:
                target_card = entity_card(target_slug)
                if not target_card:
                    continue
                # Determine target grouping type
                target_collection = target_card["collection"]
                group_key = collection_type_map.get(target_collection, target_collection)
                add_relation(slug, group_key, target_card)

    # Pass 2: Reverse relationships
    for slug, page in page_lookup.items():
        source_collection = page.get("collection", "")
        source_group = collection_type_map.get(source_collection, source_collection)
        source_card = entity_card(slug)
        if not source_card:
            continue

        rels = page.get("relationships", {})
        for rel_key, targets in rels.items():
            if isinstance(targets, str):
                targets = [targets]
            for target_slug in targets:
                if target_slug in page_lookup:
                    add_relation(target_slug, source_group, source_card)

    # Pass 3: Tag-based relationships (service tagged with category → category gets service)
    for slug, page in page_lookup.items():
        tags = page.get("tags", {})
        source_collection = page.get("collection", "")
        source_group = collection_type_map.get(source_collection, source_collection)
        source_card = entity_card(slug)
        if not source_card:
            continue

        for tag_dimension, tag_values in tags.items():
            if isinstance(tag_values, str):
                tag_values = [tag_values]
            for tag_slug in tag_values:
                if tag_slug in page_lookup:
                    # Dimension entity gets reverse link to this page
                    add_relation(tag_slug, source_group, source_card)
                    # This page gets link to the dimension entity
                    target_card = entity_card(tag_slug)
                    if target_card:
                        target_group = collection_type_map.get(
                            target_card["collection"], target_card["collection"]
                        )
                        add_relation(slug, target_group, target_card)

    # Clean up: remove empty entries
    return {slug: groups for slug, groups in result.items() if groups}
```

**Step 2: Update import in test_main.py**

The import line at top of `tests/test_main.py` needs `build_bidirectional_map` added.

**Step 3: Run tests**

Run: `.venv/bin/python -m pytest tests/test_main.py -k "bidirectional" -v`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add core/src/main.py tests/test_main.py
git commit -m "feat: implement build_bidirectional_map for bidirectional relationships"
```

---

### Task 3: Implement `inject_related_blocks()` — tests + code

**Files:**
- Modify: `core/src/main.py`
- Modify: `tests/test_main.py`

**Step 1: Write tests**

```python
from main import inject_related_blocks

def test_inject_related_blocks_adds_sections():
    """Related blocks are injected with correct sections."""
    pages = [
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist"},
                  "blocks": [
                      {"type": "hero", "data": {}, "original_key": "hero"},
                      {"type": "cta", "data": {}, "original_key": "cta"},
                  ]}},
    ]
    bi_map = {
        "ivan": {
            "services": [{"slug": "seo", "title": "SEO", "url": "/services/seo"}],
            "cases": [{"slug": "case-1", "title": "Case 1", "url": "/cases/case-1"}],
        }
    }
    inject_related_blocks(pages, bi_map)
    block_types = [b["type"] for b in pages[0]["data"]["blocks"]]
    assert "related-entities" in block_types
    # Injected before CTA (last block)
    assert block_types[-1] == "cta"
    assert block_types[-2] == "related-entities"


def test_inject_related_blocks_skips_listing():
    """Listing pages don't get related blocks."""
    pages = [
        {"url": "/services", "collection": "services", "is_listing": True,
         "data": {"config": {"slug": "services"}, "blocks": []}},
    ]
    inject_related_blocks(pages, {})
    assert len(pages[0]["data"]["blocks"]) == 0


def test_inject_related_blocks_skips_no_relations():
    """Pages with no relations get no block."""
    pages = [
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist"},
                  "blocks": [{"type": "hero", "data": {}, "original_key": "hero"}]}},
    ]
    inject_related_blocks(pages, {})
    assert len(pages[0]["data"]["blocks"]) == 1
```

**Step 2: Implement function**

Add after `build_bidirectional_map()` in `core/src/main.py`:

```python
# Section display order per entity type
RELATED_SECTION_ORDER = {
    "service": ["specialists", "cases", "categories", "industries", "countries", "languages"],
    "specialist": ["services", "cases", "languages", "countries"],
    "case": ["services", "specialists", "industries", "countries", "languages"],
    "solution": ["services", "industries"],
    "category": ["services", "specialists", "cases"],
    "industry": ["services", "specialists", "cases", "solutions"],
    "country": ["services", "specialists", "cases"],
    "language": ["services", "specialists", "cases"],
}

# Human-readable section titles
SECTION_TITLES = {
    "services": "Services",
    "specialists": "Specialists",
    "cases": "Case Studies",
    "solutions": "Solutions",
    "categories": "Categories",
    "industries": "Industries",
    "countries": "Countries",
    "languages": "Languages",
}


def inject_related_blocks(parsed_pages: List[Dict], bi_map: Dict[str, Dict[str, List[Dict]]]):
    """
    Auto-inject related-entities blocks into pages based on bidirectional map.

    Inserts a single related-entities block before the last block (typically CTA).
    The block contains multiple sections, one per related entity type.
    """
    for page in parsed_pages:
        if page.get("is_listing"):
            continue

        data = page.get("data", {})
        config = data.get("config", {})
        slug = config.get("slug", "")
        entity_type = config.get("type", "")

        if slug not in bi_map:
            continue

        relations = bi_map[slug]
        section_order = RELATED_SECTION_ORDER.get(entity_type, [])

        sections = []
        for section_type in section_order:
            items = relations.get(section_type, [])
            if items:
                sections.append({
                    "type": section_type,
                    "title": SECTION_TITLES.get(section_type, section_type.title()),
                    "items": items,
                })

        if not sections:
            continue

        block = {
            "type": "related-entities",
            "original_key": "related-entities",
            "data": {
                "entity_type": entity_type,
                "sections": sections,
            },
        }

        blocks = data.get("blocks", [])
        if blocks:
            blocks.insert(len(blocks) - 1, block)
        else:
            blocks.append(block)
```

**Step 3: Run tests**

Run: `.venv/bin/python -m pytest tests/test_main.py -k "inject_related" -v`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add core/src/main.py tests/test_main.py
git commit -m "feat: implement inject_related_blocks for auto-generated relationship sections"
```

---

### Task 4: Wire up in build pipeline

**Files:**
- Modify: `core/src/main.py` (build pipeline section, ~line 1185-1198)

**Step 1: Add bidirectional map + injection to build flow**

In `core/src/main.py`, after the existing `resolve_related_entities` call (~line 1191), add:

```python
    # Build bidirectional relationship map and inject related blocks (Phase 2b)
    print("\nBuilding bidirectional relationship map...")
    bi_map = build_bidirectional_map(parsed_pages)
    print(f"  {len(bi_map)} entities with relationships")
    inject_related_blocks(parsed_pages, bi_map)
    print("  Related-entity blocks injected")
```

**Step 2: Run full build**

Run: `.venv/bin/python core/src/main.py --site vividigit 2>&1 | grep -E "bidirectional|inject|Related"`
Expected: Shows map building and injection messages

**Step 3: Commit**

```bash
git add core/src/main.py
git commit -m "feat: wire bidirectional map and block injection into build pipeline"
```

---

### Task 5: Create card templates

**Files:**
- Create: `themes/vividigit/templates/blocks/cards/service-card.html`
- Create: `themes/vividigit/templates/blocks/cards/specialist-card.html`
- Create: `themes/vividigit/templates/blocks/cards/case-card.html`
- Create: `themes/vividigit/templates/blocks/cards/solution-card.html`
- Create: `themes/vividigit/templates/blocks/cards/category-card.html`
- Create: `themes/vividigit/templates/blocks/cards/dimension-card.html`

Each card template receives `item` (entity data dict) and renders a card matching the existing JS-rendered cards.

**Step 1: Create all 6 card templates**

`cards/service-card.html`:
```html
{# Service card — matches catalog.html renderServiceCard() #}
{% set cats = item.tags.categories | default([]) %}
{% set url = item.url | default('/services/' ~ item.slug) %}
<a href="{{ url }}" class="service-card">
    <div class="service-card-header">
        <div class="service-categories">
            {% for cat in cats[:3] %}
            <span class="service-category">{{ cat | replace('-', ' ') | title }}</span>
            {% endfor %}
        </div>
    </div>
    <h3>{{ item.menu or item.title }}</h3>
    <p>{{ item.description }}</p>
    <div class="service-card-footer">
        {% if item.config.from_price or item.config.price %}
        <span class="service-price">From ${{ item.config.from_price or item.config.price }}</span>
        {% else %}
        <span></span>
        {% endif %}
        <span class="service-cta">View →</span>
    </div>
</a>
```

`cards/specialist-card.html`:
```html
{# Specialist card — matches catalog.html renderSpecialistCard() #}
{% set url = item.url | default('/team/' ~ item.slug) %}
{% set sidebar = item.sidebar | default({}) %}
{% set initials = item.menu[:2] | upper if item.menu else 'SP' %}
<a href="{{ url }}" class="specialist-card">
    <div class="specialist-card-top">
        <div class="specialist-avatar">
            {% if item.config.avatar %}
            <img src="{{ item.config.avatar }}" alt="{{ item.menu or item.title }}">
            {% else %}
            <div class="specialist-avatar-initials">{{ initials }}</div>
            {% endif %}
        </div>
        <div class="specialist-info">
            <h3>{{ item.menu or item.title }}</h3>
            {% if sidebar.role %}<div class="specialist-role">{{ sidebar.role }}</div>{% endif %}
        </div>
    </div>
    <div class="specialist-stats">
        {% if sidebar.rating %}
        <div class="specialist-stat">
            <span class="specialist-stat-value rating">★ {{ sidebar.rating }}</span>
            <span class="specialist-stat-label">Rating</span>
        </div>
        {% endif %}
        {% if sidebar.projects %}
        <div class="specialist-stat">
            <span class="specialist-stat-value">{{ sidebar.projects }}</span>
            <span class="specialist-stat-label">Projects</span>
        </div>
        {% endif %}
    </div>
    <div class="specialist-card-footer">
        {% if sidebar.hourly_rate %}
        <span class="specialist-rate">${{ sidebar.hourly_rate }}/h</span>
        {% else %}
        <span></span>
        {% endif %}
        <span class="specialist-cta">View Profile →</span>
    </div>
</a>
```

`cards/case-card.html`:
```html
{# Case study card — matches catalog.html renderCaseCard() #}
{% set url = item.url | default('/cases/' ~ item.slug) %}
{% set rels = item.get('relationships', {}) if item.get is defined else {} %}
<a href="{{ url }}" class="case-card">
    <div class="case-image">
        {% if item.config.image %}
        <img src="{{ item.config.image }}" alt="{{ item.title }}" loading="lazy">
        {% else %}
        <div class="case-image-placeholder"><span>{{ (item.title or 'C')[:1] | upper }}</span></div>
        {% endif %}
    </div>
    <div class="case-content">
        <div class="case-meta">
            {% if item.sidebar.industry %}<span class="case-industry">{{ item.sidebar.industry | replace('-', ' ') | title }}</span>{% endif %}
            {% if item.sidebar.client %}<span class="case-client">{{ item.sidebar.client }}</span>{% endif %}
        </div>
        <h3>{{ item.menu or item.title }}</h3>
        <p>{{ item.description }}</p>
    </div>
</a>
```

`cards/solution-card.html`:
```html
{# Solution card — matches catalog.html renderSolutionCard() #}
{% set url = item.url | default('/solutions/' ~ item.slug) %}
<a href="{{ url }}" class="solution-card">
    <h3>{{ item.menu or item.title }}</h3>
    <p>{{ item.description }}</p>
    <div class="solution-card-footer">
        {% if item.config.starting_price %}
        <span class="solution-price">From ${{ item.config.starting_price }}</span>
        {% else %}
        <span></span>
        {% endif %}
        <span class="solution-cta">View Solution →</span>
    </div>
</a>
```

`cards/category-card.html`:
```html
{# Category card — matches catalog.html renderCategoryCard() #}
{% set url = item.url | default('/categories/' ~ item.slug) %}
<a href="{{ url }}" class="category-card">
    <div class="category-card-header">
        <h3>{{ item.menu or item.title }}</h3>
        <div class="category-card-icon" style="--icon-url: url(/assets/icons/{{ item.config.icon | default('settings') }}.svg)"></div>
    </div>
    <p>{{ item.description }}</p>
    <div class="category-card-footer">
        {% if item.config.door_opener_price %}
        <span class="category-price">From ${{ item.config.door_opener_price }}</span>
        {% else %}
        <span></span>
        {% endif %}
        <span class="category-cta">Explore →</span>
    </div>
</a>
```

`cards/dimension-card.html`:
```html
{# Dimension card (industry, country, language) — matches renderDimensionCard() #}
{% set url = item.url | default('/' ~ item.collection ~ '/' ~ item.slug) %}
<a href="{{ url }}" class="dimension-card">
    <div class="dimension-card-header">
        <h3>{{ item.menu or item.title }}</h3>
        {% if item.config.icon %}
        <div class="dimension-card-badge icon" style="--icon-url: url(/assets/icons/{{ item.config.icon }}.svg)"></div>
        {% elif item.config.flag %}
        <div class="dimension-card-badge">{{ item.config.flag }}</div>
        {% elif item.config.code %}
        <div class="dimension-card-badge code">{{ item.config.code }}</div>
        {% endif %}
    </div>
    <p>{{ item.description }}</p>
    <div class="dimension-card-footer">
        <span></span>
        <span class="dimension-cta">Explore →</span>
    </div>
</a>
```

**Step 2: Verify templates parse without errors**

Run: `.venv/bin/python -c "from jinja2 import Environment, FileSystemLoader; env = Environment(loader=FileSystemLoader('themes/vividigit/templates')); [env.get_template(f'blocks/cards/{t}') for t in ['service-card.html','specialist-card.html','case-card.html','solution-card.html','category-card.html','dimension-card.html']]; print('All card templates OK')"`

**Step 3: Commit**

```bash
git add themes/vividigit/templates/blocks/cards/
git commit -m "feat: add Jinja2 card templates for all entity types"
```

---

### Task 6: Create `related-entities.html` block template

**Files:**
- Create: `themes/vividigit/templates/blocks/related-entities.html`

**Step 1: Create the block template**

```html
{# Related Entities Block — auto-generated from relationship graph #}
{% if data.sections %}
<div class="related-entities">
    {% for section in data.sections %}
    <section class="related-section" data-type="{{ section.type }}">
        <div class="related-section-header">
            <h2>{{ section.title }}</h2>
            {% if section.items | length > 4 %}
            <button class="related-show-all" data-expanded="false">
                Show all ({{ section.items | length }})
            </button>
            {% endif %}
        </div>
        <div class="related-grid{% if section.items | length > 4 %} related-grid-collapsed{% endif %}">
            {% for item in section.items %}
            {% set card_type = item.type | default('') %}
            {% if card_type == 'service' %}
                {% include 'blocks/cards/service-card.html' %}
            {% elif card_type == 'specialist' %}
                {% include 'blocks/cards/specialist-card.html' %}
            {% elif card_type == 'case' %}
                {% include 'blocks/cards/case-card.html' %}
            {% elif card_type == 'solution' %}
                {% include 'blocks/cards/solution-card.html' %}
            {% elif card_type == 'category' %}
                {% include 'blocks/cards/category-card.html' %}
            {% else %}
                {% include 'blocks/cards/dimension-card.html' %}
            {% endif %}
            {% endfor %}
        </div>
    </section>
    {% endfor %}
</div>
{% endif %}
```

**Step 2: Run a full build to verify rendering**

Run: `.venv/bin/python core/src/main.py --site vividigit 2>&1 | tail -5`
Expected: Build complete without template errors

**Step 3: Commit**

```bash
git add themes/vividigit/templates/blocks/related-entities.html
git commit -m "feat: add related-entities block template with card includes"
```

---

### Task 7: CSS for related-entities sections

**Files:**
- Modify: `themes/vividigit/assets/css/styles.css`

**Step 1: Add related-entities CSS**

Append to `styles.css`:

```css
/* === Block: related-entities === */
.related-entities { display: flex; flex-direction: column; gap: var(--space-2xl); }
.related-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.related-section-header h2 { font-size: var(--font-size-h3); color: var(--text-primary); margin: 0; }
.related-show-all {
    background: none; border: 1px solid var(--border); color: var(--accent);
    padding: var(--space-xs) var(--space-md); border-radius: var(--radius-md);
    cursor: pointer; font-size: var(--font-size-ui); transition: var(--transition);
}
.related-show-all:hover { border-color: var(--accent); background: var(--bg-tertiary); }
.related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-lg);
}
.related-grid-collapsed > :nth-child(n+5) { display: none; }
.related-grid-expanded > :nth-child(n+5) { display: flex; }
```

**Step 2: Rebuild and verify**

Run: `.venv/bin/python core/src/main.py --site vividigit 2>&1 | tail -3`

**Step 3: Commit**

```bash
git add themes/vividigit/assets/css/styles.css
git commit -m "feat: add CSS for related-entities block sections and grid"
```

---

### Task 8: JS progressive enhancement

**Files:**
- Modify: `themes/vividigit/assets/js/site.js`

**Step 1: Add "Show all" toggle JS**

Append to `site.js`:

```javascript
/* === Related Entities: Show All toggle === */
document.querySelectorAll('.related-show-all').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var grid = btn.closest('.related-section').querySelector('.related-grid');
        var expanded = btn.dataset.expanded === 'true';
        if (expanded) {
            grid.classList.remove('related-grid-expanded');
            grid.classList.add('related-grid-collapsed');
            btn.textContent = 'Show all (' + grid.children.length + ')';
            btn.dataset.expanded = 'false';
        } else {
            grid.classList.remove('related-grid-collapsed');
            grid.classList.add('related-grid-expanded');
            btn.textContent = 'Show less';
            btn.dataset.expanded = 'true';
        }
    });
});
```

**Step 2: Rebuild and verify**

Run: `.venv/bin/python core/src/main.py --site vividigit 2>&1 | tail -3`

**Step 3: Commit**

```bash
git add themes/vividigit/assets/js/site.js
git commit -m "feat: add JS show-all toggle for related entity sections"
```

---

### Task 9: Remove old catalog-mini blocks from pillar TOMLs

**Files:**
- Modify: All category TOML files in `sites/vividigit/content/categories/*/`
- Modify: All industry TOML files in `sites/vividigit/content/industries/*/`
- Modify: All country TOML files in `sites/vividigit/content/countries/*/`
- Modify: All language TOML files in `sites/vividigit/content/languages/*/`

**Step 1: Remove `[catalog-mini]`, `[catalog-mini_specialists]`, `[catalog-mini_cases]` blocks**

For each pillar TOML, remove these blocks since they are now auto-generated:
- `[catalog-mini]` — services filtered by dimension
- `[catalog-mini_specialists]` — specialists filtered by dimension
- `[catalog-mini_cases]` — cases filtered by dimension

These blocks exist on category, industry, country, and language pillar pages.

**Step 2: Rebuild and verify page structure**

Run: `.venv/bin/python core/src/main.py --site vividigit 2>&1 | tail -5`
Expected: Build complete, same page count

**Step 3: Verify a pillar page has related-entities instead of catalog-mini**

Check `/categories/seo/` output for `related-entities` class.

**Step 4: Commit**

```bash
git add sites/vividigit/content/
git commit -m "refactor: remove manual catalog-mini blocks from pillar pages (now auto-generated)"
```

---

### Task 10: Run all tests + full build verification

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `.venv/bin/python -m pytest tests/ -v`
Expected: ALL PASS

**Step 2: Full build**

Run: `.venv/bin/python core/src/main.py --site vividigit`
Expected: 86 pages, 0 errors

**Step 3: Visual verification**

Start dev server and check:
- `/team/ivan-petrov/` — should show Services, Cases, Languages, Countries sections
- `/categories/seo/` — should show Services, Specialists, Cases sections
- `/services/technical-seo/` — should show Specialists, Cases sections
- `/cases/ecommerce-migration-2025/` — should show Services, Specialists, Industry, Country sections

**Step 4: Commit any fixes, then push**

```bash
git push
```
