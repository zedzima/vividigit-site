# Card Consistency Design

> **Status: Implemented** (updated 2026-02-21)

## Goal

Keep one visual/data contract per entity card, so catalog pages and related-entities blocks show the same key information and do not diverge.

## Implemented Decisions

1. **Single specialist card implementation**
   - Source of truth: `themes/vividigit/assets/js/cards.js` (`renderSpecialistCard`)
   - Reused in:
     - `themes/vividigit/templates/blocks/catalog.html`
     - `themes/vividigit/templates/blocks/catalog-mini.html`
     - `themes/vividigit/templates/blocks/related-entities.html`
   - Removed legacy specialist card fields: `rating`, `hourly_rate`
   - Current specialist card fields: avatar, name, role, projects, cases, articles, industries/languages/countries

2. **Service cards use compact metrics (no cover image)**
   - Category chips + delivery badge
   - Title + description
   - Counters: industries, countries, languages, tasks
   - Footer price

3. **Solution cards use compact metrics (no cover image)**
   - Service/industry chips
   - Title + description
   - Counters: specialists, cases, countries, languages
   - Footer starting price

4. **Category cards include specialist count**
   - Service count + specialist count + industry/country/language counts
   - Door-opener price retained in footer

5. **Case cards expose success signal + timeline**
   - Meta scope: industry/country/language/client
   - Computed `primary_result` and `timeline` shown as KPI row

6. **Country/language cards include market metrics**
   - Language: `native_speakers_l1`, `official_countries_count`
   - Country: `population_total`, `official_languages_count`

7. **Blog cards aligned between listing and related blocks**
   - Type/category chips
   - Title + excerpt
   - Date + author meta

## Data Contract (Build Exports)

| Export | Card-critical fields |
|-------|-----------------------|
| `public/data/services-index.json` | `industry_count`, `country_count`, `language_count`, `task_count`, `case_count`, `article_count` |
| `public/data/team.json` | `projects`, `industries`, `languages`, `countries`, `case_count`, `article_count` |
| `public/data/cases.json` | `client`, `primary_result`, `timeline`, `results` |
| `public/data/categories-index.json` | `service_count`, `specialist_count`, `industry_count`, `country_count`, `language_count` |
| `public/data/solutions-index.json` | `starting_price`, `specialist_count`, `case_count` |
| `public/data/countries-index.json` | `population_total`, `official_languages_count`, `service_count` |
| `public/data/languages-index.json` | `native_speakers_l1`, `official_countries_count`, `service_count` |

## Implementation Notes

- Specialist card is intentionally JS-rendered in related sections through placeholders to reuse identical markup.
- Other related-entities cards use dedicated Jinja partials under `themes/vividigit/templates/blocks/cards/`.
- `catalog.html` and `catalog-mini.html` mirror the same field priorities as related card partials.
