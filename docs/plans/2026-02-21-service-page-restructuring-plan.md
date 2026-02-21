# AI Optimisation Page Restructuring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the `ai-optimisation` service page into a task-focused service page and an educational solution page.

**Architecture:** No code changes — pure content restructuring via TOML files. The CMS auto-discovers content by walking the content directory. Create a new solution folder, write the TOML, and rewrite the existing service TOML. Build to verify.

**Tech Stack:** TOML content files, Jinja2 templates (no changes), Python CMS builder (no changes)

**Design doc:** `docs/plans/2026-02-21-service-page-restructuring-design.md`

---

### Task 1: Create the solution page

**Files:**
- Create: `sites/vividigit/content/solutions/ai-visibility/ai-visibility.en.toml`

**Context:**
The solution page takes all educational content from the current `ai-optimisation` service page: the problem explanation, how AI works, citation readiness model, SEO vs AI comparison. It adds a simple pricing block that links to the service page for purchase.

Follow the pattern from `solutions/seo-ecommerce/seo-ecommerce.en.toml`: config with `type = "solution"`, sidebar, links, tags, relationships, meta, then content blocks.

**Step 1: Create solution directory and TOML file**

Create `sites/vividigit/content/solutions/ai-visibility/ai-visibility.en.toml` with this exact content:

