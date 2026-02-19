/**
 * Site JavaScript
 * Vividigit - Main site interactions
 */

// ========================================
// Configuration
// ========================================
const SITE_CONFIG = {
    web3formsKey: '419be280-f452-493c-9745-bd1daba07eb8',
    notifyEmail: 'mail@vividigit.com',
    cartStorageKey: 'vividigit_cart',
    langPct: 0.6,      // each extra language adds 60% of item price
    countryPct: 0.4    // each extra country adds 40% of item price
};

// ========================================
// Analytics: dataLayer helper (GTM)
// ========================================
window.dataLayer = window.dataLayer || [];
function pushDL(event, params) {
    window.dataLayer.push(Object.assign({ event: event }, params || {}));
}

// ========================================
// Traffic Source Detection (referrer, UTM, direct)
// ========================================
var _trafficSource = (function() {
    var params = new URLSearchParams(window.location.search);
    var utmSource = params.get('utm_source');
    var utmMedium = params.get('utm_medium');
    var utmCampaign = params.get('utm_campaign');
    var utmTerm = params.get('utm_term');
    var utmContent = params.get('utm_content');

    if (utmSource) {
        var parts = [utmSource];
        if (utmMedium) parts.push(utmMedium);
        if (utmCampaign) parts.push('(' + utmCampaign + ')');
        if (utmTerm) parts.push('[' + utmTerm + ']');
        if (utmContent) parts.push('{' + utmContent + '}');
        return parts.join(' / ');
    }

    var ref = document.referrer;
    if (!ref) return 'direct';

    try {
        var refHost = new URL(ref).hostname;
        if (refHost === window.location.hostname) return 'direct';
        if (/google\./i.test(refHost)) return 'google (organic)';
        if (/bing\./i.test(refHost)) return 'bing (organic)';
        if (/yahoo\./i.test(refHost)) return 'yahoo (organic)';
        if (/duckduckgo/i.test(refHost)) return 'duckduckgo (organic)';
        if (/yandex/i.test(refHost)) return 'yandex (organic)';
        if (/facebook|fb\./i.test(refHost)) return 'facebook (social)';
        if (/twitter|x\.com/i.test(refHost)) return 'twitter (social)';
        if (/linkedin/i.test(refHost)) return 'linkedin (social)';
        if (/instagram/i.test(refHost)) return 'instagram (social)';
        if (/youtube/i.test(refHost)) return 'youtube (social)';
        if (/reddit/i.test(refHost)) return 'reddit (social)';
        return refHost + ' (referral)';
    } catch (e) {
        return ref;
    }
})();

// ========================================
// Sidebar Toggles
// ========================================
const btnMenu = document.getElementById('btnMenu');
const btnAction = document.getElementById('btnAction');
const sidebarNav = document.getElementById('sidebarNav');
const sidebarAction = document.getElementById('sidebarAction');
const overlay = document.getElementById('overlay');

function closeSidebars() {
    sidebarNav?.classList.remove('open');
    sidebarAction?.classList.remove('open');
    overlay?.classList.remove('active');
}

btnMenu?.addEventListener('click', () => {
    sidebarNav?.classList.toggle('open');
    overlay?.classList.toggle('active');
    sidebarAction?.classList.remove('open');
});

btnAction?.addEventListener('click', () => {
    sidebarAction?.classList.toggle('open');
    overlay?.classList.toggle('active');
    sidebarNav?.classList.remove('open');
});

overlay?.addEventListener('click', closeSidebars);

