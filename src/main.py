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
BLOCKS_DIR = os.path.join(TEMPLATE_DIR, "blocks")
BLOCKS_CONTENT_DIR = os.path.join(CONTENT_DIR, "blocks")

# Default language for build
DEFAULT_LANG = "en"


def get_available_blocks() -> set:
    """Get set of available block names from templates/blocks/*.html"""
    blocks = set()
    if os.path.exists(BLOCKS_DIR):
        for f in os.listdir(BLOCKS_DIR):
            if f.endswith('.html'):
                blocks.add(f[:-5])  # Remove .html extension
    return blocks


def get_demo_blocks(lang: str) -> set:
    """Get set of blocks that have demo content in content/blocks/"""
    demos = set()
    if os.path.exists(BLOCKS_CONTENT_DIR):
        for item in os.listdir(BLOCKS_CONTENT_DIR):
            item_path = os.path.join(BLOCKS_CONTENT_DIR, item)
            if os.path.isdir(item_path):
                # Check if there's a lang-specific file
                for f in os.listdir(item_path):
                    if f".{lang}." in f:
                        demos.add(item.replace('-', '_'))  # Normalize: services-grid → services_grid
                        break
    return demos


def validate_blocks(available: set, demos: set) -> List[str]:
    """
    Validate block consistency.
    Returns list of warnings.
    """
    warnings = []

    # Check for templates without demos
    for block in available:
        normalized = block.replace('-', '_')
        if normalized not in demos and block not in demos:
            warnings.append(f"Template '{block}' has no demo content in content/blocks/")

    return warnings


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
    COLLECTION_ORDER = ["blog", "services", "team", "cases", "solutions", "industries", "categories", "countries", "languages"]

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
    Copy assets to public/assets directory.

    assets/* → public/assets/*

    Structure:
    - assets/images/site/     → public/assets/images/site/     (site logos, og-image)
    - assets/images/services/ → public/assets/images/services/ (service images)
    - assets/images/blog/     → public/assets/images/blog/     (blog images)
    - assets/icons/           → public/assets/icons/           (SVG icon system)
    - assets/logos/           → public/assets/logos/           (client logos)
    """
    if not os.path.exists(assets_dir):
        return

    assets_output = os.path.join(output_dir, "assets")

    # Copy all asset folders
    for root, dirs, files in os.walk(assets_dir):
        # Skip hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]

        rel_path = os.path.relpath(root, assets_dir)

        for filename in files:
            # Skip hidden files
            if filename.startswith('.'):
                continue

            src = os.path.join(root, filename)
            if rel_path == ".":
                dst_dir = assets_output
            else:
                dst_dir = os.path.join(assets_output, rel_path)

            os.makedirs(dst_dir, exist_ok=True)
            shutil.copy2(src, os.path.join(dst_dir, filename))

    print(f"  Assets copied to {assets_output}")


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


def build_tag_index(parsed_pages: List[Dict]) -> Dict[str, Dict[str, List[str]]]:
    """
    Build reverse index of tags to services.

    Returns:
    {
        "categories": {
            "digital-marketing": ["seo", "ppc", "ai-optimisation"],
            ...
        },
        "industries": {...},
        "countries": {...},
        "languages": {...}
    }
    """
    tag_index = {
        "categories": {},
        "industries": {},
        "countries": {},
        "languages": {}
    }

    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})

        # Process services for tag index
        is_service = config.get("type") == "service" or config.get("collection") == "services"

        if not is_service:
            continue

        item_slug = config.get("slug", "")
        if not item_slug:
            continue

        tags = data.get("tags", {})

        for dimension in ["categories", "industries", "countries", "languages"]:
            for tag_slug in tags.get(dimension, []):
                if tag_slug not in tag_index[dimension]:
                    tag_index[dimension][tag_slug] = []
                if item_slug not in tag_index[dimension][tag_slug]:
                    tag_index[dimension][tag_slug].append(item_slug)

    return tag_index


def export_services_index(parsed_pages: List[Dict], tag_index: Dict, output_dir: str):
    """
    Export services index with tags for client-side filtering.

    Creates public/data/services-index.json
    """
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    services = []

    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        meta = data.get("meta", {})

        # Only include services
        if config.get("type") != "service" and config.get("collection") != "services":
            continue

        # Skip pages without a slug (catalog pages themselves)
        if not config.get("slug"):
            continue

        tags = data.get("tags", {})

        entry = {
            "slug": config.get("slug", ""),
            "url": config.get("url", ""),
            "title": meta.get("title", ""),
            "description": meta.get("description", ""),
            "tags": {
                "categories": tags.get("categories", []),
                "industries": tags.get("industries", []),
                "countries": tags.get("countries", []),
                "languages": tags.get("languages", [])
            }
        }

        # Include rating and price if available
        if config.get("rating"):
            entry["rating"] = config["rating"]
        if config.get("price"):
            entry["from_price"] = config["price"]

        services.append(entry)

    # Build filters list with counts
    filters = {}
    for dimension, tag_dict in tag_index.items():
        filters[dimension] = [
            {"slug": slug, "count": len(services_list)}
            for slug, services_list in sorted(tag_dict.items())
        ]

    index_data = {
        "services": services,
        "filters": filters
    }

    json_path = os.path.join(json_dir, "services-index.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(services)} services)")



def export_team_index(parsed_pages: List[Dict], output_dir: str):
    """
    Export team/specialists index.

    Creates public/data/team.json
    """
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    specialists = []

    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})

        if config.get("type") != "specialist" and config.get("collection") != "team":
            continue
        if page.get("is_listing"):
            continue

        if not config.get("slug"):
            continue

        relationships = data.get("relationships", {})
        sidebar = data.get("sidebar", {})

        specialists.append({
            "slug": config.get("slug", ""),
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "role": sidebar.get("role", ""),
            "rating": sidebar.get("rating"),
            "projects": sidebar.get("projects"),
            "hourly_rate": sidebar.get("hourly_rate"),
            "relationships": {
                "tasks": relationships.get("tasks", []),
                "languages": relationships.get("languages", []),
                "countries": relationships.get("countries", []),
                "cases": relationships.get("cases", [])
            }
        })

    json_path = os.path.join(json_dir, "team.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"specialists": specialists}, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(specialists)} specialists)")


def export_cases_index(parsed_pages: List[Dict], output_dir: str):
    """
    Export cases index.

    Creates public/data/cases.json
    """
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    cases = []

    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})

        if config.get("type") != "case" and config.get("collection") != "cases":
            continue
        if page.get("is_listing"):
            continue

        if not config.get("slug"):
            continue

        relationships = data.get("relationships", {})

        cases.append({
            "slug": config.get("slug", ""),
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "relationships": {
                "industry": relationships.get("industry", ""),
                "country": relationships.get("country", ""),
                "services_used": relationships.get("services_used", []),
                "tasks_used": relationships.get("tasks_used", []),
                "specialists": relationships.get("specialists", [])
            }
        })

    json_path = os.path.join(json_dir, "cases.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"cases": cases}, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(cases)} cases)")


def get_page_blocks(data: Dict[str, Any]) -> set:
    """Extract block names used in a page's data."""
    # System sections that are NOT content blocks
    # blocks = processed list of block objects (handled by generator)
    # sidebar = layout configuration (handled by generator)
    # tags = faceted catalog tags (handled by generator)
    # links = solution links to parent pillars (handled by generator)
    system_sections = {"config", "meta", "stats", "changes", "translations", "blocks", "sidebar", "tags", "links", "relationships"}
    blocks = set()
    for key in data.keys():
        if key not in system_sections:
            # Normalize: services_grid → services-grid for template matching
            blocks.add(key.replace('_', '-'))
    return blocks


def validate_page_blocks(page_blocks: set, available_blocks: set, filepath: str) -> List[str]:
    """Validate that all blocks used in a page have corresponding templates."""
    errors = []
    for block in page_blocks:
        if block not in available_blocks:
            errors.append(f"{filepath}: Block '{block}' has no template in {BLOCKS_DIR}/")
    return errors


def generate_sitemap(pages: List[Dict], site_config: dict, output_dir: str):
    """Generate sitemap.xml for search engines."""
    base_url = site_config.get("site", {}).get("domain", "https://example.com")

    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    for page in pages:
        url = page.get("url", "/")
        # Build full URL
        full_url = base_url.rstrip("/") + url
        if not full_url.endswith("/"):
            full_url += "/"

        xml_lines.append("  <url>")
        xml_lines.append(f"    <loc>{full_url}</loc>")
        xml_lines.append("    <changefreq>weekly</changefreq>")
        xml_lines.append("    <priority>0.8</priority>")
        xml_lines.append("  </url>")

    xml_lines.append("</urlset>")

    sitemap_path = os.path.join(output_dir, "sitemap.xml")
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write("\n".join(xml_lines))
    print(f"  Created: {sitemap_path} ({len(pages)} URLs)")


def generate_robots(site_config: dict, output_dir: str):
    """Generate robots.txt."""
    base_url = site_config.get("site", {}).get("domain", "https://example.com")

    content = f"""User-agent: *
Allow: /

Sitemap: {base_url.rstrip('/')}/sitemap.xml
"""

    robots_path = os.path.join(output_dir, "robots.txt")
    with open(robots_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Created: {robots_path}")


def main(lang: str = DEFAULT_LANG, local: bool = False):
    """Build site for specified language."""
    print(f"Building site for language: {lang}")
    if local:
        print("Mode: LOCAL (base_url=/)")
    print("=" * 50)

    # Load site configuration
    site_config = load_site_config()

    # Override base_url for local development
    if local:
        if "site" not in site_config:
            site_config["site"] = {}
        site_config["site"]["base_url"] = "/"

    base_url = site_config.get("site", {}).get("base_url", "/")
    print(f"Base URL: {base_url}")

    # Validate block templates and demos
    print("\nValidating blocks...")
    available_blocks = get_available_blocks()
    demo_blocks = get_demo_blocks(lang)
    block_warnings = validate_blocks(available_blocks, demo_blocks)

    print(f"  Found {len(available_blocks)} block templates")
    print(f"  Found {len(demo_blocks)} block demos")

    for warning in block_warnings:
        print(f"  ⚠ {warning}")

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
    block_errors = []

    for file_info in content_files:
        filepath = file_info["filepath"]
        try:
            data = load_file(filepath)

            # Validate blocks used in this page
            page_blocks = get_page_blocks(data)
            page_block_errors = validate_page_blocks(page_blocks, available_blocks, filepath)
            block_errors.extend(page_block_errors)

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

    if block_errors:
        print(f"\n⚠ {len(block_errors)} block validation errors:")
        for err in block_errors:
            print(f"  ✗ {err}")

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

    # Build tag index for faceted navigation
    print("\nBuilding tag index...")
    tag_index = build_tag_index(parsed_pages)
    for dimension, tags in tag_index.items():
        if tags:
            print(f"  {dimension}: {len(tags)} tags")

    # Export services index for client-side filtering
    print("\nExporting services index...")
    export_services_index(parsed_pages, tag_index, OUTPUT_DIR)

    # Export team index
    print("\nExporting team index...")
    export_team_index(parsed_pages, OUTPUT_DIR)

    # Export cases index
    print("\nExporting cases index...")
    export_cases_index(parsed_pages, OUTPUT_DIR)

    # Copy assets
    print("\nCopying assets...")
    copy_assets(ASSETS_DIR, OUTPUT_DIR)

    # Generate sitemap.xml
    print("\nGenerating sitemap.xml...")
    generate_sitemap(parsed_pages, site_config, OUTPUT_DIR)

    # Generate robots.txt
    print("Generating robots.txt...")
    generate_robots(site_config, OUTPUT_DIR)

    # Summary
    print("\n" + "=" * 50)
    print(f"Build complete: {len(parsed_pages)} pages")
    total_warnings = len(errors) + len(render_errors) + len(block_warnings)
    total_errors = len(block_errors)
    if total_warnings:
        print(f"Warnings: {total_warnings}")
    if total_errors:
        print(f"Block errors: {total_errors} (missing templates)")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Build static site")
    parser.add_argument("lang", nargs="?", default=DEFAULT_LANG, help="Language code (default: en)")
    parser.add_argument("--local", action="store_true", help="Build for local development (base_url=/)")
    args = parser.parse_args()
    main(args.lang, local=args.local)
