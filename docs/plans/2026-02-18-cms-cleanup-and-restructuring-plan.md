# CMS Cleanup & Restructuring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up technical debt (docs, styles, artifacts) then restructure into reusable Core / Theme / Content modules within one repository.

**Architecture:** Two-phase approach. Phase 1 cleans up in-place (docs, CSS consolidation, minor fixes). Phase 2 reorganizes files into `core/`, `themes/vividigit/`, `sites/vividigit/` and refactors hardcoded values into YAML configuration. Each phase is independently deployable.

**Tech Stack:** Python 3 (Jinja2, Flask, tomllib, pyyaml), vanilla CSS/JS, GitHub Pages deployment.

**Design doc:** `docs/plans/2026-02-18-cms-review-and-restructuring-design.md`

---

## Phase 1: Cleanup

### Task 1: Fix .gitignore — unblock docs tracking

**Context:** `docs/` is currently in `.gitignore`, preventing documentation from being version-controlled. This must be fixed first.

**Files:**
- Modify: `.gitignore`

**Step 1: Read current .gitignore**

Read `.gitignore` to understand full ignore rules.

**Step 2: Update .gitignore**

- Remove `docs/` from ignore list
- Add `.DS_Store` to ignore list (if not already there)
- Keep `public/`, `.venv/`, `__pycache__/` ignored

**Step 3: Remove .DS_Store from git tracking**

```bash
git rm -r --cached '*.DS_Store' 2>/dev/null || true
git rm --cached .DS_Store 2>/dev/null || true
```

**Step 4: Commit**

```bash
git add .gitignore
git commit -m "fix: update .gitignore — track docs/, ignore .DS_Store"
```

---

### Task 2: Documentation cleanup

**Context:** One doc is superseded, one has unclear status, port numbers conflict across docs.

**Files:**
- Delete: `docs/services-catalog-design.md` (superseded, contains Russian text)
- Modify: `docs/card-consistency-design.md` (verify status, update or archive)
- Modify: `GUIDE.md` (fix port number)
- Modify: `CMSspec.md` (verify port number)
- Read: `src/cms_server.py` (check actual port)

**Step 1: Check actual CMS server port**

Read `src/cms_server.py` — find the `app.run()` call to determine actual port number.

**Step 2: Delete superseded document**

```bash
rm docs/services-catalog-design.md
```

**Step 3: Review card-consistency-design.md**

Read `docs/card-consistency-design.md`. Check the templates it references (`templates/blocks/services.html`, `templates/blocks/cases.html`, `templates/blocks/process.html`) to determine if the described changes were implemented.

- If implemented: update doc header to mark as "Completed"
- If not implemented: update doc header to mark as "Planned — Not Yet Implemented"

**Step 4: Fix port numbers in docs**

Update `GUIDE.md` and `CMSspec.md` to match the actual port from Step 1.

**Step 5: Add status timestamps to TR.md**

In TR.md section 10 (implementation status), add `Last updated: 2026-02-18` and verify which items are actually completed by checking the codebase.

**Step 6: Organize docs directory**

Move planning documents to `docs/plans/` if not already there:
- `docs/card-consistency-design.md` → `docs/plans/card-consistency-design.md`
- `docs/event-map.md` — keep in `docs/` (reference, not a plan)
- `docs/page-structure.md` — keep in `docs/` (reference, not a plan)
- `docs/service-taxonomy-design.md` — already correct location check

**Step 7: Commit**

```bash
git add -A docs/ GUIDE.md CMSspec.md TR.md
git commit -m "docs: cleanup — remove superseded docs, fix port numbers, add timestamps"
```

---

### Task 3: CSS consolidation — extract block styles

**Context:** 30 block templates have embedded `<style>` sections (50-200 lines each). All must move to `assets/css/styles.css`.

**Files:**
- Modify: `assets/css/styles.css` (append block styles)
- Modify: `templates/blocks/*.html` (remove `<style>` sections from all 30 files)

**Step 1: Inventory all `<style>` blocks**

Search all templates for `<style>` tags:
```bash
grep -rn '<style>' templates/blocks/ | head -40
```

Document the list of files that have embedded styles.

**Step 2: Read current styles.css structure**

Read `assets/css/styles.css` to understand its organization (sections, comment conventions).

**Step 3: Extract styles from each block template**

For each block template in `templates/blocks/`:

