"""Shared fixtures for CMS tests."""

import os
import sys
import pytest

# Add src to path
CMS_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(CMS_ROOT, "src"))

CONTENT_DIR = os.path.join(CMS_ROOT, "content")
TEMPLATE_DIR = os.path.join(CMS_ROOT, "templates")
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
