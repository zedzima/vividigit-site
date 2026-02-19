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
import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional

# Ensure core/src is on the path for sibling imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parser import load_file
from generator import Generator

# Project root: CMS/ (two levels up from core/src/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public")
DEFAULT_LANG = "en"

# Site-specific paths (set by configure_paths)
CONTENT_DIR = None
TEMPLATE_DIR = None
ASSETS_DIR = None
GLOBAL_DIR = None
BLOCKS_DIR = None
BLOCKS_CONTENT_DIR = None
TASKS_DIR = None


def configure_paths(site_name: str) -> dict:
    """Configure all paths based on site name and its theme."""
    global CONTENT_DIR, TEMPLATE_DIR, ASSETS_DIR, GLOBAL_DIR, BLOCKS_DIR, BLOCKS_CONTENT_DIR, TASKS_DIR

    # Load site.yml to get theme name
    site_yml_path = os.path.join(PROJECT_ROOT, "sites", site_name, "site.yml")
    with open(site_yml_path) as f:
        site_yml = yaml.safe_load(f)

    theme_name = site_yml["site"]["theme"]

    CONTENT_DIR = os.path.join(PROJECT_ROOT, "sites", site_name, "content")
    TEMPLATE_DIR = os.path.join(PROJECT_ROOT, "themes", theme_name, "templates")
    ASSETS_DIR = os.path.join(PROJECT_ROOT, "themes", theme_name, "assets")
    GLOBAL_DIR = os.path.join(CONTENT_DIR, "_global")
    BLOCKS_DIR = os.path.join(TEMPLATE_DIR, "blocks")
    BLOCKS_CONTENT_DIR = os.path.join(CONTENT_DIR, "blocks")
    TASKS_DIR = os.path.join(CONTENT_DIR, "_tasks")

    return site_yml


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


def build_navigation(pages: List[Dict[str, Any]], nav_order: List[str] = None) -> List[Dict[str, Any]]:
    """
    Build navigation tree from parsed pages.
    Returns hierarchical structure for menu rendering.

    Args:
        pages: List of parsed page dicts
        nav_order: Ordered list of top-level URLs and collection names from site.yml
    """
    collections = {}
    top_pages = {}  # url -> nav item

    # Use provided nav_order or sensible default
    if nav_order is None:
        nav_order = ["/", "services", "categories", "solutions", "cases",
                     "team", "industries", "countries", "languages", "blog", "contact"]

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
            top_pages[url] = {"url": url, "menu": menu, "children": []}

    # Build nav in exact order
    nav = []
    for entry in nav_order:
        if entry.startswith("/"):
            # Top-level page by URL
            if entry in top_pages:
                nav.append(top_pages[entry])
        else:
            # Collection by name
            if entry in collections:
                coll_data = collections[entry]
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


def build_tag_index(parsed_pages: List[Dict], dimensions: List[str] = None) -> Dict[str, Dict[str, List[str]]]:
    """
    Build reverse index of tags to services.

    Args:
        parsed_pages: List of parsed page dicts
        dimensions: List of facet dimension names from site.yml

    Returns:
    {
        "categories": {
            "digital-marketing": ["seo", "ppc", "ai-optimisation"],
            ...
        },
        "industries": {...},
        ...
    }
    """
    if dimensions is None:
        dimensions = ["categories", "industries", "countries", "languages"]

    tag_index = {dim: {} for dim in dimensions}

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

        for dimension in dimensions:
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

        # Include rating, price, and delivery type if available
        if config.get("rating"):
            entry["rating"] = config["rating"]
        if config.get("price"):
            entry["from_price"] = config["price"]
        if config.get("delivery"):
            entry["delivery"] = config["delivery"]

        # Count specialists linked to this service
        rels = data.get("relationships", {})
        entry["specialist_count"] = len(rels.get("specialists", []))

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
            "avatar": config.get("avatar", ""),
            "rating": sidebar.get("rating"),
            "projects": sidebar.get("projects"),
            "hourly_rate": sidebar.get("hourly_rate"),
            "languages": relationships.get("languages", []),
            "countries": relationships.get("countries", []),
            "tasks": relationships.get("tasks", []),
            "cases": relationships.get("cases", []),
            "services": [],
            "categories": [],
            "industries": [],
        })

    # Derive categories/industries/services for each specialist from service pages
    for spec in specialists:
        spec_categories = set()
        spec_industries = set()
        spec_services = set()
        for page in parsed_pages:
            pdata = page.get("data", {})
            pconfig = pdata.get("config", {})
            prels = pdata.get("relationships", {})
            if pconfig.get("type") == "service" and pconfig.get("slug"):
                if spec["slug"] in prels.get("specialists", []):
                    spec_services.add(pconfig["slug"])
                    ptags = pdata.get("tags", {})
                    spec_categories.update(ptags.get("categories", []))
                    spec_industries.update(ptags.get("industries", []))
        spec["services"] = list(spec_services)
        spec["categories"] = list(spec_categories)
        spec["industries"] = list(spec_industries)

    json_path = os.path.join(json_dir, "team.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"specialists": specialists}, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(specialists)} specialists)")


