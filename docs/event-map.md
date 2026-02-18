# Event Map — Vividigit Analytics

> 10 custom events. 2 key (conversions), 8 engagement.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    WEBSITE                           │
│                                                     │
│  site.js              GTM Custom HTML    catalog.js  │
│  ────────             ───────────────    ──────────  │
│  2 key events         7 engagement       1 filter    │
│  (AJAX callbacks)     events             event       │
│       │                    │                │        │
│       └───────── dataLayer ─────────────────┘        │
└────────────────────────┼────────────────────────────-┘
                         ▼
                ┌────────────────┐
                │  GTM container │
                │  10 CE triggers│
                │  10 GA4 tags   │
                └───────┬────────┘
                        ▼
                ┌────────────────┐
                │  Google        │
                │  Analytics 4   │
                │  G-TZQKK1XJGS │
                └────────────────┘
```

---

## All 10 Events

### ★ Key Events (site.js → dataLayer)

These fire from AJAX success callbacks — only way to detect them.

---

#### 1. `contact`

> Contact form submitted successfully

| Detail        | Value                            |
|---------------|----------------------------------|
| Source        | site.js (AJAX callback)          |
| Where         | Any page with contact form       |
| Button        | "Book Consultation" / "Send"     |

**Parameters:**

| Parameter   | Example                      |
|-------------|------------------------------|
| form_type   | `quick_contact` or `full_form` |
| page        | `Contact Us — Vividigit`     |

---

#### 2. `generate_lead`

> Cart order request submitted successfully

| Detail        | Value                            |
|---------------|----------------------------------|
| Source        | site.js (AJAX callback)          |
| Where         | /cart/ page                      |
| Button        | "Request Quote"                  |

**Parameters:**

| Parameter   | Example          |
|-------------|------------------|
| cart_items  | `3`              |
| cart_total  | `2400`           |
| email       | `john@example.com` |

---

### Engagement Events (GTM Custom HTML → dataLayer)

Detected by `cHTML - Event Listeners` tag via click/scroll delegation.

---

#### 3. `add_to_cart`

> Item added to cart

| Detail        | Value                                          |
|---------------|------------------------------------------------|
| Source        | GTM click delegation                           |
| Parameters    | none                                           |

| User action                        | CSS selector               | Pages              |
|------------------------------------|----------------------------|---------------------|
| Click pricing package button       | `.pricing-package .btn`    | Service pages       |
| Click pricing tier                 | `.pricing-tier`            | Service pages       |
| Check task picker checkbox         | `.task-select-cb` (checked)| Service pages       |

---

#### 4. `remove_from_cart`

> Item removed from cart

| Detail        | Value                                          |
|---------------|------------------------------------------------|
| Source        | GTM click delegation                           |
| Parameters    | none                                           |

| User action                        | CSS selector               | Pages              |
|------------------------------------|----------------------------|---------------------|
| Click × in sidebar                 | `.cart-item-remove`        | Service pages       |
| Click × on cart page               | `.cart-item-remove-btn`    | /cart/              |
| Uncheck task picker checkbox       | `.task-select-cb` (unchecked)| Service pages     |

---

#### 5. `view_cart`

> User opened the cart page

| Detail        | Value                                          |
|---------------|------------------------------------------------|
| Source        | GTM DOM check on page load                     |
| Trigger       | `#cartPage` element exists                     |
| Where         | /cart/                                         |
| Parameters    | none                                           |
| Fires         | Once per page load                             |

---

#### 6. `begin_checkout`

> User clicked the checkout button

| Detail        | Value                                          |
|---------------|------------------------------------------------|
| Source        | GTM click delegation                           |
| Trigger       | Click on `#cartSendRequest`                    |
| Where         | /cart/                                         |
| Parameters    | none                                           |

---

#### 7. `cta_click`

> User clicked a CTA button (navigation link)

| Detail        | Value                                          |
|---------------|------------------------------------------------|
| Source        | GTM click delegation                           |
| Selector      | `a.btn` (link buttons only)                    |
| Where         | Any page                                       |

**Parameters:**

| Parameter     | Example                      |
|---------------|------------------------------|
| event_label   | `Book Consultation`          |
| event_section | `sidebar`, `hero`, `pricing` |

**Examples of tracked buttons:**

| Button text             | Typical section  | Pages                   |
|-------------------------|------------------|-------------------------|
| Book Consultation       | sidebar          | Service, industry, etc. |
| Explore Services        | hero             | Home, landing pages     |
| View All Services       | catalog-mini     | Category pages          |
| Contact Us              | cta              | Various                 |
| Learn More              | section          | Various                 |

> Note: `a.btn` is a catch-all — pricing package buttons and cart buttons are matched first by their specific selectors and won't fire `cta_click`.

---

#### 8. `content_engage`

> User interacted with content block (process step, FAQ)

| Detail        | Value                                          |
|---------------|------------------------------------------------|
| Source        | GTM click delegation                           |
| Where         | Pages with Process or FAQ blocks               |

**Parameters:**

| Parameter     | Example                          |
|---------------|----------------------------------|
| event_label   | `Discovery` / `What is SEO?`    |
| event_section | `process` or `faq`              |

| User action                        | CSS selector        |
|------------------------------------|---------------------|
| Click process step tab             | `.process-btn`      |
| Open FAQ question (expand only)    | `.faq-question` (details not yet open) |

---

#### 9. `filter_apply`

> User applied catalog filters

| Detail        | Value                                          |
|---------------|------------------------------------------------|
| Source        | catalog.html script (dataLayer push)           |
| Trigger       | Click "Apply Filters" button                   |
| Where         | Listing pages (services, team, cases, etc.)    |
| Parameters    | none                                           |

