# Service Taxonomy Design for Vividigit

**Date:** 2026-01-27
**Status:** Draft for review
**Based on:** PSA productization model, e-commerce configurator pattern

---

## Overview

Complete **Category → Service → Task** structure for a productized marketing services agency.

**Model:**
- **Category** = Marketing direction (SEO, Content, PPC, etc.) with door opener Task
- **Service** = Task catalog (configurator page for a domain)
- **Task** = Atomic execution unit (product with unit tiers and delivery type)

**E-commerce approach:**
- User selects any Tasks from Service catalog
- Each Task has **unit tiers** (S/M/L/XL) and **delivery type** (one-time/monthly)
- **Languages + Countries = order-level modifiers** (apply to entire order)
- Cart collects selected Tasks → checkout

---

## Task Attributes

### Delivery Type

| Type | Description | Example |
|------|-------------|---------|
| **one-time** | Single delivery, project-based | Audit, Setup, Migration |
| **monthly** | Ongoing service, recurring billing | Management, Maintenance, Reporting |
| **both** | Available as one-time OR monthly | Optimization (one-time fix vs ongoing) |

### Unit Model

Each Task defines:
- **unit_type**: What is being measured (pages, keywords, campaigns, etc.)
- **tiers**: Volume limits with pricing (S/M/L/XL)

---

## Pricing Model

### Task Pricing
```
Task Base Price × Unit Tier × Delivery Type
```

### Order Modifiers (apply to entire order)
```
Subtotal (sum of Tasks) + Language modifiers + Country modifiers = Total
```

**Language modifier:** +60% of item base price per additional language
**Country modifier:** +40% of item base price per additional country

---

## 1. SEO (Search Engine Optimization)

**Category door opener:** Site Audit — $500 (one-time)

### 1.1 Service: Technical SEO

**URL:** `/services/technical-seo/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Site Audit** ⭐ | one-time | pages | 100 pages $500 | 1k pages $1,200 | 10k pages $2,500 | 50k+ custom |
| **Site Speed Optimization** | one-time | pages | 10 pages $300 | 50 pages $600 | 200 pages $1,000 | 500+ custom |
| **Schema Markup Setup** | one-time | templates | 5 types $200 | 10 types $400 | 20 types $700 | all types $1,000 |
| **Site Architecture Review** | one-time | pages | 100 pages $400 | 500 pages $800 | 2k pages $1,500 | 10k+ custom |
| **Migration SEO Support** | one-time | URLs | 500 URLs $1,000 | 2k URLs $2,500 | 10k URLs $5,000 | 50k+ custom |
| **Technical SEO Maintenance** | monthly | pages | 100 pages $300/mo | 1k pages $600/mo | 10k pages $1,000/mo | 50k+ custom |

---

### 1.2 Service: On-Page SEO

**URL:** `/services/on-page-seo/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Page Optimization** | both | pages | 5 pages $250 | 15 pages $600 | 30 pages $1,000 | 100+ custom |
| **Keyword Research** ⭐ | one-time | clusters | 1 cluster $300 | 5 clusters $800 | 15 clusters $1,800 | 50+ custom |
| **Content Brief Creation** | one-time | briefs | 5 briefs $500 | 15 briefs $1,200 | 30 briefs $2,000 | 100+ custom |
| **Landing Page Optimization** | one-time | pages | 1 page $400 | 3 pages $1,000 | 10 pages $2,500 | 30+ custom |
| **On-Page SEO Maintenance** | monthly | pages | 10 pages/mo $400/mo | 30 pages/mo $900/mo | 100 pages/mo $2,000/mo | custom |

---

### 1.3 Service: Link Building

**URL:** `/services/link-building/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Backlink Analysis** ⭐ | one-time | domains | 1 domain $400 | 5 competitors $700 | 10 competitors $1,200 | full market custom |
| **Guest Post Outreach** | monthly | links/mo | 5 links $800/mo | 10 links $1,500/mo | 20 links $2,800/mo | 50+ custom |
| **Digital PR Campaign** | both | placements | 3 placements $1,500 | 10 placements $4,000 | 25 placements $8,000 | custom |
| **Broken Link Building** | monthly | links/mo | 3 links $300/mo | 8 links $700/mo | 15 links $1,200/mo | 30+ custom |
| **HARO/Qwoted Pitching** | monthly | pitches/mo | 10 pitches $500/mo | 25 pitches $900/mo | 50 pitches $1,500/mo | 100+ custom |
| **Link Disavow & Cleanup** | one-time | toxic links | 50 links $300 | 200 links $600 | 500 links $1,000 | 1k+ custom |

---

### 1.4 Service: Local SEO

**URL:** `/services/local-seo/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Local SEO Audit** ⭐ | one-time | locations | 1 location $400 | 5 locations $1,000 | 15 locations $2,500 | 50+ custom |
| **GBP Setup & Optimization** | one-time | locations | 1 location $250 | 5 locations $1,000 | 15 locations $2,500 | 50+ custom |
| **Local Citations Building** | one-time | citations | 50 citations $400 | 100 citations $700 | 200 citations $1,200 | 500+ custom |
| **Review Management Setup** | one-time | locations | 1 location $300 | 5 locations $800 | 15 locations $1,800 | 50+ custom |
| **Local SEO Management** | monthly | locations | 1 location $400/mo | 5 locations $1,200/mo | 15 locations $3,000/mo | 50+ custom |

