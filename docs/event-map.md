# Event Map — Vividigit Analytics

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      WEBSITE                            │
│                                                         │
│   site.js                    GTM Custom HTML Tag        │
│   ───────                    ────────────────────       │
│   2 key events               4 non-key events           │
│   (AJAX callbacks)           (click/DOM detection)      │
│        │                            │                   │
│        └──────── dataLayer ─────────┘                   │
│                      │                                  │
└──────────────────────┼──────────────────────────────────┘
                       ▼
              ┌─────────────────┐
              │   Google Tag    │
              │    Manager      │
              │                 │
              │  6 CE triggers  │
              │  6 GA4 tags     │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │   Google        │
              │   Analytics 4   │
              │                 │
              │  G-TZQKK1XJGS  │
              └─────────────────┘
```

---

## Key Events (site.js → dataLayer)

These fire from AJAX success callbacks — GTM cannot detect them natively.

### `contact`

> Contact form submitted successfully

```
Source:     site.js (line 585)
Trigger:    Web3Forms API returns { success: true }
Where:      Any page with a contact form widget
```

| Parameter   | Value                          | Example                   |
|-------------|--------------------------------|---------------------------|
| form_type   | `quick_contact` or `full_form` | `full_form`               |
| page        | Document title or pathname     | `Contact Us — Vividigit`  |

```
Form fields sent to Web3Forms:
├── name           "John Smith"
├── email          "john@example.com"
├── phone          "+1 555 123 4567"
├── message        "I need help with SEO..."
├── source         "search" | "social" | "referral" | "ad" | "other"
├── traffic_source "google (organic)" | "utm_source / utm_medium (campaign)" | "direct"
├── page_url       "https://vividigit.com/contact/"
└── subject        "Contact Form from Contact Us — Vividigit"
```

**Trigger locations:**

| Page                  | Form type       | Button label       |
|-----------------------|-----------------|--------------------|
| /contact/             | full_form       | Book Consultation  |
| Any page (sidebar)    | quick_contact   | Book Consultation  |

---

### `generate_lead`

> Cart order request submitted successfully

```
Source:     site.js (line 847)
Trigger:    Web3Forms API returns { success: true }
Where:      /cart/ page only
```

| Parameter   | Value                     | Example  |
|-------------|---------------------------|----------|
| cart_items  | Number of items in cart    | `3`      |
| cart_total  | Grand total in USD         | `2400`   |
| email       | Submitter's email          | `john@example.com` |

```
Form fields sent to Web3Forms:
├── name           "John Smith"
├── email          "john@example.com"
├── phone          "+1 555 123 4567"
├── message        [full order summary with items, tiers, prices, modifiers]
├── source         "search" | "social" | "referral" | "ad" | "other"
├── traffic_source "google (organic)" | "direct" | "utm..."
├── page_url       "https://vividigit.com/cart/"
└── subject        "Order Request — 3 items — Vividigit"
```

---

## Non-Key Events (GTM Custom HTML → dataLayer)

These fire from a single Custom HTML tag (`cHTML - Cart Event Listeners`) that lives entirely in GTM. It uses click/change event delegation on `document`.

### `add_to_cart`

> User adds a service/task to the cart

```
Source:     GTM tag "cHTML - Cart Event Listeners"
Mechanism:  Click delegation + change listener
Where:      Service pages with pricing or task-picker blocks
Parameters: none
```

| Trigger element               | CSS selector              | User action                       | Page example         |
|-------------------------------|---------------------------|-----------------------------------|----------------------|
| Pricing package button        | `.pricing-package .btn`   | Click "Add to Cart" on a package  | /services/seo/       |
| Pricing tier block            | `.pricing-tier`           | Click on a pricing tier           | /services/seo/       |
| Task picker checkbox          | `.task-select-cb` (checked) | Check a task checkbox           | /services/seo/       |

---

### `remove_from_cart`

> User removes a service/task from the cart

```
Source:     GTM tag "cHTML - Cart Event Listeners"
Mechanism:  Click delegation + change listener
Where:      Service pages (sidebar), cart page
Parameters: none
```

| Trigger element               | CSS selector              | User action                       | Page example         |
|-------------------------------|---------------------------|-----------------------------------|----------------------|
| Sidebar remove button (×)     | `.cart-item-remove`       | Click × next to item in sidebar   | /services/seo/       |
| Cart page remove button (×)   | `.cart-item-remove-btn`   | Click × next to item in cart      | /cart/               |
| Task picker checkbox          | `.task-select-cb` (unchecked) | Uncheck a task checkbox       | /services/seo/       |

---

### `view_cart`

> User views the cart page

```
Source:     GTM tag "cHTML - Cart Event Listeners"
Mechanism:  DOM Ready check for #cartPage element
Where:      /cart/ page only
Parameters: none
Fires:      Once per page load
```

---

### `begin_checkout`

> User clicks the checkout/submit button (before form submission)

```
Source:     GTM tag "cHTML - Cart Event Listeners"
Mechanism:  Click delegation
Where:      /cart/ page only
Parameters: none
```

| Trigger element               | CSS selector         | User action                    |
|-------------------------------|----------------------|--------------------------------|
| Request Quote button          | `#cartSendRequest`   | Click "Request Quote" on cart  |

