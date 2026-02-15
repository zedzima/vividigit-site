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
    resolve_related_entities,
    load_tasks,
    resolve_task_pickers,
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
    os.chdir(cms_root)
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
    os.chdir(cms_root)
    tasks_dir = os.path.join(cms_root, "content", "_tasks")
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
