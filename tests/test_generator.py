"""Tests for page generator."""

import os
import tempfile
import pytest
from generator import Generator


def test_render_page_creates_html(template_dir):
    """Rendering a page creates an HTML file."""
    with tempfile.TemporaryDirectory() as tmpdir:
        gen = Generator(template_dir, tmpdir, {"site": {"base_url": "/"}})

        page_data = {
            "config": {"url": "/test-page", "lang": "en", "layout": "base.html"},
            "meta": {"title": "Test Page", "description": "A test"},
            "translations": {},
            "sidebar": {},
            "relationships": {},
            "blocks": [],
        }

        gen.render_page(page_data, "test.toml", [], [])

        output_path = os.path.join(tmpdir, "test-page", "index.html")
        assert os.path.exists(output_path)

        with open(output_path, "r") as f:
            html = f.read()
        assert "Test Page" in html


def test_render_page_root(template_dir):
    """Root URL (/) creates index.html in output root."""
    with tempfile.TemporaryDirectory() as tmpdir:
        gen = Generator(template_dir, tmpdir, {"site": {"base_url": "/"}})

        page_data = {
            "config": {"url": "/", "lang": "en", "layout": "base.html"},
            "meta": {"title": "Home", "description": "Homepage"},
            "translations": {},
            "sidebar": {},
            "relationships": {},
            "blocks": [],
        }

        gen.render_page(page_data, "home.toml", [], [])

        output_path = os.path.join(tmpdir, "index.html")
        assert os.path.exists(output_path)


def test_render_block(template_dir):
    """A known block template renders without error."""
    with tempfile.TemporaryDirectory() as tmpdir:
        gen = Generator(template_dir, tmpdir, {"site": {"base_url": "/"}})

        page_data = {
            "config": {"url": "/block-test", "lang": "en", "layout": "base.html"},
            "meta": {"title": "Block Test", "description": "Test"},
            "translations": {},
            "sidebar": {},
            "relationships": {},
            "blocks": [
                {
                    "type": "text",
                    "original_key": "text",
                    "data": {"title": "Hello", "body": "<p>World</p>"},
                }
            ],
        }

        gen.render_page(page_data, "test.toml", [], [])

        output_path = os.path.join(tmpdir, "block-test", "index.html")
        assert os.path.exists(output_path)

        with open(output_path, "r") as f:
            html = f.read()
        assert "Hello" in html


def test_missing_block_template_non_strict(template_dir):
    """Missing block template in non-strict mode adds HTML comment."""
    with tempfile.TemporaryDirectory() as tmpdir:
        gen = Generator(template_dir, tmpdir, {"site": {"base_url": "/"}})

        page_data = {
            "config": {"url": "/missing-block", "lang": "en", "layout": "base.html"},
            "meta": {"title": "Test", "description": "Test"},
            "translations": {},
            "sidebar": {},
            "relationships": {},
            "blocks": [
                {"type": "nonexistent-block-xyz", "data": {"title": "X"}},
            ],
        }

        # Should not raise
        gen.render_page(page_data, "test.toml", [], [])
        output_path = os.path.join(tmpdir, "missing-block", "index.html")
        assert os.path.exists(output_path)