---

## GA4 Automatic Events (built-in, no configuration)

These are collected by GA4 automatically, no tags/triggers needed.

| Event             | Description                             |
|-------------------|-----------------------------------------|
| `page_view`       | Every page load/navigation              |
| `session_start`   | New session begins                      |
| `first_visit`     | First-ever visit from this browser      |
| `user_engagement` | 10+ seconds of active engagement        |
| `scroll`          | User scrolls past 90% of page depth    |
| `click`           | Outbound link clicks (external domains) |

---

## Event Flow by User Journey

```
Landing Page
│
├─► page_view (auto)
├─► session_start / first_visit (auto)
│
├─► Browse /services/seo/
│   ├─► page_view (auto)
│   ├─► scroll (auto, 90%)
│   │
│   ├─► Select task in task-picker
│   │   └─► add_to_cart ← GTM click listener
│   │
│   ├─► Deselect task
│   │   └─► remove_from_cart ← GTM change listener
│   │
│   ├─► Click pricing tier
│   │   └─► add_to_cart ← GTM click listener
│   │
│   ├─► Click pricing package "Add to Cart"
│   │   └─► add_to_cart ← GTM click listener
│   │
│   └─► Remove item from sidebar (×)
│       └─► remove_from_cart ← GTM click listener
│
├─► Go to /cart/
│   ├─► page_view (auto)
│   ├─► view_cart ← GTM DOM check
│   │
│   ├─► Remove item (×)
│   │   └─► remove_from_cart ← GTM click listener
│   │
│   ├─► Click "Request Quote"
│   │   ├─► begin_checkout ← GTM click listener
│   │   │
│   │   └─► [AJAX to Web3Forms]
│   │       ├─► Success:
│   │       │   └─► generate_lead ← site.js dataLayer  ★ KEY EVENT
│   │       └─► Failure: error shown, no event
│   │
│   └─► Clear Cart: no event tracked
│
├─► Go to /contact/
│   ├─► page_view (auto)
│   │
│   └─► Submit contact form
│       └─► [AJAX to Web3Forms]
│           ├─► Success:
│           │   └─► contact ← site.js dataLayer  ★ KEY EVENT
│           └─► Failure: error shown, no event
│
└─► Sidebar contact form (any page)
    └─► Submit
        └─► [AJAX to Web3Forms]
            ├─► Success:
            │   └─► contact ← site.js dataLayer  ★ KEY EVENT
            └─► Failure: error shown, no event
```

---

## GTM Container Summary

| Component                        | ID  | Type          | Fires on              |
|----------------------------------|-----|---------------|-----------------------|
| **Tags**                         |     |               |                       |
| GA4 (config)                     | 3   | googtag       | Initialization        |
| cHTML - Cart Event Listeners     | 16  | html          | All Pages             |
| GA4 Event - add_to_cart          | 10  | gaawe         | CE trigger #4         |
| GA4 Event - remove_from_cart     | 11  | gaawe         | CE trigger #5         |
| GA4 Event - view_cart            | 12  | gaawe         | CE trigger #6         |
| GA4 Event - begin_checkout       | 13  | gaawe         | CE trigger #7         |
| GA4 Event - generate_lead        | 14  | gaawe         | CE trigger #8         |
| GA4 Event - contact              | 15  | gaawe         | CE trigger #9         |
| **Triggers**                     |     |               |                       |
| CE - add_to_cart                 | 4   | CUSTOM_EVENT  | `add_to_cart`         |
| CE - remove_from_cart            | 5   | CUSTOM_EVENT  | `remove_from_cart`    |
| CE - view_cart                   | 6   | CUSTOM_EVENT  | `view_cart`           |
| CE - begin_checkout              | 7   | CUSTOM_EVENT  | `begin_checkout`      |
| CE - generate_lead               | 8   | CUSTOM_EVENT  | `generate_lead`       |
| CE - contact                     | 9   | CUSTOM_EVENT  | `contact`             |
| **Variables (Data Layer)**       |     |               |                       |
| dlv - cart_items                 | 5   | v             | generate_lead tag     |
| dlv - cart_total                 | 6   | v             | generate_lead tag     |
| dlv - form_type                  | 7   | v             | contact tag           |
| dlv - page                       | 8   | v             | contact tag           |

---

## Key Events for GA4 Admin

Mark as **Key Events** in GA4 → Admin → Events (after first trigger):

| Event           | Why it's key                                |
|-----------------|---------------------------------------------|
| `contact`       | Lead captured via contact form              |
| `generate_lead` | Order request with specific items + pricing |
