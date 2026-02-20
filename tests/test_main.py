"""Tests for build system (main.py)."""

import os
import pytest
from main import (
    get_url_from_path,
    find_content_files,
    get_page_blocks,
    validate_page_blocks,
    get_available_blocks,
    build_tag_index,
    build_relationship_graph,
    build_bidirectional_map,
    inject_related_blocks,
    resolve_related_entities,
    load_tasks,
    resolve_task_pickers,
    configure_paths,
)


def test_url_from_path_home(content_dir):
    """home.en.toml maps to /."""
    filepath = os.path.join(content_dir, "home.en.toml")
    assert get_url_from_path(filepath, content_dir) == "/"


def test_url_from_path_listing(content_dir):
    """services/services.en.toml maps to /services."""
    filepath = os.path.join(content_dir, "services", "services.en.toml")
    assert get_url_from_path(filepath, content_dir) == "/services"


def test_url_from_path_item(content_dir):
    """services/technical-seo/technical-seo.en.toml maps to /services/technical-seo."""
    filepath = os.path.join(content_dir, "services", "technical-seo", "technical-seo.en.toml")
    assert get_url_from_path(filepath, content_dir) == "/services/technical-seo"


def test_find_content_files_skips_underscore(content_dir):
    """Directories starting with _ are skipped."""
    files = find_content_files(content_dir, "en")
    paths = [f["filepath"] for f in files]
    assert not any("/_tasks/" in p or "\\_tasks\\" in p for p in paths)
    assert not any("/_global/" in p or "\\_global\\" in p for p in paths)


def test_find_content_files_finds_pages(content_dir):
    """Should find real content pages."""
    files = find_content_files(content_dir, "en")
    urls = [f["url"] for f in files]
    assert "/" in urls or any(u.startswith("/") for u in urls)
    assert len(files) > 0


def test_get_page_blocks_from_blocks_array():
    """get_page_blocks reads from blocks[] array after parser processing."""
    data = {
        "config": {"slug": "test"},
        "meta": {"title": "Test"},
        "blocks": [
            {"type": "hero", "data": {"title": "Hero"}},
            {"type": "features", "data": {"title": "Features"}},
        ],
    }
    blocks = get_page_blocks(data)
    assert blocks == {"hero", "features"}


def test_get_page_blocks_normalizes_underscores():
    """Block type with underscores is normalized to hyphens."""
    data = {
        "blocks": [
            {"type": "services_grid", "data": {}},
        ],
    }
    blocks = get_page_blocks(data)
    assert "services-grid" in blocks


def test_get_page_blocks_empty():
    """No blocks returns empty set."""
    assert get_page_blocks({"blocks": []}) == set()
    assert get_page_blocks({}) == set()


def test_validate_page_blocks_valid():
    """Valid blocks produce no errors."""
    available = {"hero", "features", "cta"}
    page_blocks = {"hero", "features"}
    errors = validate_page_blocks(page_blocks, available, "test.toml")
    assert errors == []


def test_validate_page_blocks_missing():
    """Missing template produces error."""
    available = {"hero", "features"}
    page_blocks = {"hero", "nonexistent-block"}
    errors = validate_page_blocks(page_blocks, available, "test.toml")
    assert len(errors) == 1
    assert "nonexistent-block" in errors[0]


def test_available_blocks_exist(cms_root):
    """Block templates directory has templates."""
    # configure_paths sets global BLOCKS_DIR needed by get_available_blocks()
    configure_paths("vividigit")
    blocks = get_available_blocks()
    assert len(blocks) > 0
    assert "hero" in blocks


def test_build_tag_index():
    """Tag index groups services by tag dimensions."""
    pages = [
        {
            "data": {
                "config": {"type": "service", "slug": "seo"},
                "tags": {"categories": ["seo"], "industries": ["ecommerce"]},
            }
        },
        {
            "data": {
                "config": {"type": "service", "slug": "ppc"},
                "tags": {"categories": ["ppc"], "industries": ["ecommerce"]},
            }
        },
    ]
    index = build_tag_index(pages)
    assert "seo" in index["categories"]
    assert "ppc" in index["categories"]
    assert "ecommerce" in index["industries"]
    assert len(index["industries"]["ecommerce"]) == 2


# --- Phase 2: Graph tests ---

def test_build_relationship_graph():
    """Graph includes nodes with relationships."""
    pages = [
        {
            "is_listing": False,
            "data": {
                "config": {"slug": "seo", "type": "service", "url": "/services/seo"},
                "meta": {"title": "SEO", "description": "SEO service"},
                "relationships": {"specialists": ["ivan"]},
                "blocks": [],
            },
        },
        {
            "is_listing": False,
            "data": {
                "config": {"slug": "ivan", "type": "specialist", "url": "/team/ivan"},
                "meta": {"title": "Ivan", "description": "Specialist"},
                "relationships": {"cases": ["case-1"]},
                "blocks": [],
            },
        },
        {
            "is_listing": True,
            "data": {
                "config": {"slug": "services", "url": "/services"},
                "meta": {"title": "Services"},
                "blocks": [],
            },
        },
    ]
    graph = build_relationship_graph(pages)
    assert "seo" in graph
    assert "ivan" in graph
    assert "services" not in graph  # Listing pages excluded
    assert graph["seo"]["relationships"]["specialists"] == ["ivan"]


