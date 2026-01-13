"""
CMS Generator - Renders pages from content data and templates.

Strict mode: fails if a block template is missing.
Navigation is auto-generated from directory structure.
"""

import os
import sys
from jinja2 import Environment, FileSystemLoader, select_autoescape, TemplateNotFound
from typing import Dict, Any, List, Optional


class Generator:
    def __init__(self, template_dir: str, output_dir: str, site_config: Dict[str, Any] = None, strict: bool = False):
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        self.output_dir = output_dir
        self.site_config = site_config or {}
        self.strict = strict

    def render_page(
        self,
        page_data: Dict[str, Any],
        filename: str,
        sitemap: List[Dict],
        navigation: Optional[List[Dict]] = None
    ):
        """
        Render a page and save it to the output directory.

        Args:
            page_data: Parsed content data with config, meta, blocks
            filename: Original filename (for error messages)
            sitemap: List of all pages for internal linking
            navigation: Auto-generated navigation tree
        """
        # Determine layout
        layout_name = page_data.get("config", {}).get("layout", "base.html")

        # Prepare context
        context = {
            "site": self.site_config.get("site", {}),
            "config": page_data.get("config", {}),
            "meta": page_data.get("meta", {}),
            "translations": page_data.get("translations", {}),
            "blocks": [],
            "sitemap": sitemap,
            "navigation": navigation or []
        }

        # Render each block
        for block in page_data.get("blocks", []):
            block_type = block["type"]
            template_name = f"blocks/{block_type}.html"

            try:
                template = self.env.get_template(template_name)
                rendered_block = template.render(data=block["data"])
                context["blocks"].append(rendered_block)
            except TemplateNotFound:
                error_msg = f"Missing template: {template_name}"
                if self.strict:
                    raise RuntimeError(error_msg)
                print(f"  ⚠ {error_msg}")
                context["blocks"].append(f"<!-- {error_msg} -->")
            except Exception as e:
                error_msg = f"Error rendering block '{block_type}': {e}"
                if self.strict:
                    raise RuntimeError(error_msg)
                print(f"  ⚠ {error_msg}")
                context["blocks"].append(f"<!-- {error_msg} -->")

        # Render the full page
        try:
            layout = self.env.get_template(f"layouts/{layout_name}")
        except TemplateNotFound:
            error_msg = f"Missing layout: layouts/{layout_name}"
            if self.strict:
                raise RuntimeError(error_msg)
            print(f"  ⚠ {error_msg}")
            return

        final_html = layout.render(**context)

        # Determine output path from URL
        url = page_data.get("config", {}).get("url", "")
        if url == "/" or url == "":
            output_path = os.path.join(self.output_dir, "index.html")
        else:
            clean_url = url.strip("/")
            output_path = os.path.join(self.output_dir, clean_url, "index.html")

        # Create parent directories if needed
        parent_dir = os.path.dirname(output_path)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(final_html)

        print(f"  ✓ {output_path}")
