import os
import json
import glob as glob_module
import tomllib
from parser import load_file
from generator import Generator

CONTENT_DIR = "content"
TEMPLATE_DIR = "templates"
OUTPUT_DIR = "public"
GLOBAL_DIR = os.path.join(CONTENT_DIR, "global")

# Collections are subdirectories in content/ (except 'pages' and 'global')
RESERVED_DIRS = {"pages", "global"}


def load_site_config() -> dict:
    """Load global site configuration."""
    site_config_path = os.path.join(GLOBAL_DIR, "site.toml")
    if os.path.exists(site_config_path):
        with open(site_config_path, "rb") as f:
            return tomllib.load(f)
    return {}


def find_content_files(directory: str) -> list:
    """Find all content files (toml, yaml, yml, md) in a directory."""
    files = []
    for ext in ["*.toml", "*.yaml", "*.yml", "*.md"]:
        files += glob_module.glob(os.path.join(directory, "**", ext), recursive=True)
    # Filter out files starting with _ (metadata files)
    return [f for f in files if not os.path.basename(f).startswith('_')]


def find_collections(content_dir: str) -> dict:
    """Find all collection directories and their items."""
    collections = {}

    if not os.path.exists(content_dir):
        return collections

    for item in os.listdir(content_dir):
        item_path = os.path.join(content_dir, item)
        if os.path.isdir(item_path) and item not in RESERVED_DIRS and not item.startswith('.'):
            # This is a collection
            collection_files = find_content_files(item_path)
            collections[item] = collection_files

    return collections


def export_collection_json(collection_name: str, items: list, output_dir: str):
    """Export collection items to JSON for client-side filtering."""
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    json_path = os.path.join(json_dir, f"{collection_name}.json")

    # Extract only necessary fields for filtering
    export_items = []
    for item in items:
        config = item.get("config", {})
        meta = item.get("meta", {})

        export_items.append({
            "slug": config.get("slug", ""),
            "url": config.get("url", ""),
            "title": meta.get("title", config.get("title", "")),
            "description": meta.get("description", ""),
            "lang": config.get("lang", "en"),
            "category": config.get("category", ""),
            "tags": config.get("tags", []),
            "price": config.get("price", None),
            "featured": config.get("featured", False),
            "date": str(config.get("date", "")) if config.get("date") else "",
            "author": config.get("author", ""),
        })

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(export_items, f, indent=2, ensure_ascii=False)

    print(f"Exported: {json_path} ({len(export_items)} items)")


def main():
    print("Starting CMS Build...")
    print("-" * 40)

    # Load site-wide configuration
    site_config = load_site_config()
    print(f"Site base URL: {site_config.get('site', {}).get('base_url', '/')}")

    # Initialize Generator with site config
    gen = Generator(TEMPLATE_DIR, OUTPUT_DIR, site_config)

    # Find all page files
    pages_dir = os.path.join(CONTENT_DIR, "pages")
    page_files = find_content_files(pages_dir) if os.path.exists(pages_dir) else []

    # Find collections
    collections = find_collections(CONTENT_DIR)

    # Pass 1: Build Sitemap from pages
    sitemap = []
    parsed_pages = []

    print("Building Sitemap...")
    for filepath in page_files:
        try:
            data = load_file(filepath)
            parsed_pages.append({"path": filepath, "data": data, "type": "page"})

            config = data.get("config", {})
            meta = data.get("meta", {})

            sitemap.append({
                "url": config.get("url", "#"),
                "title": meta.get("title", "Untitled"),
                "lang": config.get("lang", "en"),
                "menu": config.get("menu", meta.get("title", "Untitled")),
                "translations": data.get("translations", {})
            })
        except Exception as e:
            print(f"  Failed to parse {filepath}: {e}")

    # Pass 2: Parse collections and add to sitemap
    parsed_collections = {}

    for collection_name, collection_files in collections.items():
        print(f"Processing collection: {collection_name} ({len(collection_files)} items)")
        parsed_collections[collection_name] = []

        for filepath in collection_files:
            try:
                data = load_file(filepath)
                # Add collection name to config so templates can use it
                data["config"]["collection"] = collection_name
                parsed_pages.append({
                    "path": filepath,
                    "data": data,
                    "type": "collection",
                    "collection": collection_name
                })
                parsed_collections[collection_name].append(data)

                config = data.get("config", {})
                meta = data.get("meta", {})

                # Add collection items to sitemap if they have a URL
                if config.get("url"):
                    sitemap.append({
                        "url": config.get("url", "#"),
                        "title": meta.get("title", "Untitled"),
                        "lang": config.get("lang", "en"),
                        "menu": config.get("menu", meta.get("title", "Untitled")),
                        "collection": collection_name,
                        "translations": data.get("translations", {})
                    })
            except Exception as e:
                print(f"  Failed to parse {filepath}: {e}")

    # Pass 3: Render all pages
    print("-" * 40)
    print("Rendering Pages...")
    for item in parsed_pages:
        filepath = item["path"]
        data = item["data"]
        filename = os.path.basename(filepath)

        try:
            gen.render_page(data, filename, sitemap)
        except Exception as e:
            print(f"  Failed to render {filepath}: {e}")

    # Pass 4: Export collections to JSON
    print("-" * 40)
    print("Exporting Collections to JSON...")
    for collection_name, items in parsed_collections.items():
        export_collection_json(collection_name, items, OUTPUT_DIR)

    print("-" * 40)
    print("Build Complete.")


if __name__ == "__main__":
    main()
