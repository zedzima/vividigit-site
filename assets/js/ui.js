/**
 * UI Module
 * Theme, language, and simple interaction widgets.
 */
(function() {
    var app = window.VividigitApp = window.VividigitApp || {};

    var themeIcons = {
        system: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        dark: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
        light: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
    };

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        var html = document.documentElement;
        var themeIcon = document.getElementById('themeIcon');
        var effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

        html.setAttribute('data-theme', effectiveTheme);
        localStorage.setItem('theme', theme);

        if (themeIcon) {
            themeIcon.innerHTML = themeIcons[theme];
        }

        document.querySelectorAll('#themeDropdown .dropdown-option').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    function closeAllDropdowns() {
        document.getElementById('themeDropdown')?.classList.remove('open');
        document.getElementById('langDropdownMenu')?.classList.remove('open');
    }

    function positionDropdown(dropdown, trigger) {
        if (!dropdown || !trigger) return;
        var rect = trigger.getBoundingClientRect();
        dropdown.style.left = rect.left + 'px';
        dropdown.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    }

    function initThemeSystem() {
        var themeDropdown = document.getElementById('themeDropdown');
        var themeToggleBtn = document.getElementById('themeToggleBtn');
        var savedTheme = localStorage.getItem('theme') || 'system';

        applyTheme(savedTheme);

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
            var currentTheme = localStorage.getItem('theme') || 'system';
            if (currentTheme === 'system') {
                applyTheme('system');
            }
        });

        themeToggleBtn?.addEventListener('click', function(e) {
            e.stopPropagation();
            closeAllDropdowns();
            themeDropdown?.classList.toggle('open');
            positionDropdown(themeDropdown, themeToggleBtn);
        });

        document.querySelectorAll('#themeDropdown .dropdown-option').forEach(function(btn) {
            btn.addEventListener('click', function() {
                applyTheme(btn.dataset.theme);
                themeDropdown?.classList.remove('open');
            });
        });
    }

    function initLanguageDropdown() {
        var langDropdownMenu = document.getElementById('langDropdownMenu');
        var langToggleBtn = document.getElementById('langToggleBtn');

        langToggleBtn?.addEventListener('click', function(e) {
            e.stopPropagation();
            closeAllDropdowns();
            langDropdownMenu?.classList.toggle('open');
            positionDropdown(langDropdownMenu, langToggleBtn);
        });

        document.querySelectorAll('#langDropdownMenu .dropdown-option:not(:disabled)').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#langDropdownMenu .dropdown-option').forEach(function(option) {
                    option.classList.remove('active');
                });
                btn.classList.add('active');
                langDropdownMenu?.classList.remove('open');
            });
        });

        document.addEventListener('click', function(e) {
            var themeDropdown = document.getElementById('themeDropdown');
            if (themeDropdown && !themeDropdown.contains(e.target) && e.target !== document.getElementById('themeToggleBtn') && !document.getElementById('themeToggleBtn')?.contains(e.target)) {
                themeDropdown.classList.remove('open');
            }

            if (langDropdownMenu && !langDropdownMenu.contains(e.target) && e.target !== langToggleBtn && !langToggleBtn?.contains(e.target)) {
                langDropdownMenu.classList.remove('open');
            }
        });
    }

    function initRelatedShowAll() {
        document.querySelectorAll('.related-show-all').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var grid = btn.closest('.related-section').querySelector('.related-grid');
                var expanded = btn.dataset.expanded === 'true';

                if (expanded) {
                    grid.classList.remove('related-grid-expanded');
                    grid.classList.add('related-grid-collapsed');
                    btn.textContent = 'Show all (' + grid.children.length + ')';
                    btn.dataset.expanded = 'false';
                    return;
                }

                grid.classList.remove('related-grid-collapsed');
                grid.classList.add('related-grid-expanded');
                btn.textContent = 'Show less';
                btn.dataset.expanded = 'true';
            });
        });
    }

    function initUi() {
        if (app.uiInitialized) return;
        app.uiInitialized = true;

        initThemeSystem();
        initLanguageDropdown();
        initRelatedShowAll();
    }

    app.applyTheme = applyTheme;
    app.initUi = initUi;
})();
