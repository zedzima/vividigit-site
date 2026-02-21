# Blog Post Entity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Blog Post the 9th primary entity in the CMS relationship graph, so blog posts appear on specialist and category pages as related entities.

**Architecture:** Blog posts use flat YAML frontmatter in `.md` files. A normalization step after parsing copies `config.categories` → `data.tags.categories` and `config.author` → `data.relationships.author`, so existing graph passes (forward, reverse, tag-based) handle blog posts automatically. A new `blog-post-card.html` template renders posts in related-entities blocks.

**Tech Stack:** Python (main.py, parser.py), Jinja2 templates, pytest

---

### Task 1: Add `categories` to parser flat fields

**Files:**
- Modify: `core/src/parser.py:85-86` (flat_fields list)
- Modify: `core/src/parser.py:137-139` (SYSTEM_FIELDS set)

**Step 1: Add `categories` to flat_fields**

In `core/src/parser.py:85`, add `"categories"` to the flat_fields list:

```python
flat_fields = ["title", "slug", "url", "date", "author", "tags",
               "category", "categories", "type", "lang", "featured", "draft", "menu"]
```

**Step 2: Add `categories` to SYSTEM_FIELDS**

In `core/src/parser.py:137`, add `"categories"` to SYSTEM_FIELDS:

```python
SYSTEM_FIELDS = {"config", "meta", "translations", "title", "slug", "url",
                 "date", "author", "tags", "category", "categories", "lang", "featured",
                 "draft", "menu", "description", "excerpt"}
```

**Step 3: Commit**

```bash
git add core/src/parser.py
git commit -m "feat: add categories to markdown flat fields and system fields"
```

---

### Task 2: Write tests for blog post graph integration

**Files:**
- Modify: `tests/test_main.py` (add new tests at end of file)

**Step 1: Write test for blog normalization**

Add to `tests/test_main.py`:

```python
def test_normalize_blog_entities_injects_tags_and_relationships():
    """normalize_blog_entities copies config.categories -> tags and config.author -> relationships."""
    pages = [
        {"url": "/blog/test-post", "collection": "blog", "is_listing": False,
         "data": {"config": {"slug": "test-post", "type": "blog-post", "url": "/blog/test-post",
                              "author": "ivan", "categories": ["aeo"]},
                  "meta": {"title": "Test Post", "description": "A test"},
                  "blocks": []}},
    ]
    normalize_blog_entities(pages)
    data = pages[0]["data"]
    assert data["tags"]["categories"] == ["aeo"]
    assert data["relationships"]["author"] == "ivan"
```

**Step 2: Write test for blog-post in bidirectional map via tags**

```python
def test_bidirectional_map_blog_post_via_tags():
    """Blog post with categories tag creates reverse link on category page."""
    pages = [
        {"url": "/blog/test-post", "collection": "blog", "is_listing": False,
         "data": {"config": {"slug": "test-post", "type": "blog-post", "url": "/blog/test-post",
                              "menu": "Test Post"},
                  "meta": {"title": "Test Post", "description": "A test"},
                  "sidebar": {}, "relationships": {},
                  "tags": {"categories": ["aeo"]}}},
        {"url": "/categories/aeo", "collection": "categories", "is_listing": False,
         "data": {"config": {"slug": "aeo", "type": "category", "url": "/categories/aeo"},
                  "meta": {"title": "AEO", "description": "AEO category"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result, _ = build_bidirectional_map(pages)
    # Category gets blog post via tag
    assert any(e["slug"] == "test-post" for e in result["aeo"]["blog-posts"])
    # Blog post gets category via tag
    assert any(e["slug"] == "aeo" for e in result["test-post"]["categories"])
```

**Step 3: Write test for blog-post author forward/reverse relationship**

```python
def test_bidirectional_map_blog_post_author():
    """Blog post with author relationship creates bidirectional link to specialist."""
    pages = [
        {"url": "/blog/test-post", "collection": "blog", "is_listing": False,
         "data": {"config": {"slug": "test-post", "type": "blog-post", "url": "/blog/test-post",
                              "menu": "Test Post"},
                  "meta": {"title": "Test Post", "description": "A test"},
                  "sidebar": {}, "relationships": {"author": "ivan"},
                  "tags": {}}},
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist", "url": "/team/ivan"},
                  "meta": {"title": "Ivan", "description": "Specialist"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result, _ = build_bidirectional_map(pages)
    # Blog post has forward link to specialist
    assert any(e["slug"] == "ivan" for e in result["test-post"]["specialists"])
    # Specialist gets reverse link to blog post
    assert any(e["slug"] == "test-post" for e in result["ivan"]["blog-posts"])
```

