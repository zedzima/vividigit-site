"""Tests for CMS server endpoints."""

import os
import sys
import json
import pytest

from cms_server import app


@pytest.fixture
def client():
    """Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_admin_index_returns_200(client):
    """Admin dashboard returns 200."""
    response = client.get("/admin/")
    assert response.status_code == 200


def test_admin_blocks_returns_200(client):
    """Blocks library returns 200."""
    response = client.get("/admin/blocks")
    assert response.status_code == 200


def test_admin_media_returns_200(client):
    """Media library returns 200."""
    response = client.get("/admin/media")
    assert response.status_code == 200


def test_edit_page_home(client):
    """Editing home page returns 200."""
    response = client.get("/admin/pages/edit/home")
    assert response.status_code == 200


def test_edit_page_not_found(client):
    """Editing nonexistent page returns 404."""
    response = client.get("/admin/pages/edit/nonexistent-page-xyz")
    assert response.status_code == 404


def test_save_page_endpoint(client):
    """Save endpoint accepts JSON and returns success."""
    response = client.post(
        "/admin/pages/save/home",
        data=json.dumps({
            "config": {"lang": "en", "url": "/"},
            "meta": {"title": "Home", "description": "Test"},
        }),
        content_type="application/json",
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True


def test_media_upload_route_exists(client):
    """Media upload route responds (not 404)."""
    # POST without file should return error JSON, not 404
    response = client.post("/admin/media/upload")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is False
    assert "error" in data