def test_resolve_related_entities():
    """Related-entities block with source auto-populates from graph."""
    pages = [
        {
            "data": {
                "config": {"slug": "seo"},
                "relationships": {"specialists": ["ivan"]},
                "blocks": [
                    {
                        "type": "related-entities",
                        "data": {"source": "specialists", "title": "Our Team"},
                    }
                ],
            },
        },
    ]
    graph = {
        "seo": {
            "type": "service",
            "url": "/services/seo",
            "title": "SEO",
            "description": "SEO service",
            "relationships": {"specialists": ["ivan"]},
        },
        "ivan": {
            "type": "specialist",
            "url": "/team/ivan",
            "title": "Ivan Petrov",
            "description": "SEO Specialist",
            "relationships": {},
        },
    }
    resolve_related_entities(pages, graph)
    items = pages[0]["data"]["blocks"][0]["data"]["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Ivan Petrov"
    assert items[0]["url"] == "/team/ivan"


def test_resolve_related_entities_manual_items_preserved():
    """Manual items are not overwritten by auto-resolve."""
    pages = [
        {
            "data": {
                "config": {"slug": "seo"},
                "relationships": {"specialists": ["ivan"]},
                "blocks": [
                    {
                        "type": "related-entities",
                        "data": {
                            "source": "specialists",
                            "items": [{"title": "Custom", "url": "/custom"}],
                        },
                    }
                ],
            },
        },
    ]
    graph = {"seo": {"type": "service", "url": "/", "title": "SEO", "description": "", "relationships": {"specialists": ["ivan"]}}}
    resolve_related_entities(pages, graph)
    items = pages[0]["data"]["blocks"][0]["data"]["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Custom"


# --- Phase 3: Task tests ---

def test_load_tasks(cms_root):
    """Task loader finds tasks in _tasks/ directory."""
    tasks_dir = os.path.join(cms_root, "sites", "vividigit", "content", "_tasks")
    tasks = load_tasks(tasks_dir, "en")
    assert len(tasks) >= 2
    assert "site-audit" in tasks
    task = tasks["site-audit"]
    assert task["slug"] == "site-audit"
    assert task["door_opener"] is True
    assert len(task["tiers"]) > 0


def test_resolve_task_pickers_auto_tasks():
    """auto_tasks field populates task-picker from loaded tasks."""
    pages = [
        {
            "data": {
                "config": {"slug": "seo"},
                "blocks": [
                    {
                        "type": "task-picker",
                        "data": {
                            "title": "Tasks",
                            "auto_tasks": ["audit", "research"],
                        },
                    }
                ],
            },
        },
    ]
    tasks = {
        "audit": {"slug": "audit", "title": "Audit", "tiers": [{"name": "S", "price": 500}]},
        "research": {"slug": "research", "title": "Research", "tiers": []},
    }
    resolve_task_pickers(pages, tasks)
    result = pages[0]["data"]["blocks"][0]["data"]["tasks"]
    assert len(result) == 2
    assert result[0]["slug"] == "audit"


def test_resolve_task_pickers_inline_preserved():
    """Inline task definitions with tiers are preserved (not overwritten)."""
    inline_task = {
        "slug": "audit",
        "title": "Custom Audit",
        "tiers": [{"name": "S", "price": 999}],
    }
    pages = [
        {
            "data": {
                "config": {"slug": "seo"},
                "blocks": [
                    {
                        "type": "task-picker",
                        "data": {"title": "Tasks", "tasks": [inline_task]},
                    }
                ],
            },
        },
    ]
    tasks = {"audit": {"slug": "audit", "title": "Default Audit", "tiers": [{"name": "S", "price": 500}]}}
    resolve_task_pickers(pages, tasks)
    result = pages[0]["data"]["blocks"][0]["data"]["tasks"]
    assert result[0]["title"] == "Custom Audit"
    assert result[0]["tiers"][0]["price"] == 999


# --- Phase 2b: Bidirectional map tests ---

def test_bidirectional_map_forward_relationships():
    """Forward relationships are included in the map."""
    pages = [
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist", "url": "/team/ivan"},
                  "meta": {"title": "Ivan", "description": "Specialist"},
                  "sidebar": {"role": "SEO", "rating": 4.9, "projects": 47, "hourly_rate": 75},
                  "relationships": {"cases": ["case-1"], "languages": ["english"]}}},
        {"url": "/cases/case-1", "collection": "cases", "is_listing": False,
         "data": {"config": {"slug": "case-1", "type": "case", "url": "/cases/case-1"},
                  "meta": {"title": "Case 1", "description": "A case study"},
                  "sidebar": {}, "relationships": {"specialists": ["ivan"]}}},
        {"url": "/languages/english", "collection": "languages", "is_listing": False,
         "data": {"config": {"slug": "english", "type": "language", "url": "/languages/english"},
                  "meta": {"title": "English", "description": "English language"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result, _ = build_bidirectional_map(pages)
    # Ivan has forward link to case-1
    assert any(e["slug"] == "case-1" for e in result["ivan"]["cases"])


def test_bidirectional_map_reverse_relationships():
    """Reverse relationships are computed from other pages."""
    pages = [
        {"url": "/services/seo", "collection": "services", "is_listing": False,
         "data": {"config": {"slug": "seo", "type": "service", "url": "/services/seo"},
                  "meta": {"title": "SEO", "description": "SEO service"},
                  "sidebar": {}, "relationships": {"specialists": ["ivan"]},
                  "tags": {"categories": ["seo-cat"]}}},
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist", "url": "/team/ivan"},
                  "meta": {"title": "Ivan", "description": "Specialist"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result, _ = build_bidirectional_map(pages)
    # Ivan gets reverse link to SEO service
    assert any(e["slug"] == "seo" for e in result["ivan"]["services"])


def test_bidirectional_map_via_tags():
    """Tag-based relationships (service tagged with category) create reverse links."""
    pages = [
        {"url": "/services/seo", "collection": "services", "is_listing": False,
         "data": {"config": {"slug": "seo", "type": "service", "url": "/services/seo"},
                  "meta": {"title": "SEO", "description": "SEO service"},
                  "sidebar": {}, "relationships": {},
                  "tags": {"categories": ["seo-cat"]}}},
        {"url": "/categories/seo-cat", "collection": "categories", "is_listing": False,
         "data": {"config": {"slug": "seo-cat", "type": "category", "url": "/categories/seo-cat"},
                  "meta": {"title": "SEO Category", "description": "SEO"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result, _ = build_bidirectional_map(pages)
    # Category gets reverse link from service tag
    assert any(e["slug"] == "seo" for e in result["seo-cat"]["services"])


def test_bidirectional_map_skips_listing_pages():
    """Listing pages are excluded from the map."""
    pages = [
        {"url": "/services", "collection": "services", "is_listing": True,
         "data": {"config": {"slug": "services", "type": "service", "url": "/services"},
                  "meta": {"title": "Services", "description": "All services"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result, _ = build_bidirectional_map(pages)
    assert "services" not in result


def test_bidirectional_map_empty_relations_omitted():
    """Entity types with no relations are not keys in the map entry."""
    pages = [
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist", "url": "/team/ivan"},
                  "meta": {"title": "Ivan", "description": "Specialist"},
                  "sidebar": {}, "relationships": {}}},
    ]
    result, _ = build_bidirectional_map(pages)
    assert result["ivan"] == {}


# --- Phase 2b: inject_related_blocks tests ---

def test_inject_related_blocks_adds_sections():
    """Related blocks are injected with correct sections."""
    pages = [
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist"},
                  "blocks": [
                      {"type": "hero", "data": {}, "original_key": "hero"},
                      {"type": "cta", "data": {}, "original_key": "cta"},
                  ]}},
    ]
    bi_map = {
        "ivan": {
            "services": [{"slug": "seo", "title": "SEO", "url": "/services/seo"}],
            "cases": [{"slug": "case-1", "title": "Case 1", "url": "/cases/case-1"}],
        }
    }
    inject_related_blocks(pages, bi_map)
    block_types = [b["type"] for b in pages[0]["data"]["blocks"]]
    assert "related-entities" in block_types
    # Injected before CTA (last block)
    assert block_types[-1] == "cta"
    assert block_types[-2] == "related-entities"


def test_inject_related_blocks_skips_listing():
    """Listing pages don't get related blocks."""
    pages = [
        {"url": "/services", "collection": "services", "is_listing": True,
         "data": {"config": {"slug": "services"}, "blocks": []}},
    ]
    inject_related_blocks(pages, {})
    assert len(pages[0]["data"]["blocks"]) == 0


def test_inject_related_blocks_skips_no_relations():
    """Pages with no relations get no block."""
    pages = [
        {"url": "/team/ivan", "collection": "team", "is_listing": False,
         "data": {"config": {"slug": "ivan", "type": "specialist"},
                  "blocks": [{"type": "hero", "data": {}, "original_key": "hero"}]}},
    ]
    inject_related_blocks(pages, {})
    assert len(pages[0]["data"]["blocks"]) == 1
