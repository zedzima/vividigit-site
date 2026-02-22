# Blog Post Entity Design

**Date:** 2026-02-21
**Status:** Implemented (updated 2026-02-21)

## Summary

Blog Post becomes the 9th primary entity in the CMS relationship graph. Specialists write articles; posts appear on specialist pages as related entities. Posts connect to categories, and author is a specialist slug — enabling bidirectional relationships.

## Entity Definition

| Property | Value |
|----------|-------|
| Entity type | `blog-post` |
| Collection | `blog` |
| Content format | Markdown (`.md`) with YAML frontmatter |
| URL pattern | `/blog/{slug}` |
| Listing page | `/blog/` (existing route; card formatting updated to chips + formatted meta) |

## Relationships

Minimal set, expandable later:

| Relationship | Type | Mechanism |
|-------------|------|-----------|
| Author → Specialist | Singular | `[relationships]` section: `author = "specialist-slug"` |
| Categories → Category entities | Multiple | Frontmatter: `categories: ["aeo", "seo"]` |

**Not included (future):** industries, countries, languages, services, solutions.

## Frontmatter Changes

### Current format (text-based, no graph integration):
```yaml
author: V\V\D\G\T Team
category: AI Visibility
```

### New format (entity slugs, graph-integrated):
```yaml
author: vvdgt-team          # specialist slug
categories:
  - aeo                      # category entity slugs
  - seo
```

The `category` text field is replaced by `categories` array of entity slugs. The `author` text field becomes a specialist slug resolved via `[relationships]`.

## Architecture

### main.py Changes

1. **Add `blog-post` to graph section ordering/constants** (`ALL_SECTIONS`, `RELATED_SECTION_ORDER`, `SECTION_TITLES`, contextual subtitles).

2. **`normalize_blog_entities()`** (implemented) bridges flat frontmatter to graph data:
   - `config.categories` → `data.tags.categories`
   - `config.author` → `data.relationships.author`
   - preserves original post type in `config.content_type`, sets graph entity type to `config.type = "blog-post"`

3. **`build_bidirectional_map()`** handles `blog-post` entities:
   - `author` relationship: blog-post → specialist (forward), specialist → blog-post (reverse)
   - `categories` from frontmatter: blog-post → category (forward), category → blog-post (reverse)

4. **`inject_related_blocks()`** — inject blog-post cards into specialist and category pages.

5. **`export_relationship_graph()`** — include blog-post nodes and edges.

### Template Changes

1. **`blog-post-card.html`** — new partial template for rendering blog post cards in related-entities blocks. Shows: title, date, category badge, excerpt/description, author name.

2. **`catalog.html` / `renderBlogCard()`** — listing keeps the same data source (`public/data/blog.json`) but now renders compact type/category chips and formatted date/author meta.

3. **Blog post page template** — unchanged. Posts render as hero + markdown body.

### Existing Post Migration

The single existing post `how-ai-chooses-sources.en.md` needs frontmatter updated to use entity slugs instead of text values.

## Backward Compatibility

| Scenario | Handling |
|----------|----------|
| Posts without `categories` array | Fall back to empty — no category relationships |
| Posts without `author` in relationships | No specialist link — standalone post |
| `category` text field still present | Ignored by graph, kept for display if needed |
| Blog listing filters | Continue using frontmatter text values — no change to catalog block |

## Layout

Blog posts use a simple layout: hero block + markdown body. No sidebar, no complex block system. The existing rendering pipeline handles this already.

## Files to Modify

| File | Change |
|------|--------|
| `core/src/main.py` | Add blog-post entity loading, graph integration |
| `themes/vividigit/templates/blocks/cards/blog-post-card.html` | New card template for related-entities |
| `sites/vividigit/content/blog/how-ai-chooses-sources/how-ai-chooses-sources.en.md` | Update frontmatter to entity slugs |
| `public/data/blog.json` | Will be regenerated with new fields |