---

### 1.5 Service: E-commerce SEO

**URL:** `/services/ecommerce-seo/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **E-commerce SEO Audit** ⭐ | one-time | products | 100 products $800 | 1k products $1,500 | 10k products $3,000 | 50k+ custom |
| **Product Page Optimization** | both | products | 20 products $400 | 100 products $1,200 | 500 products $4,000 | 2k+ custom |
| **Category Page SEO** | one-time | categories | 5 categories $500 | 20 categories $1,500 | 50 categories $3,000 | 200+ custom |
| **Faceted Navigation Fix** | one-time | facets | 5 facets $400 | 15 facets $900 | 30 facets $1,500 | 100+ custom |
| **Product Schema Setup** | one-time | products | 100 products $300 | 500 products $800 | 2k products $2,000 | 10k+ custom |
| **E-commerce SEO Management** | monthly | products | 100 products $800/mo | 1k products $1,500/mo | 10k products $3,000/mo | custom |

---

### 1.6 Service: International SEO

**URL:** `/services/international-seo/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **International SEO Audit** ⭐ | one-time | markets | 2 markets $500 | 5 markets $1,000 | 10 markets $2,000 | 20+ custom |
| **Hreflang Implementation** | one-time | languages | 2 languages $500 | 5 languages $1,000 | 10 languages $1,800 | 20+ custom |
| **International Keyword Research** | one-time | markets | 1 market $400 | 3 markets $1,000 | 5 markets $1,500 | 10+ custom |
| **Geo-targeting Strategy** | one-time | markets | 2 markets $600 | 5 markets $1,200 | 10 markets $2,200 | custom |
| **International SEO Management** | monthly | markets | 2 markets $600/mo | 5 markets $1,200/mo | 10 markets $2,000/mo | custom |

---

## 2. AEO (AI Engine Optimization)

**Category door opener:** AI Visibility Audit — $500 (one-time)

### 2.1 Service: AI Visibility Optimization

**URL:** `/services/ai-visibility/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **AI Visibility Audit** ⭐ | one-time | queries | 20 queries $500 | 50 queries $900 | 100 queries $1,500 | 300+ custom |
| **AI-Optimized Content** | both | pieces | 5 pieces $1,000 | 15 pieces $2,500 | 30 pieces $4,500 | 100+ custom |
| **Knowledge Panel Optimization** | one-time | entities | 1 entity $600 | 3 entities $1,200 | 10 entities $3,000 | 30+ custom |
| **AI Citation Building** | monthly | citations/mo | 5 citations $800/mo | 15 citations $1,500/mo | 30 citations $2,500/mo | custom |
| **Entity SEO Setup** | one-time | entities | 1 entity $400 | 5 entities $1,000 | 15 entities $2,200 | 50+ custom |

---

### 2.2 Service: Voice & Featured Snippets

**URL:** `/services/voice-search/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Voice Search Audit** ⭐ | one-time | queries | 20 queries $400 | 50 queries $800 | 100 queries $1,400 | custom |
| **FAQ Schema Implementation** | one-time | pages | 10 pages $300 | 30 pages $700 | 100 pages $1,500 | 500+ custom |
| **Featured Snippet Targeting** | both | topics | 5 topics $600 | 15 topics $1,400 | 30 topics $2,500 | 100+ custom |
| **Conversational Content Creation** | one-time | pieces | 10 pieces $800 | 30 pieces $2,000 | 100 pieces $5,000 | custom |

---

## 3. Content Marketing

**Category door opener:** Content Audit — $500 (one-time)

### 3.1 Service: Content Strategy

**URL:** `/services/content-strategy/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Content Audit** ⭐ | one-time | pages | 50 pages $500 | 200 pages $1,000 | 500 pages $1,800 | 2k+ custom |
| **Content Strategy Development** | one-time | months | 3 months $1,200 | 6 months $2,000 | 12 months $3,500 | multi-year custom |
| **Editorial Calendar** | both | months | 3 months $400 | 6 months $700 | 12 months $1,200 | custom |
| **Competitor Content Analysis** | one-time | competitors | 3 competitors $500 | 7 competitors $900 | 15 competitors $1,600 | custom |
| **Content Gap Analysis** | one-time | topics | 20 topics $400 | 50 topics $800 | 100 topics $1,400 | custom |

---

### 3.2 Service: Content Creation

**URL:** `/services/content-creation/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Blog Post Writing** ⭐ | both | posts | 4 posts $500 | 10 posts $1,100 | 20 posts $2,000 | 50+ custom |
| **Pillar Page Creation** | one-time | pages | 1 page $800 | 3 pages $2,200 | 6 pages $4,000 | 12+ custom |
| **Case Study Writing** | one-time | cases | 1 case $500 | 3 cases $1,200 | 6 cases $2,000 | 12+ custom |
| **White Paper / E-book** | one-time | pages (content) | 10 pages $1,500 | 25 pages $3,000 | 50 pages $5,000 | 100+ custom |
| **Product Description Writing** | both | products | 20 products $400 | 50 products $900 | 150 products $2,200 | 500+ custom |
| **Infographic Creation** | one-time | infographics | 1 piece $400 | 3 pieces $1,000 | 6 pieces $1,800 | 12+ custom |

---

### 3.3 Service: Copywriting

