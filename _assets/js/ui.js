/**
 * UI Module
 * Theme, language, and simple interaction widgets.
 */
(function() {
    var app = window.VividigitApp = window.VividigitApp || {};

    var themeIcons = {
        system: (document.getElementById('svg-theme-system') || {}).innerHTML || '',
        dark: (document.getElementById('svg-theme-dark') || {}).innerHTML || '',
        light: (document.getElementById('svg-theme-light') || {}).innerHTML || ''
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
        var viewportGap = 8;
        var offset = 8;
        var rect = trigger.getBoundingClientRect();
        var maxViewportHeight = window.innerHeight - (viewportGap * 2);
        var naturalHeight;
        var naturalWidth;
        var spaceAbove;
        var spaceBelow;
        var openAbove;
        var availableHeight;
        var dropdownRect;
        var top;
        var left;

        dropdown.style.top = '0px';
        dropdown.style.left = '0px';
        dropdown.style.bottom = 'auto';
        dropdown.style.maxHeight = maxViewportHeight + 'px';

        dropdownRect = dropdown.getBoundingClientRect();
        naturalHeight = dropdownRect.height;
        naturalWidth = dropdownRect.width;
        spaceAbove = rect.top - viewportGap;
        spaceBelow = window.innerHeight - rect.bottom - viewportGap;
        openAbove = spaceAbove > spaceBelow && spaceAbove > 120;
        availableHeight = openAbove ? (spaceAbove - offset) : (spaceBelow - offset);

        dropdown.style.maxHeight = Math.max(96, Math.min(maxViewportHeight, availableHeight)) + 'px';
        dropdownRect = dropdown.getBoundingClientRect();

        if (naturalHeight <= spaceBelow - offset) {
            openAbove = false;
        } else if (naturalHeight <= spaceAbove - offset) {
            openAbove = true;
        }

        if (openAbove) {
            top = rect.top - dropdownRect.height - offset;
        } else {
            top = rect.bottom + offset;
        }

        top = Math.max(viewportGap, Math.min(top, window.innerHeight - dropdownRect.height - viewportGap));
        left = Math.max(viewportGap, Math.min(rect.left, window.innerWidth - naturalWidth - viewportGap));

        dropdown.style.left = left + 'px';
        dropdown.style.top = top + 'px';
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

        window.addEventListener('resize', function() {
            var themeDropdown = document.getElementById('themeDropdown');
            var langDropdownMenu = document.getElementById('langDropdownMenu');
            var themeToggleBtn = document.getElementById('themeToggleBtn');
            var langToggleBtn = document.getElementById('langToggleBtn');

            if (themeDropdown?.classList.contains('open')) {
                positionDropdown(themeDropdown, themeToggleBtn);
            }

            if (langDropdownMenu?.classList.contains('open')) {
                positionDropdown(langDropdownMenu, langToggleBtn);
            }
        });
    }

    app.applyTheme = applyTheme;
    app.initUi = initUi;
})();