**UX flow:**
```
Select filters → button appears "Apply Filters" (primary)
                          ↓ click
              Grid updates → button becomes "Reset Filters" (secondary)
                          ↓ click
              All filters cleared → button hides
```

---

#### 10. `scroll_milestone`

> User scrolled past 70% of page depth

| Detail        | Value                                          |
|---------------|------------------------------------------------|
| Source        | GTM scroll listener                            |
| Threshold     | 70% of page height                            |
| Where         | Any page                                       |
| Parameters    | none                                           |
| Fires         | Once per page load                             |

---

## User Journey Flow

```
Landing Page
│
├─► page_view (GA4 auto)
├─► session_start (GA4 auto)
│
├─► Scrolls 70%+ of page
│   └─► scroll_milestone
│
├─► Clicks "Explore Services" button
│   └─► cta_click  [label: "Explore Services", section: "hero"]
│
├─► Service page /services/seo/
│   │
│   ├─► Clicks Process step "Discovery"
│   │   └─► content_engage  [label: "Discovery", section: "process"]
│   │
│   ├─► Opens FAQ "What is technical SEO?"
│   │   └─► content_engage  [label: "What is technical SEO?", section: "faq"]
│   │
│   ├─► Checks task in task-picker
│   │   └─► add_to_cart
│   │
│   ├─► Clicks pricing tier "Professional"
│   │   └─► add_to_cart
│   │
│   └─► Clicks "Book Consultation" in sidebar
│       └─► cta_click  [label: "Book Consultation", section: "sidebar"]
│
├─► Listing page /services/
│   │
│   ├─► Selects filters (Category: SEO, Language: EN)
│   ├─► Clicks "Apply Filters"
│   │   └─► filter_apply
│   └─► Clicks "Reset Filters" → grid shows all
│
├─► Cart page /cart/
│   ├─► view_cart
│   ├─► Removes item (×)
│   │   └─► remove_from_cart
│   ├─► Clicks "Request Quote"
│   │   ├─► begin_checkout
│   │   └─► [AJAX] → success:
│   │       └─► ★ generate_lead  [items: 3, total: 2400]
│   └─► Clicks "Continue Shopping"
│       └─► cta_click  [label: "Continue Shopping", section: "page"]
│
└─► Contact form (any page)
    └─► [AJAX] → success:
        └─► ★ contact  [type: "full_form", page: "Contact Us"]
```

---

## GTM Container Components

| #  | Component                      | Type         | ID  | Fires on / Uses          |
|----|--------------------------------|--------------|-----|--------------------------|
|    | **Tags**                       |              |     |                          |
| 1  | GA4 (config)                   | googtag      | 3   | Initialization           |
| 2  | cHTML - Event Listeners        | html         | 16  | All Pages                |
| 3  | GA4 Event - add_to_cart        | gaawe        | 10  | trigger #4               |
| 4  | GA4 Event - remove_from_cart   | gaawe        | 11  | trigger #5               |
| 5  | GA4 Event - view_cart          | gaawe        | 12  | trigger #6               |
| 6  | GA4 Event - begin_checkout     | gaawe        | 13  | trigger #7               |
| 7  | GA4 Event - generate_lead      | gaawe        | 14  | trigger #8               |
| 8  | GA4 Event - contact            | gaawe        | 15  | trigger #9               |
| 9  | GA4 Event - cta_click          | gaawe        | 17  | trigger #10              |
| 10 | GA4 Event - content_engage     | gaawe        | 18  | trigger #11              |
| 11 | GA4 Event - filter_apply       | gaawe        | 19  | trigger #12              |
| 12 | GA4 Event - scroll_milestone   | gaawe        | 20  | trigger #13              |
|    | **Triggers**                   |              |     |                          |
| 1  | CE - add_to_cart               | CUSTOM_EVENT | 4   |                          |
| 2  | CE - remove_from_cart          | CUSTOM_EVENT | 5   |                          |
| 3  | CE - view_cart                 | CUSTOM_EVENT | 6   |                          |
| 4  | CE - begin_checkout            | CUSTOM_EVENT | 7   |                          |
| 5  | CE - generate_lead             | CUSTOM_EVENT | 8   |                          |
| 6  | CE - contact                   | CUSTOM_EVENT | 9   |                          |
| 7  | CE - cta_click                 | CUSTOM_EVENT | 10  |                          |
| 8  | CE - content_engage            | CUSTOM_EVENT | 11  |                          |
| 9  | CE - filter_apply              | CUSTOM_EVENT | 12  |                          |
| 10 | CE - scroll_milestone          | CUSTOM_EVENT | 13  |                          |
|    | **Variables (Data Layer)**     |              |     |                          |
| 1  | dlv - cart_items               | v            | 5   | generate_lead            |
| 2  | dlv - cart_total               | v            | 6   | generate_lead            |
| 3  | dlv - form_type                | v            | 7   | contact                  |
| 4  | dlv - page                     | v            | 8   | contact                  |
| 5  | dlv - event_label              | v            | 9   | cta_click, content_engage|
| 6  | dlv - event_section            | v            | 10  | cta_click, content_engage|

---

## GA4 Admin Checklist

After first trigger of each event:

- [ ] Mark `contact` as **Key Event** in GA4 Admin → Events
- [ ] Mark `generate_lead` as **Key Event** in GA4 Admin → Events
- [ ] Register `event_label` as custom dimension (Event scope)
- [ ] Register `event_section` as custom dimension (Event scope)