**URL:** `/services/copywriting/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Website Copy** ⭐ | one-time | pages | 3 pages $800 | 7 pages $1,600 | 15 pages $3,000 | 30+ custom |
| **Sales Page Copy** | one-time | pages | 1 page $1,000 | 3 pages $2,500 | 6 pages $4,500 | 12+ custom |
| **Email Copy** | both | emails | 5 emails $300 | 15 emails $750 | 30 emails $1,300 | 100+ custom |
| **Ad Copy Sets** | both | ad sets | 3 sets $250 | 10 sets $700 | 25 sets $1,500 | 50+ custom |
| **UX/Microcopy** | one-time | screens | 10 screens $400 | 30 screens $900 | 100 screens $2,200 | 300+ custom |
| **Taglines & Messaging** | one-time | concepts | 5 concepts $300 | 15 concepts $700 | 30 concepts $1,200 | custom |

---

### 3.4 Service: Content Localization

**URL:** `/services/content-localization/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Content Translation** ⭐ | both | words | 5k words $600 | 20k words $2,000 | 50k words $4,000 | 100k+ custom |
| **Transcreation** | one-time | words | 5k words $900 | 20k words $3,000 | 50k words $6,000 | 100k+ custom |
| **Multilingual SEO** | one-time | languages | 1 language $500 | 3 languages $1,200 | 5 languages $1,800 | 10+ custom |
| **Localization QA** | one-time | words | 10k words $300 | 50k words $1,000 | 100k words $1,800 | custom |

---

## 4. Social Media Marketing

**Category door opener:** Social Media Audit — $400 (one-time)

### 4.1 Service: Social Media Management

**URL:** `/services/social-media-management/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Social Media Audit** ⭐ | one-time | platforms | 2 platforms $400 | 4 platforms $700 | 6 platforms $1,000 | all platforms $1,400 |
| **Profile Setup & Optimization** | one-time | platforms | 2 platforms $300 | 4 platforms $550 | 6 platforms $800 | all platforms custom |
| **Content Calendar Planning** | monthly | platforms | 2 platforms $300/mo | 4 platforms $550/mo | 6 platforms $800/mo | custom |
| **Social Media Management** | monthly | platforms | 2 platforms $800/mo | 4 platforms $1,400/mo | 6 platforms $2,000/mo | custom |
| **Community Management** | monthly | platforms | 2 platforms $400/mo | 4 platforms $700/mo | 6 platforms $1,000/mo | custom |
| **Social Listening Setup** | one-time | keywords | 10 keywords $300 | 30 keywords $600 | 100 keywords $1,200 | 300+ custom |

---

### 4.2 Service: Social Content Creation

**URL:** `/services/social-content/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Social Media Graphics** ⭐ | both | pieces | 10 pieces $300 | 30 pieces $750 | 60 pieces $1,300 | 150+ custom |
| **Carousel/Slider Design** | both | carousels | 5 carousels $250 | 15 carousels $650 | 30 carousels $1,100 | 100+ custom |
| **Story Templates** | one-time | templates | 5 templates $200 | 15 templates $500 | 30 templates $900 | custom |
| **Short-form Video (Reels/TikTok)** | both | videos | 4 videos $600 | 10 videos $1,300 | 20 videos $2,400 | 50+ custom |
| **Social Copywriting** | monthly | posts | 20 posts $200/mo | 50 posts $450/mo | 100 posts $800/mo | 200+ custom |

---

### 4.3 Service: Paid Social Advertising

**URL:** `/services/paid-social/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Social Ads Audit** ⭐ | one-time | accounts | 1 account $300 | 3 accounts $700 | 5 accounts $1,100 | 10+ custom |
| **Facebook/Instagram Ads Setup** | one-time | campaigns | 2 campaigns $500 | 5 campaigns $1,000 | 10 campaigns $1,800 | 20+ custom |
| **Facebook Ads Management** | monthly | ad spend | <$5k spend $600/mo | $5-15k $1,000/mo | $15-50k $1,500/mo | $50k+ custom |
| **LinkedIn Ads Setup** | one-time | campaigns | 2 campaigns $600 | 5 campaigns $1,200 | 10 campaigns $2,200 | 20+ custom |
| **LinkedIn Ads Management** | monthly | ad spend | <$5k spend $800/mo | $5-15k $1,200/mo | $15-50k $1,800/mo | $50k+ custom |
| **TikTok Ads Setup** | one-time | campaigns | 2 campaigns $500 | 5 campaigns $1,000 | 10 campaigns $1,800 | custom |
| **TikTok Ads Management** | monthly | ad spend | <$5k spend $600/mo | $5-15k $1,000/mo | $15-50k $1,500/mo | custom |
| **Social Ad Creative** | both | ad sets | 3 sets $400 | 10 sets $1,000 | 25 sets $2,200 | 50+ custom |

---

### 4.4 Service: Influencer Marketing

**URL:** `/services/influencer-marketing/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Influencer Research** ⭐ | one-time | influencers | 10 profiles $400 | 30 profiles $900 | 100 profiles $2,000 | 300+ custom |
| **Influencer Outreach** | one-time | influencers | 10 outreach $500 | 30 outreach $1,200 | 100 outreach $3,000 | custom |
| **Campaign Coordination** | one-time | influencers | 3 influencers $800 | 10 influencers $2,000 | 25 influencers $4,500 | custom |
| **Influencer Program Management** | monthly | influencers | 5 active $1,000/mo | 15 active $2,500/mo | 50 active $6,000/mo | custom |

---