**Step 4: Run tests to verify they fail**

Run: `cd "/Users/Dima/Work AI/CMS" && python -m pytest tests/test_main.py -v -k "blog" 2>&1 | tail -20`

Expected: FAIL — `normalize_blog_entities` not defined, `blog-posts` not in collection_type_map.

**Step 5: Commit test file**

```bash
git add tests/test_main.py
git commit -m "test: add blog post graph integration tests (red)"
```

---

### Task 3: Implement `normalize_blog_entities()` in main.py

**Files:**
- Modify: `core/src/main.py` (add function before `build_relationship_graph` at ~line 788)

**Step 1: Add the normalization function**

Insert before `build_relationship_graph()` (line 790):

```python
def normalize_blog_entities(parsed_pages: List[Dict]):
    """
    Normalize blog post data for graph integration.
    Blog posts use flat YAML frontmatter. This copies:
      - config.categories -> data.tags.categories (for tag-based graph pass)
      - config.author -> data.relationships.author (for forward/reverse graph pass)
    """
    for page in parsed_pages:
        if page.get("collection") != "blog" or page.get("is_listing"):
            continue
        data = page.get("data", {})
        config = data.get("config", {})

        # Inject tags.categories from config.categories
        categories = config.get("categories", [])
        if categories:
            if "tags" not in data:
                data["tags"] = {}
            data["tags"]["categories"] = categories

        # Inject relationships.author from config.author
        author = config.get("author", "")
        if author:
            if "relationships" not in data:
                data["relationships"] = {}
            data["relationships"]["author"] = author
```

**Step 2: Run normalize test**

Run: `cd "/Users/Dima/Work AI/CMS" && python -m pytest tests/test_main.py::test_normalize_blog_entities_injects_tags_and_relationships -v`

Expected: PASS

**Step 3: Commit**

```bash
git add core/src/main.py
git commit -m "feat: add normalize_blog_entities() for graph integration"
```

---

### Task 4: Add blog-post to graph constants and mappings

**Files:**
- Modify: `core/src/main.py:892-903` (collection_type_map, rel_target_collection)
- Modify: `core/src/main.py:1034-1049` (ALL_SECTIONS, RELATED_SECTION_ORDER)
- Modify: `core/src/main.py:1051-1060` (SECTION_TITLES)
- Modify: `core/src/main.py:1064-1137` (SECTION_SUBTITLES)

**Step 1: Add `blog` to `collection_type_map` (line 892)**

```python
collection_type_map = {
    "services": "services", "team": "specialists", "cases": "cases",
    "solutions": "solutions", "categories": "categories",
    "industries": "industries", "countries": "countries", "languages": "languages",
    "blog": "blog-posts",
}
```

**Step 2: Add `author` to `rel_target_collection` (line 898)**

```python
rel_target_collection = {
    "specialists": "team", "cases": "cases", "languages": "languages",
    "countries": "countries", "services_used": "services", "tasks_used": None,
    "door_opener_task": None, "available_tasks": None, "tasks": None,
    "author": "team",
}
```

**Step 3: Add `blog-posts` to `ALL_SECTIONS` (line 1036)**

```python
ALL_SECTIONS = ["services", "specialists", "cases", "solutions", "categories",
                "industries", "countries", "languages", "blog-posts"]
```

**Step 4: Add `blog-post` to `RELATED_SECTION_ORDER` (line 1040)**

The comprehension auto-generates entries for all types. Add `blog-post`:

```python
RELATED_SECTION_ORDER = {
    "service":    [s for s in ALL_SECTIONS if s != "services"],
    "specialist": [s for s in ALL_SECTIONS if s != "specialists"],
    "case":       [s for s in ALL_SECTIONS if s != "cases"],
    "solution":   [s for s in ALL_SECTIONS if s != "solutions"],
    "category":   [s for s in ALL_SECTIONS if s != "categories"],
    "industry":   [s for s in ALL_SECTIONS if s != "industries"],
    "country":    [s for s in ALL_SECTIONS if s != "countries"],
    "language":   [s for s in ALL_SECTIONS if s != "languages"],
    "blog-post":  [s for s in ALL_SECTIONS if s != "blog-posts"],
}
```