def export_categories_index(parsed_pages: List[Dict], tag_index: Dict, output_dir: str):
    """
    Export enriched categories index for catalog rendering.

    Creates public/data/categories-index.json
    """
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    categories = []

    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})

        if config.get("type") != "category" and config.get("collection") != "categories":
            continue
        if page.get("is_listing"):
            continue
        if not config.get("slug"):
            continue

        slug = config["slug"]
        service_count = len(tag_index.get("categories", {}).get(slug, []))

        categories.append({
            "slug": slug,
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "menu": config.get("menu", ""),
            "door_opener_price": config.get("door_opener_price"),
            "service_count": service_count,
        })

    json_path = os.path.join(json_dir, "categories-index.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"categories": categories}, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(categories)} categories)")


def export_solutions_index(parsed_pages: List[Dict], output_dir: str):
    """
    Export enriched solutions index for catalog rendering.

    Creates public/data/solutions-index.json
    """
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    solutions = []

    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})

        if config.get("type") != "solution" and config.get("collection") != "solutions":
            continue
        if page.get("is_listing"):
            continue
        if not config.get("slug"):
            continue

        links = data.get("links", {})

        # Extract starting price from pricing block
        starting_price = None
        for block in data.get("blocks", []):
            if block.get("type") == "pricing":
                packages = block.get("data", {}).get("packages", [])
                if packages:
                    prices = [p.get("price", 0) for p in packages if p.get("price")]
                    if prices:
                        starting_price = min(prices)
                break

        solutions.append({
            "slug": config["slug"],
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "service": links.get("service", ""),
            "industry": links.get("industry", ""),
            "starting_price": starting_price,
        })

    json_path = os.path.join(json_dir, "solutions-index.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"solutions": solutions}, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(solutions)} solutions)")


