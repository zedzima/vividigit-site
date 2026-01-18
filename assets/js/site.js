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
// Service Configurator Calculator
// ========================================
function calculatePrice() {
    // Get tariff from active tab
    const tariffBtn = document.querySelector('#tariffToggle .tab-btn.active');
    const tariff = parseInt(tariffBtn?.dataset.value || 0);

    // Get speed coefficient from active tab
    // Slow = 0.9 (-10%), Standard = 1.0 (0%), Fast = 1.1 (+10%)
    const speedBtn = document.querySelector('#speedToggle .tab-btn.active');
    const speedCoef = parseFloat(speedBtn?.dataset.value || 1);
    const timeLabel = speedBtn?.dataset.label || '2-3 weeks';

    // Sum modules
    let modules = 0;
    document.querySelectorAll('.module-check:checked').forEach(cb => {
        modules += parseInt(cb.dataset.price || 0);
    });

    // Count total languages selected (including English)
    const langCount = document.querySelectorAll('.lang-check:checked').length;
    // Each extra language = +60% (1 lang = 1.0, 2 = 1.6, 3 = 2.2, etc.)
    const langMultiplier = 1 + ((langCount - 1) * 0.6);

    // Price = (tariff + modules) × langMultiplier × speedCoef
    const total = Math.round((tariff + modules) * langMultiplier * speedCoef);

    // Update displays
    const priceDisplay = document.getElementById('totalPrice');
    const timeDisplay = document.getElementById('totalTime');
    if (priceDisplay) priceDisplay.textContent = '$' + total.toLocaleString();
    if (timeDisplay) timeDisplay.textContent = timeLabel;
}

function updateLangText() {
    const checked = document.querySelectorAll('.lang-check:checked');
    const names = Array.from(checked).map(cb => cb.dataset.name);
    const text = names.length > 2
        ? `${names.slice(0, 2).join(', ')} +${names.length - 2}`
        : names.join(', ');
    const display = document.getElementById('langSelectedText');
    if (display) display.textContent = text || 'English';
}

// Tariff tabs
document.querySelectorAll('#tariffToggle .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#tariffToggle .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calculatePrice();
    });
});

// Speed tabs
document.querySelectorAll('#speedToggle .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#speedToggle .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calculatePrice();
    });
});

// Order Language dropdown toggle (right sidebar - service configurator)
const orderLangDropdown = document.getElementById('orderLangDropdown');
const orderLangToggleBtn = document.getElementById('orderLangToggleBtn');

orderLangToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    orderLangDropdown?.classList.toggle('open');
});

// Language checkboxes (service configurator)
document.querySelectorAll('.lang-check').forEach(cb => {
    cb.addEventListener('change', () => {
        updateLangText();
        calculatePrice();
    });
});

// Modules checkboxes
document.querySelectorAll('.module-check').forEach(cb => {
    cb.addEventListener('change', calculatePrice);
});

// Initial calculation
updateLangText();
calculatePrice();

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
    orderLangDropdown?.classList.remove('open');
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
    if (orderLangDropdown && !orderLangDropdown.contains(e.target)) {
        orderLangDropdown.classList.remove('open');
    }
});