// ========================================
// Order Cart (with localStorage persistence)
// ========================================
const cart = {
    items: {},

    load() {
        try {
            const saved = localStorage.getItem(SITE_CONFIG.cartStorageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.items = data.items || {};
            }
        } catch (e) { /* ignore parse errors */ }
    },

    save() {
        try {
            localStorage.setItem(SITE_CONFIG.cartStorageKey, JSON.stringify({
                items: this.items
            }));
        } catch (e) { /* ignore storage errors */ }
        updateCartBadge();
    },

    add(slug, title, tierName, tierLabel, price, custom, delivery) {
        const prev = this.items[slug];
        this.items[slug] = {
            title, tierName, tierLabel, price, custom,
            delivery: delivery || 'one-time',
            page: window.location.pathname,
            langCount: prev ? prev.langCount || 0 : 0,
            countryCount: prev ? prev.countryCount || 0 : 0
        };
        this.save();
        this.renderSidebar();
    },

    remove(slug) {
        delete this.items[slug];
        // Uncheck on current page if present
        const cb = document.querySelector('.task-select-cb[data-slug="' + slug + '"]');
        if (cb) {
            cb.checked = false;
            const item = cb.closest('.task-picker-item');
            if (item) item.classList.remove('selected');
        }
        this.save();
        this.renderSidebar();
    },

    updateTier(slug, tierName, tierLabel, price, custom) {
        if (this.items[slug]) {
            this.items[slug].tierName = tierName;
            this.items[slug].tierLabel = tierLabel;
            this.items[slug].price = price;
            this.items[slug].custom = custom;
            this.save();
            this.renderSidebar();
        }
    },

    _backup: null,

    clear() {
        this._backup = JSON.parse(JSON.stringify(this.items));
        this.items = {};
        this.save();
        this.renderSidebar();
        // Uncheck all on current page
        document.querySelectorAll('.task-select-cb:checked').forEach(function(cb) {
            cb.checked = false;
            const item = cb.closest('.task-picker-item');
            if (item) item.classList.remove('selected');
        });
    },

    restore() {
        if (!this._backup) return false;
        this.items = this._backup;
        this._backup = null;
        this.save();
        this.renderSidebar();
        return true;
    },

    getItemTotal(item) {
        const langExtra = Math.round(item.price * SITE_CONFIG.langPct) * (item.langCount || 0);
        const countryExtra = Math.round(item.price * SITE_CONFIG.countryPct) * (item.countryCount || 0);
        return item.price + langExtra + countryExtra;
    },

    getTotal() {
        let total = 0;
        let hasCustom = false;
        for (const slug of Object.keys(this.items)) {
            const item = this.items[slug];
            if (item.custom) hasCustom = true;
            total += this.getItemTotal(item);
        }
        return { total, hasCustom };
    },

    getSummaryText() {
        const keys = Object.keys(this.items);
        if (keys.length === 0) return 'Empty cart';
        let lines = keys.map(slug => {
            const item = this.items[slug];
            const lc = item.langCount || 0;
            const cc = item.countryCount || 0;
            const delivery = item.delivery === 'monthly' ? 'Monthly' : 'One-time';
            const itemTotal = this.getItemTotal(item);
            let line = '- ' + item.title + ' (' + item.tierName + ') — ' + delivery;
            if (lc > 0) line += ', +' + lc + ' lang (×' + Math.round(SITE_CONFIG.langPct * 100) + '%)';
            if (cc > 0) line += ', +' + cc + ' countries (×' + Math.round(SITE_CONFIG.countryPct * 100) + '%)';
            line += ' — ' + (item.price > 0 ? '$' + itemTotal.toLocaleString() : 'Custom');
            return line;
        });
        const totals = this.getTotal();
        lines.push('Total: ' + (totals.hasCustom ? 'From ' : '') + '$' + totals.total.toLocaleString());
        return lines.join('\n');
    },

    buildOrderEmail(comment) {
        const keys = Object.keys(this.items);
        let lines = ['ORDER DETAILS', ''];
        let num = 1;
        for (const slug of keys) {
            const item = this.items[slug];
            const lc = item.langCount || 0;
            const cc = item.countryCount || 0;
            const delivery = item.delivery === 'monthly' ? 'Monthly' : 'One-time';
            const itemTotal = this.getItemTotal(item);
            lines.push(num + '. ' + item.title + ' (' + item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + ')');
            lines.push('   Delivery: ' + delivery);
            const perLang = Math.round(item.price * SITE_CONFIG.langPct);
            const perCountry = Math.round(item.price * SITE_CONFIG.countryPct);
            if (lc > 0) lines.push('   Languages: +' + lc + ' × $' + perLang + ' (60%) = $' + (lc * perLang));
            if (cc > 0) lines.push('   Countries: +' + cc + ' × $' + perCountry + ' (40%) = $' + (cc * perCountry));
            lines.push('   Subtotal: ' + (item.price > 0 ? '$' + itemTotal.toLocaleString() : 'Custom quote'));
            lines.push('');
            num++;
        }
        const totals = this.getTotal();
        lines.push('GRAND TOTAL: ' + (totals.hasCustom ? 'From ' : '') + '$' + totals.total.toLocaleString());
        if (comment) {
            lines.push('');
            lines.push('COMMENT:');
            lines.push(comment);
        }
        return lines.join('\n');
    },

    // Get slugs available on the current page (from task-picker checkboxes)
    _getPageSlugs() {
        const slugs = new Set();
        document.querySelectorAll('.task-select-cb').forEach(function(cb) {
            if (cb.dataset.slug) slugs.add(cb.dataset.slug);
        });
        return slugs;
    },

    // Render sidebar cart — only items added on this page
    renderSidebar() {
        const container = document.getElementById('cartItems');
        const modifiers = document.getElementById('cartModifiers');
        const totalsEl = document.getElementById('cartTotals');
        if (!container) return;

        const currentPage = window.location.pathname;
        const pageItems = {};
        for (const slug of Object.keys(this.items)) {
            if (this.items[slug].page === currentPage) pageItems[slug] = this.items[slug];
        }
        const keys = Object.keys(pageItems);

        if (keys.length === 0) {
            container.innerHTML = '<p class="cart-empty-msg">Select a package or tasks to build your order.</p>';
            if (modifiers) modifiers.classList.add('hidden');
            if (totalsEl) totalsEl.classList.add('hidden');
            return;
        }

        if (modifiers) modifiers.classList.remove('hidden');
        if (totalsEl) totalsEl.classList.remove('hidden');

        let html = '';
        let subtotal = 0;
        let hasCustom = false;

        for (const slug of keys) {
            const item = pageItems[slug];
            if (item.custom) hasCustom = true;
            subtotal += item.price;
            html += '<div class="cart-line-item">' +
                '<div class="cart-item-info">' +
                    '<span class="cart-item-title">' + item.title + '</span>' +
                    '<span class="cart-item-tier">' + item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + '</span>' +
                '</div>' +
                '<div class="cart-item-actions">' +
                    '<span class="cart-item-price">' + (item.price > 0 ? '$' + item.price.toLocaleString() : 'Custom') + '</span>' +
                    '<button class="cart-item-remove" data-slug="' + slug + '" title="Remove">&times;</button>' +
                '</div>' +
            '</div>';
        }
        container.innerHTML = html;

        // Bind remove buttons
        container.querySelectorAll('.cart-item-remove').forEach(function(btn) {
            btn.addEventListener('click', function() { cart.remove(btn.dataset.slug); });
        });

        // Read modifier values from sidebar counters
        const langCount = parseInt(document.getElementById('langCount')?.textContent) || 0;
        const countryCount = parseInt(document.getElementById('countryCount')?.textContent) || 0;

        // Sync modifier counts to all page items (unified with cart page percentage model)
        for (const slug of keys) {
            pageItems[slug].langCount = langCount;
            pageItems[slug].countryCount = countryCount;
        }
        cart.save();

        // Calculate totals using percentage-based getItemTotal (same as cart page)
        let grandTotal = 0;
        for (const slug of keys) {
            grandTotal += cart.getItemTotal(pageItems[slug]);
        }
        const modifierTotal = grandTotal - subtotal;

        // Update sidebar totals
        const subtotalEl = document.getElementById('cartSubtotal');
        const feesEl = document.getElementById('cartFees');
        const totalEl = document.getElementById('cartTotal');

        if (subtotalEl) subtotalEl.textContent = (hasCustom ? 'From $' : '$') + subtotal.toLocaleString();
        if (feesEl) feesEl.textContent = modifierTotal > 0 ? '+$' + modifierTotal.toLocaleString() : '$0';
        if (totalEl) totalEl.textContent = (hasCustom ? 'From $' : '$') + grandTotal.toLocaleString();
    }
};

