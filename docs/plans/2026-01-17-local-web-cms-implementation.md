# Local Web CMS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build localhost web interface for editing CMS content through forms instead of raw TOML.

**Architecture:** Flask server reads/writes TOML files, generates forms from demo block structures, uses existing generator for preview/build.

**Tech Stack:** Python 3, Flask, Jinja2, tomli_w (TOML writing), vanilla JS

---

## Task 1: Project Setup

**Files:**
- Create: `requirements-cms.txt`
- Modify: `.gitignore`

**Step 1: Create requirements file**

```txt
flask>=3.0.0
tomli_w>=1.0.0
```

**Step 2: Install dependencies**

Run: `cd "/Users/dima/Work AI/CMS" && .venv/bin/pip install flask tomli_w`

Expected: Successfully installed flask, tomli_w

**Step 3: Update .gitignore**

Add to `.gitignore`:
```
# CMS temp files
.cms_temp/
```

**Step 4: Commit**

```bash
git add requirements-cms.txt .gitignore
git commit -m "chore: add CMS server dependencies"
```

---

## Task 2: TOML Writer Utility

**Files:**
- Create: `src/toml_writer.py`

**Step 1: Create TOML writer module**

```python
"""
TOML Writer - Serialize Python dicts to TOML format.
Preserves structure for CMS content files.
"""

import tomli_w
from typing import Dict, Any
from pathlib import Path


def save_toml(data: Dict[str, Any], filepath: str) -> None:
    """
    Save dictionary to TOML file.

    Args:
        data: Dictionary to save
        filepath: Path to output file
    """
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "wb") as f:
        tomli_w.dump(data, f)


def dict_to_toml_string(data: Dict[str, Any]) -> str:
    """Convert dictionary to TOML string."""
    return tomli_w.dumps(data)
```

**Step 2: Test manually**

Run: `cd "/Users/dima/Work AI/CMS" && .venv/bin/python -c "from src.toml_writer import dict_to_toml_string; print(dict_to_toml_string({'meta': {'title': 'Test'}, 'hero': {'h1': 'Hello'}}))"`

Expected: Valid TOML output

**Step 3: Commit**

```bash
git add src/toml_writer.py
git commit -m "feat: add TOML writer utility"
```

---

## Task 3: CMS Server Core

**Files:**
- Create: `src/cms_server.py`

**Step 1: Create Flask server with basic routes**

