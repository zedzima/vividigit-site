/**
 * Site JavaScript
 * Vividigit - Main site interactions
 */

// ========================================
// Configuration
// ========================================
const SITE_CONFIG = {
    web3formsKey: 'YOUR_WEB3FORMS_ACCESS_KEY', // Replace with key from https://web3forms.com
    notifyEmail: 'mail@vividigit.com',
    checkoutWorkerUrl: 'https://vividigit-checkout.workers.dev', // Cloudflare Worker URL
    cartStorageKey: 'vividigit_cart',
    modifiersStorageKey: 'vividigit_modifiers'
};

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
    _pageUrl: '',

    load() {
        try {
            const saved = localStorage.getItem(SITE_CONFIG.cartStorageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.items = data.items || {};
                this._pageUrl = data.pageUrl || '';
            }
        } catch (e) { /* ignore parse errors */ }
    },

    save() {
        try {
            localStorage.setItem(SITE_CONFIG.cartStorageKey, JSON.stringify({
                items: this.items,
                pageUrl: this._pageUrl || window.location.pathname
            }));
        } catch (e) { /* ignore storage errors */ }
    },

    add(slug, title, tierName, tierLabel, price, custom) {
        this.items[slug] = { title, tierName, tierLabel, price, custom };
        this._pageUrl = window.location.pathname;
        this.save();
        this.render();
    },

    remove(slug) {
        delete this.items[slug];
        const cb = document.querySelector('.task-select-cb[data-slug="' + slug + '"]');
        if (cb) {
            cb.checked = false;
            const item = cb.closest('.task-picker-item');
            if (item) item.classList.remove('selected');
        }
        this.save();
        this.render();
    },

    updateTier(slug, tierName, tierLabel, price, custom) {
        if (this.items[slug]) {
            this.items[slug].tierName = tierName;
            this.items[slug].tierLabel = tierLabel;
            this.items[slug].price = price;
            this.items[slug].custom = custom;
            this.save();
            this.render();
        }
    },

    clear() {
        this.items = {};
        this._pageUrl = '';
        this.save();
        this.render();
    },

    getTotal() {
        let subtotal = 0;
        let hasCustom = false;
        for (const slug of Object.keys(this.items)) {
            const item = this.items[slug];
            if (item.custom) hasCustom = true;
            subtotal += item.price;
        }
        const langCount = parseInt(document.getElementById('langCount')?.textContent) || 0;
        const countryCount = parseInt(document.getElementById('countryCount')?.textContent) || 0;
        const langFeeEl = document.querySelector('.cart-counter[data-type="lang"]');
        const countryFeeEl = document.querySelector('.cart-counter[data-type="country"]');
        const langFee = parseInt(langFeeEl?.dataset.fee) || 200;
        const countryFee = parseInt(countryFeeEl?.dataset.fee) || 100;
        const modifierTotal = (langCount * langFee) + (countryCount * countryFee);
        return { subtotal, modifierTotal, total: subtotal + modifierTotal, hasCustom, langCount, countryCount };
    },

    getSummaryText() {
        const keys = Object.keys(this.items);
        if (keys.length === 0) return 'Empty cart';
        let lines = keys.map(slug => {
            const item = this.items[slug];
            const price = item.price > 0 ? '$' + item.price : 'Custom';
            return item.title + ' (' + item.tierName + ') — ' + price;
        });
        const totals = this.getTotal();
        if (totals.langCount > 0) lines.push('Additional languages: ' + totals.langCount);
        if (totals.countryCount > 0) lines.push('Additional countries: ' + totals.countryCount);
        lines.push('Estimated total: $' + totals.total);
        return lines.join('\n');
    },

    render() {
        const container = document.getElementById('cartItems');
        const modifiers = document.getElementById('cartModifiers');
        const totals = document.getElementById('cartTotals');
        if (!container) return;

        const keys = Object.keys(this.items);

        if (keys.length === 0) {
            container.innerHTML = '<p class="cart-empty-msg">Select a package or tasks to build your order.</p>';
            if (modifiers) modifiers.style.display = 'none';
            if (totals) totals.style.display = 'none';
            return;
        }

        if (modifiers) modifiers.style.display = '';
        if (totals) totals.style.display = '';

        let html = '';
        let subtotal = 0;
        let hasCustom = false;

        for (const slug of keys) {
            const item = this.items[slug];
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

        // Calculate modifiers
        const langCount = parseInt(document.getElementById('langCount')?.textContent) || 0;
        const countryCount = parseInt(document.getElementById('countryCount')?.textContent) || 0;
        const langFeeEl = document.querySelector('.cart-counter[data-type="lang"]');
        const countryFeeEl = document.querySelector('.cart-counter[data-type="country"]');
        const langFee = parseInt(langFeeEl?.dataset.fee) || 200;
        const countryFee = parseInt(countryFeeEl?.dataset.fee) || 100;
        const modifierTotal = (langCount * langFee) + (countryCount * countryFee);

        // Update displays
        const subtotalEl = document.getElementById('cartSubtotal');
        const feesEl = document.getElementById('cartFees');
        const totalEl = document.getElementById('cartTotal');

        if (subtotalEl) subtotalEl.textContent = (hasCustom ? 'From $' : '$') + subtotal.toLocaleString();
        if (feesEl) feesEl.textContent = modifierTotal > 0 ? '+$' + modifierTotal.toLocaleString() : '$0';
        if (totalEl) totalEl.textContent = (hasCustom ? 'From $' : '$') + (subtotal + modifierTotal).toLocaleString();
    }
};

