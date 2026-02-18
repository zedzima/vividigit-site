import os
import re
import tomllib
import yaml
import markdown
from typing import Dict, Any, List, Tuple

# Configure markdown with extensions
md = markdown.Markdown(extensions=[
    'tables',
    'fenced_code',
    'codehilite',
    'toc',
    'attr_list',
    'md_in_html'
])

def parse_markdown(text: str) -> str:
    """Convert markdown text to HTML."""
    if not text:
        return ""
    md.reset()
    return md.convert(text)

def parse_frontmatter(content: str) -> Tuple[Dict[str, Any], str]:
    """
    Parse YAML frontmatter from markdown content.
    Returns (frontmatter_dict, body_content)
    """
    # Match frontmatter between --- delimiters
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)

    if match:
        frontmatter_str = match.group(1)
        body = match.group(2)
        try:
            frontmatter = yaml.safe_load(frontmatter_str) or {}
        except yaml.YAMLError:
            frontmatter = {}
        return frontmatter, body

    # No frontmatter found
    return {}, content

def load_file(filepath: str) -> Dict[str, Any]:
    """Load and parse a content file (TOML, YAML, or Markdown)."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    if filepath.endswith(".md"):
        # Markdown with YAML frontmatter
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        frontmatter, body = parse_frontmatter(content)
        return process_markdown_content(frontmatter, body)

    elif filepath.endswith(".toml"):
        with open(filepath, "rb") as f:
            data = tomllib.load(f)

    elif filepath.endswith(".yml") or filepath.endswith(".yaml"):
        with open(filepath, "rb") as f:
            data = yaml.safe_load(f)

    else:
        raise ValueError(f"Unsupported file format: {filepath}")

    return process_content(data)

def process_markdown_content(frontmatter: Dict[str, Any], body: str) -> Dict[str, Any]:
    """
    Process markdown file with frontmatter.
    Creates an 'article' block for the body content.
    """
    # Extract standard fields from frontmatter
    config_data = frontmatter.get("config", {})
    meta_data = frontmatter.get("meta", {})
    translations_data = frontmatter.get("translations", {})

    # Support flat frontmatter (common in blogs)
    # If no nested config, treat top-level as config
    if not config_data:
        flat_fields = ["title", "slug", "url", "date", "author", "tags",
                       "category", "lang", "featured", "draft", "menu"]
        for field in flat_fields:
            if field in frontmatter:
                config_data[field] = frontmatter[field]

    # Auto-generate meta from config if missing
    if not meta_data:
        meta_data = {
            "title": config_data.get("title", ""),
            "description": frontmatter.get("description", frontmatter.get("excerpt", ""))
        }

    # Convert markdown body to HTML
    body_html = parse_markdown(body)

    # Extract first paragraph as excerpt if not provided
    excerpt = frontmatter.get("excerpt", "")
    if not excerpt and body:
        # Skip H1 title line and find first real paragraph
        lines = body.strip().split("\n\n")
        for para in lines:
            para = para.strip()
            if para and not para.startswith("#"):
                excerpt = re.sub(r'[#*_`\[\]]', '', para)[:200]
                break

    # Get TOC
    toc_html = getattr(md, 'toc', '')

    # Build the article block
    article_block = {
        "type": "article",
        "data": {
            "title": config_data.get("title", ""),
            "date": config_data.get("date", ""),
            "author": config_data.get("author", ""),
            "tags": config_data.get("tags", []),
            "category": config_data.get("category", ""),
            "excerpt": excerpt,
            "body": body_html,
            "reading_time": estimate_reading_time(body)
        }
    }

    # Store TOC in config for sidebar access
    config_data["toc"] = toc_html

    # Process any additional blocks from frontmatter
    blocks = [article_block]

    # System fields to skip
    SYSTEM_FIELDS = {"config", "meta", "translations", "title", "slug", "url",
                     "date", "author", "tags", "category", "lang", "featured",
                     "draft", "menu", "description", "excerpt"}

    for key, value in frontmatter.items():
        if key not in SYSTEM_FIELDS and isinstance(value, dict):
            block_type = key.split("_")[0] if "_" in key else key
            blocks.append({
                "type": block_type,
                "original_key": key,
                "data": process_markdown_fields(value)
            })

    return {
        "config": config_data,
        "meta": meta_data,
        "translations": translations_data,
        "blocks": blocks
    }

def estimate_reading_time(text: str) -> int:
    """Estimate reading time in minutes."""
    words = len(text.split())
    return max(1, round(words / 200))

def process_content(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process the raw data:
    1. Identify blocks.
    2. Convert markdown fields in blocks.
    """
    # Normalize keys to handle prefixes like '^' or '_'
    # We want to find 'config' and 'meta' regardless of prefix
    
    config_data = {}
    meta_data = {}
    
    # Helper to find specific keys
    for k, v in data.items():
        clean_k = k.lstrip("^").lstrip("_")
        if clean_k == "config":
            config_data = v
        elif clean_k == "meta":
            meta_data = v

    # Extract translations for i18n language switcher
    translations_data = {}
    for k, v in data.items():
        clean_k = k.lstrip("^").lstrip("_")
        if clean_k == "translations":
            translations_data = v

    # Extract sidebar data for layout
    sidebar_data = {}
    for k, v in data.items():
        clean_k = k.lstrip("^").lstrip("_")
        if clean_k == "sidebar":
            sidebar_data = v

    # Extract tags data for faceted catalog
    tags_data = {}
    for k, v in data.items():
        clean_k = k.lstrip("^").lstrip("_")
        if clean_k == "tags":
            tags_data = v

    # Extract links data for solutions (links to parent pillars)
    links_data = {}
    for k, v in data.items():
        clean_k = k.lstrip("^").lstrip("_")
        if clean_k == "links":
            links_data = v

    # Extract relationships data for graph edges
    relationships_data = {}
    for k, v in data.items():
        clean_k = k.lstrip("^").lstrip("_")
        if clean_k == "relationships":
            relationships_data = v

    processed = {
        "config": config_data,
        "meta": meta_data,
        "translations": translations_data,
        "sidebar": sidebar_data,
        "tags": tags_data,
        "links": links_data,
        "relationships": relationships_data,
        "blocks": []
    }

    # System fields that should not be rendered as content blocks
    SYSTEM_FIELDS = {"config", "meta", "log", "changes", "stats", "translations", "sidebar", "tags", "links", "relationships"}

    for key, value in data.items():
        clean_key = key.lstrip("^").lstrip("_")

        if clean_key in SYSTEM_FIELDS:
            # Skip system/meta fields - they are not content blocks
            continue
        
        # This is a block
        # Support naming convention: "text_problem" -> uses "text" template
        # This allows multiple blocks of the same type on one page
        # But first try full name (main_content.html), then shortened (main.html)
        block_type = clean_key.split("_")[0] if "_" in clean_key else clean_key

        block = {
            "type": block_type,
            "original_key": clean_key,
            "data": value
        }
        
        if isinstance(value, dict):
            block["data"] = process_markdown_fields(value)
        
        processed["blocks"].append(block)
            
    return processed

def process_markdown_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively process fields that are likely markdown."""
    new_data = data.copy()
    # Only process fields that typically contain rich formatted text
    # subtitle, text in features are usually plain - use body/content/description_md for markdown
    markdown_keys = ["body", "content", "answer", "description_md"]

    for k, v in new_data.items():
        if k in markdown_keys and isinstance(v, str):
            new_data[k] = parse_markdown(v)
        elif isinstance(v, dict):
            new_data[k] = process_markdown_fields(v)
        elif isinstance(v, list):
            # Process lists (e.g., testimonials, features)
            new_data[k] = [
                process_markdown_fields(item) if isinstance(item, dict) else item
                for item in v
            ]

    return new_data