## 5. Paid Advertising (PPC)

**Category door opener:** Google Ads Audit — $300 (one-time)

### 5.1 Service: Google Ads

**URL:** `/services/google-ads/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Google Ads Audit** ⭐ | one-time | campaigns | 5 campaigns $300 | 15 campaigns $600 | 30 campaigns $1,000 | 100+ custom |
| **Google Ads Setup** | one-time | campaigns | 3 campaigns $600 | 8 campaigns $1,200 | 20 campaigns $2,500 | 50+ custom |
| **Keyword Research (PPC)** | one-time | keywords | 100 keywords $300 | 500 keywords $700 | 2k keywords $1,400 | 10k+ custom |
| **Ad Copy Creation** | both | ad groups | 5 ad groups $300 | 15 ad groups $750 | 30 ad groups $1,300 | 100+ custom |
| **Landing Page for Ads** | one-time | pages | 1 page $500 | 3 pages $1,200 | 6 pages $2,200 | 15+ custom |
| **Google Ads Management** | monthly | ad spend | <$5k $500/mo | $5-20k $900/mo | $20-50k $1,400/mo | $50k+ custom |
| **Conversion Tracking Setup** | one-time | conversions | 5 events $300 | 15 events $600 | 30 events $1,000 | 100+ custom |

---

### 5.2 Service: Google Shopping

**URL:** `/services/google-shopping/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Shopping Feed Audit** ⭐ | one-time | products | 100 products $300 | 1k products $600 | 10k products $1,200 | 50k+ custom |
| **Merchant Center Setup** | one-time | feeds | 1 feed $400 | 3 feeds $900 | 6 feeds $1,600 | 12+ custom |
| **Product Feed Optimization** | both | products | 100 products $400 | 1k products $900 | 5k products $2,000 | 20k+ custom |
| **Shopping Campaign Setup** | one-time | campaigns | 2 campaigns $500 | 5 campaigns $1,000 | 10 campaigns $1,800 | 30+ custom |
| **Shopping Ads Management** | monthly | products | 100 products $500/mo | 1k products $900/mo | 5k products $1,500/mo | custom |
| **Performance Max Setup** | one-time | campaigns | 1 campaign $500 | 3 campaigns $1,000 | 6 campaigns $1,800 | custom |

---

### 5.3 Service: Microsoft/Bing Ads

**URL:** `/services/microsoft-ads/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Bing Ads Audit** ⭐ | one-time | campaigns | 5 campaigns $200 | 15 campaigns $400 | 30 campaigns $700 | custom |
| **Bing Ads Setup/Import** | one-time | campaigns | 5 campaigns $400 | 15 campaigns $800 | 30 campaigns $1,400 | custom |
| **Bing Ads Management** | monthly | ad spend | <$3k $400/mo | $3-10k $700/mo | $10-30k $1,100/mo | $30k+ custom |

---

### 5.4 Service: Display & Programmatic

**URL:** `/services/display-advertising/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Display Audit** ⭐ | one-time | campaigns | 3 campaigns $300 | 8 campaigns $600 | 15 campaigns $1,000 | custom |
| **GDN Campaign Setup** | one-time | campaigns | 2 campaigns $500 | 5 campaigns $1,000 | 10 campaigns $1,800 | 25+ custom |
| **Remarketing Setup** | one-time | audiences | 3 audiences $400 | 8 audiences $800 | 15 audiences $1,400 | 30+ custom |
| **Banner Ad Design** | both | sizes/versions | 3 sizes $200 | 8 sizes $450 | 15 sizes $800 | full set custom |
| **Display Ads Management** | monthly | ad spend | <$5k $500/mo | $5-15k $900/mo | $15-40k $1,400/mo | $40k+ custom |
| **Programmatic Setup** | one-time | platforms | 1 DSP $800 | 2 DSPs $1,400 | 4 DSPs $2,500 | custom |

---

### 5.5 Service: Amazon Advertising

**URL:** `/services/amazon-ads/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Amazon Ads Audit** ⭐ | one-time | products | 20 products $300 | 100 products $600 | 500 products $1,200 | 2k+ custom |
| **Sponsored Products Setup** | one-time | products | 20 products $500 | 100 products $1,000 | 500 products $2,500 | custom |
| **Sponsored Brands Setup** | one-time | brands | 1 brand $400 | 3 brands $900 | 6 brands $1,600 | custom |
| **Amazon DSP Setup** | one-time | campaigns | 2 campaigns $800 | 5 campaigns $1,600 | 10 campaigns $3,000 | custom |
| **Amazon Ads Management** | monthly | ad spend | <$5k $500/mo | $5-20k $900/mo | $20-50k $1,400/mo | $50k+ custom |

---

## 6. Email Marketing

**Category door opener:** Email Marketing Audit — $400 (one-time)

### 6.1 Service: Email Strategy & Setup

**URL:** `/services/email-setup/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Email Marketing Audit** ⭐ | one-time | campaigns | 10 campaigns $400 | 30 campaigns $800 | 100 campaigns $1,500 | custom |
| **Email Platform Setup** | one-time | integrations | 3 integrations $500 | 8 integrations $1,000 | 15 integrations $1,800 | custom |
| **List Segmentation Strategy** | one-time | segments | 5 segments $400 | 15 segments $900 | 30 segments $1,500 | 100+ custom |
| **Email Preference Center** | one-time | options | 5 preferences $300 | 10 preferences $550 | 20 preferences $900 | custom |
| **Compliance Setup (GDPR/CAN-SPAM)** | one-time | lists | 1 list $250 | 5 lists $500 | 15 lists $900 | custom |

