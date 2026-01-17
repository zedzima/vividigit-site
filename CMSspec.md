# File-Based Headless CMS — Unified Content, Assets, and Build Specification (TOML)

This document defines the complete and authoritative specification for a file-based headless CMS.

The CMS is designed around a strict separation of concerns:
content defines meaning, templates define presentation, folders define structure.
The system is deterministic, design-first, and safe for human editors and AI agents.

If a rule is not explicitly defined in this document, it must be considered unsupported.

---

## The CMS is based on the following core assumptions.

The site consists of a finite, predefined library of designed HTML block templates and layouts.
Pages are assembled by composing these blocks using structured content data.
Content authors and AI agents never modify layout, styling, or rendering logic.

---

## A page is defined by a directory inside the `content/` folder.

The directory path directly maps to the page URL.
Nested directories represent nested URLs.
There are no index files.
Each page explicitly owns its content via language-specific TOML files.

Example mapping:
- `content/services/` → `/services`
- `content/services/seo/` → `/services/seo`

---

## The `content/` directory defines the complete site structure and navigation hierarchy.

Folder names define URL segments and menu hierarchy.
This structure is shared across all languages and never duplicated per language.

Each page directory contains one or more language-specific content files.

Example structure:

content/
    services/
        services.en.toml
        services.de.toml
        seo/
            seo.en.toml
            seo.de.toml

---

## Languages are represented by file suffixes.

Rules:
- One file represents one page in one language.
- File naming pattern is `<page>.<lang>.toml`.
- Language codes are normalized short codes such as `en`, `de`, `fr`.
- There are no language-specific folders.

During build, only files matching the active language are processed.
All other language files are ignored.

Each language build is deployed independently, typically to its own subdomain
(e.g. `en.example.com`, `de.example.com`).

---

Each content file may contain the following system sections:
`config`, `meta`, `stats`, `changes`.

All other top-level sections are treated as content blocks.

System sections have fixed meaning and must not be renamed.

---

## The `config` section defines page-level system configuration.

It is never translated and never affects layout or rendering.

It may contain:
- language identifier (must match file suffix),
- routing or menu flags,
- versioning and timestamps,
- editor identifiers.

---

## The `meta` section defines SEO metadata.

Rules:
- Plain strings or arrays of plain strings only.
- No formatting or structure.
- Translated per language.
- Used only for metadata generation.

---

## Any top-level section that is not a system section is a content block.

A content block:
- is identified by its section name,
- maps one-to-one to an HTML block template with the same name,
- is rendered in the order it appears in the file.

Block identifiers are stable and shared across all languages.
Block identifiers must exactly match existing HTML templates.

If a content block has no corresponding template, the build must fail.

---

## Layouts are predefined and controlled exclusively by code.

Typical layout elements include:
- header,
- global navigation,
- sidebars,
- footer.

Layouts define where content blocks are rendered.
Content files never define or influence layout structure.

---

## Content blocks store structured data only.

Allowed data patterns include:
- plain strings for headings and labels,
- arrays of strings for paragraphs,
- arrays of strings for simple lists,
- structured objects for nested lists and steps,
- structured objects for links,
- structured objects for images,
- structured arrays for tables.

Inline markup, styling, or layout logic is not part of the contract.

Visual hierarchy, typography, and interaction are defined by templates.

---

## Text values may contain placeholder tokens.

Placeholders:
- are immutable,
- must not be translated or altered,
- are replaced at render time.

AI agents must preserve placeholder syntax exactly.

---

## Links are stored as structured objects.

Rules:
- Each link has a human-readable label and a target.
- Internal links reference semantic paths or anchors.
- External links use absolute URLs.
- Links are not embedded inline inside text values.

---

## Images are represented semantically.

Rules:
- Content files store meaning only (alt text, captions).
- Image sources, formats, sizes, and loading behavior are defined in templates.
- Content files never reference rendering parameters.

---

## Tables are represented as structured data.

Rules:
- Headers are defined explicitly.
- Rows are arrays of values.
- Tables contain no presentation logic.

---

## All non-text resources are stored separately from content.

Assets include:
- images,
- data files,
- page-specific scripts,
- other static resources.

Assets are stored in the `assets/` directory.

---

## The `assets/` directory mirrors the structure of `content/`.

Example:

assets/
    services/
        hero.jpg
        services.js
        seo/
            diagram.png

Rules:
- Assets for a page live in the folder matching the page path.
- Assets are shared across all languages.
- Templates resolve asset paths based on page directory.

---

## Navigation and menus are derived from the directory structure under `content/`.

