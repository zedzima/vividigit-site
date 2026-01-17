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


if __name__ == "__main__":
    print("CMS Server starting...")
    print(f"Content: {CONTENT_DIR}")
    print(f"Templates: {TEMPLATES_DIR}")
    print("Open http://localhost:5000")
    app.run(debug=True, port=5000)