---

### 6.2 Service: Email Campaigns

**URL:** `/services/email-campaigns/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Email Template Design** ⭐ | one-time | templates | 3 templates $400 | 8 templates $900 | 15 templates $1,500 | 30+ custom |
| **Newsletter Creation** | monthly | newsletters | 2/mo $300/mo | 4/mo $550/mo | 8/mo $1,000/mo | daily custom |
| **Email Sequence Writing** | one-time | emails in sequence | 5 emails $500 | 12 emails $1,000 | 20 emails $1,600 | 50+ custom |
| **Welcome Series Setup** | one-time | emails | 3 emails $400 | 7 emails $800 | 12 emails $1,300 | 20+ custom |
| **Abandoned Cart Series** | one-time | emails | 3 emails $400 | 5 emails $650 | 8 emails $1,000 | custom |
| **Re-engagement Campaign** | one-time | emails | 3 emails $350 | 6 emails $650 | 10 emails $1,000 | custom |
| **Promotional Campaign** | both | campaigns | 1 campaign $250 | 4 campaigns $800 | 10 campaigns $1,800 | 25+ custom |

---

### 6.3 Service: Email Deliverability

**URL:** `/services/email-deliverability/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Deliverability Audit** ⭐ | one-time | domains | 1 domain $300 | 3 domains $700 | 6 domains $1,200 | 12+ custom |
| **DNS/Authentication Setup** | one-time | domains | 1 domain $200 | 3 domains $450 | 6 domains $800 | custom |
| **List Cleaning** | one-time | subscribers | 10k subs $150 | 50k subs $500 | 200k subs $1,500 | 1M+ custom |
| **Domain Warm-up** | one-time | domains | 1 domain $400 | 3 domains $900 | 6 domains $1,600 | custom |
| **Inbox Placement Testing** | both | tests | 5 tests $200 | 15 tests $500 | 30 tests $900 | ongoing custom |
| **Deliverability Monitoring** | monthly | domains | 1 domain $200/mo | 3 domains $450/mo | 6 domains $800/mo | custom |

---

## 7. Analytics & Data

**Category door opener:** Analytics Audit — $400 (one-time)

### 7.1 Service: Analytics Setup

**URL:** `/services/analytics-setup/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Analytics Audit** ⭐ | one-time | properties | 1 property $400 | 3 properties $900 | 6 properties $1,600 | 12+ custom |
| **GA4 Setup & Configuration** | one-time | events | 10 events $500 | 30 events $1,000 | 60 events $1,800 | 150+ custom |
| **GTM Implementation** | one-time | tags | 10 tags $500 | 30 tags $1,000 | 60 tags $1,800 | 150+ custom |
| **E-commerce Tracking** | one-time | events | 15 events $600 | 30 events $1,100 | 50 events $1,800 | custom |
| **Cross-domain Tracking** | one-time | domains | 2 domains $300 | 5 domains $600 | 10 domains $1,000 | custom |
| **Server-side Tracking** | one-time | endpoints | 1 endpoint $800 | 3 endpoints $1,800 | 6 endpoints $3,200 | custom |

---

### 7.2 Service: Reporting & Dashboards

**URL:** `/services/reporting/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Custom Dashboard** ⭐ | one-time | data sources | 3 sources $500 | 8 sources $1,000 | 15 sources $1,800 | 30+ custom |
| **Executive Dashboard** | one-time | KPIs | 10 KPIs $600 | 25 KPIs $1,200 | 50 KPIs $2,200 | custom |
| **Monthly Reporting** | monthly | reports | 1 report $300/mo | 3 reports $700/mo | 6 reports $1,200/mo | custom |
| **Real-time Alerting Setup** | one-time | alerts | 5 alerts $300 | 15 alerts $700 | 30 alerts $1,200 | custom |
| **Data Warehouse Integration** | one-time | sources | 3 sources $1,000 | 8 sources $2,200 | 15 sources $4,000 | custom |

---

### 7.3 Service: Attribution & Analysis

**URL:** `/services/attribution/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Attribution Audit** ⭐ | one-time | channels | 5 channels $500 | 10 channels $900 | 20 channels $1,600 | custom |
| **Multi-touch Attribution Setup** | one-time | models | 2 models $800 | 4 models $1,500 | 8 models $2,800 | custom |
| **Marketing Mix Modeling** | one-time | channels | 5 channels $2,000 | 10 channels $4,000 | 20 channels $7,000 | custom |
| **Customer Journey Mapping** | one-time | touchpoints | 10 touchpoints $600 | 25 touchpoints $1,200 | 50 touchpoints $2,200 | custom |

---

### 7.4 Service: Research & Analysis

**URL:** `/services/market-research/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Competitor Analysis** ⭐ | one-time | competitors | 3 competitors $600 | 8 competitors $1,200 | 15 competitors $2,200 | 30+ custom |
| **Market Research** | one-time | markets | 1 market $1,000 | 3 markets $2,500 | 6 markets $4,500 | custom |
| **Audience Research** | one-time | segments | 3 segments $600 | 8 segments $1,200 | 15 segments $2,200 | custom |
| **Pricing Analysis** | one-time | competitors | 5 competitors $500 | 15 competitors $1,000 | 30 competitors $1,800 | custom |

