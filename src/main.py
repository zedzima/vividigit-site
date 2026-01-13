"""
CMS Build System - Spec Compliant

Directory structure determines URLs:
- content/home.en.toml → /
- content/services/services.en.toml → /services
- content/services/seo/seo.en.toml → /services/seo

Language files: <page>.<lang>.toml (e.g., home.en.toml, home.de.toml)
"""

import os
import sys
import json
import shutil
import tomllib
from pathlib import Path
from typing import Dict, Any, List, Optional
from parser import load_file
from generator import Generator

CONTENT_DIR = "content"
TEMPLATE_DIR = "templates"
OUTPUT_DIR = "public"
ASSETS_DIR = "assets"
GLOBAL_DIR = os.path.join(CONTENT_DIR, "_global")

# Default language for build
DEFAULT_LANG = "en"


def load_site_config() -> dict:
    """Load global site configuration from _global/site.toml."""
    site_config_path = os.path.join(GLOBAL_DIR, "site.toml")
    if os.path.exists(site_config_path):
        with open(site_config_path, "rb") as f:
            return tomllib.load(f)
    return {}


def get_url_from_path(filepath: str, content_dir: str) -> str:
    """
    Derive URL from file path.

    content/home.en.toml → /
    content/services/services.en.toml → /services
    content/services/seo/seo.en.toml → /services/seo
    content/blog/my-post/my-post.en.md → /blog/my-post
    """
    # Get relative path from content dir
    rel_path = os.path.relpath(filepath, content_dir)
    parts = Path(rel_path).parts

    # Get directory part (exclude filename)
    if len(parts) == 1:
        # File in content root (e.g., home.en.toml)
        filename = parts[0]
        page_name = filename.split('.')[0]  # home.en.toml → home
        if page_name == "home" or page_name == "index":
            return "/"
        return f"/{page_name}"
    else:
        # File in subdirectory
        # content/services/seo/seo.en.toml → /services/seo
        dir_path = "/".join(parts[:-1])
        return f"/{dir_path}"


def get_collection_from_path(filepath: str, content_dir: str) -> Optional[str]:
    """
    Determine if file belongs to a collection.

    Collections are top-level directories with nested items.
    content/blog/blog.en.toml → collection: blog (listing page)
    content/blog/post-1/post-1.en.toml → collection: blog (item)
    content/services/services.en.toml → collection: services (listing page)
    content/services/seo/seo.en.toml → collection: services (item)
    """
    rel_path = os.path.relpath(filepath, content_dir)
    parts = Path(rel_path).parts

    if len(parts) >= 2:
        # At least: collection/file.toml (listing) or collection/item/file.toml (item)
        return parts[0]
    return None


def find_content_files(content_dir: str, lang: str) -> List[Dict[str, Any]]:
    """
    Find all content files for a specific language.
    Returns list of {filepath, url, collection, is_listing}
    """
    files = []

    for root, dirs, filenames in os.walk(content_dir):
        # Skip hidden and underscore-prefixed directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and not d.startswith('_')]

        for filename in filenames:
            # Match language-specific files: *.en.toml, *.en.md, etc.
            if f".{lang}." not in filename:
                continue

            filepath = os.path.join(root, filename)
            url = get_url_from_path(filepath, content_dir)
            collection = get_collection_from_path(filepath, content_dir)

            # Determine if this is a collection listing page
            # content/services/services.en.toml is listing, content/services/seo/seo.en.toml is item
            rel_path = os.path.relpath(filepath, content_dir)
            parts = Path(rel_path).parts
            is_listing = len(parts) == 2  # collection/collection.lang.ext

            files.append({
                "filepath": filepath,
                "url": url,
                "collection": collection,
                "is_listing": is_listing
            })

    return files