// Load saved cart from localStorage
cart.load();

// Listen for events from task-picker and pricing blocks
document.addEventListener('taskToggled', function(e) {
    const d = e.detail;
    if (d.replaceAll) {
        // Clear only current page items, keep others
        const currentPage = window.location.pathname;
        for (const slug of Object.keys(cart.items)) {
            if (cart.items[slug].page === currentPage) delete cart.items[slug];
        }
        cart.add(d.slug, d.title, d.tierName, d.tierLabel, d.price, d.custom);
    } else if (d.selected) {
        cart.add(d.slug, d.title, d.tierName, d.tierLabel, d.price, d.custom);
    } else {
        cart.remove(d.slug);
    }
});

document.addEventListener('tierChanged', function(e) {
    const d = e.detail;
    cart.updateTier(d.taskSlug, d.tierName, d.tierLabel, d.price, d.custom);
});

// Initialize sidebar cart on pages with order-cart sidebar
if (document.getElementById('cartItems')) {
    // Restore modifier counter values from saved cart items
    var curPageInit = window.location.pathname;
    for (var s of Object.keys(cart.items)) {
        if (cart.items[s].page === curPageInit) {
            var langEl = document.getElementById('langCount');
            var countryEl = document.getElementById('countryCount');
            if (langEl && cart.items[s].langCount) langEl.textContent = cart.items[s].langCount;
            if (countryEl && cart.items[s].countryCount) countryEl.textContent = cart.items[s].countryCount;
            break;
        }
    }

    // Render sidebar with current page items only (no checkbox syncing from other pages)
    cart.renderSidebar();

    // Init from pre-checked tasks (door openers) only if NO current-page items in cart
    const currentPage = window.location.pathname;
    let hasPageItems = false;
    for (const slug of Object.keys(cart.items)) {
        if (cart.items[slug].page === currentPage) { hasPageItems = true; break; }
    }
    if (!hasPageItems) {
        document.querySelectorAll('.task-select-cb:checked').forEach(function(cb) {
            const item = cb.closest('.task-picker-item');
            const activeTier = item?.querySelector('.tier-btn.active');
            cart.add(
                cb.dataset.slug,
                cb.dataset.title,
                activeTier ? activeTier.dataset.tierName : 'S',
                activeTier ? activeTier.dataset.tierLabel : '',
                activeTier ? (parseInt(activeTier.dataset.price) || 0) : 0,
                activeTier ? activeTier.dataset.custom === 'true' : false
            );
        });
    }
    // DO NOT sync checkboxes from saved cart — only show what user selects on this page
}