```toml
# AI Visibility Solution
# Why AI ignores your business and how to fix it

[config]
lang = "en"
url = "/solutions/ai-visibility"
slug = "ai-visibility"
type = "solution"
menu = "AI Visibility"

[sidebar]
type = "order-cart"
title = "Your Order"
button_label = "Request Quote"
button_url = "contact?service=ai-optimisation"
note = "Estimated pricing. Final quote after brief."
extra_languages = true
language_fee = 200
extra_countries = true
country_fee = 100

[links]
service = "ai-optimisation"

[tags]
categories = ["aeo"]
countries = ["germany", "france", "usa", "uk"]
languages = ["english", "german", "french", "spanish", "russian", "chinese"]

[relationships]
specialists = ["ivan-petrov"]
cases = []

[meta]
title = "AI Visibility: Why AI Ignores Your Business & How to Fix It"
description = "Your SEO works but AI still ignores you. Understand how ChatGPT, Perplexity, and Claude choose sources — and what makes content citation-ready."
keywords = ["AI visibility", "AI citations", "ChatGPT citations", "LLM optimization", "citation-ready content", "AEO"]

# Hero Section
[hero]
style = "split"
tag = "solution"
h1 = "Your SEO Works. But AI Still Ignores You."
highlight = "AI Still Ignores You"
subtitle = "Search engines rank pages. AI generates explanations — then decides if your content is worth citing. Different game, different rules."
text = "We help businesses become citable sources in AI-generated answers."
button_label = "Get AI Visibility Audit"
button_url = "/services/ai-optimisation#task-picker"
button_secondary_label = "How It Works"
button_secondary_url = "#how-it-works"

[[hero.stats]]
value = "3%"
label = "of AI answers cite business sources"

[[hero.stats]]
value = "0"
label = "guaranteed citations (that's not how it works)"

[[hero.stats]]
value = "1"
label = "question at a time"

# The Problem - Text Block
[text]
tag = "text"
title = "Why AI Shows Competitors Instead of You"
centered = false
narrow = false

body = """
More companies are running into the same issue.

Their SEO performance is stable, their content ranks in search engines, yet when potential customers ask AI tools questions, **their business does not appear in the answer.**

Instead, AI responses often:

- Reference competitors
- Cite general informational websites
- Or include no business sources at all

The reason is not a sudden drop in quality. It lies in **how AI systems decide whether to reference external sources.**

Search engines ask: *"Which website should I show?"*

AI asks: *"Do I need a source to support this explanation — and if so, which one fits best?"*

Once this distinction is clear, AI citation behavior becomes much easier to understand.
"""

# How AI Works - Features Block
[features]
tag = "features"
title = "How AI Actually Chooses Sources"
subtitle = "AI doesn't browse the web like humans. It generates an answer first, then decides if a citation would help."

[[features.features]]
title = "AI Generates First, Cites Second"
icon = "1"
text = "The AI creates an explanation based on its understanding. Only after that does it decide whether adding a reference would make the answer clearer or more reliable. Your page is not recommended — it's used as supporting evidence."
list = ["Strong websites are often not cited", "Sales-focused pages are ignored", "Many answers contain no links at all"]

[[features.features]]
title = "Not All Questions Are Equal"
icon = "?"
text = "The same subject can produce very different answers depending on how it's framed. 'How does X work?' favors explanatory content. 'Who offers X?' favors directories. Most business content is written for commercial intent — but AI citations appear when explaining concepts."
list = ["How does X work? → Educational content wins", "Is X safe? → Trust signals matter", "Who offers X? → Directories, not landing pages"]

[[features.features]]
title = "AI Avoids Promotional Content"
icon = "x"
text = "AI systems are designed to be cautious. They avoid sources that prioritize persuasion over explanation. A page that explains first and sells later is far more likely to be cited than one that does the opposite."
list = ["Heavily promotional = ignored", "Unclear authorship = skipped", "Strong claims without explanation = avoided"]

# Citation Readiness Model - Cards
[cards]
tag = "model"
title = "The Citation Readiness Model"
subtitle = "Whether a website can be cited by AI comes down to five criteria. If any are missing, the page is unlikely to be used as a reference."

[[cards.cards]]
icon = "A"
title = "Accessibility"
text = "Easy to access and parse. Blocked or poorly structured pages are ignored before quality is even considered."

[[cards.cards]]
icon = "C"
title = "Credibility"
text = "Clear who created the content and why they're qualified. Anonymous pages are less likely to be cited."

[[cards.cards]]
icon = "C"
title = "Clarity"
text = "Key points stated directly. If the main idea requires interpretation, it's harder to reuse as a reference."

[[cards.cards]]
icon = "D"
title = "Distinctiveness"
text = "Something that's not interchangeable. Generic explanations give AI no reason to prefer your source."

[[cards.cards]]
icon = "M"
title = "Maintenance"
text = "Regularly updated. Outdated content is less reliable as a reference."

# Comparison Table - SEO vs AI/LLM
[comparison]
tag = "comparison"
title = "Why SEO Doesn't Translate to AI Visibility"
subtitle = "Strong rankings, keywords, and backlinks matter far less than whether content can support an explanation"
feature_label = "Factor"

[[comparison.options]]
name = "SEO"
description = "Search optimization"

[[comparison.options]]
name = "AI/LLM"
description = "Citation optimization"
highlighted = true
badge = "Different Game"

[[comparison.rows]]
feature = "What gets ranked/cited"
cells = ["Pages", "Explanations"]

[[comparison.rows]]
feature = "Primary signal"
cells = ["Keywords + backlinks", "Clarity + extractability"]

[[comparison.rows]]
feature = "Content goal"
cells = ["Rank for queries", "Support AI explanations"]

[[comparison.rows]]
feature = "Promotional content"
cells = ["Can rank well", "Usually ignored"]

[[comparison.rows]]
feature = "Structure importance"
cells = ["Moderate", "Critical"]

[[comparison.rows]]
feature = "Result type"
cells = ["List of 10 links", "One answer, 0-3 citations"]

[[comparison.rows]]
feature = "User behavior"
cells = ["Clicks through results", "Reads answer, may not click"]

[[comparison.rows]]
feature = "Visibility guarantee"
cells = ["Predictable with effort", "Probabilistic, context-dependent"]

[comparison.conclusion]
title = "Different systems, different strategies"
text = "AI visibility is not about control. It's about probability. You can't force citations, but you can make your content suitable for reuse."
button_label = "Check Your AI Visibility"
button_url = "/services/ai-optimisation#task-picker"

# Testimonials
[testimonials]
tag = "testimonials"
title = "What Clients Say"
subtitle = "Real feedback from businesses who invested in AI visibility"

[[testimonials.testimonials]]
quote = "We were skeptical at first — AI citations felt too unpredictable. But the audit revealed exactly where we were invisible and gave us a clear path forward."
name = "Marketing Director"
role = "Marketing"
company = "B2B SaaS Company"
metrics = [{ value = "40%", label = "increase in AI mentions" }]

[[testimonials.testimonials]]
quote = "Our content ranked well in search, but never appeared in AI answers. After restructuring based on the recommendations, we started getting cited within weeks."
name = "Content Lead"
role = "Content"
company = "Financial Services"
metrics = [{ value = "3x", label = "more AI citations" }]

[[testimonials.testimonials]]
quote = "The honest assessment was refreshing. They told us upfront that some of our pages wouldn't work for AI — and focused on the ones that could."
name = "Head of Growth"
role = "Growth"
company = "E-commerce Platform"
metrics = [{ value = "12", label = "pages optimized" }]

# Simple Pricing Block
[pricing]
tag = "pricing"
style = "simple"
yearly_discount = 0
one_time = true
monthly = false
yearly = false
title = "AI Visibility Audit"
subtitle = "Understand where you're invisible to AI — and what to fix first."
description = "Comprehensive analysis of how AI tools present your industry. We map which sources get cited, identify gaps in your content, and deliver a prioritized action plan."
price_prefix = "from"
price = 500
button_label = "Get Started"
button_url = "/services/ai-optimisation#task-picker"
button_secondary_label = "View All Tasks"
button_secondary_url = "/services/ai-optimisation"
note = "One-time audit. No ongoing commitment required."

# FAQ - Conceptual questions about AI visibility
[faq]
tag = "faq"
title = "Understanding AI Visibility"
subtitle = "How AI citation works and what to expect"
centered = true
contact_text = "Have a different question?"
contact_button = "Ask Us"
contact_url = "/contact"

[[faq.questions]]
question = "Can you guarantee our site will be cited by ChatGPT?"
answer = "No. And anyone who promises that is misleading you. AI citation is probabilistic, not controllable. What we can do is significantly increase the likelihood by making your content suitable for reuse as a reference. But there are no guarantees in this space."
open = true

[[faq.questions]]
question = "We already rank #1 for our keywords. Why isn't that enough?"
answer = "Search engines rank pages. AI generates explanations. These are fundamentally different systems. Your #1 ranking means Google thinks your page is relevant. It doesn't mean AI thinks your page is useful for supporting an explanation. Many top-ranking pages are never cited because they're promotional, poorly structured, or don't actually explain anything."

[[faq.questions]]
question = "How is this different from SEO?"
answer = "SEO optimizes for search rankings: keywords, backlinks, technical factors. AI optimization focuses on citation readiness: clarity, extractability, explanation quality. A page can rank well and never be cited. A page can rank poorly and be cited repeatedly. Different systems, different signals."

[[faq.questions]]
question = "What if AI just doesn't cite sources in our industry?"
answer = "This happens in some verticals. Part of the audit is determining whether citation opportunities exist at all. If AI consistently answers questions in your space without sources, we'll tell you — and recommend whether investing in this channel makes sense."

[[faq.questions]]
question = "How long before we see results?"
answer = "AI visibility changes are not instant. After implementing recommendations, it typically takes 4-8 weeks to see shifts in how AI tools reference your content. This isn't a switch you flip — it's positioning that builds over time."

# CTA
[cta]
style = "gradient"
tag = "cta"
title = "Want a Clear Picture of Your AI Visibility?"
text = "See how AI currently presents your business. Understand which sources it cites. Know what needs to change."
button_label = "View AI Optimisation Tasks"
button_url = "/services/ai-optimisation#task-picker"
button_secondary_label = "Read the Full Article"
button_secondary_url = "/blog/how-ai-chooses-sources"
note = "No guarantees. No fluff. Just clarity."
```

