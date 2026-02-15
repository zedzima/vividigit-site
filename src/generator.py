"""
CMS Generator - Renders pages from content data and templates.

Strict mode: fails if a block template is missing.
Navigation is auto-generated from directory structure.
"""

import os
import sys
import re
from jinja2 import Environment, FileSystemLoader, select_autoescape, TemplateNotFound
from markupsafe import Markup
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
        self.icons_dir = os.path.join(os.path.dirname(template_dir), "assets", "icons")

        # Register global icon function
        self.env.globals['icon'] = self._icon_func

    def _icon_func(self, name: str, size: int = 24, gradient: bool = True) -> str:
        """
        Load SVG icon by name and optionally apply gradient.
        Usage in templates: {{ icon('tech') }} or {{ icon('check', 16, false) }}
        """
        icon_path = os.path.join(self.icons_dir, f"{name}.svg")
        if not os.path.exists(icon_path):
            return f'<!-- Icon not found: {name} -->'

        with open(icon_path, 'r', encoding='utf-8') as f:
            svg = f.read()

        # Strip width/height from <svg> tag only (not from inner elements like <rect>)
        svg = re.sub(r'(<svg[^>]*?)\s+width="[^"]*"', r'\1', svg, count=1)
        svg = re.sub(r'(<svg[^>]*?)\s+height="[^"]*"', r'\1', svg, count=1)

        # Add size and class
        svg = re.sub(
            r'<svg([^>]*)>',
            f'<svg\\1 width="{size}" height="{size}" class="icon icon-{name}">',
            svg,
            count=1
        )

        # Apply gradient stroke if enabled
        if gradient:
            # Generate unique ID for this icon instance
            import random
            uid = f"icon-grad-{random.randint(1000, 9999)}"

            # Add gradient definition — use userSpaceOnUse to avoid degenerate
            # bounding boxes on vertical/horizontal lines (zero-width/height bbox
            # makes objectBoundingBox gradients invisible)
            gradient_def = f'''<defs><linearGradient id="{uid}" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" style="stop-color:var(--accent-start, #8b5cf6)"/>
                <stop offset="100%" style="stop-color:var(--accent-end, #6366f1)"/>
            </linearGradient></defs>'''

            svg = svg.replace('stroke="currentColor"', f'stroke="url(#{uid})"')
            svg = svg.replace('</svg>', f'{gradient_def}</svg>')

        return Markup(svg)

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
            "analytics": self.site_config.get("analytics", {}),
            "config": page_data.get("config", {}),
            "meta": page_data.get("meta", {}),
            "translations": page_data.get("translations", {}),
            "sidebar": page_data.get("sidebar", {}),
            "relationships": page_data.get("relationships", {}),
            "blocks": [],
            "sitemap": sitemap,
            "navigation": navigation or []
        }

        # Render each block
        for block in page_data.get("blocks", []):
            block_type = block["type"]
            original_key = block.get("original_key", block_type)

            # Try full name first (e.g., main_content.html), then shortened (e.g., main.html)
            template_names = [f"blocks/{original_key}.html"]
            if original_key != block_type:
                template_names.append(f"blocks/{block_type}.html")

            template = None
            template_name = None
            for tname in template_names:
                try:
                    template = self.env.get_template(tname)
                    template_name = tname
                    break
                except TemplateNotFound:
                    continue

            if template is None:
                error_msg = f"Missing template: {template_names}"
                if self.strict:
                    raise RuntimeError(error_msg)
                print(f"  ⚠ {error_msg}")
                context["blocks"].append(f"<!-- {error_msg} -->")
                continue

            try:
                # Pass block_type and site so templates can use them
                rendered_block = template.render(
                    data=block["data"],
                    block_type=block_type,
                    site=self.site_config.get("site", {})
                )
                context["blocks"].append(rendered_block)
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