**Step 5: Add `blog-posts` to `SECTION_TITLES` (line 1051)**

```python
SECTION_TITLES = {
    "services": "Services",
    "specialists": "Specialists",
    "cases": "Case Studies",
    "solutions": "Solutions",
    "categories": "Categories",
    "industries": "Industries",
    "countries": "Countries",
    "languages": "Languages",
    "blog-posts": "Blog Posts",
}
```

**Step 6: Add subtitle templates for `blog-post` and add `blog-posts` to existing entity types**

Add to `SECTION_SUBTITLES`:

For existing entity types — append `"blog-posts"` subtitle:

```python
"service": {
    ...existing entries...,
    "blog-posts": "Articles about {name}",
},
"specialist": {
    ...existing entries...,
    "blog-posts": "Articles by {name}",
},
"case": {
    ...existing entries...,
    "blog-posts": "Related articles",
},
"solution": {
    ...existing entries...,
    "blog-posts": "Articles about {name}",
},
"category": {
    ...existing entries...,
    "blog-posts": "{name} articles",
},
"industry": {
    ...existing entries...,
    "blog-posts": "Articles about {name}",
},
"country": {
    ...existing entries...,
    "blog-posts": "Articles about {name}",
},
"language": {
    ...existing entries...,
    "blog-posts": "Articles in {name}",
},
```

Add new blog-post entry:

```python
"blog-post": {
    "services": "Related services",
    "specialists": "Written by",
    "cases": "Related case studies",
    "solutions": "Related solutions",
    "categories": "Topics covered",
    "industries": "Industry focus",
    "countries": "Geographic focus",
    "languages": "Available in",
},
```

**Step 7: Run bidirectional map tests**

Run: `cd "/Users/Dima/Work AI/CMS" && python -m pytest tests/test_main.py -v -k "blog" 2>&1 | tail -20`

Expected: ALL 3 blog tests PASS.

**Step 8: Run full test suite**

Run: `cd "/Users/Dima/Work AI/CMS" && python -m pytest tests/ -v 2>&1 | tail -30`

Expected: All existing tests still pass.

**Step 9: Commit**

```bash
git add core/src/main.py
git commit -m "feat: add blog-post to graph constants and collection mappings"
```

---

### Task 5: Wire normalization into build pipeline

**Files:**
- Modify: `core/src/main.py:1711-1727` (main function, between parsing and graph building)

**Step 1: Add `normalize_blog_entities()` call in `main()`**

After line 1710 (after parsing loop, before graph building), insert:

```python
    # Normalize blog posts for graph integration
    normalize_blog_entities(parsed_pages)
```

The section should read:

```python
    # Normalize blog posts for graph integration (before graph building)
    normalize_blog_entities(parsed_pages)

    # Build relationship graph (Phase 2)
    print("\nBuilding relationship graph...")
    graph = build_relationship_graph(parsed_pages)
```

**Step 2: Commit**

```bash
git add core/src/main.py
git commit -m "feat: wire normalize_blog_entities into build pipeline"
```

---

### Task 6: Create `blog-post-card.html` template

**Files:**
- Create: `themes/vividigit/templates/blocks/cards/blog-post-card.html`

**Step 1: Create the card template**

Pattern matches existing cards (service-card.html, case-card.html). Uses `item.*` context from related-entities.html loop.

```jinja2
{# Blog post card — for related-entities blocks #}
{% set url = item.url | default('/blog/' ~ item.slug) %}
{% set cats = item.tags.categories | default([]) %}
{% set category_label_map = {'digital-marketing': 'Digital Marketing', 'seo': 'SEO', 'aeo': 'AEO', 'content': 'Content', 'ppc': 'PPC', 'analytics': 'Analytics', 'social-media': 'Social Media', 'email': 'Email', 'cro': 'CRO', 'video': 'Video', 'pr': 'PR', 'automation': 'Automation', 'marketplace-management': 'Marketplace', 'affiliate': 'Affiliate'} %}
<a href="{{ url }}" class="blog-post-card">
    <div class="blog-post-card-header">
        {% for cat in cats[:2] %}
        <span class="blog-post-category">{{ category_label_map.get(cat, cat|replace('-', ' ')|title) }}</span>
        {% endfor %}
        {% if item.config.date %}
        <span class="blog-post-date">{{ item.config.date }}</span>
        {% endif %}
    </div>
    <h3>{{ item.menu or item.title }}</h3>
    <p>{{ item.description }}</p>
    {% if item.config.type %}
    <div class="blog-post-card-footer">
        <span class="blog-post-type">{{ item.config.type | title }}</span>
        <span class="blog-post-cta">Read →</span>
    </div>
    {% else %}
    <div class="blog-post-card-footer">
        <span class="blog-post-cta">Read →</span>
    </div>
    {% endif %}
</a>
```

