import os
import tomllib
from jinja2 import Environment, FileSystemLoader, select_autoescape
from typing import Dict, Any

class Generator:
    def __init__(self, template_dir: str, output_dir: str, site_config: Dict[str, Any] = None):
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        self.output_dir = output_dir
        self.site_config = site_config or {}

    def render_page(self, page_data: Dict[str, Any], filename: str, sitemap: list):
        """Render a page and save it to the output directory."""
        # Determine layout
        layout_name = page_data.get("config", {}).get("layout", "base.html")
        
        # Prepare context
        context = {
            "site": self.site_config.get("site", {}),
            "config": page_data.get("config", {}),
            "meta": page_data.get("meta", {}),
            "translations": page_data.get("translations", {}),
            "blocks": [],
            "sitemap": sitemap
        }
        
        # Render each block
        for block in page_data.get("blocks", []):
            block_type = block["type"]
            template_name = f"blocks/{block_type}.html"
            
            try:
                template = self.env.get_template(template_name)
                rendered_block = template.render(data=block["data"])
                context["blocks"].append(rendered_block)
            except Exception as e:
                print(f"Warning: Could not render block '{block_type}': {e}")
                # Fallback or skip
                context["blocks"].append(f"<!-- Missing template for {block_type} -->")

        # Render the full page
        try:
            layout = self.env.get_template(f"layouts/{layout_name}")
            final_html = layout.render(**context)
            
            # Save to file
            # Handle URL structure if defined in config, otherwise use filename
            # For now, just use the filename (e.g. home.toml -> index.html if url is /)
            
            url = page_data.get("config", {}).get("url", "")
            if url == "/" or url == "":
                # Home page stays as index.html
                output_path = os.path.join(self.output_dir, "index.html")
            else:
                # Other pages: /services/ai-optimisation → /services/ai-optimisation/index.html
                # This allows clean URLs without .html extension
                clean_url = url.strip("/")
                output_path = os.path.join(self.output_dir, clean_url, "index.html")

            # Create parent directories if needed
            parent_dir = os.path.dirname(output_path)
            if parent_dir:
                os.makedirs(parent_dir, exist_ok=True)
            with open(output_path, "w") as f:
                f.write(final_html)
                
            print(f"Generated: {output_path}")
            
        except Exception as e:
            print(f"Error rendering page {filename}: {e}")