1. Read the file
2. Copy the CSS content between `<style>` and `</style>` tags
3. Append to `assets/css/styles.css` with section header:
   ```css
   /* ================================================================
      Block: {block-name}
      ================================================================ */
   ```
4. Remove the `<style>...</style>` block from the template HTML
5. Verify the template still has valid HTML structure

Process blocks in alphabetical order. Do ALL 30 blocks.

**Important:** Some blocks may have multiple `<style>` sections or conditional styles — merge them into one CSS section per block.

**Step 4: Run tests to verify nothing broke**

```bash
cd /Users/Dima/Work\ AI/CMS
.venv/bin/python -m pytest tests/ -v
```

**Step 5: Rebuild site and visually verify**

```bash
.venv/bin/python src/main.py
```

Check that `public/` output still builds correctly.

**Step 6: Commit**

```bash
git add assets/css/styles.css templates/blocks/
git commit -m "refactor: extract all block <style> sections into styles.css"
```

---

### Task 4: Replace inline style attributes with CSS classes

**Context:** ~60 inline `style=""` attributes, mostly in admin UI and base layout. Replace with CSS utility classes.

**Files:**
- Modify: `assets/css/styles.css` (add utility classes if missing)
- Modify: `templates/layouts/base.html`
- Modify: `templates/cms/blocks.html`
- Modify: `templates/cms/editor.html`
- Modify: `templates/cms/media.html`
- Modify: `templates/cms/new_page.html`
- Modify: `templates/cms/index.html`

**Step 1: Verify utility classes exist**

Check if `assets/css/styles.css` already has utility classes:
- `.hidden` (`display: none`)
- `.text-muted` (`color: var(--text-muted)`)
- Spacing utilities (`.mb-sm`, `.mb-md`, `.mb-lg`, `.mb-xl`, `.mb-2xl`)

If missing, add them to the utilities section of `styles.css`.

**Step 2: Replace inline styles in templates**

For each template file:
1. Find all `style="..."` attributes
2. Replace with appropriate CSS class
3. Skip dynamic styles that MUST be inline (JS-driven CSS vars like `--icon-url`)

Common replacements:
- `style="display:none"` → `class="hidden"` (add to existing class if present)
- `style="display: none;"` → `class="hidden"`
- `style="margin-bottom: 2rem"` → `class="mb-2xl"`
- `style="color: var(--text-muted)"` → `class="text-muted"`
- `style="width: 100%"` → check if `.w-full` or `.btn-full` utility exists

**Step 3: Test admin UI**

```bash
.venv/bin/python src/cms_server.py
```

Open `http://127.0.0.1:{port}/` and verify admin pages render correctly.

**Step 4: Commit**

```bash
git add assets/css/styles.css templates/
git commit -m "refactor: replace inline style attributes with CSS utility classes"
```

---

### Task 5: Minor technical fixes

**Files:**
- Check: `public/assets/icons/` vs `assets/icons/` (extra icons)
- Move: `gtm-container-import.json` → `docs/gtm-container-import.json`
- Check: `public/test-icons.html` (remove if test artifact)
- Check: `public/css/styles.css` (remove if duplicate of `public/assets/css/styles.css`)
- Check: `workers/checkout/` (verify if still in use)

**Step 1: Check extra icons**

```bash
diff <(ls assets/icons/ | sort) <(ls public/assets/icons/ | sort)
```

If icons exist in `public/` but not in `assets/`, they're build artifacts. Note them for cleanup — `public/` is regenerated on build so no manual deletion needed. If they keep appearing after build, check `main.py` `copy_assets()` logic.

**Step 2: Move GTM container**

```bash
mv gtm-container-import.json docs/
```

**Step 3: Check test-icons.html**

Read `public/test-icons.html`. If it's a development test page, note that it will be removed when `public/` is rebuilt. If it's generated by `main.py`, find and remove the generation logic.

**Step 4: Check CSS duplication**

```bash
diff public/css/styles.css public/assets/css/styles.css
```

If identical, check `main.py` or build process to see why CSS is output to two locations. Fix the build to output only to `public/assets/css/styles.css`.

**Step 5: Check workers directory**

