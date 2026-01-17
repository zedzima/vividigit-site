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


@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files from public/css/."""
    return send_from_directory(str(BASE_DIR / "public" / "css"), filename)


@app.route('/vividigit-site/')
@app.route('/vividigit-site/<path:filename>')
def serve_vividigit(filename=''):
    """Serve files with /vividigit-site/ prefix (for GitHub Pages base href)."""
    public_dir = BASE_DIR / "public"

    if filename == '':
        filename = 'index.html'
    else:
        file_path = public_dir / filename
        if file_path.is_dir():
            filename = f"{filename}/index.html"

    return send_from_directory(str(public_dir), filename)


@app.route('/public/')
@app.route('/public/<path:filename>')
def serve_public(filename=''):
    """Serve public files for preview."""
    public_dir = BASE_DIR / "public"

    # Handle directory requests - serve index.html
    if filename == '':
        filename = 'index.html'
    else:
        file_path = public_dir / filename
        if file_path.is_dir():
            filename = f"{filename}/index.html"

    return send_from_directory(str(public_dir), filename)


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


if __name__ == "__main__":
    print("CMS Server starting...")
    print(f"Content: {CONTENT_DIR}")
    print(f"Templates: {TEMPLATES_DIR}")
    print("Open http://localhost:5000")
    app.run(debug=True, port=5000)