def build_navigation(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Build navigation tree from parsed pages.
    Returns hierarchical structure for menu rendering.
    """
    nav = []
    collections = {}

    # Define collection order (customize as needed)
    COLLECTION_ORDER = ["blog", "services"]

    for page in pages:
        url = page.get("url", "/")
        menu = page.get("menu", page.get("title", "Untitled"))
        collection = page.get("collection")
        is_listing = page.get("is_listing", False)

        if collection:
            if collection not in collections:
                collections[collection] = {"items": [], "listing": None}

            if is_listing:
                collections[collection]["listing"] = {"url": url, "menu": menu}
            else:
                collections[collection]["items"].append({"url": url, "menu": menu})
        else:
            # Top-level page
            nav.append({"url": url, "menu": menu, "children": []})

    # Add collections to nav in specified order
    # First add collections that are in COLLECTION_ORDER
    for coll_name in COLLECTION_ORDER:
        if coll_name in collections:
            coll_data = collections[coll_name]
            listing = coll_data["listing"]
            if listing:
                nav.append({
                    "url": listing["url"],
                    "menu": listing["menu"],
                    "children": coll_data["items"]
                })

    # Then add any remaining collections not in COLLECTION_ORDER
    for coll_name, coll_data in collections.items():
        if coll_name not in COLLECTION_ORDER:
            listing = coll_data["listing"]
            if listing:
                nav.append({
                    "url": listing["url"],
                    "menu": listing["menu"],
                    "children": coll_data["items"]
                })

    return nav


def copy_assets(assets_dir: str, output_dir: str):
    """
    Copy assets to public directory.

    assets/_shared/* → public/images/
    assets/<path>/* → public/assets/<path>/
    """
    if not os.path.exists(assets_dir):
        return

    # Copy shared assets to images/
    shared_dir = os.path.join(assets_dir, "_shared")
    if os.path.exists(shared_dir):
        images_dir = os.path.join(output_dir, "images")
        os.makedirs(images_dir, exist_ok=True)
        for item in os.listdir(shared_dir):
            src = os.path.join(shared_dir, item)
            dst = os.path.join(images_dir, item)
            if os.path.isfile(src):
                shutil.copy2(src, dst)
        print(f"  Copied shared assets to {images_dir}")

    # Copy page-specific assets
    assets_output = os.path.join(output_dir, "assets")
    for root, dirs, files in os.walk(assets_dir):
        # Skip _shared directory
        dirs[:] = [d for d in dirs if not d.startswith('_')]

        rel_path = os.path.relpath(root, assets_dir)
        if rel_path == ".":
            continue

        for filename in files:
            src = os.path.join(root, filename)
            dst_dir = os.path.join(assets_output, rel_path)
            os.makedirs(dst_dir, exist_ok=True)
            shutil.copy2(src, os.path.join(dst_dir, filename))

    if os.path.exists(assets_output):
        print(f"  Copied page assets to {assets_output}")


def export_collection_json(collection_name: str, items: List[Dict], output_dir: str):
    """Export collection items to JSON for client-side filtering."""
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    json_path = os.path.join(json_dir, f"{collection_name}.json")

    export_items = []
    for item in items:
        config = item.get("config", {})
        meta = item.get("meta", {})

        export_items.append({
            "slug": config.get("slug", ""),
            "url": config.get("url", ""),
            "title": meta.get("title", config.get("title", "")),
            "description": meta.get("description", ""),
            "lang": config.get("lang", DEFAULT_LANG),
            "category": config.get("category", ""),
            "tags": config.get("tags", []),
            "price": config.get("price"),
            "featured": config.get("featured", False),
            "date": str(config.get("date", "")) if config.get("date") else "",
            "author": config.get("author", ""),
        })

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(export_items, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(export_items)} items)")


def main(lang: str = DEFAULT_LANG):
    """Build site for specified language."""
    print(f"Building site for language: {lang}")
    print("=" * 50)

    # Load site configuration
    site_config = load_site_config()
    base_url = site_config.get("site", {}).get("base_url", "/")
    print(f"Base URL: {base_url}")

    # Initialize generator
    gen = Generator(TEMPLATE_DIR, OUTPUT_DIR, site_config)

    # Find all content files for this language
    print(f"\nScanning {CONTENT_DIR}/ for .{lang}. files...")
    content_files = find_content_files(CONTENT_DIR, lang)
    print(f"Found {len(content_files)} content files")

    # Parse all files
    print("\nParsing content...")
    parsed_pages = []
    collections = {}
    errors = []

    for file_info in content_files:
        filepath = file_info["filepath"]
        try:
            data = load_file(filepath)

            # Inject URL and collection from directory structure
            data["config"]["url"] = file_info["url"]
            data["config"]["lang"] = lang
            if file_info["collection"]:
                data["config"]["collection"] = file_info["collection"]

            page_info = {
                "filepath": filepath,
                "data": data,
                "url": file_info["url"],
                "collection": file_info["collection"],
                "is_listing": file_info["is_listing"],
                "menu": data.get("config", {}).get("menu",
                        data.get("meta", {}).get("title", "Untitled")),
                "title": data.get("meta", {}).get("title", "Untitled")
            }
            parsed_pages.append(page_info)

            # Track collections
            if file_info["collection"] and not file_info["is_listing"]:
                coll = file_info["collection"]
                if coll not in collections:
                    collections[coll] = []
                collections[coll].append(data)

            print(f"  ✓ {file_info['url']} ← {os.path.basename(filepath)}")

        except Exception as e:
            errors.append(f"{filepath}: {e}")
            print(f"  ✗ {filepath}: {e}")

    if errors:
        print(f"\n⚠ {len(errors)} parsing errors")

    # Build navigation
    print("\nBuilding navigation...")
    navigation = build_navigation(parsed_pages)

    # Build sitemap for templates
    sitemap = []
    for page in parsed_pages:
        sitemap.append({
            "url": page["url"],
            "title": page["title"],
            "menu": page["menu"],
            "lang": lang,
            "collection": page.get("collection"),
            "translations": page["data"].get("translations", {})
        })

    # Render all pages
    print("\nRendering pages...")
    render_errors = []

    for page in parsed_pages:
        try:
            gen.render_page(
                page["data"],
                os.path.basename(page["filepath"]),
                sitemap,
                navigation
            )
        except Exception as e:
            render_errors.append(f"{page['url']}: {e}")
            print(f"  ✗ {page['url']}: {e}")

    if render_errors:
        print(f"\n⚠ {len(render_errors)} rendering errors")
        # In strict mode, we should exit with error
        # sys.exit(1)

    # Export collections to JSON
    print("\nExporting collections...")
    for coll_name, items in collections.items():
        export_collection_json(coll_name, items, OUTPUT_DIR)

    # Copy assets
    print("\nCopying assets...")
    copy_assets(ASSETS_DIR, OUTPUT_DIR)

    # Summary
    print("\n" + "=" * 50)
    print(f"Build complete: {len(parsed_pages)} pages")
    if errors or render_errors:
        print(f"Warnings: {len(errors) + len(render_errors)}")


if __name__ == "__main__":
    # Get language from command line argument
    lang = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_LANG
    main(lang)