def export_industries_index(parsed_pages: List[Dict], tag_index: Dict, output_dir: str):
    """Export enriched industries index. Creates public/data/industries-index.json"""
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    items = []
    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        if config.get("type") != "industry":
            continue
        if page.get("is_listing") or not config.get("slug"):
            continue
        slug = config["slug"]
        service_count = len(tag_index.get("industries", {}).get(slug, []))
        items.append({
            "slug": slug,
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "menu": config.get("menu", ""),
            "icon": config.get("icon", ""),
            "service_count": service_count,
        })

    json_path = os.path.join(json_dir, "industries-index.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"industries": items}, f, indent=2, ensure_ascii=False)
    print(f"  Exported: {json_path} ({len(items)} industries)")


def export_countries_index(parsed_pages: List[Dict], tag_index: Dict, output_dir: str):
    """Export enriched countries index. Creates public/data/countries-index.json"""
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    items = []
    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        if config.get("type") != "country":
            continue
        if page.get("is_listing") or not config.get("slug"):
            continue
        slug = config["slug"]
        service_count = len(tag_index.get("countries", {}).get(slug, []))
        items.append({
            "slug": slug,
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "menu": config.get("menu", ""),
            "flag": config.get("flag", ""),
            "service_count": service_count,
        })

    json_path = os.path.join(json_dir, "countries-index.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"countries": items}, f, indent=2, ensure_ascii=False)
    print(f"  Exported: {json_path} ({len(items)} countries)")


def export_languages_index(parsed_pages: List[Dict], tag_index: Dict, output_dir: str,
                           lang_code_map: Dict[str, str] = None):
    """Export enriched languages index. Creates public/data/languages-index.json"""
    if lang_code_map is None:
        lang_code_map = {
            'english': 'EN', 'german': 'DE', 'french': 'FR', 'spanish': 'ES',
            'russian': 'RU', 'chinese': 'ZH', 'japanese': 'JA', 'italian': 'IT',
            'portuguese': 'PT',
        }

    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    items = []
    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        if config.get("type") != "language":
            continue
        if page.get("is_listing") or not config.get("slug"):
            continue
        slug = config["slug"]
        service_count = len(tag_index.get("languages", {}).get(slug, []))
        items.append({
            "slug": slug,
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "menu": config.get("menu", ""),
            "flag": config.get("flag", ""),
            "code": (lang_code_map.get(slug) or slug[:2].upper()),
            "service_count": service_count,
        })

    json_path = os.path.join(json_dir, "languages-index.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"languages": items}, f, indent=2, ensure_ascii=False)
    print(f"  Exported: {json_path} ({len(items)} languages)")


def export_cases_index(parsed_pages: List[Dict], output_dir: str):
    """
    Export cases index.

    Creates public/data/cases.json
    """
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    cases = []

    # Build service -> categories lookup for deriving case categories
    service_categories = {}
    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        if config.get("type") == "service" and config.get("slug"):
            tags = data.get("tags", {})
            service_categories[config["slug"]] = tags.get("categories", [])

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

        # Extract results from hero stats or dedicated results field
        results = []
        hero_data = next(
            (b["data"] for b in data.get("blocks", []) if b.get("type") == "hero"),
            {}
        )
        if hero_data.get("stats"):
            results = [
                {"value": s.get("value", ""), "label": s.get("label", "")}
                for s in hero_data["stats"]
            ]

        # Derive categories from services_used
        services_used = relationships.get("services_used", [])
        case_categories = set()
        for svc_slug in services_used:
            case_categories.update(service_categories.get(svc_slug, []))

        cases.append({
            "slug": config.get("slug", ""),
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "client": config.get("client", ""),
            "image": config.get("image", ""),
            "industry": relationships.get("industry", ""),
            "country": relationships.get("country", ""),
            "language": relationships.get("language", ""),
            "services": services_used,
            "categories": sorted(case_categories),
            "specialists": relationships.get("specialists", []),
            "results": results,
        })

    json_path = os.path.join(json_dir, "cases.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"cases": cases}, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(cases)} cases)")


###############################################################################
# Phase 2: Relationship Graph
###############################################################################

def build_relationship_graph(parsed_pages: List[Dict]) -> Dict[str, Dict]:
    """
    Build bidirectional relationship graph from all parsed pages.

    Returns dict keyed by slug with node info and relationships.
    """
    graph = {}

    # First pass: register all nodes
    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        slug = config.get("slug", "")
        if not slug or page.get("is_listing"):
            continue

        graph[slug] = {
            "type": config.get("type", config.get("collection", "")),
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "relationships": data.get("relationships", {}),
        }

    # Second pass: no reverse index needed — we resolve forward relationships
    # directly against the graph at render time.
    return graph


def build_bidirectional_map(parsed_pages: List[Dict]) -> Dict[str, Dict[str, List[Dict]]]:
    """
    Build bidirectional relationship map for all entity pages.

    For each entity slug, returns a dict of entity_type -> list of related entity data.
    Computes forward relationships, reverse relationships, and tag-based relationships.

    Returns:
        {
            "ivan-petrov": {
                "services": [{"slug": "technical-seo", "title": ..., "url": ..., ...}],
                "cases": [{"slug": "ecommerce-migration-2025", ...}],
            }
        }
    """
    # Build lookup: slug -> full page data (for entity cards)
    page_lookup = {}
    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        slug = config.get("slug", "")
        if not slug or page.get("is_listing"):
            continue
        # Collection can be in config or at page level (parser sets both)
        collection = config.get("collection", "") or page.get("collection", "")
        page_lookup[slug] = {
            "slug": slug,
            "type": config.get("type", collection),
            "collection": collection,
            "url": config.get("url", ""),
            "title": data.get("meta", {}).get("title", ""),
            "description": data.get("meta", {}).get("description", ""),
            "menu": config.get("menu", ""),
            "sidebar": data.get("sidebar", {}),
            "relationships": data.get("relationships", {}),
            "tags": data.get("tags", {}),
            "config": config,
        }

    # Initialize result: slug -> {entity_type: [entity_data]}
    result = {slug: {} for slug in page_lookup}

    # Collection-to-entity-type mapping for reverse lookups
    collection_type_map = {
        "services": "services", "team": "specialists", "cases": "cases",
        "solutions": "solutions", "categories": "categories",
        "industries": "industries", "countries": "countries", "languages": "languages",
    }

    # Relationship key -> target collection mapping
    rel_target_collection = {
        "specialists": "team", "cases": "cases", "languages": "languages",
        "countries": "countries", "services_used": "services", "tasks_used": None,
        "door_opener_task": None, "available_tasks": None, "tasks": None,
    }

    def add_relation(source_slug, target_type, target_data):
        """Add a relation, avoiding duplicates."""
        if source_slug not in result:
            return
        if target_type not in result[source_slug]:
            result[source_slug][target_type] = []
        # Avoid duplicates by slug
        if not any(e["slug"] == target_data["slug"] for e in result[source_slug][target_type]):
            result[source_slug][target_type].append(target_data)

    def entity_card(slug):
        """Extract card-level data for an entity."""
        p = page_lookup.get(slug)
        if not p:
            return None
        return {
            "slug": p["slug"],
            "type": p["type"],
            "collection": p["collection"],
            "url": p["url"],
            "title": p["title"],
            "description": p["description"],
            "menu": p["menu"],
            "sidebar": p["sidebar"],
            "config": p["config"],
            "tags": p["tags"],
        }

    # Pass 1: Forward relationships
    for slug, page in page_lookup.items():
        rels = page.get("relationships", {})
        for rel_key, targets in rels.items():
            if isinstance(targets, str):
                targets = [targets]

            for target_slug in targets:
                target_card = entity_card(target_slug)
                if not target_card:
                    continue
                # Determine target grouping type
                target_collection = target_card["collection"]
                group_key = collection_type_map.get(target_collection, target_collection)
                add_relation(slug, group_key, target_card)

    # Pass 2: Reverse relationships
    for slug, page in page_lookup.items():
        source_collection = page.get("collection", "")
        source_group = collection_type_map.get(source_collection, source_collection)
        source_card = entity_card(slug)
        if not source_card:
            continue

        rels = page.get("relationships", {})
        for rel_key, targets in rels.items():
            if isinstance(targets, str):
                targets = [targets]
            for target_slug in targets:
                if target_slug in page_lookup:
                    add_relation(target_slug, source_group, source_card)

    # Pass 3: Tag-based relationships (service tagged with category -> category gets service)
    for slug, page in page_lookup.items():
        tags = page.get("tags", {})
        source_collection = page.get("collection", "")
        source_group = collection_type_map.get(source_collection, source_collection)
        source_card = entity_card(slug)
        if not source_card:
            continue

        for tag_dimension, tag_values in tags.items():
            if isinstance(tag_values, str):
                tag_values = [tag_values]
            for tag_slug in tag_values:
                if tag_slug in page_lookup:
                    # Dimension entity gets reverse link to this page
                    add_relation(tag_slug, source_group, source_card)
                    # This page gets link to the dimension entity
                    target_card = entity_card(tag_slug)
                    if target_card:
                        target_group = collection_type_map.get(
                            target_card["collection"], target_card["collection"]
                        )
                        add_relation(slug, target_group, target_card)

    return result


# Section display order per entity type
RELATED_SECTION_ORDER = {
    "service": ["specialists", "cases", "categories", "industries", "countries", "languages"],
    "specialist": ["services", "cases", "languages", "countries"],
    "case": ["services", "specialists", "industries", "countries", "languages"],
    "solution": ["services", "industries"],
    "category": ["services", "specialists", "cases"],
    "industry": ["services", "specialists", "cases", "solutions"],
    "country": ["services", "specialists", "cases"],
    "language": ["services", "specialists", "cases"],
}

SECTION_TITLES = {
    "services": "Services",
    "specialists": "Specialists",
    "cases": "Case Studies",
    "solutions": "Solutions",
    "categories": "Categories",
    "industries": "Industries",
    "countries": "Countries",
    "languages": "Languages",
}


def inject_related_blocks(parsed_pages: List[Dict], bi_map: Dict[str, Dict[str, List[Dict]]]):
    """
    Auto-inject related-entities blocks into pages based on bidirectional map.
    Inserts a single related-entities block before the last block (typically CTA).
    """
    for page in parsed_pages:
        if page.get("is_listing"):
            continue

        data = page.get("data", {})
        config = data.get("config", {})
        slug = config.get("slug", "")
        entity_type = config.get("type", "")

        if slug not in bi_map:
            continue

        relations = bi_map[slug]
        section_order = RELATED_SECTION_ORDER.get(entity_type, [])

        sections = []
        for section_type in section_order:
            items = relations.get(section_type, [])
            if items:
                sections.append({
                    "type": section_type,
                    "title": SECTION_TITLES.get(section_type, section_type.title()),
                    "items": items,
                })

        if not sections:
            continue

        block = {
            "type": "related-entities",
            "original_key": "related-entities",
            "data": {
                "entity_type": entity_type,
                "sections": sections,
            },
        }

        blocks = data.get("blocks", [])
        if blocks:
            blocks.insert(len(blocks) - 1, block)
        else:
            blocks.append(block)


def resolve_related_entities(parsed_pages: List[Dict], graph: Dict[str, Dict]):
    """
    Auto-populate related-entities blocks from relationship graph.

    If a related-entities block has a `source` field (e.g., source = "specialists")
    but no manual `items`, populate items from the page's relationships.
    """
    for page in parsed_pages:
        data = page.get("data", {})
        config = data.get("config", {})
        slug = config.get("slug", "")

        for block in data.get("blocks", []):
            if block["type"] != "related-entities":
                continue
            if block["data"].get("items"):
                continue  # Manual items take precedence
            source = block["data"].get("source", "")
            if not source:
                # Ensure items key exists to avoid Jinja2 dict.items() conflict
                block["data"].setdefault("items", [])
                continue

            if slug not in graph:
                block["data"]["items"] = []
                continue

            page_rels = graph[slug].get("relationships", {})
            related_slugs = page_rels.get(source, [])
            if isinstance(related_slugs, str):
                related_slugs = [related_slugs]

            items = []
            for rel_slug in related_slugs:
                node = graph.get(rel_slug)
                if node:
                    items.append({
                        "title": node["title"],
                        "url": node["url"],
                        "description": node["description"],
                        "badge": node.get("type", ""),
                    })

            block["data"]["items"] = items


def export_relationship_graph(graph: Dict[str, Dict], output_dir: str):
    """Export relationship graph as JSON for client-side use."""
    json_dir = os.path.join(output_dir, "data")
    os.makedirs(json_dir, exist_ok=True)

    nodes = {}
    edges = []

    for slug, node in graph.items():
        nodes[slug] = {
            "type": node["type"],
            "title": node["title"],
            "url": node["url"],
        }
        for rel_type, targets in node.get("relationships", {}).items():
            if isinstance(targets, str):
                targets = [targets]
            for target in targets:
                if isinstance(target, str):
                    edges.append({"from": slug, "to": target, "type": rel_type})

    json_path = os.path.join(json_dir, "graph.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"nodes": nodes, "edges": edges}, f, indent=2, ensure_ascii=False)

    print(f"  Exported: {json_path} ({len(nodes)} nodes, {len(edges)} edges)")


###############################################################################
# Phase 3: Task Normalization
###############################################################################

def load_tasks(tasks_dir: str, lang: str) -> Dict[str, Dict]:
    """
    Load task definitions from _tasks/ directory.

    Returns dict keyed by task slug with task-picker-compatible data.
    """
    tasks = {}
    if not os.path.exists(tasks_dir):
        return tasks

    for item in os.listdir(tasks_dir):
        item_path = os.path.join(tasks_dir, item)
        if not os.path.isdir(item_path):
            continue

        for f in os.listdir(item_path):
            if f".{lang}." in f and (f.endswith('.toml') or f.endswith('.md')):
                filepath = os.path.join(item_path, f)
                data = load_file(filepath)
                config = data.get("config", {})
                meta = data.get("meta", {})
                sidebar = data.get("sidebar", {})

                slug = config.get("slug", item)

                # Extract deliverables from features block if present
                deliverables = []
                for block in data.get("blocks", []):
                    if block["type"] == "features":
                        for feat in block["data"].get("features", []):
                            deliverables.append(feat.get("title", ""))

                # Build tiers from sidebar
                tiers = []
                for tier in sidebar.get("tiers", []):
                    tiers.append({
                        "name": tier.get("name", ""),
                        "label": tier.get("label", ""),
                        "price": tier.get("price", 0),
                    })

                tasks[slug] = {
                    "slug": slug,
                    "title": meta.get("title", "").split("—")[0].split("–")[0].strip(),
                    "description": meta.get("description", ""),
                    "delivery_type": config.get("delivery_type", "one-time"),
                    "unit_type": sidebar.get("unit_type", ""),
                    "door_opener": config.get("door_opener", False),
                    "deliverables": deliverables,
                    "tiers": tiers,
                }
                break

    return tasks


def resolve_task_pickers(parsed_pages: List[Dict], tasks: Dict[str, Dict]):
    """
    Auto-populate task-picker blocks from loaded tasks.

    Supports:
    - auto_tasks = ["site-audit", ...] → fill tasks from _tasks/
    - Inline task definitions still override (backward compatible)
    """
    for page in parsed_pages:
        data = page.get("data", {})

        for block in data.get("blocks", []):
            if block["type"] != "task-picker":
                continue

            block_data = block["data"]
            auto_slugs = block_data.get("auto_tasks", [])

            if auto_slugs and not block_data.get("tasks"):
                # Auto-populate from _tasks/
                block_data["tasks"] = [
                    tasks[s] for s in auto_slugs if s in tasks
                ]

            # Enrich existing slug-only references
            if block_data.get("tasks"):
                enriched = []
                for task in block_data["tasks"]:
                    if isinstance(task, str):
                        if task in tasks:
                            enriched.append(tasks[task])
                    elif isinstance(task, dict):
                        task_slug = task.get("slug", "")
                        if task_slug in tasks and not task.get("tiers"):
                            # Merge: inline overrides _tasks defaults
                            base = tasks[task_slug].copy()
                            base.update({k: v for k, v in task.items() if v})
                            enriched.append(base)
                        else:
                            enriched.append(task)
                    else:
                        enriched.append(task)
                block_data["tasks"] = enriched


def get_page_blocks(data: Dict[str, Any]) -> set:
    """Extract block names used in a page's data."""
    blocks = set()
    for block in data.get("blocks", []):
        block_type = block.get("type", "")
        if block_type:
            blocks.add(block_type.replace('_', '-'))
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


def main(lang: str = DEFAULT_LANG, local: bool = False, site_name: str = "vividigit"):
    """Build site for specified language."""
    print(f"Building site for language: {lang} (site: {site_name})")
    if local:
        print("Mode: LOCAL (base_url=/)")
    print("=" * 50)

    # Configure paths from site.yml
    site_yml = configure_paths(site_name)

    # Load site configuration from _global/site.toml
    site_config = load_site_config()

    # Merge site.yml values into site_config so templates have access
    if "site" not in site_config:
        site_config["site"] = {}
    # site.yml provides theme, navigation, facets — keep site.toml for domain, base_url etc.
    for key in ("theme", "language"):
        if key in site_yml.get("site", {}):
            site_config["site"].setdefault(key, site_yml["site"][key])

    # Override base_url for local development
    if local:
        if "site" not in site_config:
            site_config["site"] = {}
        site_config["site"]["base_url"] = "/"

    base_url = site_config.get("site", {}).get("base_url", "/")

    # For non-default languages, build to public/{lang}/ subdirectory
    output_dir = OUTPUT_DIR
    if lang != DEFAULT_LANG:
        output_dir = os.path.join(OUTPUT_DIR, lang)
        os.makedirs(output_dir, exist_ok=True)
        print(f"Output: {output_dir}")

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

    # Initialize generator with theme templates (and core CMS templates as fallback)
    core_templates_dir = os.path.join(PROJECT_ROOT, "core", "templates")
    template_dirs = [TEMPLATE_DIR]
    if os.path.isdir(core_templates_dir):
        template_dirs.append(core_templates_dir)
    gen = Generator(template_dirs, output_dir, site_config)

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

    # Build relationship graph (Phase 2)
    print("\nBuilding relationship graph...")
    graph = build_relationship_graph(parsed_pages)
    print(f"  {len(graph)} nodes")

    # Resolve related-entities blocks from graph (Phase 2)
    resolve_related_entities(parsed_pages, graph)

    # Load tasks and resolve task-picker blocks (Phase 3)
    print("\nLoading tasks...")
    tasks = load_tasks(TASKS_DIR, lang)
    if tasks:
        print(f"  Loaded {len(tasks)} tasks from _tasks/")
        resolve_task_pickers(parsed_pages, tasks)

    # Build navigation
    print("\nBuilding navigation...")
    nav_order = site_yml.get("navigation", {}).get("order")
    navigation = build_navigation(parsed_pages, nav_order)

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
        export_collection_json(coll_name, items, output_dir)

    # Build tag index for faceted navigation
    print("\nBuilding tag index...")
    dimensions = site_yml.get("facets", {}).get("dimensions")
    tag_index = build_tag_index(parsed_pages, dimensions)
    for dimension, tags in tag_index.items():
        if tags:
            print(f"  {dimension}: {len(tags)} tags")

    # Export services index for client-side filtering
    print("\nExporting services index...")
    export_services_index(parsed_pages, tag_index, output_dir)

    # Export team index
    print("\nExporting team index...")
    export_team_index(parsed_pages, output_dir)

    # Export cases index
    print("\nExporting cases index...")
    export_cases_index(parsed_pages, output_dir)

    # Export categories index
    print("\nExporting categories index...")
    export_categories_index(parsed_pages, tag_index, output_dir)

    # Export solutions index
    print("\nExporting solutions index...")
    export_solutions_index(parsed_pages, output_dir)

    # Export industries index
    print("\nExporting industries index...")
    export_industries_index(parsed_pages, tag_index, output_dir)

    # Export countries index
    print("\nExporting countries index...")
    export_countries_index(parsed_pages, tag_index, output_dir)

    # Export languages index
    print("\nExporting languages index...")
    lang_code_map = site_yml.get("exports", {}).get("language_code_map")
    export_languages_index(parsed_pages, tag_index, output_dir, lang_code_map)

    # Export relationship graph (Phase 2)
    print("\nExporting relationship graph...")
    export_relationship_graph(graph, output_dir)

    # Copy assets (only for default language — shared)
    if lang == DEFAULT_LANG:
        print("\nCopying assets...")
        copy_assets(ASSETS_DIR, output_dir)

    # Generate sitemap.xml
    print("\nGenerating sitemap.xml...")
    generate_sitemap(parsed_pages, site_config, output_dir)

    # Generate robots.txt
    if lang == DEFAULT_LANG:
        print("Generating robots.txt...")
        generate_robots(site_config, output_dir)

    # Summary
    print("\n" + "=" * 50)
    print(f"Build complete: {len(parsed_pages)} pages")
    total_warnings = len(errors) + len(render_errors) + len(block_warnings)
    total_errors = len(block_errors)
    if total_warnings:
        print(f"Warnings: {total_warnings}")
    if total_errors:
        print(f"Block errors: {total_errors} (missing templates)")


def build_all_languages(local: bool = False, site_name: str = "vividigit"):
    """Build site for all available languages."""
    # Configure paths first so CONTENT_DIR is set
    configure_paths(site_name)

    langs = set()
    for root, dirs, files in os.walk(CONTENT_DIR):
        dirs[:] = [d for d in dirs if not d.startswith('.') and not d.startswith('_')]
        for f in files:
            parts = f.split('.')
            if len(parts) >= 3:
                lang = parts[-2]
                if len(lang) == 2:
                    langs.add(lang)

    print(f"Detected languages: {sorted(langs)}")
    for lang in sorted(langs):
        main(lang, local=local, site_name=site_name)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Build static site")
    parser.add_argument("lang", nargs="?", default=DEFAULT_LANG, help="Language code (default: en)")
    parser.add_argument("--local", action="store_true", help="Build for local development (base_url=/)")
    parser.add_argument("--all", action="store_true", help="Build all detected languages")
    parser.add_argument("--site", default="vividigit", help="Site name (directory in sites/)")
    args = parser.parse_args()
    if args.all:
        build_all_languages(local=args.local, site_name=args.site)
    else:
        main(args.lang, local=args.local, site_name=args.site)
