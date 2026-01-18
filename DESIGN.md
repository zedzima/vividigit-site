# Design Specifications

## Typography Rules

**CRITICAL: All text sizes must be consistent across the entire site.**

| Element | Variable | Base Size | Notes |
|---------|----------|-----------|-------|
| Body text | `--font-size-body` | 14px | Main content, paragraphs |
| UI elements | `--font-size-ui` | 13px | Buttons, labels, ALL sidebar text |
| Captions | `--font-size-caption` | 11px | Small labels, hints |
| H1 | `--font-size-h1` | 32px | Page titles |
| H2 | `--font-size-h2` | 24px | Section titles |
| H3 | `--font-size-h3` | 18px | Subsections |
| H4 | `--font-size-h4` | 15px | Subheadings |
| Display | `--font-size-display` | 48px | Hero numbers, stats |

### Sidebar Text Rules
- Sidebar text must NOT be larger than main content text
- Use `--font-size-ui` (13px) for sidebar labels, buttons, widget titles
- Use `--font-size-caption` (11px) for secondary info
- **Never use --font-size-body in sidebars** - it's for main content only

### DO NOT
- Add custom font-size multipliers (like `* 0.9`)
- Use different font sizes for same element types
- Make sidebar text larger than content text

## Spacing Rules

- Use CSS variables for all spacing: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`
- Don't add custom multipliers to spacing
- Keep padding/margins consistent between similar widgets

## Right Sidebar (Action Sidebar)

- Must fit on 13" laptop screen without scrollbar
- Use compact spacing but don't shrink fonts artificially
- If content doesn't fit, reduce number of widgets, not font sizes

## Left Sidebar (Navigation)

- Icon bar: 64px width, always visible on desktop (>800px)
- Nav panel: 200px width, appears on hover showing only hovered section's items
- Hidden on mobile (<800px), opens via menu button

## Responsive Breakpoints

| Breakpoint | Left Sidebar | Right Sidebar |
|------------|--------------|---------------|
| >1400px | Icon bar visible | Visible |
| 800-1400px | Icon bar visible | Hidden (button in header) |
| <800px | Hidden (button) | Hidden (button) |