// Counter +/- buttons for order modifiers (values synced to items in renderSidebar)
document.querySelectorAll('.cart-counter').forEach(function(counter) {
    counter.querySelector('.counter-minus')?.addEventListener('click', function() {
        const valEl = counter.querySelector('.counter-value');
        let val = parseInt(valEl.textContent) || 0;
        val = Math.max(0, val - 1);
        valEl.textContent = val;
        cart.renderSidebar();
    });
    counter.querySelector('.counter-plus')?.addEventListener('click', function() {
        const valEl = counter.querySelector('.counter-value');
        let val = parseInt(valEl.textContent) || 0;
        val++;
        valEl.textContent = val;
        cart.renderSidebar();
    });
});

// Pricing block → Order Cart integration
if (document.getElementById('cartItems')) {
    document.querySelectorAll('.pricing-package .btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var pkg = btn.closest('.pricing-package');
            var grid = pkg.closest('.pricing-packages-grid');
            var nameEl = pkg.querySelector('.package-header h3');
            var priceEl = pkg.querySelector('.price-current');
            if (!nameEl || !priceEl) return;

            e.preventDefault();
            var pkgName = nameEl.textContent.trim();
            var serviceName = (grid && grid.dataset.service) ? grid.dataset.service : '';
            var slug = (serviceName ? serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' : '') + pkgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            var price = parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;

            document.querySelectorAll('.pricing-package').forEach(function(p) {
                p.classList.remove('pricing-package-selected');
            });
            pkg.classList.add('pricing-package-selected');

            // Clear current page items, add package
            var curPage = window.location.pathname;
            for (var s of Object.keys(cart.items)) {
                if (cart.items[s].page === curPage) delete cart.items[s];
            }
            cart.add(slug, serviceName || pkgName, pkgName, '', price, false);
        });
    });

    document.querySelectorAll('.pricing-tier').forEach(function(tier) {
        tier.style.cursor = 'pointer';
        tier.addEventListener('click', function() {
            var nameEl = tier.querySelector('.tier-name');
            var priceEl = tier.querySelector('.tier-price');
            if (!nameEl || !priceEl) return;

            var tierName = nameEl.textContent.trim();
            var section = tier.closest('.pricing-block');
            var headerEl = section ? section.querySelector('.pricing-header h2') : null;
            var serviceName = headerEl ? headerEl.textContent.trim() : '';
            var slug = (serviceName ? serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' : '') + tierName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            var price = parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;

            document.querySelectorAll('.pricing-tier').forEach(function(t) {
                t.classList.remove('active');
            });
            tier.classList.add('active');

            var curPage = window.location.pathname;
            for (var s of Object.keys(cart.items)) {
                if (cart.items[s].page === curPage) delete cart.items[s];
            }
            cart.add(slug, serviceName || tierName, tierName, '', price, false);
        });
    });
}