**Step 2: Commit**

```bash
git add sites/vividigit/content/solutions/ai-visibility/ai-visibility.en.toml
git commit -m "content: create AI Visibility solution page

Educational content split from ai-optimisation service page.
Covers problem explanation, citation readiness model, SEO vs AI comparison."
```

---

### Task 2: Rewrite the service page

**Files:**
- Modify: `sites/vividigit/content/services/ai-optimisation/ai-optimisation.en.toml`

**Context:**
Strip the educational content (moved to solution page). Keep: config, tags, relationships, translations, meta, sidebar. Rewrite: hero (task-focused), features (new "What You Get" deliverables preview), keep task-picker and process as-is, move testimonials after process, write new practical FAQ, update CTA.

**Step 1: Rewrite the service TOML**

Replace the entire content of `sites/vividigit/content/services/ai-optimisation/ai-optimisation.en.toml` with:

```toml
# AI Optimisation Service
# Task-focused service page for AI visibility optimization

[config]
encoding = "UTF-8"
lang = "en"
url = "/services/ai-optimisation"
slug = "ai-optimisation"
menu = "AI Optimisation"
collection = "services"
type = "service"

# Catalog card data
delivery = "one-time"
price = 500
rating = 4.9
featured = true

[tags]
categories = ["aeo"]
industries = ["ecommerce", "saas", "fintech", "healthcare"]
countries = ["germany", "france", "usa", "uk"]
languages = ["english", "german", "french", "spanish", "russian", "chinese"]

[relationships]
door_opener_task = "ai-visibility-audit"
available_tasks = ["ai-visibility-audit", "ai-optimized-content", "entity-seo-setup"]
specialists = ["ivan-petrov"]
cases = []

[translations]
ru = "/ru/services/ai-optimisation"
de = "/de/services/ai-optimisation"

[meta]
title = "AI Optimisation: Audits, Content & Entity SEO for AI Citations"
description = "Make your content citable by ChatGPT, Perplexity, and Claude. AI visibility audits from $500, citation-ready content, and entity SEO. Transparent pricing, named specialists."
keywords = ["AI visibility audit", "AI optimization", "LLM citations", "ChatGPT citations", "citation-ready content", "entity SEO", "AEO"]

# Hero Section — task-focused
[hero]
style = "split"
tag = "hero"
h1 = "AI Optimisation That Gets You Cited"
highlight = "Gets You Cited"
subtitle = "Audits, content optimization, and entity SEO — everything you need to become a citable source in AI-generated answers."
text = "Start with an AI Visibility Audit from $500. Clear deliverables, named specialist, no long-term contracts."
button_label = "Get AI Visibility Audit — $500"
button_url = "#task-picker"
button_secondary_label = "Why AI Visibility Matters"
button_secondary_url = "/solutions/ai-visibility"

[[hero.stats]]
value = "47+"
label = "Projects completed"

[[hero.stats]]
value = "4.9"
label = "Average rating"

[[hero.stats]]
value = "$500"
label = "Door opener audit"

# Client Logos
[logos]
title = "Trusted by industry leaders"
style = "marquee"

[[logos.logos]]
name = "Cryomed"

[[logos.logos]]
name = "Porto Montenegro"

[[logos.logos]]
name = "Minto"

[[logos.logos]]
name = "Weestep"

[[logos.logos]]
name = "Alfacash"

[[logos.logos]]
name = "Bamboo Group"

[[logos.logos]]
name = "KISA"

[[logos.logos]]
name = "Promwad"

[[logos.logos]]
name = "Alvadi"

[[logos.logos]]
name = "Alfa Coins"

[[logos.logos]]
name = "Infatica"

[[logos.logos]]
name = "Ethplorer"

# What You Get — deliverables preview
[features]
tag = "features"
title = "What You Get"
subtitle = "Each task has clear deliverables, fixed pricing, and a named specialist."

[[features.features]]
title = "AI Visibility Audit"
icon = "search"
text = "Understand how AI tools present your industry and where your business is invisible. We map citations, analyze competitors, and deliver a prioritized action plan."
list = ["AI landscape map for your industry", "Citation analysis — who gets cited and why", "Gap report with prioritized recommendations"]

[[features.features]]
title = "Citation-Ready Content"
icon = "document"
text = "Content restructured for AI citation — clear definitions, extractable answers, and logical organization. We optimize existing pages and create new ones where gaps exist."
list = ["Content audit for citation readiness", "Rewritten pages with schema markup", "Citation-ready formatting"]

[[features.features]]
title = "Entity SEO"
icon = "globe"
text = "Build structured data and knowledge graph presence so AI tools can identify and reference your brand as an authority."
list = ["Entity mapping and knowledge graph analysis", "Schema markup implementation", "Brand entity optimization"]

[[features.features]]
title = "Ongoing Monitoring"
icon = "analytics"
text = "Track how AI tools reference your content over time. Measure changes in visibility and adjust strategy based on what's working."
list = ["Monthly AI mention tracking", "Visibility change reports", "Strategy iteration based on data"]

# Available Tasks - Interactive Picker
[task-picker]
tag = "tasks"
title = "Available Tasks"
subtitle = "Select individual tasks and volume tiers to build a custom order."
yearly_discount = 20

[[task-picker.tasks]]
slug = "ai-visibility-audit"
title = "AI Visibility Audit"
description = "Analyze how AI tools like ChatGPT, Perplexity, and Claude present your business. Understand why competitors get cited while you don't."
delivery_type = "one-time"
one_time = true
monthly = false
yearly = false
unit_type = "queries"
door_opener = true
deliverables = [
    "AI landscape map — how AI explains your industry",
    "Citation analysis — which sources get cited and why",
    "Gap report — what's missing from your content",
    "Action plan with prioritized recommendations"
]

[[task-picker.tasks.tiers]]
name = "S"
label = "20 queries"
price = 500

[[task-picker.tasks.tiers]]
name = "M"
label = "50 queries"
price = 900

[[task-picker.tasks.tiers]]
name = "L"
label = "100 queries"
price = 1500

[[task-picker.tasks.tiers]]
name = "XL"
label = "300+ queries"
price = 0

[[task-picker.tasks]]
slug = "ai-optimized-content"
title = "AI-Optimized Content"
description = "Create content structured for AI citation — clear definitions, extractable answers, and logical organization."
delivery_type = "one-time"
one_time = true
monthly = false
yearly = false
unit_type = "pages"
door_opener = false
deliverables = [
    "Content audit for citation readiness",
    "Rewritten/restructured pages",
    "Schema markup additions",
    "Citation-ready formatting"
]

[[task-picker.tasks.tiers]]
name = "S"
label = "5 pages"
price = 800

[[task-picker.tasks.tiers]]
name = "M"
label = "15 pages"
price = 2000

[[task-picker.tasks.tiers]]
name = "L"
label = "30 pages"
price = 3500

[[task-picker.tasks.tiers]]
name = "XL"
label = "50+ pages"
price = 0

[[task-picker.tasks]]
slug = "entity-seo-setup"
title = "Entity SEO Setup"
description = "Build structured data and knowledge graph presence so AI tools can identify and reference your brand as an authority."
delivery_type = "one-time"
one_time = true
monthly = false
yearly = false
unit_type = "entities"
door_opener = false
deliverables = [
    "Entity mapping and knowledge graph analysis",
    "Schema markup implementation",
    "Wikipedia/Wikidata presence assessment",
    "Brand entity optimization plan"
]

[[task-picker.tasks.tiers]]
name = "S"
label = "1 entity"
price = 600

[[task-picker.tasks.tiers]]
name = "M"
label = "5 entities"
price = 1500

[[task-picker.tasks.tiers]]
name = "L"
label = "15 entities"
price = 3000

[[task-picker.tasks.tiers]]
name = "XL"
label = "30+ entities"
price = 0

# Process
[process]
tag = "process"
style = "sidebar"
title = "How We Work"
subtitle = "Simple, transparent process with clear milestones."

[[process.steps]]
title = "Brief"
icon = "document"
description = "15-minute call to understand your goals, current issues, and priorities. We define the scope together."

[[process.steps]]
title = "Audit"
icon = "search"
description = "Full analysis of how AI tools present your industry. We identify where you're invisible and where competitors get cited."

[[process.steps]]
title = "Report"
icon = "analytics"
description = "Detailed report with findings, prioritized recommendations, and implementation roadmap."

[[process.steps]]
title = "Execute"
icon = "lightning"
description = "We implement the recommendations: content restructuring, schema markup, entity optimization."

[[process.steps]]
title = "Monitor"
icon = "analytics"
description = "Track how AI tools begin to reference your content. Measure changes and iterate on strategy."

# Testimonials — near pricing for CRO
[testimonials]
tag = "testimonials"
title = "What Clients Say"
subtitle = "Real feedback from businesses who invested in AI visibility"

[[testimonials.testimonials]]
quote = "We were skeptical at first — AI citations felt too unpredictable. But the audit revealed exactly where we were invisible and gave us a clear path forward."
name = "Marketing Director"
role = "Marketing"
company = "B2B SaaS Company"
metrics = [{ value = "40%", label = "increase in AI mentions" }]

[[testimonials.testimonials]]
quote = "Our content ranked well in search, but never appeared in AI answers. After restructuring based on the recommendations, we started getting cited within weeks."
name = "Content Lead"
role = "Content"
company = "Financial Services"
metrics = [{ value = "3x", label = "more AI citations" }]

[[testimonials.testimonials]]
quote = "The honest assessment was refreshing. They told us upfront that some of our pages wouldn't work for AI — and focused on the ones that could."
name = "Head of Growth"
role = "Growth"
company = "E-commerce Platform"
metrics = [{ value = "12", label = "pages optimized" }]

# FAQ — practical questions
[faq]
tag = "faq"
title = "Common Questions"
subtitle = "Practical answers about working with us"
centered = true
contact_text = "Have a different question?"
contact_button = "Ask Us"
contact_url = "/contact"

[[faq.questions]]
question = "How long does the AI Visibility Audit take?"
answer = "Depends on the scope. S tier (20 queries) takes 5-7 business days. M tier (50 queries) takes 7-10 days. L tier (100 queries) takes 10-15 days. XL is custom-scoped."
open = true

[[faq.questions]]
question = "What do I get after the audit?"
answer = "A detailed report with: an AI landscape map showing how AI explains your industry, citation analysis identifying which sources get cited and why, a gap report highlighting what's missing from your content, and a prioritized action plan with estimated impact."

[[faq.questions]]
question = "Which AI tools do you analyze?"
answer = "We focus on the major LLMs that include citations: ChatGPT (with browsing), Perplexity, Claude, Gemini, and Copilot. The specific mix depends on what's relevant for your market and audience."

[[faq.questions]]
question = "Do you implement the changes or just report them?"
answer = "The audit delivers a report with prioritized recommendations. Content optimization and entity SEO can be ordered as separate tasks. You can also implement the recommendations with your own team — the report includes everything they need."

[[faq.questions]]
question = "Can we start with a small scope and expand later?"
answer = "Yes, that's exactly what the tier system is for. Start with the S tier audit (20 queries, $500) to validate the approach, then expand to more queries or add content optimization tasks based on the findings."

# CTA
[cta]
tag = "cta"
title = "Start with an AI Visibility Audit"
text = "Understand how AI tools present your industry. See where you're invisible. Get a clear action plan."
button_label = "Get AI Visibility Audit — From $500"
button_url = "#task-picker"
note = "Delivery: 5-10 business days."

# Sidebar — Order Cart
[sidebar]
title = "Your Order"
type = "order-cart"
button_label = "Request Quote"
button_url = "contact/?service=ai-optimisation"
note = "Estimated pricing. Final quote after brief."
language_fee = 200
country_fee = 100
extra_languages = true
extra_countries = true
```