Read `workers/checkout/wrangler.toml` to understand if the Cloudflare Worker is actively used. Note findings in the commit message.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: move GTM config to docs/, fix build artifacts"
```

---

## Phase 2: Modular Restructuring

### Task 6: Create target directory structure

**Context:** Create `core/`, `themes/vividigit/`, `sites/vividigit/` directories and move files.

**Step 1: Create directories**

```bash
mkdir -p core/src
mkdir -p core/templates/cms
mkdir -p themes/vividigit/templates/layouts
mkdir -p themes/vividigit/templates/blocks
mkdir -p themes/vividigit/assets
mkdir -p sites/vividigit
```

**Step 2: Move CMS core files**

```bash
# Python source
mv src/main.py core/src/
mv src/generator.py core/src/
mv src/parser.py core/src/
mv src/cms_server.py core/src/
mv src/toml_writer.py core/src/

# Admin templates
mv templates/cms/* core/templates/cms/

# Dependencies
mv requirements.txt core/

# Remove empty src/ directory
rmdir src/
```

**Step 3: Move theme files**

```bash
# Templates
mv templates/layouts/base.html themes/vividigit/templates/layouts/
mv templates/blocks/* themes/vividigit/templates/blocks/

# Assets
mv assets/css themes/vividigit/assets/
mv assets/js themes/vividigit/assets/
mv assets/icons themes/vividigit/assets/
mv assets/images themes/vividigit/assets/
mv assets/logos themes/vividigit/assets/

# Remove empty directories
rmdir templates/layouts templates/blocks templates
rmdir assets
```

**Step 4: Move site content**

```bash
# Content
mv content sites/vividigit/

# Site-specific files
mv CNAME sites/vividigit/
mv workers sites/vividigit/
```

**Step 5: Verify structure**

```bash
find core/ themes/ sites/ -type f | head -60
```

Confirm the structure matches the design document.

**Step 6: Commit (snapshot before code changes)**

```bash
git add -A
git commit -m "refactor: reorganize into core/, themes/, sites/ directory structure"
```

---

### Task 7: Create YAML configuration files

**Files:**
- Create: `sites/vividigit/site.yml`
- Create: `themes/vividigit/theme.yml`

**Step 1: Create site.yml**

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

exports:
  language_code_map:
    english: EN
    german: DE
    french: FR
    spanish: ES
    russian: RU
    chinese: ZH
    japanese: JA
    italian: IT
    portuguese: PT
```

**Step 2: Create theme.yml**

```yaml
name: Vividigit Glassmorphism
version: "1.0"
description: Dark glassmorphism theme with neon accents
```

**Step 3: Commit**

```bash
git add sites/vividigit/site.yml themes/vividigit/theme.yml
git commit -m "feat: add YAML configuration for site and theme"
```

---

### Task 8: Refactor main.py — load config and fix paths

**Context:** This is the largest task. Replace hardcoded values with config-driven logic and update all file paths.

**Files:**
- Modify: `core/src/main.py`
- Read: `sites/vividigit/site.yml` (for reference)

**Step 1: Add site config loading**

At the top of `main.py`, add a function to load `site.yml`:

```python
import yaml

def load_site_config(site_name):
    """Load site configuration from sites/{site_name}/site.yml"""
    config_path = os.path.join(PROJECT_ROOT, "sites", site_name, "site.yml")
    with open(config_path) as f:
        return yaml.safe_load(f)
```

Add `--site` CLI argument (alongside existing `--lang`, `--local`, `--all`):

```python
parser.add_argument("--site", default="vividigit", help="Site name (directory in sites/)")
```

**Step 2: Replace NAV_ORDER with config**

Find the hardcoded `NAV_ORDER` list (lines ~177-189). Replace with:

```python
NAV_ORDER = site_config["navigation"]["order"]
```

**Step 3: Update file paths**

Replace hardcoded paths throughout `main.py`:

| Old path | New path |
|----------|----------|
| `content/` | `sites/{site}/content/` |
| `templates/blocks/` | `themes/{theme}/templates/blocks/` |
| `templates/layouts/` | `themes/{theme}/templates/layouts/` |
| `templates/cms/` | `core/templates/cms/` |
| `assets/` | `themes/{theme}/assets/` |

The Generator class in `generator.py` needs its `template_dir` updated to search multiple directories (theme templates first, then core templates).

**Step 4: Replace hardcoded entity checks**

Find all instances of `type == "service"`, `type == "specialist"`, etc. Replace with checks against `site_config["entities"]["types"]`.

For export functions, make them data-driven: iterate over `site_config["entities"]["types"]` instead of calling each export function individually.

**Step 5: Replace hardcoded facet dimensions**

Find `build_tag_index()` and related functions. Replace hardcoded dimension lists with `site_config["facets"]["dimensions"]`.

**Step 6: Replace hardcoded language code map**

Replace the inline `langCodeMap` dict (lines ~687-691) with `site_config["exports"]["language_code_map"]`.

**Step 7: Update generator.py template paths**

Modify `Generator.__init__()` to accept multiple template directories:

```python
from jinja2 import FileSystemLoader, ChoiceLoader

loader = ChoiceLoader([
    FileSystemLoader(theme_template_dir),
    FileSystemLoader(core_template_dir),
])
```

This ensures theme templates override core templates (e.g., admin UI lives in core, block templates in theme).

**Step 8: Run tests**

```bash
cd /Users/Dima/Work\ AI/CMS
.venv/bin/python -m pytest tests/ -v
```

Fix any failures. Tests will likely need path updates too (see Task 9).

**Step 9: Rebuild site**

```bash
.venv/bin/python core/src/main.py --site vividigit
```

Verify `public/` output is identical to pre-refactor output.

**Step 10: Commit**

```bash
git add core/src/main.py core/src/generator.py
git commit -m "refactor: replace hardcoded values with site.yml config, update all paths"
```

---

### Task 9: Update tests

**Files:**
- Modify: `tests/test_main.py`
- Modify: `tests/test_generator.py`
- Modify: `tests/test_parser.py`
- Modify: `tests/test_cms_server.py`
- Modify: `tests/test_links.py`
- Modify: `tests/conftest.py`

**Step 1: Update conftest.py fixtures**

Update temp directory fixtures to create the new directory structure (core/, themes/, sites/) instead of flat structure.

**Step 2: Update test imports**

Change all imports from `src.main` to `core.src.main` (or adjust `sys.path`).

**Step 3: Update path assertions**

Any test that asserts file paths (like `test_links.py`) must use new paths.

**Step 4: Run full test suite**

```bash
.venv/bin/python -m pytest tests/ -v
```

All tests must pass.

**Step 5: Commit**

```bash
git add tests/
git commit -m "test: update tests for new directory structure"
```

---

### Task 10: Update CI/CD and documentation

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `CLAUDE.md`
- Modify: `CMSspec.md`
- Modify: `GUIDE.md`
- Modify: `TR.md`
- Modify: `DESIGN.md`

**Step 1: Update deploy.yml**

Update build command and paths:
- Python command: `python core/src/main.py --site vividigit`
- Requirements: `pip install -r core/requirements.txt`
- Public output directory stays `public/`

**Step 2: Update CLAUDE.md**

Add new directory structure reference. Update build commands. Document the core/theme/content separation.

**Step 3: Update GUIDE.md**

Update all file paths referenced in the editorial guide:
- Content paths: `sites/vividigit/content/...`
- Template paths: `themes/vividigit/templates/blocks/...`
- Asset paths: `themes/vividigit/assets/...`
- Build command: `python core/src/main.py --site vividigit`

**Step 4: Update CMSspec.md**

Update directory structure diagram and all path references.

**Step 5: Update remaining docs**

Scan all .md files for old paths (`src/`, `templates/blocks/`, `assets/`, `content/`) and update to new structure.

**Step 6: Final full build and test**

```bash
.venv/bin/python -m pytest tests/ -v
.venv/bin/python core/src/main.py --site vividigit
```

Both must succeed.

**Step 7: Commit**

```bash
git add -A
git commit -m "docs: update all documentation and CI/CD for new project structure"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `python core/src/main.py --site vividigit` builds successfully
- [ ] `pytest tests/ -v` — all tests pass
- [ ] No `<style>` blocks in `themes/vividigit/templates/blocks/*.html`
- [ ] No inline `style=""` in templates (except dynamic JS-driven ones)
- [ ] `docs/services-catalog-design.md` deleted
- [ ] `.DS_Store` not tracked in git
- [ ] CSS exists only in `themes/vividigit/assets/css/styles.css`
- [ ] `site.yml` and `theme.yml` exist and are valid YAML
- [ ] All docs reference correct paths
- [ ] GitHub Actions deploy.yml uses correct paths
- [ ] Built site output matches pre-refactor output (visual diff)
