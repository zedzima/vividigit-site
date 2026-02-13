/**
 * Site JavaScript
 * Vividigit - Main site interactions
 */

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
// Order Cart
// ========================================
const cart = {
    items: {},

    add(slug, title, tierName, tierLabel, price, custom) {
        this.items[slug] = { title, tierName, tierLabel, price, custom };
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
        this.render();
    },

    updateTier(slug, tierName, tierLabel, price, custom) {
        if (this.items[slug]) {
            this.items[slug].tierName = tierName;
            this.items[slug].tierLabel = tierLabel;
            this.items[slug].price = price;
            this.items[slug].custom = custom;
            this.render();
        }
    },

    render() {
        const container = document.getElementById('cartItems');
        const modifiers = document.getElementById('cartModifiers');
        const totals = document.getElementById('cartTotals');
        if (!container) return;

        const keys = Object.keys(this.items);

        if (keys.length === 0) {
            container.innerHTML = '<p class="cart-empty-msg">Select tasks below to build your order.</p>';
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

// Listen for events from task-picker block
document.addEventListener('taskToggled', function(e) {
    const d = e.detail;
    if (d.selected) {
        cart.add(d.slug, d.title, d.tierName, d.tierLabel, d.price, d.custom);
    } else {
        cart.remove(d.slug);
    }
});

document.addEventListener('tierChanged', function(e) {
    const d = e.detail;
    cart.updateTier(d.taskSlug, d.tierName, d.tierLabel, d.price, d.custom);
});

// Initialize cart with pre-checked tasks (door openers)
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

// Counter +/- buttons for order modifiers
document.querySelectorAll('.cart-counter').forEach(function(counter) {
    counter.querySelector('.counter-minus')?.addEventListener('click', function() {
        const valEl = counter.querySelector('.counter-value');
        let val = parseInt(valEl.textContent) || 0;
        val = Math.max(0, val - 1);
        valEl.textContent = val;
        cart.render();
    });
    counter.querySelector('.counter-plus')?.addEventListener('click', function() {
        const valEl = counter.querySelector('.counter-value');
        let val = parseInt(valEl.textContent) || 0;
        val++;
        valEl.textContent = val;
        cart.render();
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

    // Update icon
    if (themeIcon) themeIcon.innerHTML = themeIcons[theme];

    // Update active state in dropdown
    document.querySelectorAll('#themeDropdown .dropdown-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'system';
applyTheme(savedTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = localStorage.getItem('theme') || 'system';
    if (currentTheme === 'system') {
        applyTheme('system');
    }
});

// Theme dropdown toggle
themeToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    themeDropdown?.classList.toggle('open');
    positionDropdown(themeDropdown, themeToggleBtn);
});

// Theme option click
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

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (themeDropdown && !themeDropdown.contains(e.target) && e.target !== themeToggleBtn && !themeToggleBtn?.contains(e.target)) {
        themeDropdown.classList.remove('open');
    }
    if (langDropdownMenu && !langDropdownMenu.contains(e.target) && e.target !== langToggleBtnIcon && !langToggleBtnIcon?.contains(e.target)) {
        langDropdownMenu.classList.remove('open');
    }
});