// ========================================
// Sidebar Tab Switcher (Order / Contact)
// ========================================
document.querySelectorAll('.sidebar-tabs').forEach(function(tabs) {
    tabs.querySelectorAll('.sidebar-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            const target = tab.dataset.tab;
            // Update active tab
            tabs.querySelectorAll('.sidebar-tab').forEach(function(t) {
                t.classList.toggle('active', t.dataset.tab === target);
            });
            // Show/hide tab content
            const sidebar = tabs.closest('.sidebar-content');
            if (sidebar) {
                sidebar.querySelectorAll('.sidebar-tab-content').forEach(function(panel) {
                    panel.classList.toggle('hidden', panel.dataset.tabContent !== target);
                });
            }
        });
    });
});

// ========================================
// Cart CTA → Navigate to cart page
// ========================================
const cartCta = document.getElementById('cartCta');
if (cartCta) {
    cartCta.addEventListener('click', function(e) {
        // Only prevent default if cart is empty (show alert)
        const keys = Object.keys(cart.items);
        if (keys.length === 0) {
            e.preventDefault();
            alert('Please select services to build your order.');
        }
        // Otherwise let the <a href="cart/"> work naturally
    });
}

// ========================================
// Web3Forms: Contact & Quick Contact Forms
// ========================================
document.querySelectorAll('.sidebar-content .widget').forEach(function(widget) {
    const inputs = widget.querySelectorAll('input.form-input, textarea.form-input, select.form-input');
    const submitBtn = widget.querySelector('button.btn-primary.btn-full');

    if (inputs.length === 0 || !submitBtn) return;
    if (widget.querySelector('form')) return;

    submitBtn.addEventListener('click', function(e) {
        e.preventDefault();

        const formData = {};
        let hasEmail = false;
        inputs.forEach(function(input) {
            const name = input.name || input.type || input.tagName.toLowerCase();
            const value = input.value.trim();
            if (name === 'email' || input.type === 'email') {
                formData.email = value;
                hasEmail = true;
            } else if (name === 'name' || (input.type === 'text' && !formData.name)) {
                formData.name = value;
            } else if (name === 'phone' || input.type === 'tel') {
                formData.phone = value;
            } else if (name === 'message' || input.tagName === 'TEXTAREA') {
                formData.message = value;
            } else if (name === 'source' || input.tagName === 'SELECT') {
                formData.source = value;
            }
        });

        if (!formData.email || !formData.email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }

        const page = document.title || window.location.pathname;
        const isQuickContact = inputs.length <= 2;
        const subject = isQuickContact
            ? 'Quick Contact from ' + page
            : 'Contact Form from ' + page;

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_key: SITE_CONFIG.web3formsKey,
                subject: subject,
                from_name: formData.name || 'Website Visitor',
                replyto: formData.email,
                name: formData.name || '',
                email: formData.email,
                message: formData.message || '(no message)',
                phone: formData.phone || '',
                source: formData.source || '',
                traffic_source: _trafficSource,
                page_url: window.location.href,
                botcheck: ''
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                pushDL('contact', { form_type: isQuickContact ? 'quick_contact' : 'full_form', page: page });
                inputs.forEach(function(input) {
                    if (input.tagName === 'SELECT') {
                        input.selectedIndex = 0;
                    } else {
                        input.value = '';
                    }
                });
                submitBtn.textContent = 'Sent!';
                setTimeout(function() {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 3000);
            } else {
                submitBtn.textContent = 'Error. Try again.';
                submitBtn.disabled = false;
                setTimeout(function() { submitBtn.textContent = originalText; }, 3000);
            }
        })
        .catch(function() {
            submitBtn.textContent = 'Error. Try again.';
            submitBtn.disabled = false;
            setTimeout(function() { submitBtn.textContent = originalText; }, 3000);
        });
    });
});