---

## 8. Conversion Rate Optimization (CRO)

**Category door opener:** CRO Audit — $500 (one-time)

### 8.1 Service: CRO Audits & Analysis

**URL:** `/services/cro/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **CRO Audit** ⭐ | one-time | pages | 5 pages $500 | 15 pages $1,000 | 30 pages $1,800 | 100+ custom |
| **Landing Page Audit** | one-time | pages | 3 pages $400 | 8 pages $900 | 15 pages $1,500 | 30+ custom |
| **Checkout Funnel Audit** | one-time | steps | 4 steps $500 | 8 steps $900 | 15 steps $1,500 | custom |
| **Heatmap & Recording Analysis** | one-time | pages | 5 pages $400 | 15 pages $900 | 30 pages $1,500 | 100+ custom |
| **User Survey Setup** | one-time | surveys | 1 survey $300 | 3 surveys $700 | 6 surveys $1,200 | custom |
| **Form Optimization** | one-time | forms | 3 forms $400 | 8 forms $900 | 15 forms $1,500 | 30+ custom |

---

### 8.2 Service: A/B Testing

**URL:** `/services/ab-testing/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **A/B Testing Audit** ⭐ | one-time | tests | 5 past tests $300 | 15 tests $600 | 30 tests $1,000 | custom |
| **Testing Tool Setup** | one-time | tools | 1 tool $500 | 2 tools $900 | 4 tools $1,500 | custom |
| **A/B Test Design & Setup** | one-time | tests | 3 tests $600 | 8 tests $1,300 | 15 tests $2,200 | 30+ custom |
| **A/B Testing Program** | monthly | tests/mo | 2 tests/mo $1,200/mo | 4 tests/mo $2,200/mo | 8 tests/mo $4,000/mo | custom |
| **Test Results Analysis** | one-time | tests | 5 tests $400 | 15 tests $900 | 30 tests $1,500 | custom |

---

## 9. Video Marketing

**Category door opener:** Video Marketing Audit — $300 (one-time)

### 9.1 Service: Video Production

**URL:** `/services/video-production/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Video Marketing Audit** ⭐ | one-time | channels | 2 channels $300 | 5 channels $600 | 10 channels $1,000 | custom |
| **Explainer Video** | one-time | minutes | 1 min $1,200 | 2 min $2,200 | 3 min $3,000 | 5+ custom |
| **Product Video** | one-time | products | 1 product $600 | 3 products $1,500 | 6 products $2,700 | 12+ custom |
| **Testimonial Video** | one-time | testimonials | 1 video $500 | 3 videos $1,200 | 6 videos $2,100 | 12+ custom |
| **Corporate Video** | one-time | minutes | 2 min $2,000 | 5 min $4,500 | 10 min $8,000 | custom |
| **Video Editing** | both | minutes (raw) | 10 min raw $300 | 30 min raw $750 | 60 min raw $1,300 | 180+ custom |
| **Motion Graphics** | one-time | seconds | 30 sec $500 | 60 sec $900 | 120 sec $1,600 | custom |

---

### 9.2 Service: Short-form Video

**URL:** `/services/short-form-video/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Reels/TikTok Creation** ⭐ | both | videos | 4 videos $600 | 12 videos $1,500 | 24 videos $2,700 | 50+ custom |
| **YouTube Shorts** | both | videos | 4 videos $500 | 12 videos $1,300 | 24 videos $2,400 | 50+ custom |
| **Video Repurposing** | both | long videos | 1 source $300 | 4 sources $1,000 | 10 sources $2,200 | 25+ custom |
| **Vertical Video Ads** | one-time | ads | 3 ads $500 | 8 ads $1,100 | 15 ads $1,900 | 30+ custom |

---

### 9.3 Service: YouTube Marketing

**URL:** `/services/youtube-marketing/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **YouTube Channel Audit** ⭐ | one-time | videos | 20 videos $300 | 50 videos $600 | 100 videos $1,000 | 500+ custom |
| **YouTube Channel Setup** | one-time | channels | 1 channel $400 | 3 channels $900 | 6 channels $1,600 | custom |
| **YouTube SEO** | both | videos | 5 videos $300 | 15 videos $750 | 30 videos $1,300 | 100+ custom |
| **Thumbnail Design** | both | thumbnails | 5 thumbnails $150 | 15 thumbnails $400 | 30 thumbnails $700 | 100+ custom |
| **YouTube Ads Setup** | one-time | campaigns | 2 campaigns $500 | 5 campaigns $1,000 | 10 campaigns $1,800 | custom |
| **YouTube Ads Management** | monthly | ad spend | <$5k $500/mo | $5-15k $900/mo | $15-50k $1,400/mo | $50k+ custom |
| **YouTube Channel Management** | monthly | videos/mo | 2 videos/mo $800/mo | 4 videos/mo $1,400/mo | 8 videos/mo $2,400/mo | custom |

---

### 9.4 Service: Podcast Marketing

**URL:** `/services/podcast-marketing/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Podcast Audit** ⭐ | one-time | episodes | 10 episodes $300 | 30 episodes $600 | 60 episodes $1,000 | custom |
| **Podcast Launch Package** | one-time | episodes | 3 episodes $1,000 | 6 episodes $1,800 | 12 episodes $3,200 | custom |
| **Podcast Editing** | both | episodes | 4 episodes $400 | 10 episodes $900 | 20 episodes $1,600 | 50+ custom |
| **Podcast SEO** | both | episodes | 10 episodes $400 | 30 episodes $1,000 | 60 episodes $1,800 | 150+ custom |
| **Show Notes & Transcripts** | both | episodes | 4 episodes $200 | 12 episodes $500 | 24 episodes $900 | 50+ custom |
| **Podcast Management** | monthly | episodes/mo | 2/mo $600/mo | 4/mo $1,100/mo | 8/mo $2,000/mo | custom |

