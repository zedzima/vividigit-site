/**
 * Forms Module
 * Contact flows, CTA routing, and enhanced selects.
 */
(function() {
    var app = window.VividigitApp = window.VividigitApp || {};

    function initSidebarTabs() {
        document.querySelectorAll('.sidebar-tabs').forEach(function(tabs) {
            tabs.querySelectorAll('.sidebar-tab').forEach(function(tab) {
                tab.addEventListener('click', function() {
                    var target = tab.dataset.tab;

                    tabs.querySelectorAll('.sidebar-tab').forEach(function(currentTab) {
                        currentTab.classList.toggle('active', currentTab.dataset.tab === target);
                    });

                    var sidebar = tabs.closest('.sidebar-content');
                    if (!sidebar) return;

                    sidebar.querySelectorAll('.sidebar-tab-content').forEach(function(panel) {
                        panel.classList.toggle('hidden', panel.dataset.tabContent !== target);
                    });
                });
            });
        });
    }

    function getBtnLabel(el) {
        return (el.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function isContactHref(href) {
        if (!href) return false;
        var normalized = href.replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();
        return normalized === 'contact' || normalized.startsWith('contact/') || normalized.startsWith('contact?');
    }

    function isSidebarContactHref(href) {
        return (href || '').trim().toLowerCase() === '#sidebar-contact';
    }

    function openContactSidebar() {
        app.sidebarNav?.classList.remove('open');
        app.sidebarAction?.classList.add('open');
        app.syncSidebarOverlay?.();

        var contactTab = document.querySelector('.sidebar-tabs .sidebar-tab[data-tab="contact"]');
        if (contactTab && !contactTab.classList.contains('active')) {
            contactTab.click();
        }

        var sidebarContent = document.querySelector('.sidebar-action .sidebar-content');
        if (!sidebarContent) return;

        var contactWidget = null;
        var contactPanel = sidebarContent.querySelector('.sidebar-tab-content[data-tab-content="contact"]:not(.hidden)');
        if (contactPanel) {
            contactWidget = contactPanel.querySelector('.widget');
        }

        if (!contactWidget) {
            sidebarContent.querySelectorAll('.widget').forEach(function(widget) {
                if (contactWidget) return;
                var title = widget.querySelector('.widget-title');
                if (title && title.textContent.trim().toLowerCase() === 'contact us') {
                    contactWidget = widget;
                }
            });
        }

        contactWidget?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function addFromPricingBlock() {
        var simpleBtn = document.querySelector('.pricing-simple-cta');
        if (simpleBtn) {
            simpleBtn.click();
            return true;
        }

        var packageBtn = document.querySelector('.pricing-package .btn');
        if (packageBtn) {
            packageBtn.click();
            return true;
        }

        var tier = document.querySelector('.pricing-tier');
        if (tier) {
            tier.click();
            return true;
        }

        return false;
    }

    function addFromTaskPicker() {
        var firstChecked = document.querySelector('.task-select-cb:checked');
        var cb = firstChecked || document.querySelector('.task-select-cb');
        var billing = null;
        var item = null;
        var activeTier = null;

        if (!cb) return false;

        item = cb.closest('.task-picker-item');
        activeTier = item ? item.querySelector('.tier-btn.active') : null;
        billing = app.readBillingFromDataset
            ? app.readBillingFromDataset(cb, app.defaultBilling)
            : { oneTime: true, monthly: false, yearly: false };

        if (!cb.checked) {
            cb.checked = true;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }

        document.dispatchEvent(new CustomEvent('taskToggled', {
            detail: {
                slug: cb.dataset.slug,
                title: cb.dataset.title,
                selected: true,
                tierName: activeTier ? activeTier.dataset.tierName : 'S',
                tierLabel: activeTier ? activeTier.dataset.tierLabel : '',
                price: activeTier ? (parseInt(activeTier.dataset.price) || 0) : 0,
                custom: activeTier ? activeTier.dataset.custom === 'true' : false,
                billing: billing
            }
        }));

        return true;
    }

    function openOrderSidebar() {
        app.sidebarNav?.classList.remove('open');
        app.sidebarAction?.classList.add('open');
        app.syncSidebarOverlay?.();

        var orderTab = document.querySelector('.sidebar-tabs .sidebar-tab[data-tab="order"]');
        if (orderTab && !orderTab.classList.contains('active')) {
            orderTab.click();
        }

        document.getElementById('cartItems')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function normalizeCtaButtons() {
        document.querySelectorAll('a.btn, button.btn').forEach(function(btn) {
            var label;
            var href;

            if (btn.id === 'cartSendRequest' || btn.id === 'cartCta' || btn.closest('#cartPage')) return;
            if (btn.closest('.pricing-block') && document.getElementById('cartItems')) return;

            label = getBtnLabel(btn);
            href = btn.tagName === 'A' ? (btn.getAttribute('href') || '').trim() : '';

            if (/^(request quote|get quote)$/i.test(label)) {
                btn.textContent = 'Contact Us';
                btn.dataset.ctaAction = 'open-contact';
                if (btn.tagName === 'A') btn.setAttribute('href', '#sidebar-contact');
                return;
            }

            if (/^(discuss your project|ask us|apply|request consultation|contact us)$/i.test(label)) {
                btn.dataset.ctaAction = 'open-contact';
                if (btn.tagName === 'A') btn.setAttribute('href', '#sidebar-contact');
                return;
            }

            if (/^book consultation$/i.test(label)) {
                if (btn.tagName === 'A' && isSidebarContactHref(href)) {
                    btn.dataset.ctaAction = 'open-contact';
                } else {
                    btn.dataset.ctaAction = 'booking-disabled';
                    btn.classList.add('btn-disabled');
                    btn.setAttribute('aria-disabled', 'true');
                    if (btn.tagName === 'A') btn.setAttribute('href', '#');
                }
                return;
            }

            if (btn.tagName === 'A' && (isContactHref(href) || isSidebarContactHref(href))) {
                btn.dataset.ctaAction = 'open-contact';
                btn.setAttribute('href', '#sidebar-contact');
            }
        });
    }

    function setupGlobalCtaActions() {
        var path = window.location.pathname.replace(/\/+$/, '');
        var hasOrderCart = !!document.getElementById('cartItems');
        var isScopeDetail = /^\/scopes\/[^/]+$/.test(path);
        var isServiceDetail = /^\/services\/[^/]+$/.test(path);
        var isSolutionDetail = /^\/solutions\/[^/]+$/.test(path);

        document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href]');
            var btn;
            var label;
            var href;
            var inPricingBlock;
            var ctaAction;

            if (link) {
                href = (link.getAttribute('href') || '').trim();
                if (hasOrderCart && link.closest('.pricing-block')) {
                    // Pricing buttons on order-cart pages should add to order, not jump to contact tab.
                } else if (isContactHref(href) || isSidebarContactHref(href)) {
                    e.preventDefault();
                    openContactSidebar();
                    return;
                }
            }

            btn = e.target.closest('a.btn, button.btn');
            if (!btn) return;
            if (btn.id === 'cartSendRequest' || btn.id === 'cartCta') return;

            label = getBtnLabel(btn);
            href = btn.tagName === 'A' ? (btn.getAttribute('href') || '').trim() : '';
            inPricingBlock = !!btn.closest('.pricing-block');
            ctaAction = btn.dataset.ctaAction || '';

            if (ctaAction === 'booking-disabled') {
                e.preventDefault();
                alert('Booking is not available yet.');
                return;
            }

            if (ctaAction === 'open-contact') {
                e.preventDefault();
                openContactSidebar();
                return;
            }

            if (!inPricingBlock && isServiceDetail && /^start with\b/i.test(label)) {
                e.preventDefault();
                if (addFromPricingBlock()) openOrderSidebar();
                else openContactSidebar();
                return;
            }

            if (!inPricingBlock && isSolutionDetail && (/^request audit$/i.test(label) || (/^get\b/i.test(label) && /\baudit\b/i.test(label)))) {
                e.preventDefault();
                if (addFromPricingBlock()) openOrderSidebar();
                else openContactSidebar();
                return;
            }

            if (!inPricingBlock && isScopeDetail && (href === '#task-picker' || /^start with\b/i.test(label) || (/^get\b/i.test(label) && /\baudit\b/i.test(label)))) {
                e.preventDefault();
                if (addFromTaskPicker()) openOrderSidebar();
                else openContactSidebar();
            }
        });
    }

    function initSidebarShare() {
        var shareWidget = document.getElementById('sidebarShare');
        var contactPanel = document.querySelector('.sidebar-tab-content[data-tab-content="contact"]');
        var canonicalHref;
        var pageUrl;
        var pageTitle;
        var encodedUrl;
        var encodedTitle;

        if (!shareWidget) return;

        if (contactPanel) {
            contactPanel.appendChild(shareWidget);
        } else {
            var lastContactWidget = null;

            document.querySelectorAll('.sidebar-content .widget').forEach(function(widget) {
                var hasEmail = !!widget.querySelector('input[type="email"], input[name="email"]');
                var hasMessage = !!widget.querySelector('textarea[name="message"], textarea.form-input');
                var hasSubmit = !!widget.querySelector('button.btn-primary.btn-full');

                if (hasEmail && hasMessage && hasSubmit) {
                    lastContactWidget = widget;
                }
            });

            if (lastContactWidget) {
                lastContactWidget.insertAdjacentElement('afterend', shareWidget);
            }
        }

        canonicalHref = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        pageUrl = canonicalHref.trim() || window.location.href;
        pageTitle = document.title || 'VIVIDIGIT';
        encodedUrl = encodeURIComponent(pageUrl);
        encodedTitle = encodeURIComponent(pageTitle);

        shareWidget.querySelectorAll('.sidebar-share-btn[data-share]').forEach(function(btn) {
            var network = (btn.dataset.share || '').toLowerCase();

            if (network === 'linkedin' && btn.tagName === 'A') {
                btn.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl;
            } else if (network === 'x' && btn.tagName === 'A') {
                btn.href = 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodedTitle;
            } else if (network === 'facebook' && btn.tagName === 'A') {
                btn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
            } else if (network === 'copy') {
                var originalTitle = btn.getAttribute('title') || 'Copy Link';
                var originalAria = btn.getAttribute('aria-label') || 'Copy Link';

                btn.addEventListener('click', function() {
                    var markCopied = function() {
                        btn.classList.add('copied');
                        btn.setAttribute('title', 'Copied');
                        btn.setAttribute('aria-label', 'Copied');
                        setTimeout(function() {
                            btn.classList.remove('copied');
                            btn.setAttribute('title', originalTitle);
                            btn.setAttribute('aria-label', originalAria);
                        }, 1200);
                    };

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(pageUrl).then(markCopied).catch(function() {
                            window.prompt('Copy this link:', pageUrl);
                        });
                    } else {
                        window.prompt('Copy this link:', pageUrl);
                    }
                });
            }
        });
    }

    function initSourceSelectDropdowns() {
        var selects = document.querySelectorAll(
            '.sidebar-content .widget select.form-input[name="source"], #cartSource.cart-field-input'
        );
        var viewportPadding = 16;
        var menuDefaultMaxHeight = 220;
        var menuMinHeight = 120;
        var menuMaxHeight = 360;

        if (!selects.length) return;

        function closeAllSourceSelects(except) {
            document.querySelectorAll('.source-select.open').forEach(function(wrapper) {
                if (except && wrapper === except) return;

                wrapper.classList.remove('open', 'open-up');
                wrapper.querySelector('.source-select-toggle')?.setAttribute('aria-expanded', 'false');

                var menu = wrapper.querySelector('.source-select-menu');
                if (menu) menu.style.maxHeight = '';
            });
        }

        function positionSourceMenu(wrapper, menu) {
            var rect = wrapper.getBoundingClientRect();
            var spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
            var spaceAbove = rect.top - viewportPadding;
            var openUp = spaceBelow < menuDefaultMaxHeight && spaceAbove > spaceBelow;
            var availableSpace = openUp ? spaceAbove : spaceBelow;
            var nextMaxHeight = Math.max(menuMinHeight, Math.min(menuMaxHeight, Math.floor(availableSpace)));

            wrapper.classList.toggle('open-up', openUp);
            menu.style.maxHeight = nextMaxHeight + 'px';
        }

        function repositionOpenSourceMenus() {
            document.querySelectorAll('.source-select.open').forEach(function(wrapper) {
                var menu = wrapper.querySelector('.source-select-menu');
                if (menu) positionSourceMenu(wrapper, menu);
            });
        }

        selects.forEach(function(select) {
            var group;
            var wrapper;
            var toggle;
            var label;
            var arrow;
            var arrowPath;
            var menu;

            if (select.dataset.enhanced === 'true') return;
            select.dataset.enhanced = 'true';

            group = select.closest('.form-group') || select.parentElement;
            if (!group) return;

            wrapper = document.createElement('div');
            wrapper.className = 'source-select';
            if (select.id === 'cartSource') {
                wrapper.classList.add('source-select-cart');
            }

            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'source-select-toggle';
            toggle.setAttribute('aria-haspopup', 'listbox');
            toggle.setAttribute('aria-expanded', 'false');

            label = document.createElement('span');
            label.className = 'source-select-label';
            toggle.appendChild(label);

            var arrowTemplate = document.querySelector('#svg-chevron-down svg');
            if (arrowTemplate) {
                arrow = arrowTemplate.cloneNode(true);
                arrow.setAttribute('class', 'dropdown-arrow');
            } else {
                arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                arrow.setAttribute('class', 'dropdown-arrow');
                arrow.setAttribute('viewBox', '0 0 24 24');
                arrow.setAttribute('fill', 'none');
                arrow.setAttribute('stroke', 'currentColor');
                arrow.setAttribute('stroke-width', '2');
                arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                arrowPath.setAttribute('points', '6 9 12 15 18 9');
                arrow.appendChild(arrowPath);
            }
            toggle.appendChild(arrow);

            menu = document.createElement('div');
            menu.className = 'source-select-menu';
            menu.setAttribute('role', 'listbox');

            function updateState() {
                var selected = select.options[select.selectedIndex] || select.options[0];
                var fallback = select.options[0];
                var hasValue = !!(selected && selected.value);

                label.textContent = hasValue
                    ? selected.textContent
                    : (fallback ? fallback.textContent : 'Select');
                toggle.classList.toggle('is-placeholder', !hasValue);

                menu.querySelectorAll('.source-select-option').forEach(function(optionBtn) {
                    var value = optionBtn.dataset.value || '';
                    var isActive = value === select.value && value !== '';
                    optionBtn.classList.toggle('active', isActive);
                });
            }

            Array.from(select.options).forEach(function(option) {
                var optionBtn = document.createElement('button');

                optionBtn.type = 'button';
                optionBtn.className = 'source-select-option dropdown-option';
                optionBtn.textContent = option.textContent;
                optionBtn.dataset.value = option.value;

                if (option.disabled) {
                    optionBtn.disabled = true;
                    optionBtn.classList.add('disabled');
                }

                optionBtn.addEventListener('click', function() {
                    if (optionBtn.disabled) return;

                    select.value = optionBtn.dataset.value || '';
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    wrapper.classList.remove('open', 'open-up');
                    toggle.setAttribute('aria-expanded', 'false');
                    menu.style.maxHeight = '';
                });

                menu.appendChild(optionBtn);
            });

            toggle.addEventListener('click', function(e) {
                var willOpen;

                e.stopPropagation();
                willOpen = !wrapper.classList.contains('open');
                closeAllSourceSelects(wrapper);
                wrapper.classList.toggle('open', willOpen);

                if (willOpen) {
                    positionSourceMenu(wrapper, menu);
                } else {
                    wrapper.classList.remove('open-up');
                    menu.style.maxHeight = '';
                }

                toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });

            select.addEventListener('change', updateState);
            group.appendChild(wrapper);
            wrapper.appendChild(toggle);
            wrapper.appendChild(menu);
            select.classList.add('source-select-native');
            wrapper.appendChild(select);
            updateState();
        });

        if (!document.body.dataset.sourceSelectInit) {
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.source-select')) closeAllSourceSelects();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') closeAllSourceSelects();
            });
            window.addEventListener('resize', repositionOpenSourceMenus);
            window.addEventListener('scroll', repositionOpenSourceMenus, true);
            document.body.dataset.sourceSelectInit = 'true';
        }
    }

    function submitWeb3Form(payload, submitBtn, onSuccess) {
        var originalText;

        if (!submitBtn) return Promise.resolve(false);

        originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        return fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({
                access_key: app.config ? app.config.web3formsKey : '',
                traffic_source: app.trafficSource || 'direct',
                page_url: window.location.href,
                botcheck: ''
            }, payload))
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (!data || !data.success) {
                throw new Error('Web3Forms request failed');
            }

            if (typeof onSuccess === 'function') {
                onSuccess({
                    submitBtn: submitBtn,
                    originalText: originalText,
                    response: data
                });
            } else {
                submitBtn.textContent = 'Sent!';
                setTimeout(function() {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 3000);
            }

            return true;
        })
        .catch(function() {
            submitBtn.textContent = 'Error. Try again.';
            submitBtn.disabled = false;
            setTimeout(function() {
                submitBtn.textContent = originalText;
            }, 3000);
            return false;
        });
    }

    function initSidebarWidgetForms() {
        document.querySelectorAll('.sidebar-content .widget').forEach(function(widget) {
            var inputs = widget.querySelectorAll('input.form-input, textarea.form-input, select.form-input');
            var submitBtn = widget.querySelector('button.btn-primary.btn-full');

            if (inputs.length === 0 || !submitBtn) return;
            if (widget.querySelector('form')) return;

            submitBtn.addEventListener('click', function(e) {
                var formData = {};
                var hasEmail = false;
                var page;
                var isQuickContact;
                var subject;

                e.preventDefault();

                inputs.forEach(function(input) {
                    var name = input.name || input.type || input.tagName.toLowerCase();
                    var value = input.value.trim();

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

                if (!hasEmail || !formData.email || !formData.email.includes('@')) {
                    alert('Please enter a valid email address.');
                    return;
                }

                page = document.title || window.location.pathname;
                isQuickContact = inputs.length <= 2;
                subject = isQuickContact
                    ? 'Quick Contact from ' + page
                    : 'Contact Form from ' + page;

                submitWeb3Form({
                    subject: subject,
                    from_name: formData.name || 'Website Visitor',
                    replyto: formData.email,
                    name: formData.name || '',
                    email: formData.email,
                    message: formData.message || '(no message)',
                    phone: formData.phone || '',
                    source: formData.source || ''
                }, submitBtn, function(state) {
                    app.pushDL?.('contact', {
                        form_type: isQuickContact ? 'quick_contact' : 'full_form',
                        page: page
                    });

                    inputs.forEach(function(input) {
                        if (input.tagName === 'SELECT') {
                            input.selectedIndex = 0;
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            return;
                        }

                        input.value = '';
                    });

                    submitBtn.textContent = 'Sent!';
                    setTimeout(function() {
                        submitBtn.textContent = state.originalText;
                        submitBtn.disabled = false;
                    }, 3000);
                });
            });
        });
    }

    function initForms() {
        if (app.formsInitialized) return;
        app.formsInitialized = true;

        initSidebarTabs();
        normalizeCtaButtons();
        setupGlobalCtaActions();
        initSidebarShare();
        initSourceSelectDropdowns();
        initSidebarWidgetForms();
    }

    app.openContactSidebar = openContactSidebar;
    app.initSourceSelectDropdowns = initSourceSelectDropdowns;
    app.submitWeb3Form = submitWeb3Form;
    app.initForms = initForms;
})();