// ========================================
// Cart Badge (header cart icon)
// ========================================
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = Object.keys(cart.items).length;
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
}
updateCartBadge();

// ========================================
// Cart Page: Full table with per-item modifiers, delivery toggle, comment & email
// ========================================
(function() {
    const cartPage = document.getElementById('cartPage');
    if (!cartPage) return;

    function renderCartPage() {
        // Preserve form state across re-renders
        const savedComment = document.getElementById('cartComment')?.value || '';
        const savedName = document.getElementById('cartName')?.value || '';
        const savedPhone = document.getElementById('cartPhone')?.value || '';
        const savedEmail = document.getElementById('cartEmail')?.value || '';
        const savedSource = document.getElementById('cartSource')?.value || '';

        const keys = Object.keys(cart.items);

        if (keys.length === 0) {
            let emptyHtml = '<div class="cart-page-empty">' +
                '<p>Your cart is empty</p>' +
                '<div class="cart-actions" style="justify-content:center;">' +
                    '<a href="services/" class="btn btn-primary">Browse Services</a>' +
                    (cart._backup ? '<button class="btn btn-secondary" id="cartRestore">Restore Cart</button>' : '') +
                '</div>' +
            '</div>';
            cartPage.innerHTML = emptyHtml;
            document.getElementById('cartRestore')?.addEventListener('click', function() {
                cart.restore();
                renderCartPage();
            });
            return;
        }

        // Table
        let html = '<div class="cart-table-wrap"><table class="cart-table"><thead><tr>' +
            '<th>Service</th>' +
            '<th>Delivery</th>' +
            '<th>Languages</th>' +
            '<th>Countries</th>' +
            '<th class="text-right">Total</th>' +
            '<th></th>' +
        '</tr></thead><tbody>';

        let grandTotal = 0;
        let hasCustom = false;

        for (const slug of keys) {
            const item = cart.items[slug];
            if (item.custom) hasCustom = true;
            const lc = item.langCount || 0;
            const cc = item.countryCount || 0;
            const itemTotal = cart.getItemTotal(item);
            grandTotal += itemTotal;
            const isMonthly = item.delivery === 'monthly';
            const perLang = Math.round(item.price * SITE_CONFIG.langPct);
            const perCountry = Math.round(item.price * SITE_CONFIG.countryPct);

            var basePriceStr = item.price > 0 ? '$' + item.price.toLocaleString() : 'Custom';
            html += '<tr>' +
                '<td>' +
                    '<span class="cart-item-name">' + item.title + '</span>' +
                    '<span class="cart-item-tier">' + item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + ' — ' + basePriceStr + '</span>' +
                '</td>' +
                '<td>' +
                    '<div class="cart-delivery-tabs">' +
                        '<button class="cart-delivery-opt' + (!isMonthly ? ' active' : '') + '" data-slug="' + slug + '" data-val="one-time">One-time</button>' +
                        '<button class="cart-delivery-opt' + (isMonthly ? ' active' : '') + '" data-slug="' + slug + '" data-val="monthly">Monthly</button>' +
                    '</div>' +
                '</td>' +
                '<td>' +
                    '<div class="cart-inline-counter">' +
                        '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="langCount" data-action="minus">−</button>' +
                        '<span class="cart-inline-val">' + lc + '</span>' +
                        '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="langCount" data-action="plus">+</button>' +
                    '</div>' +
                    (lc > 0 ? '<span class="cart-inline-fee">+$' + (perLang * lc).toLocaleString() + '</span>' : '') +
                '</td>' +
                '<td>' +
                    '<div class="cart-inline-counter">' +
                        '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="countryCount" data-action="minus">−</button>' +
                        '<span class="cart-inline-val">' + cc + '</span>' +
                        '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="countryCount" data-action="plus">+</button>' +
                    '</div>' +
                    (cc > 0 ? '<span class="cart-inline-fee">+$' + (perCountry * cc).toLocaleString() + '</span>' : '') +
                '</td>' +
                '<td class="text-right"><span class="cart-item-price">' + (item.price > 0 ? '$' + itemTotal.toLocaleString() : 'Custom') + '</span></td>' +
                '<td><button class="cart-item-remove-btn" data-slug="' + slug + '">&times;</button></td>' +
            '</tr>';
        }
        html += '</tbody></table></div>';

        // Totals row
        html += '<div class="cart-totals">' +
            '<div>' +
                '<div class="cart-total-amount">' + (hasCustom ? 'From ' : '') + '$' + grandTotal.toLocaleString() + '</div>' +
                '<div class="cart-total-label">Estimated Total</div>' +
            '</div>' +
        '</div>';

        // Comment
        html += '<div class="cart-comment-section">' +
            '<label class="cart-field-label" for="cartComment">Order Notes</label>' +
            '<textarea class="cart-field-input" id="cartComment" placeholder="Add notes or special requests..." rows="3"></textarea>' +
        '</div>';

        // Request form (2 fields per row)
        html += '<div class="cart-request-section">' +
            '<div class="cart-request-fields">' +
                '<input type="text" class="cart-field-input" id="cartName" placeholder="Your name" />' +
                '<input type="email" class="cart-field-input" id="cartEmail" placeholder="Your email *" />' +
            '</div>' +
            '<div class="cart-request-fields">' +
                '<input type="tel" class="cart-field-input" id="cartPhone" placeholder="Phone number" />' +
                '<select class="cart-field-input" id="cartSource">' +
                    '<option value="" disabled selected>How did you hear about us?</option>' +
                    '<option value="search">Search engine</option>' +
                    '<option value="social">Social media</option>' +
                    '<option value="referral">Referral</option>' +
                    '<option value="ad">Advertisement</option>' +
                    '<option value="other">Other</option>' +
                '</select>' +
            '</div>' +
            '<div class="cart-actions">' +
                '<button class="btn btn-primary" id="cartSendRequest">Request Quote</button>' +
                '<button class="btn btn-secondary" id="cartPageClear">Clear Cart</button>' +
            '</div>' +
        '</div>';

        cartPage.innerHTML = html;

        // Restore form state
        if (savedComment) document.getElementById('cartComment').value = savedComment;
        if (savedName) document.getElementById('cartName').value = savedName;
        if (savedPhone) document.getElementById('cartPhone').value = savedPhone;
        if (savedEmail) document.getElementById('cartEmail').value = savedEmail;
        if (savedSource) document.getElementById('cartSource').value = savedSource;

        // --- Bind events ---

        // Remove buttons
        cartPage.querySelectorAll('.cart-item-remove-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                cart.remove(btn.dataset.slug);
                renderCartPage();
            });
        });

        // Delivery tabs
        cartPage.querySelectorAll('.cart-delivery-opt').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const slug = btn.dataset.slug;
                const val = btn.dataset.val;
                const item = cart.items[slug];
                if (!item || item.delivery === val) return;
                item.delivery = val;
                cart.save();
                renderCartPage();
            });
        });

        // Inline counter +/- (languages & countries per item)
        cartPage.querySelectorAll('.cart-inline-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const slug = btn.dataset.slug;
                const field = btn.dataset.field;
                const action = btn.dataset.action;
                const item = cart.items[slug];
                if (!item) return;
                let val = item[field] || 0;
                if (action === 'plus') val++;
                else val = Math.max(0, val - 1);
                item[field] = val;
                cart.save();
                renderCartPage();
            });
        });

        // Clear cart
        document.getElementById('cartPageClear')?.addEventListener('click', function() {
            cart.clear();
            renderCartPage();
        });

        // Send request via Web3Forms
        document.getElementById('cartSendRequest')?.addEventListener('click', function() {
            const email = document.getElementById('cartEmail')?.value.trim();
            const name = document.getElementById('cartName')?.value.trim() || 'Website Visitor';
            const phone = document.getElementById('cartPhone')?.value.trim() || '';
            const comment = document.getElementById('cartComment')?.value.trim();
            const source = document.getElementById('cartSource')?.value || '';

            if (!email || !email.includes('@')) {
                alert('Please enter a valid email address.');
                return;
            }

            const orderBody = cart.buildOrderEmail(comment);
            const btn = document.getElementById('cartSendRequest');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_key: SITE_CONFIG.web3formsKey,
                    subject: 'Order Request — ' + keys.length + ' items — Vividigit',
                    from_name: name,
                    replyto: email,
                    name: name,
                    email: email,
                    phone: phone,
                    message: orderBody,
                    source: source,
                    traffic_source: _trafficSource,
                    page_url: window.location.href,
                    botcheck: ''
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.success) {
                    pushDL('generate_lead', { cart_items: keys.length, cart_total: grandTotal, email: email });
                    cartPage.innerHTML = '<div class="cart-page-success">' +
                        '<h3>Request Sent!</h3>' +
                        '<p>We\'ll review your order and get back to you within 24 hours.</p>' +
                        '<div class="cart-actions">' +
                            '<a href="services/" class="btn btn-primary">Continue Shopping</a>' +
                            '<button class="btn btn-secondary" id="cartSuccessClear">Clear Cart</button>' +
                        '</div>' +
                    '</div>';
                    document.getElementById('cartSuccessClear')?.addEventListener('click', function() {
                        cart.clear();
                        renderCartPage();
                    });
                } else {
                    btn.textContent = 'Error. Try again.';
                    btn.disabled = false;
                    setTimeout(function() { btn.textContent = originalText; }, 3000);
                }
            })
            .catch(function() {
                btn.textContent = 'Error. Try again.';
                btn.disabled = false;
                setTimeout(function() { btn.textContent = originalText; }, 3000);
            });
        });
    }

    renderCartPage();
})();

