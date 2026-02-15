"""Tests for content parser."""

import os
import pytest
from parser import load_file, process_content, parse_markdown


def test_load_toml_file(content_dir):
    """Loading a real TOML file returns config, meta, blocks."""
    # Use a service page that has actual blocks
    filepath = os.path.join(content_dir, "services", "technical-seo", "technical-seo.en.toml")
    data = load_file(filepath)

    assert "config" in data
    assert "meta" in data
    assert "blocks" in data
    assert isinstance(data["blocks"], list)
    assert len(data["blocks"]) > 0


def test_process_content_extracts_blocks():
    """Non-system keys become blocks."""
    raw = {
        "config": {"slug": "test"},
        "meta": {"title": "Test"},
        "hero": {"title": "Hero Title", "subtitle": "Sub"},
        "features": {"title": "Features", "items": []},
    }
    result = process_content(raw)

    assert len(result["blocks"]) == 2
    types = {b["type"] for b in result["blocks"]}
    assert "hero" in types
    assert "features" in types


def test_system_fields_not_blocks():
    """System sections must not appear as blocks."""
    raw = {
        "config": {"slug": "test"},
        "meta": {"title": "Test"},
        "sidebar": {"type": "order-cart"},
        "tags": {"categories": ["seo"]},
        "relationships": {"specialists": ["ivan"]},
        "translations": {"de": "/de/test"},
    }
    result = process_content(raw)
    assert len(result["blocks"]) == 0
    assert result["sidebar"] == {"type": "order-cart"}
    assert result["tags"] == {"categories": ["seo"]}
    assert result["relationships"] == {"specialists": ["ivan"]}


def test_markdown_fields_converted():
    """Fields named 'body' or 'content' get markdown conversion."""
    raw = {
        "config": {"slug": "test"},
        "meta": {"title": "Test"},
        "article": {"body": "**bold text**", "title": "Article"},
    }
    result = process_content(raw)
    block = result["blocks"][0]
    assert "<strong>bold text</strong>" in block["data"]["body"]


def test_block_naming_convention():
    """Block 'text_problem' should have type 'text' and original_key 'text_problem'."""
    raw = {
        "config": {"slug": "test"},
        "meta": {"title": "Test"},
        "text_problem": {"title": "Problem", "body": "Description"},
    }
    result = process_content(raw)
    block = result["blocks"][0]
    assert block["type"] == "text"
    assert block["original_key"] == "text_problem"


def test_load_markdown_file(content_dir):
    """Loading a markdown file creates an article block."""
    md_files = []
    for root, dirs, files in os.walk(content_dir):
        dirs[:] = [d for d in dirs if not d.startswith('_') and not d.startswith('.')]
        for f in files:
            if f.endswith('.en.md'):
                md_files.append(os.path.join(root, f))

    if not md_files:
        pytest.skip("No markdown files found")

    data = load_file(md_files[0])
    assert "blocks" in data
    assert any(b["type"] == "article" for b in data["blocks"])


def test_parse_markdown_empty():
    """Empty string returns empty string."""
    assert parse_markdown("") == ""


def test_load_nonexistent_file():
    """Loading a missing file raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        load_file("/nonexistent/path.toml")