**Key changes from current file:**
- **Removed blocks:** text_problem, features (educational), cards, comparison, text_failures, services_grid, stats, changes
- **New block:** features → "What You Get" (deliverables preview with 4 cards)
- **Rewritten:** hero (task-focused, stats changed to project metrics), process (simplified), FAQ (practical), CTA (task-picker link)
- **Kept as-is:** config, tags, relationships, translations, logos, task-picker, testimonials, sidebar
- **Removed task:** `knowledge-panel-optimization` and `ai-citation-building` from available_tasks (not defined as tasks in task-picker, so they caused broken references)
- **Changed catalog price:** `price = 500` (door opener audit, was 2500)

**Step 2: Commit**

```bash
git add sites/vividigit/content/services/ai-optimisation/ai-optimisation.en.toml
git commit -m "content: restructure ai-optimisation as task-focused service page

Strip educational content (moved to /solutions/ai-visibility).
Add 'What You Get' deliverables preview. Rewrite hero, FAQ, CTA.
Tasks appear right after logos for conversion-focused flow."
```

---

### Task 3: Build and verify

**Files:**
- None modified — verification only

**Step 1: Run the CMS build**

```bash
cd /Users/Dima/Work\ AI/CMS && python core/src/main.py en --site vividigit
```

Expected: Build succeeds with no errors. Both pages are generated.

