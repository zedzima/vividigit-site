# AI Optimisation Page Restructuring Design

**Date:** 2026-02-21
**Status:** Approved

## Summary

Split the current `ai-optimisation` service page (13 blocks) into two focused pages:
- **Service page** `/services/ai-optimisation` — task-focused, "what to buy"
- **Solution page** `/solutions/ai-visibility` — problem/solution narrative, "why you need it"

## Rationale

The current page mixes educational content (problem explanation, comparison, citation model) with transactional content (task picker, pricing, process). CRO best practices and competitor analysis show these serve different user intents:
- Users who already understand the problem want to see tasks and pricing quickly
- Users discovering the concept need education before they're ready to buy

Splitting separates intent. The solution page educates and funnels to the service page for purchase.

## Service Page: `/services/ai-optimisation`

8 blocks, task-focused. Tasks appear early (after logos) for users ready to buy.

| # | Block | Key | Content |
|---|-------|-----|---------|
| 1 | Hero | `hero` | Task-focused: "AI Optimisation" + stats + CTA to task-picker |
| 2 | Logos | `logos` | Client logos marquee (reused from current page) |
| 3 | Features | `features` | NEW — "What You Get": 4 cards previewing deliverables (Audit, Content Optimization, Entity SEO, Monitoring) |
| 4 | Task Picker | `task-picker` | Interactive task selector with tiers and pricing (reused) |
| 5 | Process | `process` | "How We Work" — simplified steps (reused) |
| 6 | Testimonials | `testimonials` | Client quotes with metrics (moved near pricing for CRO) |
| 7 | FAQ | `faq` | Practical questions (pricing, timelines, deliverables) |
| 8 | CTA | `cta` | Final conversion CTA |

**Sidebar:** order-cart (reused from current page)

### Changes from current page
- **Removed:** text_problem, features (educational), cards, comparison, text_failures, services_grid
- **Added:** NEW features block ("What You Get" — deliverables preview)
- **Moved:** testimonials closer to task-picker (CRO best practice)
- **Hero rewritten:** task-focused instead of problem-focused
- **FAQ rewritten:** practical instead of conceptual

## Solution Page: `/solutions/ai-visibility`

10 blocks, educational narrative. Explains the problem, builds understanding, then funnels to the service page.

| # | Block | Key | Content |
|---|-------|-----|---------|
| 1 | Hero | `hero` | "Your SEO Works. But AI Still Ignores You" (reused from current service hero) |
| 2 | Text | `text` | Problem — "Why AI Shows Competitors Instead of You" (from text_problem) |
| 3 | Features | `features` | "How AI Actually Chooses Sources" (from current features) |
| 4 | Cards | `cards` | Citation Readiness Model ACCDM (from current cards) |
| 5 | Comparison | `comparison` | SEO vs AI/LLM table (from current comparison) |
| 6 | Testimonials | `testimonials` | Same client quotes (shared content) |
| 7 | Pricing | `pricing` | Simple pricing block — "AI Visibility Audit from $500" + link to service page |
| 8 | FAQ | `faq` | Conceptual questions — how AI works, guarantees, expectations |
| 9 | CTA | `cta` | "Get Started" — links to service page task-picker |
| 10 | Related | (auto) | Related entities from graph |

**Sidebar:** order-cart with link to service

### Solution page structure follows existing pattern
Uses same format as `seo-ecommerce` solution: config, sidebar, links, tags, relationships, meta, then content blocks.

### Cross-linking
- Solution hero/CTA links to `/services/ai-optimisation#task-picker`
- Solution `[links].service = "ai-optimisation"`
- Service hero has secondary button linking to solution page

## Content Strategy

### What moves to solution
All educational/explanatory blocks: text_problem, features (how AI works), cards (ACCDM model), comparison, text_failures

### What stays in service
All transactional blocks: task-picker, process, testimonials, CTA. Plus new "What You Get" features block.

### What gets removed
- `services_grid` — self-referential, provides no value
- `text_failures` — merged into solution FAQ or dropped (redundant with text_problem)

### What gets rewritten
- **Service hero** — from problem statement to service description
- **Service FAQ** — from conceptual ("Can you guarantee citations?") to practical ("How long does the audit take?")
- **Service features** — entirely new block previewing deliverables

## Files Modified

| File | Action |
|------|--------|
| `services/ai-optimisation/ai-optimisation.en.toml` | Rewrite: keep task-picker/process/sidebar, new hero/features/FAQ/CTA |
| `solutions/ai-visibility/ai-visibility.en.toml` | Create: educational content from old service page |

## Backward Compatibility

- Service URL stays the same: `/services/ai-optimisation`
- Solution is a new page: `/solutions/ai-visibility`
- No breaking changes to existing links
- Task-picker anchor `#task-picker` still works on service page
- Existing solution pattern (seo-ecommerce) used as template