Rules:
- Folder hierarchy defines navigation hierarchy.
- Menu labels are taken from language-specific content files.
- Pages without a content file for the active language are excluded.

Content files do not define menu structure or layout.

---

## Collections group similar content items under a shared parent.

A collection is a directory inside `content/` that contains multiple child pages of the same type.

Example collections:
- `content/blog/` — blog articles
- `content/services/` — service offerings

Rules:
- A collection directory may have its own content file (e.g., `blog.en.toml`) for the listing page.
- Each child directory represents one collection item.
- All items in a collection share the same layout and block structure.
- Collections are used to generate listing pages, filters, and JSON indexes.

Example structure:

```
content/
    blog/
        blog.en.toml              # listing page
        how-ai-works/
            how-ai-works.en.toml  # article
        seo-trends/
            seo-trends.en.toml    # article
    services/
        services.en.toml          # listing page
        seo/
            seo.en.toml           # service
        ppc/
            ppc.en.toml           # service
```

---

## Collection items are automatically indexed.

During build, each collection generates a JSON index file.

The index contains:
- item URLs,
- titles,
- descriptions,
- tags and categories,
- other filterable metadata.

This index is used for client-side filtering and search.

JSON files are output to `public/data/<collection>.json`.

---

## All language variants of a page must share:
- identical block identifiers,
- identical structure,
- identical data shapes.

Only values differ between languages.

If structure differs between language files, the build must fail.

---

## The build process for a given language is deterministic.

Build steps:
1. Scan the `content/` directory tree.
2. Select only files matching the active language suffix.
3. Validate block templates and demos (warn if templates lack demos).
4. Resolve page URLs from directory structure.
5. For each page:
   - load content blocks,
   - validate that each block has a corresponding template,
   - match blocks to templates,
   - render blocks,
   - inject blocks into layout.
6. Resolve assets from the mirrored `assets/` directory.
7. Output the built site for the active language.

No runtime decisions are made based on content structure.

---

## The `stats` section stores optional content statistics.

Rules:
- Not used for rendering.
- May be generated automatically.
- May be omitted.

---

## The `changes` section stores a human-readable editorial change log.

Rules:
- Content accountability only.
- Not used for rendering or logic.
- Entries describe what changed and when.

---

## Block templates define the complete contract for content.

Rules:
1. Pages must not contain any data that is not defined in a corresponding block template.
2. Block demo TOML files must include ALL parameters that the template supports.
3. Global styles must be defined only in the global CSS file (`public/css/styles.css`).

Block templates are the source of truth for:
- which fields are allowed,
- which fields are required,
- which fields are optional.

Demo content files in `content/blocks/` serve as complete examples.
Every parameter a block template can render must be present in its demo file.
This ensures:
- templates are fully documented by example,
- content authors see all available options,
- AI agents can reference complete parameter lists.

Inline styles in block templates are allowed only for styles unique to that block.
Any style that could apply to multiple blocks must be in the global CSS.

---

## The build validates block consistency.

Validation runs automatically during build.

Warnings are issued when:
- A block template in `templates/blocks/` has no demo content in `content/blocks/`.

Errors are issued when:
- A content file uses a block that has no corresponding template.

If a content file references a block without a matching template, the build must report an error.
Templates without demo content are allowed but discouraged.

---

## Responsibilities are strictly separated.

Developers:
- define templates and layouts,
- define validation rules,
- control rendering and assets,
- maintain the build pipeline.

Editors and AI agents:
- modify content values only,
- preserve structure and identifiers,
- follow this specification exactly.

---

## The CMS provides a local web interface for content management.

The web interface runs on localhost and provides:
- a dashboard listing all content pages,
- a form-based editor for page content,
- a page builder for creating new pages from block templates,
- a media library for managing assets,
- build and preview functionality.

The web interface does not replace direct file editing.
Content managers may edit TOML files directly or use the web interface.
Both methods produce identical results.

To start the web interface:
```
python src/cms_server.py
```

The interface is available at `http://127.0.0.1:5000/`.
Site preview is available at `http://127.0.0.1:5000/public/`.

---

## Build modes support local development and production deployment.

The build system supports two modes:

Local development:
```
python src/main.py --local
```
Sets `base_url="/"` for local preview.

Production (GitHub Pages):
```
python src/main.py
```
Uses `base_url` from `site.toml` (e.g., `/vividigit-site/`).

The web interface automatically uses local mode for preview.

---

## This CMS does not aim to:
- allow content-driven layout changes,
- embed styling or behavior in content,
- infer missing structure,
- replace version control systems.

---

This document is the single source of truth for content, assets, routing, and build behavior.