// ========================================
// Theme System
// ========================================
const html = document.documentElement;
const themeDropdown = document.getElementById('themeDropdown');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

const themeIcons = {
    system: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
    dark: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    light: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
};

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
    html.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('theme', theme);
    if (themeIcon) themeIcon.innerHTML = themeIcons[theme];
    document.querySelectorAll('#themeDropdown .dropdown-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

const savedTheme = localStorage.getItem('theme') || 'system';
applyTheme(savedTheme);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = localStorage.getItem('theme') || 'system';
    if (currentTheme === 'system') applyTheme('system');
});

themeToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    themeDropdown?.classList.toggle('open');
    positionDropdown(themeDropdown, themeToggleBtn);
});

document.querySelectorAll('#themeDropdown .dropdown-option').forEach(btn => {
    btn.addEventListener('click', () => {
        applyTheme(btn.dataset.theme);
        themeDropdown?.classList.remove('open');
    });
});

// ========================================
// Language Dropdown (Site Language)
// ========================================
const langDropdownMenu = document.getElementById('langDropdownMenu');
const langToggleBtnIcon = document.getElementById('langToggleBtn');

langToggleBtnIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    langDropdownMenu?.classList.toggle('open');
    positionDropdown(langDropdownMenu, langToggleBtnIcon);
});

