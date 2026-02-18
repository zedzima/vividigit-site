"""
CMS Server - Local web interface for content management.
Run: python src/cms_server.py
Open: http://localhost:5000
"""

import os
import sys
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory

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


@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets in development."""
    return send_from_directory(str(ASSETS_DIR), filename)


@app.route('/<path:filename>')
def serve_site(filename):
    """Serve site from public/ at root (like production)."""
    public_dir = BASE_DIR / "public"

    # Handle directory requests - serve index.html
    file_path = public_dir / filename
    if file_path.is_dir():
        filename = f"{filename}/index.html"

    return send_from_directory(str(public_dir), filename)


@app.route('/')
def serve_site_root():
    """Serve site root."""
    return send_from_directory(str(BASE_DIR / "public"), 'index.html')


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


@app.route("/admin")
@app.route("/admin/")
def admin_index():
    """Dashboard - list all pages."""
    pages = get_all_pages()
    return render_template("index.html", pages=pages)


@app.route("/admin/pages/edit/<path:page_path>")
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


@app.route("/admin/pages/save/<path:page_path>", methods=["POST"])
def save_page(page_path):
    """Save page changes, merging with original file to preserve unedited fields."""
    # Find the file
    if page_path == "home":
        filepath = CONTENT_DIR / f"home.{LANG}.toml"
    else:
        filepath = CONTENT_DIR / page_path / f"{page_path.split('/')[-1]}.{LANG}.toml"

    # Get JSON data from request
    incoming = request.get_json()

    # Load original raw TOML (not parsed through process_content)
    # to preserve all fields including those not shown in editor
    original = {}
    if filepath.exists():
        import tomllib
        with open(filepath, "rb") as f:
            original = tomllib.load(f)

    # Deep merge: incoming values override original, but original fields
    # not present in incoming are preserved
    merged = _deep_merge(original, incoming)

    # Save to TOML
    save_toml(merged, str(filepath))

    return jsonify({"success": True, "message": "Saved"})


def _deep_merge(base: dict, override: dict) -> dict:
    """Recursively merge override into base. Override values win."""
    result = dict(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


@app.route("/admin/blocks")
def blocks_library():
    """Show available blocks."""
    blocks = get_available_blocks()
    return render_template("blocks.html", blocks=blocks)


@app.route("/admin/build", methods=["POST"])
def build_site():
    """Run site generator with --local flag."""
    import subprocess
    result = subprocess.run(
        [sys.executable, "src/main.py", "--local"],
        cwd=str(BASE_DIR),
        capture_output=True,
        text=True
    )
    return jsonify({
        "success": result.returncode == 0,
        "output": result.stdout,
        "error": result.stderr
    })


@app.route("/admin/media")
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


@app.route("/admin/media/upload", methods=["POST"])
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


def _escape(text):
    """Escape HTML entities in text for safe rendering in attributes/content."""
    if not isinstance(text, str):
        return str(text)
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def _render_field(key: str, value, prefix: str = "block") -> str:
    """Render a single form field. Recursive for nested structures."""
    field_name = f"{prefix}.{key}"

    # Markdown fields get special editor
    markdown_keys = {"body", "content", "answer", "description_md"}

    if isinstance(value, bool):
        checked = 'checked' if value else ''
        return f'''<div class="field-row">
            <label class="field-label">{_escape(key)}</label>
            <input type="checkbox" name="{field_name}" data-type="bool" {checked} class="cms-checkbox">
        </div>'''

    if isinstance(value, (int, float)):
        return f'''<div class="field-row">
            <label class="field-label">{_escape(key)}</label>
            <input type="number" name="{field_name}" data-type="number" value="{value}" step="any">
        </div>'''

    if isinstance(value, str):
        if key in markdown_keys:
            return f'''<div class="field-row markdown-editor">
                <label class="field-label">{_escape(key)} <span class="cms-field-hint">markdown</span></label>
                <div class="md-tabs">
                    <button type="button" class="md-tab active" onclick="mdTab(this,'edit')">Edit</button>
                    <button type="button" class="md-tab" onclick="mdTab(this,'preview')">Preview</button>
                </div>
                <textarea name="{field_name}" rows="8" class="md-textarea">{_escape(value)}</textarea>
                <div class="md-preview cms-hidden"></div>
            </div>'''
        if len(value) > 100 or '\n' in value:
            return f'''<div class="field-row">
                <label class="field-label">{_escape(key)}</label>
                <textarea name="{field_name}" rows="3">{_escape(value)}</textarea>
            </div>'''
        return f'''<div class="field-row">
            <label class="field-label">{_escape(key)}</label>
            <input type="text" name="{field_name}" value="{_escape(value)}">
        </div>'''

    if isinstance(value, list):
        items_html = []
        if all(isinstance(item, str) for item in value):
            # String array
            for i, item in enumerate(value):
                items_html.append(f'''<div class="array-item" data-index="{i}">
                    <input type="text" name="{field_name}[{i}]" value="{_escape(item)}">
                    <button type="button" class="btn-remove-item" onclick="removeArrayItem(this)" title="Remove">&times;</button>
                </div>''')
            return f'''<div class="field-row">
                <label class="field-label">{_escape(key)} <span class="cms-field-hint">[{len(value)} items]</span></label>
                <div class="array-editor" data-field="{field_name}" data-item-type="string">
                    {''.join(items_html)}
                    <button type="button" class="btn-add-item" onclick="addStringItem(this)">+ Add item</button>
                </div>
            </div>'''

        if all(isinstance(item, dict) for item in value):
            # Object array
            for i, item in enumerate(value):
                fields_html = []
                for sub_key, sub_value in item.items():
                    fields_html.append(_render_field(sub_key, sub_value, f"{field_name}[{i}]"))
                items_html.append(f'''<details class="array-item-obj" data-index="{i}">
                    <summary>{_escape(item.get('title', item.get('name', item.get('label', item.get('slug', item.get('question', item.get('value', f'Item {i+1}')))))))}
                        <button type="button" class="btn-remove-item" onclick="event.stopPropagation();removeArrayItem(this.closest('.array-item-obj'))" title="Remove">&times;</button>
                    </summary>
                    <div class="array-item-fields">{''.join(fields_html)}</div>
                </details>''')
            return f'''<div class="field-row">
                <label class="field-label">{_escape(key)} <span class="cms-field-hint">[{len(value)} items]</span></label>
                <div class="array-editor" data-field="{field_name}" data-item-type="object">
                    {''.join(items_html)}
                    <button type="button" class="btn-add-item" onclick="addObjectItem(this)">+ Add item</button>
                </div>
            </div>'''

        # Mixed array — show as JSON
        import json
        return f'''<div class="field-row">
            <label class="field-label">{_escape(key)} <span class="cms-field-hint">mixed array</span></label>
            <textarea name="{field_name}" data-type="json" rows="4">{_escape(json.dumps(value, indent=2, ensure_ascii=False))}</textarea>
        </div>'''

    if isinstance(value, dict):
        fields_html = []
        for sub_key, sub_value in value.items():
            fields_html.append(_render_field(sub_key, sub_value, field_name))
        return f'''<div class="field-row nested-editor">
            <label class="field-label">{_escape(key)}</label>
            <div class="nested-fields">{''.join(fields_html)}</div>
        </div>'''

    return ''


@app.template_global()
def render_block_fields(block_type: str, data: dict, index: int) -> str:
    """Render form fields for a block."""
    html = []
    for key, value in data.items():
        html.append(_render_field(key, value, "block"))

    from markupsafe import Markup
    return Markup('\n'.join(html))


@app.template_global()
def render_section_fields(section_name: str, data) -> str:
    """Render form fields for a system section (meta, sidebar, tags, etc.)."""
    if not isinstance(data, dict):
        return ''
    html = []
    for key, value in data.items():
        html.append(_render_field(key, value, section_name))

    from markupsafe import Markup
    return Markup('\n'.join(html))


@app.route("/admin/blocks/demo/<block_name>")
def get_block_demo(block_name):
    """Return demo data for a block type."""
    demo_path = BLOCKS_CONTENT_DIR / block_name / f"{block_name}.{LANG}.toml"
    if demo_path.exists():
        try:
            data = load_file(str(demo_path))
            for block in data.get("blocks", []):
                return jsonify(block.get("data", {}))
        except Exception:
            pass
    return jsonify({"title": f"New {block_name}"})


@app.route("/admin/pages/new")
def new_page():
    """Create new page form."""
    blocks = get_available_blocks()
    pages = get_all_pages()
    return render_template("new_page.html", blocks=blocks, pages=pages)


@app.route("/admin/pages/create", methods=["POST"])
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

    return jsonify({"success": True, "url": f"/admin/pages/edit/{url_path}"})


if __name__ == "__main__":
    print("CMS Server starting...")
    print(f"Content: {CONTENT_DIR}")
    print(f"Templates: {TEMPLATES_DIR}")
    print("Site:  http://127.0.0.1:5001/")
    print("Admin: http://127.0.0.1:5001/admin")
    app.run(debug=True, port=5001)