// Load saved cart from localStorage
cart.load();

// Listen for events from task-picker and pricing blocks
document.addEventListener('taskToggled', function(e) {
    const d = e.detail;
    if (d.replaceAll) {
        cart.items = {};
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

// Initialize cart display on pages with order-cart sidebar
if (document.getElementById('cartItems')) {
    // Restore modifiers from localStorage
    try {
        const savedMods = localStorage.getItem(SITE_CONFIG.modifiersStorageKey);
        if (savedMods) {
            const mods = JSON.parse(savedMods);
            const langEl = document.getElementById('langCount');
            const countryEl = document.getElementById('countryCount');
            if (langEl && mods.langCount) langEl.textContent = mods.langCount;
            if (countryEl && mods.countryCount) countryEl.textContent = mods.countryCount;
        }
    } catch (e) { /* ignore */ }

    // Render saved cart
    cart.render();

    // Also init from pre-checked tasks (door openers) if cart was empty
    if (Object.keys(cart.items).length === 0) {
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
    } else {
        // Sync checkboxes with saved cart state
        document.querySelectorAll('.task-select-cb').forEach(function(cb) {
            const slug = cb.dataset.slug;
            if (cart.items[slug]) {
                cb.checked = true;
                const item = cb.closest('.task-picker-item');
                if (item) item.classList.add('selected', 'expanded');
                const savedTier = cart.items[slug].tierName;
                const tierBtns = item?.querySelectorAll('.tier-btn');
                if (tierBtns) {
                    tierBtns.forEach(function(btn) {
                        btn.classList.toggle('active', btn.dataset.tierName === savedTier);
                    });
                }
            }
        });
    }
}

// Counter +/- buttons for order modifiers
document.querySelectorAll('.cart-counter').forEach(function(counter) {
    counter.querySelector('.counter-minus')?.addEventListener('click', function() {
        const valEl = counter.querySelector('.counter-value');
        let val = parseInt(valEl.textContent) || 0;
        val = Math.max(0, val - 1);
        valEl.textContent = val;
        saveModifiers();
        cart.render();
    });
    counter.querySelector('.counter-plus')?.addEventListener('click', function() {
        const valEl = counter.querySelector('.counter-value');
        let val = parseInt(valEl.textContent) || 0;
        val++;
        valEl.textContent = val;
        saveModifiers();
        cart.render();
    });
});

function saveModifiers() {
    try {
        localStorage.setItem(SITE_CONFIG.modifiersStorageKey, JSON.stringify({
            langCount: parseInt(document.getElementById('langCount')?.textContent) || 0,
            countryCount: parseInt(document.getElementById('countryCount')?.textContent) || 0
        }));
    } catch (e) { /* ignore */ }
}

// Pricing block → Order Cart integration
if (document.getElementById('cartItems')) {
    document.querySelectorAll('.pricing-package .btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var pkg = btn.closest('.pricing-package');
            var nameEl = pkg.querySelector('.package-header h3');
            var priceEl = pkg.querySelector('.price-current');
            if (!nameEl || !priceEl) return;

            e.preventDefault();
            var name = nameEl.textContent.trim();
            var slug = name.toLowerCase().replace(/\s+/g, '-');
            var price = parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;

            document.querySelectorAll('.pricing-package').forEach(function(p) {
                p.classList.remove('pricing-package-selected');
            });
            pkg.classList.add('pricing-package-selected');

            cart.items = {};
            cart.add(slug, name, 'Package', '', price, false);
        });
    });

    document.querySelectorAll('.pricing-tier').forEach(function(tier) {
        tier.style.cursor = 'pointer';
        tier.addEventListener('click', function() {
            var nameEl = tier.querySelector('.tier-name');
            var priceEl = tier.querySelector('.tier-price');
            if (!nameEl || !priceEl) return;

            var name = nameEl.textContent.trim();
            var slug = name.toLowerCase().replace(/\s+/g, '-');
            var price = parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;

            document.querySelectorAll('.pricing-tier').forEach(function(t) {
                t.classList.remove('active');
            });
            tier.classList.add('active');

            cart.items = {};
            cart.add(slug, name, 'Tier', '', price, false);
        });
    });
}

