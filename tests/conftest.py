"""Shared fixtures for CMS tests."""

import os
import sys
import pytest

# Add core/src to path (sources moved from src/ to core/src/)
CMS_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(CMS_ROOT, "core", "src"))

# Site-specific paths (content and templates moved under sites/ and themes/)
SITE_NAME = "vividigit"
CONTENT_DIR = os.path.join(CMS_ROOT, "sites", SITE_NAME, "content")
TEMPLATE_DIR = os.path.join(CMS_ROOT, "themes", SITE_NAME, "templates")
OUTPUT_DIR = os.path.join(CMS_ROOT, "public")


@pytest.fixture
def cms_root():
    return CMS_ROOT


@pytest.fixture
def content_dir():
    return CONTENT_DIR


@pytest.fixture
def template_dir():
    return TEMPLATE_DIR


@pytest.fixture
def output_dir():
    return OUTPUT_DIR