---

## 10. Public Relations

**Category door opener:** Brand Mention Audit — $400 (one-time)

### 10.1 Service: Digital PR

**URL:** `/services/digital-pr/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Brand Mention Audit** ⭐ | one-time | months history | 3 months $400 | 12 months $800 | 24 months $1,400 | all-time custom |
| **Press Release Writing** | one-time | releases | 1 release $350 | 3 releases $900 | 6 releases $1,600 | 12+ custom |
| **Press Release Distribution** | one-time | tiers | local $200 | national $500 | premium $1,000 | AP wire custom |
| **Media Outreach** | monthly | pitches/mo | 20 pitches $800/mo | 50 pitches $1,500/mo | 100 pitches $2,500/mo | custom |
| **Media List Building** | one-time | contacts | 50 contacts $400 | 150 contacts $900 | 300 contacts $1,500 | custom |
| **PR Campaign Management** | monthly | placements goal | 3 placements $1,500/mo | 8 placements $3,000/mo | 15 placements $5,000/mo | custom |

---

### 10.2 Service: Reputation Management

**URL:** `/services/reputation-management/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Reputation Audit** ⭐ | one-time | platforms | 5 platforms $500 | 10 platforms $900 | 20 platforms $1,600 | custom |
| **Review Response Templates** | one-time | templates | 10 templates $300 | 25 templates $650 | 50 templates $1,100 | custom |
| **Review Generation Setup** | one-time | locations | 1 location $400 | 5 locations $1,000 | 15 locations $2,500 | custom |
| **Crisis Communication Plan** | one-time | scenarios | 3 scenarios $800 | 8 scenarios $1,600 | 15 scenarios $2,800 | custom |
| **Reputation Monitoring** | monthly | mentions/mo | 100 mentions $300/mo | 500 mentions $700/mo | 2k mentions $1,200/mo | custom |
| **Review Management** | monthly | reviews/mo | 10 reviews $400/mo | 30 reviews $900/mo | 100 reviews $1,800/mo | custom |

---

## 11. Marketing Automation

**Category door opener:** Automation Audit — $500 (one-time)

### 11.1 Service: Automation Setup

**URL:** `/services/marketing-automation/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Automation Audit** ⭐ | one-time | workflows | 10 workflows $500 | 30 workflows $1,000 | 60 workflows $1,800 | 150+ custom |
| **HubSpot Setup** | one-time | hubs | 1 hub $1,500 | 2 hubs $2,800 | 4 hubs $5,000 | enterprise custom |
| **Salesforce Marketing Cloud** | one-time | journeys | 5 journeys $2,000 | 15 journeys $4,500 | 30 journeys $8,000 | custom |
| **Klaviyo Setup** | one-time | flows | 5 flows $800 | 15 flows $1,800 | 30 flows $3,200 | custom |
| **ActiveCampaign Setup** | one-time | automations | 5 automations $600 | 15 automations $1,400 | 30 automations $2,500 | custom |
| **Workflow Automation (Zapier/Make)** | one-time | zaps/scenarios | 5 zaps $400 | 15 zaps $900 | 30 zaps $1,600 | 100+ custom |
| **Lead Scoring Setup** | one-time | criteria | 10 criteria $500 | 25 criteria $1,000 | 50 criteria $1,800 | custom |

---

### 11.2 Service: Chatbots & AI

**URL:** `/services/chatbots/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Chatbot Audit** ⭐ | one-time | bots | 1 bot $300 | 3 bots $700 | 6 bots $1,200 | custom |
| **Chatbot Setup** | one-time | intents | 10 intents $600 | 30 intents $1,200 | 60 intents $2,200 | 150+ custom |
| **AI Assistant Setup** | one-time | use cases | 3 use cases $1,000 | 8 use cases $2,200 | 15 use cases $4,000 | custom |
| **Conversational Flow Design** | one-time | flows | 5 flows $500 | 15 flows $1,200 | 30 flows $2,200 | custom |
| **Chatbot Optimization** | monthly | conversations/mo | 500 convos $400/mo | 2k convos $900/mo | 10k convos $1,800/mo | custom |

---

## 12. E-commerce Marketing

**Category door opener:** E-commerce Marketing Audit — $600 (one-time)

### 12.1 Service: Marketplace Management