// ========================================
// Checkout: Cart CTA → Revolut Payment
// ========================================
const cartCta = document.getElementById('cartCta');
if (cartCta) {
    cartCta.addEventListener('click', function(e) {
        e.preventDefault();

        const keys = Object.keys(cart.items);
        if (keys.length === 0) {
            alert('Please select services to build your order.');
            return;
        }

        const totals = cart.getTotal();

        // If total is 0 or has custom pricing, redirect to contact with cart summary
        if (totals.total === 0 || totals.hasCustom) {
            const summary = encodeURIComponent(cart.getSummaryText());
            window.location.href = 'contact/?order=' + summary;
            return;
        }

        // Show loading state
        cartCta.textContent = 'Processing...';
        cartCta.style.pointerEvents = 'none';

        // Send to Cloudflare Worker → Revolut
        fetch(SITE_CONFIG.checkoutWorkerUrl + '/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart.items,
                modifiers: {
                    languages: totals.langCount,
                    countries: totals.countryCount
                },
                total: totals.total,
                currency: 'USD',
                pageUrl: window.location.href
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else if (data.error) {
                alert('Payment error: ' + data.error);
                cartCta.textContent = 'Request Quote';
                cartCta.style.pointerEvents = '';
            }
        })
        .catch(function(err) {
            // Fallback: redirect to contact with cart summary
            console.error('Checkout error:', err);
            const summary = encodeURIComponent(cart.getSummaryText());
            window.location.href = 'contact/?order=' + summary;
        });
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

        // Check for cart data in URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderData = urlParams.get('order');
        if (orderData) {
            formData.order = decodeURIComponent(orderData);
        }

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
                email: formData.email,
                message: formData.message || '(no message)',
                phone: formData.phone || '',
                source: formData.source || '',
                order: formData.order || '',
                page_url: window.location.href,
                botcheck: ''
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
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