```python
"""
CMS Server - Local web interface for content management.
Run: python src/cms_server.py
Open: http://localhost:5000
"""

import os
import sys
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, jsonify

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from parser import load_file
from toml_writer import save_toml

# Directories
BASE_DIR = Path(__file__).parent.parent
CONTENT_DIR = BASE_DIR / "content"
TEMPLATES_DIR = BASE_DIR / "templates"
BLOCKS_DIR = TEMPLATES_DIR / "blocks"
BLOCKS_CONTENT_DIR = CONTENT_DIR / "blocks"
ASSETS_DIR = BASE_DIR / "assets"

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates" / "cms"),
    static_folder=str(BASE_DIR / "static" / "cms")
)

# Configuration
LANG = "en"


def get_all_pages() -> list:
    """Get list of all content pages."""
    pages = []

    for root, dirs, files in os.walk(CONTENT_DIR):
        # Skip system directories
        dirs[:] = [d for d in dirs if not d.startswith('_') and not d.startswith('.')]

        for filename in files:
            if f".{LANG}." not in filename:
                continue
            if filename.endswith('.toml') or filename.endswith('.md'):
                filepath = Path(root) / filename
                rel_path = filepath.relative_to(CONTENT_DIR)

                # Derive URL
                parts = rel_path.parts[:-1]  # Remove filename
                if len(parts) == 0:
                    # Root file like home.en.toml
                    name = filename.split('.')[0]
                    url = "/" if name == "home" else f"/{name}"
                else:
                    url = "/" + "/".join(parts)

                # Load to get title
                try:
                    data = load_file(str(filepath))
                    title = data.get("meta", {}).get("title", url)
                except:
                    title = url

                pages.append({
                    "url": url,
                    "title": title,
                    "filepath": str(filepath),
                    "filename": filename
                })

    # Sort by URL
    pages.sort(key=lambda x: x["url"])
    return pages


def get_available_blocks() -> list:
    """Get list of available block types from templates."""
    blocks = []
    if BLOCKS_DIR.exists():
        for f in BLOCKS_DIR.iterdir():
            if f.suffix == '.html':
                block_name = f.stem
                # Get description from demo if exists
                demo_path = BLOCKS_CONTENT_DIR / block_name / f"{block_name}.{LANG}.toml"
                description = ""
                if demo_path.exists():
                    try:
                        data = load_file(str(demo_path))
                        description = data.get("meta", {}).get("description", "")
                    except:
                        pass

                blocks.append({
                    "name": block_name,
                    "description": description
                })

    blocks.sort(key=lambda x: x["name"])
    return blocks


@app.route("/")
def index():
    """Dashboard - list all pages."""
    pages = get_all_pages()
    return render_template("index.html", pages=pages)


@app.route("/pages/edit/<path:page_path>")
def edit_page(page_path):
    """Edit page form."""
    # Find the file
    if page_path == "home":
        filepath = CONTENT_DIR / f"home.{LANG}.toml"
    else:
        filepath = CONTENT_DIR / page_path / f"{page_path.split('/')[-1]}.{LANG}.toml"

    if not filepath.exists():
        return f"Page not found: {filepath}", 404

    data = load_file(str(filepath))
    blocks = get_available_blocks()
    pages = get_all_pages()  # For link selector

    return render_template(
        "editor.html",
        page_path=page_path,
        data=data,
        available_blocks=blocks,
        all_pages=pages,
        filepath=str(filepath)
    )


@app.route("/pages/save/<path:page_path>", methods=["POST"])
def save_page(page_path):
    """Save page changes."""
    # Find the file
    if page_path == "home":
        filepath = CONTENT_DIR / f"home.{LANG}.toml"
    else:
        filepath = CONTENT_DIR / page_path / f"{page_path.split('/')[-1]}.{LANG}.toml"

    # Get JSON data from request
    data = request.get_json()

    # Save to TOML
    save_toml(data, str(filepath))

    return jsonify({"success": True, "message": "Saved"})


@app.route("/blocks")
def blocks_library():
    """Show available blocks."""
    blocks = get_available_blocks()
    return render_template("blocks.html", blocks=blocks)


@app.route("/build", methods=["POST"])
def build_site():
    """Run site generator."""
    import subprocess
    result = subprocess.run(
        [sys.executable, "src/main.py"],
        cwd=str(BASE_DIR),
        capture_output=True,
        text=True
    )
    return jsonify({
        "success": result.returncode == 0,
        "output": result.stdout,
        "error": result.stderr
    })


if __name__ == "__main__":
    print("CMS Server starting...")
    print(f"Content: {CONTENT_DIR}")
    print(f"Templates: {TEMPLATES_DIR}")
    print("Open http://localhost:5000")
    app.run(debug=True, port=5000)
```

**Step 2: Test server starts**

Run: `cd "/Users/dima/Work AI/CMS" && .venv/bin/python src/cms_server.py &`
Then: `curl http://localhost:5000/ 2>/dev/null | head -5`