**URL:** `/services/marketplace-management/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Amazon Listing Audit** ⭐ | one-time | listings | 20 listings $400 | 100 listings $900 | 500 listings $2,000 | 2k+ custom |
| **Amazon Listing Optimization** | both | listings | 10 listings $500 | 50 listings $1,500 | 200 listings $4,500 | custom |
| **Amazon A+ Content** | one-time | ASINs | 5 ASINs $600 | 15 ASINs $1,500 | 30 ASINs $2,700 | custom |
| **Amazon Brand Store** | one-time | pages | 3 pages $800 | 6 pages $1,400 | 12 pages $2,500 | custom |
| **Multi-marketplace Setup** | one-time | marketplaces | 1 marketplace $500 | 3 marketplaces $1,200 | 6 marketplaces $2,200 | custom |
| **Marketplace Management** | monthly | SKUs | 50 SKUs $600/mo | 200 SKUs $1,200/mo | 500 SKUs $2,200/mo | 2k+ custom |

---

### 12.2 Service: E-commerce Growth

**URL:** `/services/ecommerce-growth/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **E-commerce Marketing Audit** ⭐ | one-time | channels | 5 channels $600 | 10 channels $1,200 | 20 channels $2,200 | custom |
| **Product Launch Campaign** | one-time | products | 1 product $1,500 | 5 products $4,000 | 15 products $10,000 | custom |
| **Retention Marketing Setup** | one-time | programs | 2 programs $800 | 5 programs $1,800 | 10 programs $3,500 | custom |
| **Loyalty Program Setup** | one-time | tiers | 3 tiers $1,000 | 5 tiers $1,800 | 10 tiers $3,200 | custom |
| **Referral Program Setup** | one-time | mechanics | 1 mechanic $600 | 3 mechanics $1,200 | 6 mechanics $2,000 | custom |
| **E-commerce Growth Management** | monthly | revenue | <$100k $1,200/mo | $100-500k $2,200/mo | $500k-2M $4,000/mo | $2M+ custom |

---

## 13. Affiliate Marketing

**Category door opener:** Affiliate Program Audit — $400 (one-time)

### 13.1 Service: Affiliate Program Management

**URL:** `/services/affiliate-marketing/`

| Task | Delivery | Unit Type | S | M | L | XL |
|------|----------|-----------|---|---|---|-----|
| **Affiliate Program Audit** ⭐ | one-time | affiliates | 20 affiliates $400 | 100 affiliates $900 | 500 affiliates $1,800 | custom |
| **Affiliate Platform Setup** | one-time | platforms | 1 platform $800 | 2 platforms $1,400 | 4 platforms $2,500 | custom |
| **Affiliate Creative Package** | one-time | assets | 10 assets $400 | 30 assets $1,000 | 60 assets $1,800 | custom |
| **Affiliate Recruitment** | monthly | affiliates/mo | 10 affiliates $600/mo | 30 affiliates $1,200/mo | 100 affiliates $2,500/mo | custom |
| **Affiliate Communication** | monthly | newsletters/mo | 2/mo $300/mo | 4/mo $550/mo | 8/mo $1,000/mo | custom |
| **Affiliate Program Management** | monthly | active affiliates | 50 affiliates $800/mo | 200 affiliates $1,600/mo | 500 affiliates $3,000/mo | custom |

---

## Summary

### Taxonomy Structure

```
Category (SEO)  ← door opener: Site Audit $500 (one-time)
  ├── Service: Technical SEO
  │     ├── Task: Site Audit ⭐ [one-time] [pages: S/M/L/XL]
  │     ├── Task: Site Speed Optimization [one-time] [pages: S/M/L]
  │     ├── Task: Schema Markup Setup [one-time] [templates: S/M/L/XL]
  │     ├── Task: Site Architecture Review [one-time] [pages: S/M/L/XL]
  │     ├── Task: Migration SEO Support [one-time] [URLs: S/M/L/XL]
  │     └── Task: Technical SEO Maintenance [monthly] [pages: S/M/L/XL]
  │
  ├── Service: On-Page SEO
  │     ├── Task: Page Optimization [both] [pages: S/M/L/XL]
  │     ├── Task: Keyword Research ⭐ [one-time] [clusters: S/M/L/XL]
  │     └── ...
```

### Counts

| Entity | Count |
|--------|-------|
| Categories | 13 |
| Services | ~45 |
| Tasks | ~180 |

### Unit Types by Category

| Category | Common Unit Types |
|----------|-------------------|
| **SEO** | pages, URLs, products, categories, locations, markets, keywords, clusters |
| **AEO** | queries, entities, citations, pieces |
| **Content** | words, posts, pages, briefs, cases, products, languages |
| **Social** | platforms, pieces, videos, posts, influencers, ad spend |
| **PPC** | campaigns, ad groups, keywords, products, ad spend |
| **Email** | campaigns, emails, templates, segments, subscribers, domains |
| **Analytics** | properties, events, tags, sources, KPIs, channels |
| **CRO** | pages, steps, forms, tests, surveys |
| **Video** | minutes, videos, thumbnails, episodes |
| **PR** | releases, pitches, contacts, placements, scenarios, mentions |
| **Automation** | workflows, zaps, flows, hubs, intents |
| **E-commerce** | SKUs, listings, ASINs, products, programs, revenue |
| **Affiliate** | affiliates, assets, platforms |

### Key Principles

1. **Service = Task catalog** (configurator page)
2. **Task = product** with delivery type + unit tiers
3. **Delivery type**: one-time | monthly | both
4. **Unit tiers**: S/M/L/XL with specific limits and prices
5. **Languages + Countries = order-level modifiers**
6. **Door opener Task per category** (⭐) for entry point
7. **E-commerce UX**: configurator → cart → checkout

---

## Sources

- [PSA Concept Document](../../../PSA concept/PSA concept.md)
- [Fiverr Digital Marketing](https://www.fiverr.com/categories/online-marketing)
- [FATJOE Productized SEO](https://fatjoe.com/blog/productized-seo/)
