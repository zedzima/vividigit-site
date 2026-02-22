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

### Task-Picker Block (Service Pages)
Interactive task selector displayed in main content area.

**Card structure (collapsed):**
- Custom checkbox (left) + task title + badges (door_opener, delivery_type) + expand chevron (right)
- Description text below title
- Background: `--bg-secondary`, border: `--border-color`, radius: `--radius-lg`

**Card structure (expanded):**
- Deliverables: checklist with accent-colored check icons
- Tier selector: grid of buttons (S/M/L/XL) with name, label, and price
- Active tier: accent border + gradient background (`rgba(124,58,237,0.06)`)

**States:**
- `.selected`: accent border + box-shadow highlight
- `.expanded`: chevron rotates 180°, details panel slides open via `grid-template-rows: 0fr → 1fr`
- Door opener (`.task-picker-opener`): purple-tinted border, pre-expanded + pre-selected

**Badges:**
- Door Opener: gradient background (purple), accent text
- Delivery type: tertiary background, secondary text

### Order Cart Sidebar (Service Pages, `type = "order-cart"`)
Right sidebar showing live order summary, driven by task-picker events.

**Cart items:**
- Each line: task title + tier label (left) | price + remove button (right)
- Empty state: centered muted message "Select tasks below to build your order."

**Modifiers section** (hidden until tasks selected):
- Language counter: label + fee + (−/+) buttons with value display
- Country counter: same layout
- Counters use `--bg-tertiary` background, `--radius-sm` buttons

**Totals section** (hidden until tasks selected):
- Subtotal row, Modifier fees row, Total row (bold, accent color)
- "From $X" prefix when any task has custom pricing

**CTA:**
- Full-width primary button ("Request Quote")
- Note text below in muted caption

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

## Page Type Layouts

### Specialist Page
- Hero: name + role + photo
- Stats row: project-oriented metrics (projects/cases/articles in card UI)
- Tasks grid: cards of tasks this specialist performs
- Languages/Countries: badge rows
- Cases: carousel of case studies this specialist worked on
- Right sidebar: "Book Consultation" CTA, availability info

### Case Page
- Hero: project name + client + industry tag
- Results: metric cards (value + label + timeframe)
- Problem/Solution: two-column or sequential narrative
- Tasks & Services used: linked badge list
- Specialist attribution: small profile card
- Testimonial: styled quote block
- Right sidebar: "Similar Services" links, results summary

### Category Pillar Page
- Hero: category name + description
- Door opener CTA: prominent block featuring the entry-point task with price
- Services in this category: cards with task counts
- Featured tasks: grid of key tasks
- Right sidebar: "Start with [door opener task]" CTA

### Blog Post Page
- Hero: title + publication date + author (specialist link) + content type badge
- Body: Markdown-rendered article content
- Related entities: auto-generated links to categories, services, specialists
- Card template: `blocks/cards/blog-post-card.html` for related-entities rendering
- Right sidebar: default CTA + contact form (same as other listing items)