document.querySelectorAll('#langDropdownMenu .dropdown-option:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#langDropdownMenu .dropdown-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        langDropdownMenu?.classList.remove('open');
    });
});

// ========================================
// Helper Functions
// ========================================
function closeAllDropdowns() {
    themeDropdown?.classList.remove('open');
    langDropdownMenu?.classList.remove('open');
}

function positionDropdown(dropdown, trigger) {
    if (!dropdown || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
}

document.addEventListener('click', (e) => {
    if (themeDropdown && !themeDropdown.contains(e.target) && e.target !== themeToggleBtn && !themeToggleBtn?.contains(e.target)) {
        themeDropdown.classList.remove('open');
    }
    if (langDropdownMenu && !langDropdownMenu.contains(e.target) && e.target !== langToggleBtnIcon && !langToggleBtnIcon?.contains(e.target)) {
        langDropdownMenu.classList.remove('open');
    }
});

/* === Related Entities: Show All toggle === */
document.querySelectorAll('.related-show-all').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var grid = btn.closest('.related-section').querySelector('.related-grid');
        var expanded = btn.dataset.expanded === 'true';
        if (expanded) {
            grid.classList.remove('related-grid-expanded');
            grid.classList.add('related-grid-collapsed');
            btn.textContent = 'Show all (' + grid.children.length + ')';
            btn.dataset.expanded = 'false';
        } else {
            grid.classList.remove('related-grid-collapsed');
            grid.classList.add('related-grid-expanded');
            btn.textContent = 'Show less';
            btn.dataset.expanded = 'true';
        }
    });
});