Expected: HTML response (will fail with template error - that's OK for now)

**Step 3: Commit**

```bash
git add src/cms_server.py
git commit -m "feat: add CMS server core with basic routes"
```

---

## Task 4: CMS Base Template

**Files:**
- Create: `templates/cms/base.html`

**Step 1: Create base template**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}CMS{% endblock %} — Vividigit</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg: #0f0f0f;
            --bg-card: #1a1a1a;
            --bg-input: #252525;
            --border: #333;
            --text: #e5e5e5;
            --text-muted: #888;
            --accent: #8b5cf6;
            --accent-hover: #7c3aed;
            --success: #22c55e;
            --error: #ef4444;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
        }

        header h1 {
            font-size: 1.25rem;
            font-weight: 600;
        }

        header nav a {
            color: var(--text-muted);
            text-decoration: none;
            margin-left: 1.5rem;
            transition: color 0.2s;
        }

        header nav a:hover,
        header nav a.active {
            color: var(--text);
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
        }

        .btn-primary {
            background: var(--accent);
            color: white;
        }

        .btn-primary:hover {
            background: var(--accent-hover);
        }

        .btn-secondary {
            background: var(--bg-input);
            color: var(--text);
            border: 1px solid var(--border);
        }

        .btn-secondary:hover {
            border-color: var(--text-muted);
        }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }

        input, textarea, select {
            width: 100%;
            padding: 0.75rem;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text);
            font-size: 0.875rem;
        }

        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--accent);
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-muted);
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            opacity: 0;
            transform: translateY(1rem);
            transition: all 0.3s;
            z-index: 1000;
        }

        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }

        .toast.success { background: var(--success); }
        .toast.error { background: var(--error); }
    </style>
    {% block extra_css %}{% endblock %}
</head>
<body>
    <header>
        <h1>CMS Vividigit</h1>
        <nav>
            <a href="{{ url_for('index') }}" class="{% if request.endpoint == 'index' %}active{% endif %}">Pages</a>
            <a href="{{ url_for('blocks_library') }}" class="{% if request.endpoint == 'blocks_library' %}active{% endif %}">Blocks</a>
        </nav>
    </header>

    <main class="container">
        {% block content %}{% endblock %}
    </main>

    <div id="toast" class="toast"></div>

    <script>
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = 'toast ' + type + ' show';
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    </script>
    {% block extra_js %}{% endblock %}
</body>
</html>
```

**Step 2: Commit**

```bash
mkdir -p templates/cms
git add templates/cms/base.html
git commit -m "feat: add CMS base template with dark theme"
```

---

## Task 5: Dashboard Page

**Files:**
- Create: `templates/cms/index.html`

**Step 1: Create dashboard template**

```html
{% extends "base.html" %}

{% block title %}Pages{% endblock %}

{% block content %}
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
    <h2>Pages</h2>
    <div style="display: flex; gap: 1rem;">
        <button class="btn btn-secondary" onclick="buildSite()">Rebuild Site</button>
        <a href="{{ url_for('blocks_library') }}" class="btn btn-primary">+ New Page</a>
    </div>
</div>

<div class="pages-list">
    {% for page in pages %}
    <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <strong style="color: var(--text);">{{ page.title }}</strong>
            <div style="color: var(--text-muted); font-size: 0.875rem;">{{ page.url }}</div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <a href="/pages/edit/{{ page.url[1:] or 'home' }}" class="btn btn-secondary">Edit</a>
            <a href="/public{{ page.url }}" target="_blank" class="btn btn-secondary">View</a>
        </div>
    </div>
    {% endfor %}
</div>

{% if not pages %}
<div class="card" style="text-align: center; color: var(--text-muted);">
    No pages found. Create your first page!
</div>
{% endif %}
{% endblock %}

{% block extra_js %}
<script>
async function buildSite() {
    showToast('Building site...', 'success');

    try {
        const response = await fetch('/build', { method: 'POST' });
        const result = await response.json();

        if (result.success) {
            showToast('Site built successfully!', 'success');
        } else {
            showToast('Build failed: ' + result.error, 'error');
        }
    } catch (err) {
        showToast('Build error: ' + err.message, 'error');
    }
}
</script>
{% endblock %}
```

**Step 2: Test dashboard loads**

Run: `cd "/Users/dima/Work AI/CMS" && .venv/bin/python src/cms_server.py`

Open: http://localhost:5000

Expected: Dark-themed dashboard with list of pages

**Step 3: Commit**

```bash
git add templates/cms/index.html
git commit -m "feat: add CMS dashboard page"
```

---

## Task 6: Page Editor - Basic Structure

**Files:**
- Create: `templates/cms/editor.html`

**Step 1: Create editor template**

```html
{% extends "base.html" %}