**Step 2: Commit**

```bash
git add themes/vividigit/templates/blocks/cards/blog-post-card.html
git commit -m "feat: add blog-post-card.html template for related-entities"
```

---

### Task 7: Add blog-post routing to `related-entities.html`

**Files:**
- Modify: `themes/vividigit/templates/blocks/related-entities.html:17-30`

**Step 1: Add `blog-post` card type**

After the `solution` elif (line 25) and before the `category` elif (line 26), add:

```jinja2
{% elif card_type == 'blog-post' %}
    {% include 'blocks/cards/blog-post-card.html' %}
```

The full conditional should read:

```jinja2
{% if card_type == 'service' %}
    {% include 'blocks/cards/service-card.html' %}
{% elif card_type == 'specialist' %}
    {% include 'blocks/cards/specialist-card.html' %}
{% elif card_type == 'case' %}
    {% include 'blocks/cards/case-card.html' %}
{% elif card_type == 'solution' %}
    {% include 'blocks/cards/solution-card.html' %}
{% elif card_type == 'blog-post' %}
    {% include 'blocks/cards/blog-post-card.html' %}
{% elif card_type == 'category' %}
    {% include 'blocks/cards/category-card.html' %}
{% else %}
    {% include 'blocks/cards/dimension-card.html' %}
{% endif %}
```

**Step 2: Commit**

```bash
git add themes/vividigit/templates/blocks/related-entities.html
git commit -m "feat: route blog-post cards in related-entities template"
```

---

### Task 8: Add blog-post-card CSS

**Files:**
- Modify: `themes/vividigit/assets/css/styles.css` (append styles)

**Step 1: Add blog-post-card styles**

Append to `styles.css`:

```css
/* Blog Post Card — related-entities */
.blog-post-card {
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    border-radius: var(--radius-md, 12px);
    background: var(--card-bg, #fff);
    border: 1px solid var(--border-color, #e5e7eb);
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.2s, border-color 0.2s;
}
.blog-post-card:hover {
    border-color: var(--accent, #6366f1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.blog-post-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
}
.blog-post-category {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--accent, #6366f1);
    background: var(--accent-light, #eef2ff);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
}
.blog-post-date {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    margin-left: auto;
}
.blog-post-card h3 {
    font-size: 1.05rem;
    margin: 0 0 0.5rem;
    line-height: 1.35;
}
.blog-post-card p {
    font-size: 0.875rem;
    color: var(--text-secondary, #4b5563);
    margin: 0 0 auto;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.blog-post-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color, #e5e7eb);
}
.blog-post-type {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
}
.blog-post-cta {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--accent, #6366f1);
}
```

**Step 2: Commit**

```bash
git add themes/vividigit/assets/css/styles.css
git commit -m "feat: add blog-post-card CSS styles"
```

---

### Task 9: Update existing blog post frontmatter

**Files:**
- Modify: `sites/vividigit/content/blog/how-ai-chooses-sources/how-ai-chooses-sources.en.md:1-27`

**Step 1: Update frontmatter**

Change the frontmatter from:

```yaml
---
title: How AI Chooses Which Websites to Cite
slug: how-ai-chooses-sources
url: /blog/how-ai-chooses-sources
date: 2025-01-06
author: V\V\D\G\T Team
type: research
category: AI Visibility
tags:
  - AI
  - LLM Citations
  - GEO
  - Content Strategy
menu: How AI Chooses Sources
lang: en
featured: true

description: Understanding why AI systems cite some sources and ignore others. A deep dive into citation behavior of ChatGPT, Perplexity, and other LLMs.
```

To:

```yaml
---
title: How AI Chooses Which Websites to Cite
slug: how-ai-chooses-sources
url: /blog/how-ai-chooses-sources
date: 2025-01-06
author: ivan-petrov
type: research
category: AI Visibility
categories:
  - aeo
tags:
  - AI
  - LLM Citations
  - GEO
  - Content Strategy
menu: How AI Chooses Sources
lang: en
featured: true

description: Understanding why AI systems cite some sources and ignore others. A deep dive into citation behavior of ChatGPT, Perplexity, and other LLMs.
```

