# CMS User Guide

## 1. How to Add a New Page

To add a new page, create a new `.toml` (recommended) or `.yml` file in the `content/pages/` directory.

### Example: `content/pages/about.toml`

```toml
# Page Configuration
[config]
url = "/about"          # The URL where this page will be generated
lang = "en"             # Language code
layout = "base.html"    # Layout template to use (default: base.html)

# Page Metadata (SEO)
[meta]
title = "About Us"
description = "Learn more about our company."

# Content Blocks
# The order of blocks here determines the order on the page.

[hero]
h1 = "About Our Company"
text = "We are building the future of content management."

[main_content]
body = """
## Our Mission
To simplify web development.

## Our Vision
A world where content is easy to manage.
"""

[cta]
text = "Want to join us?"
button_label = "Careers"
button_url = "/careers"
```

This will generate `public/about/index.html`.

## 2. How to Add a New Block Template

To add a new block type (e.g., `[testimonial]`), you need to create a corresponding HTML template.

1.  **Create the content block** in your TOML/YAML file:
    ```toml
    [testimonial]
    quote = "This CMS is amazing!"
    author = "Jane Doe"
    ```

2.  **Create the template file** in `templates/blocks/`. The filename must match the block name (e.g., `testimonial.html`).

### Example: `templates/blocks/testimonial.html`

```html
<div class="testimonial-block">
    <blockquote>
        "{{ data.quote }}"
    </blockquote>
    <cite>- {{ data.author }}</cite>
</div>
```

The `data` variable contains all the fields you defined in your content block.

### Using Markdown in Blocks
If you have fields that contain Markdown (like `text`, `body`, `content`), they are automatically converted to HTML. You should use the `| safe` filter in Jinja2 to render them:

```html
<div class="content">
    {{ data.body | safe }}
</div>
```
