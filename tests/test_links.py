"""Link checker: validates internal links in built HTML pages."""

import os
import re
import pytest

CMS_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(CMS_ROOT, "public")


def get_all_html_files():
    """Collect all HTML files in public/."""
    html_files = []
    for root, dirs, files in os.walk(PUBLIC_DIR):
        for f in files:
            if f.endswith(".html"):
                html_files.append(os.path.join(root, f))
    return html_files


def extract_internal_links(html_content):
    """Extract internal href values from HTML (excludes script blocks)."""
    # Remove <script> blocks to avoid parsing JS template literals as links
    cleaned = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL)
    # Only match <a href="..."> (not <link>, <base>, etc.)
    hrefs = re.findall(r'<a\s[^>]*href=["\']([^"\']+)["\']', cleaned)
    internal = []
    for href in hrefs:
        if href.startswith(("http://", "https://", "mailto:", "tel:", "javascript:", "#")):
            continue
        if href.startswith(("data:", "${")):
            continue
        internal.append(href)
    return internal


def resolve_link(href, public_dir):
    """Check if an internal link resolves to an existing file."""
    # Strip anchor
    href = href.split("#")[0]
    if not href:
        return True

    # Strip query params
    href = href.split("?")[0]

    # Normalize path
    clean = href.strip("/")
    if not clean:
        # Root link
        return os.path.exists(os.path.join(public_dir, "index.html"))

    # Try as directory with index.html
    dir_path = os.path.join(public_dir, clean, "index.html")
    if os.path.exists(dir_path):
        return True

    # Try as exact file
    file_path = os.path.join(public_dir, clean)
    if os.path.exists(file_path):
        return True

    # Try with .html extension
    html_path = os.path.join(public_dir, clean + ".html")
    if os.path.exists(html_path):
        return True

    return False


def test_internal_links_resolve():
    """All internal links in built HTML should resolve to existing files."""
    if not os.path.exists(PUBLIC_DIR):
        pytest.skip("public/ directory not found — run build first")

    html_files = get_all_html_files()
    if not html_files:
        pytest.skip("No HTML files in public/")

    broken = []
    checked = 0

    for html_file in html_files:
        with open(html_file, "r", encoding="utf-8") as f:
            content = f.read()

        page_path = os.path.relpath(html_file, PUBLIC_DIR)
        links = extract_internal_links(content)

        for link in links:
            checked += 1
            if not resolve_link(link, PUBLIC_DIR):
                broken.append(f"  {page_path}: {link}")

    # Report all broken links
    if broken:
        report = f"\n{len(broken)} broken links found (out of {checked} checked):\n"
        report += "\n".join(broken[:50])  # Show first 50
        if len(broken) > 50:
            report += f"\n  ... and {len(broken) - 50} more"
        pytest.fail(report)