Key changes:
- `author` → `ivan-petrov` (specialist slug instead of text)
- Added `categories: ["aeo"]` (entity slugs for graph)
- Kept `category: "AI Visibility"` (display text for catalog listing)

**Step 2: Commit**

```bash
git add sites/vividigit/content/blog/how-ai-chooses-sources/how-ai-chooses-sources.en.md
git commit -m "feat: update blog post frontmatter with entity slugs"
```

---

### Task 10: Update `export_collection_json` for blog author resolution

**Files:**
- Modify: `core/src/main.py:295-325` (export_collection_json)

**Step 1: Add author name resolution**

The blog.json export currently uses `config.get("author", "")` which will now be a slug like `ivan-petrov`. For backward compatibility with the catalog listing (which displays author text), resolve the slug to a display name.

This is optional — the catalog listing `renderBlogCard()` shows `s.author`. If the author is a slug, it'll display the slug. To show a proper name, we need to pass a lookup.

**Decision:** Keep it simple. The catalog listing's `renderBlogCard()` already works with whatever text is in `author`. Since `category` text field is kept for display, we should also consider keeping a display-friendly author. But the design says `author = specialist slug`.

**Simplest approach:** Add `author_name` to blog.json export. In `export_collection_json()`, no change needed — the catalog already works. If a human-readable author name is desired later, it can be added to the blog export specifically.

**No changes needed in this step.** The slug `ivan-petrov` will display as-is in the catalog. This is acceptable for now — a display name mapping can be added later.

**Step 2: Skip — no commit needed**

---

### Task 11: Build and verify

**Step 1: Run full test suite**

Run: `cd "/Users/Dima/Work AI/CMS" && python -m pytest tests/ -v`

Expected: All tests pass, including new blog tests.

**Step 2: Build the site**

Run: `cd "/Users/Dima/Work AI/CMS" && python core/src/main.py en --site vividigit`

Expected: Build succeeds. Look for:
- Blog post included in relationship graph
- Bidirectional map includes blog-post entity
- Related-entity blocks injected into specialist/category pages

**Step 3: Verify specialist page has blog post section**

Check: `public/team/ivan-petrov/index.html` should contain a "Blog Posts" or "Articles by Ivan Petrov" section with the blog post card.

**Step 4: Verify category page has blog post section**

Check: `public/categories/aeo/index.html` should contain a blog-posts section with the blog post card.

**Step 5: Verify blog post page has related entities**

Check: `public/blog/how-ai-chooses-sources/index.html` should contain related specialist and category sections.

**Step 6: Verify blog listing still works**

Check: `public/data/blog.json` still has the post with `author: "ivan-petrov"`.

**Step 7: Commit any fixes**

If any issues found during verification, fix and commit.

---

### Task 12: Update documentation

**Files:**
- Modify: `DESIGN.md` or `CMSspec.md` — add Blog Post to entity model
- Modify: `TR.md` — note 9th entity addition

**Step 1: Update relevant docs**

Add Blog Post entity to the entity model documentation:
- Type: `blog-post`
- Collection: `blog`
- Content format: Markdown with YAML frontmatter
- Relationships: `author` (specialist slug), `categories` (category entity slugs)
- Graph integration: normalized via `normalize_blog_entities()` before graph building

**Step 2: Commit**

```bash
git add DESIGN.md CMSspec.md TR.md
git commit -m "docs: add blog-post entity to CMS documentation"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Parser: add `categories` to flat fields | `core/src/parser.py` |
| 2 | Tests: write 3 blog graph tests (red) | `tests/test_main.py` |
| 3 | Implement `normalize_blog_entities()` | `core/src/main.py` |
| 4 | Graph constants: collection map, sections, titles, subtitles | `core/src/main.py` |
| 5 | Wire normalization into build pipeline | `core/src/main.py` |
| 6 | Create `blog-post-card.html` | `templates/blocks/cards/blog-post-card.html` |
| 7 | Route blog-post in `related-entities.html` | `templates/blocks/related-entities.html` |
| 8 | Blog post card CSS | `assets/css/styles.css` |
| 9 | Update existing post frontmatter | `content/blog/.../how-ai-chooses-sources.en.md` |
| 10 | (Skipped — no changes needed) | — |
| 11 | Build & verify | — |
| 12 | Update docs | `DESIGN.md`, `CMSspec.md`, `TR.md` |