**Step 2: Verify solution page exists**

Check that these files were generated:
- `public/solutions/ai-visibility/index.html` — the solution page
- `public/data/solutions-index.json` — should contain `ai-visibility` entry

**Step 3: Verify service page exists**

Check that this file was generated:
- `public/services/ai-optimisation/index.html` — the service page

**Step 4: Verify no broken links**

Open both generated HTML files and check:
- Solution hero CTA links to `/services/ai-optimisation#task-picker`
- Solution pricing CTA links to `/services/ai-optimisation#task-picker`
- Service hero secondary button links to `/solutions/ai-visibility`
- Task-picker renders correctly with 3 tasks

**Step 5: Run tests**

```bash
cd /Users/Dima/Work\ AI/CMS && python -m pytest tests/ -v
```

Expected: All tests pass (no code changes, so no regressions).

**Step 6: Commit verification (if any fixes needed)**

Only if fixes were required during verification.

---

### Task 4: Update documentation

**Files:**
- Modify: `DESIGN.md` (if it documents page structure)
- Modify: `CMSspec.md` (if it lists solutions)

**Step 1: Check if docs mention ai-optimisation page structure**

Read relevant sections of DESIGN.md and CMSspec.md. Update any references to the old 13-block ai-optimisation structure.

**Step 2: Add ai-visibility to solution listings if documented**

If CMSspec.md or other docs list available solutions, add `ai-visibility`.

**Step 3: Commit**

```bash
git add DESIGN.md CMSspec.md
git commit -m "docs: update docs for ai-optimisation/ai-visibility split"
```