{% block title %}Edit: {{ page_path }}{% endblock %}

{% block extra_css %}
<style>
    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .block-section {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
    }

    .block-header:hover {
        background: var(--bg-input);
    }

    .block-name {
        font-weight: 600;
        color: var(--accent);
    }

    .block-content {
        padding: 1.5rem;
    }

    .block-content.collapsed {
        display: none;
    }

    .field-row {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 1rem;
        align-items: start;
        margin-bottom: 1rem;
    }

    .field-label {
        font-size: 0.875rem;
        color: var(--text-muted);
        padding-top: 0.75rem;
    }

    .array-item {
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 0.5rem;
    }

    .array-controls {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
</style>
{% endblock %}

{% block content %}
<div class="editor-header">
    <div>
        <a href="{{ url_for('index') }}" style="color: var(--text-muted); text-decoration: none;">← Back</a>
        <h2 style="margin-top: 0.5rem;">Editing: /{{ page_path }}</h2>
    </div>
    <div style="display: flex; gap: 1rem;">
        <button class="btn btn-secondary" onclick="previewPage()">Preview</button>
        <button class="btn btn-primary" onclick="savePage()">Save</button>
    </div>
</div>

<!-- Meta Section -->
<div class="block-section">
    <div class="block-header" onclick="toggleBlock(this)">
        <span class="block-name">meta</span>
        <span style="color: var(--text-muted);">▼</span>
    </div>
    <div class="block-content" id="block-meta">
        <div class="field-row">
            <label class="field-label">title</label>
            <input type="text" name="meta.title" value="{{ data.meta.title or '' }}">
        </div>
        <div class="field-row">
            <label class="field-label">description</label>
            <textarea name="meta.description" rows="2">{{ data.meta.description or '' }}</textarea>
        </div>
    </div>
</div>

<!-- Content Blocks -->
{% for block in data.blocks %}
<div class="block-section" data-block-type="{{ block.type }}">
    <div class="block-header" onclick="toggleBlock(this)">
        <span class="block-name">{{ block.original_key or block.type }}</span>
        <span style="color: var(--text-muted);">▼</span>
    </div>
    <div class="block-content" id="block-{{ loop.index }}">
        {{ render_block_fields(block.type, block.data, loop.index) }}
    </div>
</div>
{% endfor %}

<!-- Add Block Button -->
<div style="text-align: center; margin-top: 2rem;">
    <button class="btn btn-secondary" onclick="showAddBlock()">+ Add Block</button>
</div>

<!-- Add Block Modal -->
<div id="add-block-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100;">
    <div style="background: var(--bg-card); max-width: 600px; margin: 10vh auto; border-radius: 12px; padding: 2rem;">
        <h3 style="margin-bottom: 1rem;">Add Block</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
            {% for block in available_blocks %}
            <button class="btn btn-secondary" onclick="addBlock('{{ block.name }}')" style="justify-content: flex-start;">
                {{ block.name }}
            </button>
            {% endfor %}
        </div>
        <button class="btn btn-secondary" onclick="hideAddBlock()" style="margin-top: 1rem; width: 100%;">Cancel</button>
    </div>
</div>
{% endblock %}

{% block extra_js %}
<script>
const pageData = {{ data | tojson }};
const pagePath = "{{ page_path }}";
const allPages = {{ all_pages | tojson }};

function toggleBlock(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('collapsed');
    header.querySelector('span:last-child').textContent =
        content.classList.contains('collapsed') ? '▶' : '▼';
}

function collectFormData() {
    const data = {
        config: pageData.config || {},
        meta: {},
        blocks: []
    };

    // Collect meta
    document.querySelectorAll('[name^="meta."]').forEach(input => {
        const key = input.name.replace('meta.', '');
        data.meta[key] = input.value;
    });

    // Collect blocks
    document.querySelectorAll('.block-section[data-block-type]').forEach(section => {
        const blockType = section.dataset.blockType;
        const blockData = {};

        section.querySelectorAll('[name^="block."]').forEach(input => {
            const key = input.name.replace('block.', '');
            blockData[key] = input.value;
        });

        // For now, preserve original block data
        const originalBlock = pageData.blocks.find(b => b.type === blockType);
        if (originalBlock) {
            data[originalBlock.original_key || blockType] = originalBlock.data;
        }
    });

    return data;
}

async function savePage() {
    const data = collectFormData();

    try {
        const response = await fetch('/pages/save/' + pagePath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Saved!', 'success');
        } else {
            showToast('Save failed', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function previewPage() {
    await savePage();

    // Build and open
    const response = await fetch('/build', { method: 'POST' });
    const result = await response.json();

    if (result.success) {
        window.open('/public/' + pagePath, '_blank');
    } else {
        showToast('Build failed', 'error');
    }
}

function showAddBlock() {
    document.getElementById('add-block-modal').style.display = 'block';
}

function hideAddBlock() {
    document.getElementById('add-block-modal').style.display = 'none';
}

function addBlock(blockName) {
    // TODO: Load block schema from demo, add to page
    hideAddBlock();
    showToast('Block adding not yet implemented', 'error');
}
</script>
{% endblock %}
```

**Step 2: Add Jinja helper for rendering fields**

Update `src/cms_server.py` - add before `if __name__`:

```python
@app.template_global()
def render_block_fields(block_type: str, data: dict, index: int) -> str:
    """Render form fields for a block."""
    html = []

    for key, value in data.items():
        field_id = f"block-{index}-{key}"

        if isinstance(value, str):
            if len(value) > 100 or '\n' in value:
                html.append(f'''
                <div class="field-row">
                    <label class="field-label">{key}</label>
                    <textarea name="block.{key}" id="{field_id}" rows="3">{value}</textarea>
                </div>
                ''')
            else:
                html.append(f'''
                <div class="field-row">
                    <label class="field-label">{key}</label>
                    <input type="text" name="block.{key}" id="{field_id}" value="{value}">
                </div>
                ''')
        elif isinstance(value, bool):
            checked = 'checked' if value else ''
            html.append(f'''
            <div class="field-row">
                <label class="field-label">{key}</label>
                <input type="checkbox" name="block.{key}" id="{field_id}" {checked} style="width: auto;">
            </div>
            ''')
        elif isinstance(value, (int, float)):
            html.append(f'''
            <div class="field-row">
                <label class="field-label">{key}</label>
                <input type="number" name="block.{key}" id="{field_id}" value="{value}">
            </div>
            ''')
        elif isinstance(value, list):
            html.append(f'''
            <div class="field-row">
                <label class="field-label">{key}</label>
                <div style="color: var(--text-muted); font-size: 0.875rem;">
                    [{len(value)} items] — array editing coming soon
                </div>
            </div>
            ''')
        elif isinstance(value, dict):
            html.append(f'''
            <div class="field-row">
                <label class="field-label">{key}</label>
                <div style="color: var(--text-muted); font-size: 0.875rem;">
                    {{object}} — nested editing coming soon
                </div>
            </div>
            ''')

    from markupsafe import Markup
    return Markup('\n'.join(html))
```

**Step 3: Test editor loads**

Open: http://localhost:5000/pages/edit/services/ai-optimisation

Expected: Page editor with collapsible blocks and form fields

**Step 4: Commit**

```bash
git add templates/cms/editor.html src/cms_server.py
git commit -m "feat: add page editor with basic form fields"
```

---

## Task 7: Blocks Library Page

**Files:**
- Create: `templates/cms/blocks.html`

**Step 1: Create blocks library template**

```html
{% extends "base.html" %}

{% block title %}Blocks Library{% endblock %}

{% block content %}
<div style="margin-bottom: 2rem;">
    <h2>Blocks Library</h2>
    <p style="color: var(--text-muted);">Available blocks for building pages</p>
</div>

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
    {% for block in blocks %}
    <div class="card">
        <h3 style="color: var(--accent); margin-bottom: 0.5rem;">{{ block.name }}</h3>
        <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">
            {{ block.description or 'No description' }}
        </p>
        <a href="/public/blocks/{{ block.name }}/" target="_blank" class="btn btn-secondary" style="width: 100%; justify-content: center;">
            View Demo
        </a>
    </div>
    {% endfor %}
</div>
{% endblock %}
```

**Step 2: Commit**

```bash
git add templates/cms/blocks.html
git commit -m "feat: add blocks library page"
```

---

## Task 8: New Page Creation

**Files:**
- Modify: `src/cms_server.py`
- Create: `templates/cms/new_page.html`

**Step 1: Add routes to cms_server.py**

Add these routes:

```python
@app.route("/pages/new")
def new_page():
    """Create new page form."""
    blocks = get_available_blocks()
    pages = get_all_pages()
    return render_template("new_page.html", blocks=blocks, pages=pages)


@app.route("/pages/create", methods=["POST"])
def create_page():
    """Create new page from selected blocks."""
    data = request.get_json()

    url_path = data.get("url", "").strip("/")
    title = data.get("title", "New Page")
    selected_blocks = data.get("blocks", [])

    if not url_path:
        return jsonify({"success": False, "error": "URL is required"})

    # Determine file path
    parts = url_path.split("/")
    if len(parts) == 1:
        # Root level page
        filepath = CONTENT_DIR / f"{url_path}.{LANG}.toml"
    else:
        # Nested page
        dir_path = CONTENT_DIR / "/".join(parts)
        dir_path.mkdir(parents=True, exist_ok=True)
        filepath = dir_path / f"{parts[-1]}.{LANG}.toml"

    if filepath.exists():
        return jsonify({"success": False, "error": "Page already exists"})

    # Build page data
    page_data = {
        "config": {
            "lang": LANG,
            "url": f"/{url_path}",
            "menu": title
        },
        "meta": {
            "title": title,
            "description": ""
        }
    }

    # Add selected blocks with placeholder content
    for block_name in selected_blocks:
        demo_path = BLOCKS_CONTENT_DIR / block_name / f"{block_name}.{LANG}.toml"
        if demo_path.exists():
            try:
                demo_data = load_file(str(demo_path))
                # Get first block from demo
                for key, value in demo_data.items():
                    if key not in ("config", "meta", "stats", "changes", "translations", "blocks", "sidebar"):
                        page_data[block_name] = value
                        break
            except:
                page_data[block_name] = {"title": f"{block_name} title"}
        else:
            page_data[block_name] = {"title": f"{block_name} title"}

    # Save file
    save_toml(page_data, str(filepath))

    return jsonify({"success": True, "url": f"/pages/edit/{url_path}"})
```

**Step 2: Create new page template**

```html
{% extends "base.html" %}

{% block title %}New Page{% endblock %}

{% block content %}
<div style="margin-bottom: 2rem;">
    <a href="{{ url_for('index') }}" style="color: var(--text-muted); text-decoration: none;">← Back</a>
    <h2 style="margin-top: 0.5rem;">Create New Page</h2>
</div>

<div class="card">
    <div class="form-group">
        <label>URL Path</label>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--text-muted);">/</span>
            <input type="text" id="page-url" placeholder="services/new-service">
        </div>
    </div>

    <div class="form-group">
        <label>Page Title</label>
        <input type="text" id="page-title" placeholder="New Service Page">
    </div>
</div>

<div style="margin: 2rem 0 1rem;">
    <h3>Select Blocks</h3>
    <p style="color: var(--text-muted); font-size: 0.875rem;">Choose which blocks to include</p>
</div>

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
    {% for block in blocks %}
    <label class="card" style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; margin: 0; padding: 1rem;">
        <input type="checkbox" name="blocks" value="{{ block.name }}" style="width: auto;">
        <span>{{ block.name }}</span>
    </label>
    {% endfor %}
</div>

<div style="margin-top: 2rem;">
    <button class="btn btn-primary" onclick="createPage()">Create Page</button>
</div>
{% endblock %}

{% block extra_js %}
<script>
async function createPage() {
    const url = document.getElementById('page-url').value;
    const title = document.getElementById('page-title').value;
    const blocks = Array.from(document.querySelectorAll('[name="blocks"]:checked'))
        .map(cb => cb.value);

    if (!url) {
        showToast('URL is required', 'error');
        return;
    }

    if (!title) {
        showToast('Title is required', 'error');
        return;
    }

    try {
        const response = await fetch('/pages/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, title, blocks })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Page created!', 'success');
            window.location.href = result.url;
        } else {
            showToast(result.error, 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}
</script>
{% endblock %}
```

**Step 3: Update dashboard link**

In `templates/cms/index.html`, change the "+ New Page" link:

```html
<a href="{{ url_for('new_page') }}" class="btn btn-primary">+ New Page</a>
```

**Step 4: Test page creation**

1. Open http://localhost:5000
2. Click "+ New Page"
3. Fill URL: `test-page`, Title: `Test Page`
4. Select hero, features blocks
5. Click Create

Expected: Page created, redirected to editor

**Step 5: Commit**

```bash
git add src/cms_server.py templates/cms/new_page.html templates/cms/index.html
git commit -m "feat: add new page creation with block selection"
```

---

## Task 9: Media Library

**Files:**
- Modify: `src/cms_server.py`
- Create: `templates/cms/media.html`

**Step 1: Add media routes**

```python
@app.route("/media")
def media_library():
    """Media library page."""
    media_files = []

    if ASSETS_DIR.exists():
        for root, dirs, files in os.walk(ASSETS_DIR):
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for filename in files:
                if filename.startswith('.'):
                    continue

                filepath = Path(root) / filename
                rel_path = filepath.relative_to(ASSETS_DIR)

                media_files.append({
                    "path": str(rel_path),
                    "name": filename,
                    "folder": str(rel_path.parent) if str(rel_path.parent) != '.' else '',
                    "url": f"/assets/{rel_path}"
                })

    # Group by folder
    folders = {}
    for f in media_files:
        folder = f["folder"] or "root"
        if folder not in folders:
            folders[folder] = []
        folders[folder].append(f)

    return render_template("media.html", folders=folders)


@app.route("/media/upload", methods=["POST"])
def upload_media():
    """Upload media file."""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file"})

    file = request.files['file']
    folder = request.form.get('folder', 'images/site')

    if file.filename == '':
        return jsonify({"success": False, "error": "No filename"})

    # Secure filename
    from werkzeug.utils import secure_filename
    filename = secure_filename(file.filename)

    # Save file
    save_path = ASSETS_DIR / folder / filename
    save_path.parent.mkdir(parents=True, exist_ok=True)
    file.save(str(save_path))

    return jsonify({"success": True, "path": f"/assets/{folder}/{filename}"})
```

**Step 2: Create media template**

```html
{% extends "base.html" %}

{% block title %}Media Library{% endblock %}

{% block content %}
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
    <h2>Media Library</h2>
    <button class="btn btn-primary" onclick="document.getElementById('file-input').click()">
        Upload File
    </button>
    <input type="file" id="file-input" style="display: none;" onchange="uploadFile(this)">
</div>

{% for folder, files in folders.items() %}
<div class="card" style="margin-bottom: 1rem;">
    <h3 style="margin-bottom: 1rem; color: var(--text-muted);">
        📁 {{ folder if folder != 'root' else 'Root' }}
    </h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
        {% for file in files %}
        <div style="text-align: center;">
            {% if file.name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')) %}
            <img src="{{ file.url }}" alt="{{ file.name }}"
                 style="max-width: 100%; max-height: 100px; border-radius: 4px; background: var(--bg);">
            {% else %}
            <div style="height: 100px; display: flex; align-items: center; justify-content: center;
                        background: var(--bg); border-radius: 4px; color: var(--text-muted);">
                📄
            </div>
            {% endif %}
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ file.name }}
            </div>
        </div>
        {% endfor %}
    </div>
</div>
{% endfor %}

{% if not folders %}
<div class="card" style="text-align: center; color: var(--text-muted);">
    No media files. Upload some!
</div>
{% endif %}
{% endblock %}

{% block extra_js %}
<script>
async function uploadFile(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'images/site');

    try {
        const response = await fetch('/media/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showToast('Uploaded!', 'success');
            location.reload();
        } else {
            showToast(result.error, 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }

    input.value = '';
}
</script>
{% endblock %}
```

**Step 3: Add nav link**

Update `templates/cms/base.html` nav:

```html
<nav>
    <a href="{{ url_for('index') }}" class="{% if request.endpoint == 'index' %}active{% endif %}">Pages</a>
    <a href="{{ url_for('blocks_library') }}" class="{% if request.endpoint == 'blocks_library' %}active{% endif %}">Blocks</a>
    <a href="{{ url_for('media_library') }}" class="{% if request.endpoint == 'media_library' %}active{% endif %}">Media</a>
</nav>
```

**Step 4: Commit**

```bash
git add src/cms_server.py templates/cms/media.html templates/cms/base.html
git commit -m "feat: add media library with upload"
```

---

## Task 10: Static Files Setup

**Files:**
- Modify: `src/cms_server.py`

**Step 1: Add static file serving for assets**

Add route to serve assets in development:

```python
from flask import send_from_directory

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets in development."""
    return send_from_directory(str(ASSETS_DIR), filename)


@app.route('/public/<path:filename>')
def serve_public(filename):
    """Serve public files for preview."""
    return send_from_directory(str(BASE_DIR / "public"), filename)
```

**Step 2: Commit**

```bash
git add src/cms_server.py
git commit -m "feat: add static file serving for preview"
```

---

## Task 11: Final Integration Test

**Step 1: Start server**

```bash
cd "/Users/dima/Work AI/CMS"
.venv/bin/python src/cms_server.py
```

**Step 2: Test workflow**

1. Open http://localhost:5000
2. Click "+ New Page"
3. Create page: URL `demo`, Title `Demo Page`, select hero + faq
4. Edit the page, change title
5. Click Save
6. Click Preview
7. Verify page opens in new tab

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete local web CMS MVP

- Dashboard with page list
- Page editor with form fields
- New page creation with block selection
- Media library with upload
- Build and preview integration"
```

---

## Summary

**Created files:**
- `requirements-cms.txt` — dependencies
- `src/toml_writer.py` — TOML serialization
- `src/cms_server.py` — Flask server (~200 lines)
- `templates/cms/base.html` — base layout
- `templates/cms/index.html` — dashboard
- `templates/cms/editor.html` — page editor
- `templates/cms/new_page.html` — page creation
- `templates/cms/blocks.html` — blocks library
- `templates/cms/media.html` — media library

**Commands:**
- Start: `.venv/bin/python src/cms_server.py`
- Open: http://localhost:5000

**Future improvements (post-MVP):**
- Array/object field editing in editor
- Drag-drop block reordering
- Link selector dropdown
- Git publish button
- Image picker in editor
