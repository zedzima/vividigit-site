/**
 * Site App Core
 * Shared configuration, analytics, and sidebar state.
 */
(function() {
    var app = window.VividigitApp = window.VividigitApp || {};

    function detectTrafficSource() {
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
    }

    function initCore() {
        if (app.coreInitialized) return;
        app.coreInitialized = true;

        window.dataLayer = window.dataLayer || [];
        app.config = {
            web3formsKey: '419be280-f452-493c-9745-bd1daba07eb8',
            notifyEmail: 'mail@vividigit.com',
            cartStorageKey: 'vividigit_cart',
            langPct: 0.6,
            countryPct: 0.4
        };

        app.pushDL = function(event, params) {
            window.dataLayer.push(Object.assign({ event: event }, params || {}));
        };
        app.trafficSource = detectTrafficSource();

        app.btnMenu = document.getElementById('btnMenu');
        app.btnMenuSelectors = document.getElementById('btnMenuSelectors');
        app.cartHeaderBtn = document.getElementById('cartHeaderBtn');
        app.btnAction = document.getElementById('btnAction');
        app.btnBackToTop = document.getElementById('btnBackToTop');
        app.sidebarNav = document.getElementById('sidebarNav');
        app.sidebarAction = document.getElementById('sidebarAction');
        app.overlay = document.getElementById('overlay');
        app.header = document.querySelector('.header');
        app.iconBar = document.querySelector('.icon-bar');
        app.iconBarNav = document.querySelector('.icon-bar-nav');
        app.iconBarBottom = document.querySelector('.icon-bar-bottom');
        app.actionPanels = app.sidebarAction ? app.sidebarAction.querySelectorAll('[data-action-panel]') : [];

        app.closeLeftSidebarDropdowns = function() {
            document.getElementById('themeDropdown')?.classList.remove('open');
            document.getElementById('langDropdownMenu')?.classList.remove('open');
        };

        app.getLeftSidebarState = function() {
            var widthHidden = window.innerWidth <= 800;
            var split = widthHidden;
            var hadSplit = document.body.classList.contains('sidebar-nav-split');
            var currentPanel = app.sidebarNav?.dataset.panel || 'menu';

            if (app.sidebarNav && app.iconBar && app.iconBarNav && app.iconBarBottom) {
                if (hadSplit) {
                    document.body.classList.remove('sidebar-nav-split');
                    app.sidebarNav.dataset.panel = 'menu';
                }

                var iconBarStyle = window.getComputedStyle(app.iconBar);
                var paddingTop = parseFloat(iconBarStyle.paddingTop) || 0;
                var paddingBottom = parseFloat(iconBarStyle.paddingBottom) || 0;
                var totalNeeded = paddingTop + paddingBottom + app.iconBarNav.scrollHeight + app.iconBarBottom.scrollHeight;
                if (totalNeeded > app.sidebarNav.offsetHeight) {
                    split = true;
                }

                if (hadSplit) {
                    document.body.classList.add('sidebar-nav-split');
                    app.sidebarNav.dataset.panel = currentPanel;
                }
            }

            return {
                widthHidden: widthHidden,
                split: split
            };
        };

        app.getRightSidebarState = function() {
            return {
                docked: window.innerWidth >= 1600
            };
        };

        app.setHeaderButtonState = function(button, isShown) {
            if (!button) return;
            button.classList.toggle('is-shown', !!isShown);
            button.setAttribute('aria-pressed', isShown ? 'true' : 'false');
        };

        app.syncActionPanels = function() {
            if (!app.sidebarAction) return;

            var currentPanel = app.sidebarAction.dataset.panel || 'order';

            app.actionPanels.forEach(function(panel) {
                panel.classList.toggle('hidden', panel.dataset.actionPanel !== currentPanel);
            });
        };

        app.syncSidebarOverlay = function() {
            var navOpen = !!app.sidebarNav?.classList.contains('open');
            var rightState = app.getRightSidebarState();
            var actionOpen = !rightState.docked && !!app.sidebarAction?.classList.contains('open');
            var navPanel = app.sidebarNav?.dataset.panel || 'menu';
            var actionPanel = app.sidebarAction?.dataset.panel || 'order';
            var leftState = app.getLeftSidebarState();
            var overlayOpen = actionOpen || (leftState.widthHidden && navOpen);
            var menuShown = false;
            var selectorsShown = false;
            var orderShown = false;
            var contactShown = false;

            document.body.classList.toggle('sidebar-nav-split', leftState.split);
            document.body.classList.toggle('sidebar-nav-hidden', leftState.widthHidden);
            document.body.classList.toggle('sidebar-action-docked', rightState.docked);
            app.overlay?.classList.toggle('active', overlayOpen);
            document.body.classList.toggle('sidebar-open', overlayOpen);
            app.syncActionPanels();

            if (!leftState.split) {
                menuShown = true;
                selectorsShown = true;
            } else if (leftState.widthHidden) {
                menuShown = navOpen && navPanel === 'menu';
                selectorsShown = navOpen && navPanel === 'selectors';
            } else {
                menuShown = navPanel !== 'selectors';
                selectorsShown = navPanel === 'selectors';
            }

            app.setHeaderButtonState(app.btnMenu, menuShown);
            app.setHeaderButtonState(app.btnMenuSelectors, selectorsShown);

            if (rightState.docked) {
                orderShown = actionPanel === 'order';
                contactShown = actionPanel === 'contact';
            } else {
                orderShown = actionOpen && actionPanel === 'order';
                contactShown = actionOpen && actionPanel === 'contact';
            }

            app.setHeaderButtonState(app.cartHeaderBtn, orderShown);
            app.setHeaderButtonState(app.btnAction, contactShown);
        };

        app.updateBackToTop = function() {
            if (!app.btnBackToTop) return;
            app.btnBackToTop.classList.toggle('visible', window.scrollY > 640);
        };

        app.openNavPanel = function(panel) {
            if (!app.sidebarNav) return;
            var leftState = app.getLeftSidebarState();
            app.closeLeftSidebarDropdowns();
            app.sidebarNav.dataset.panel = panel;

            if (leftState.widthHidden) {
                app.sidebarNav.classList.add('open');
            } else {
                app.sidebarNav.classList.remove('open');
            }

            app.sidebarAction?.classList.remove('open');
            app.syncSidebarOverlay();
        };

        app.openActionPanel = function(panel) {
            if (!app.sidebarAction) return;

            var rightState = app.getRightSidebarState();

            app.closeLeftSidebarDropdowns();
            app.sidebarAction.dataset.panel = panel === 'contact' ? 'contact' : 'order';
            app.sidebarNav?.classList.remove('open');

            if (rightState.docked) {
                app.sidebarAction.classList.remove('open');
            } else {
                app.sidebarAction.classList.add('open');
            }

            app.syncSidebarOverlay();
        };

        app.toggleActionPanel = function(panel) {
            if (!app.sidebarAction) return;

            var rightState = app.getRightSidebarState();
            var currentPanel = app.sidebarAction.dataset.panel || 'order';
            var isOpen = app.sidebarAction.classList.contains('open');

            if (rightState.docked) {
                if (currentPanel === panel) return;
                app.openActionPanel(panel);
                return;
            }

            if (isOpen && currentPanel === panel) {
                app.closeSidebars();
                return;
            }

            app.openActionPanel(panel);
        };

        app.toggleNavPanel = function(panel) {
            if (!app.sidebarNav) return;
            var leftState = app.getLeftSidebarState();
            var currentPanel = app.sidebarNav.dataset.panel || 'menu';
            var isOpen = app.sidebarNav.classList.contains('open');

            if (!leftState.split) {
                return;
            }

            if (leftState.widthHidden && isOpen && currentPanel === panel) {
                app.closeSidebars();
                return;
            }

            if (!leftState.widthHidden && currentPanel === panel) {
                return;
            }

            app.openNavPanel(panel);
        };

        app.btnBackToTop?.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', app.updateBackToTop, { passive: true });
        app.updateBackToTop();

        app.updateNavSelectorSplit = function() {
            if (!app.sidebarNav || !app.iconBar || !app.iconBarNav || !app.iconBarBottom) return;

            var leftState = app.getLeftSidebarState();
            var currentPanel = app.sidebarNav.dataset.panel || 'menu';

            if (!leftState.split) {
                app.sidebarNav.dataset.panel = 'menu';
                app.sidebarNav.classList.remove('open');
                app.closeLeftSidebarDropdowns();
            } else if (!leftState.widthHidden && currentPanel !== 'selectors') {
                app.sidebarNav.dataset.panel = 'menu';
                app.sidebarNav.classList.remove('open');
            } else if (!leftState.widthHidden) {
                app.sidebarNav.classList.remove('open');
            }

            app.syncSidebarOverlay();
        };

        app.updateActionSidebarState = function() {
            if (!app.sidebarAction) return;

            var rightState = app.getRightSidebarState();

            if (rightState.docked) {
                app.sidebarAction.classList.remove('open');
                if (!app.sidebarAction.dataset.panel) {
                    app.sidebarAction.dataset.panel = 'order';
                }
            }

            app.syncSidebarOverlay();
        };

        app.closeSidebars = function() {
            app.closeLeftSidebarDropdowns();
            app.sidebarNav?.classList.remove('open');
            app.sidebarAction?.classList.remove('open');
            if (app.getLeftSidebarState().widthHidden) {
                app.sidebarNav?.setAttribute('data-panel', 'menu');
            }
            app.syncSidebarOverlay();
        };

        app.btnMenu?.addEventListener('click', function() {
            app.toggleNavPanel('menu');
        });

        app.btnMenuSelectors?.addEventListener('click', function() {
            if (!document.body.classList.contains('sidebar-nav-split')) return;
            app.toggleNavPanel('selectors');
        });

        app.cartHeaderBtn?.addEventListener('click', function() {
            app.toggleActionPanel('order');
        });

        app.btnAction?.addEventListener('click', function() {
            app.toggleActionPanel('contact');
        });

        app.overlay?.addEventListener('click', app.closeSidebars);
        window.addEventListener('resize', function() {
            app.updateNavSelectorSplit();
            app.updateActionSidebarState();
        });
        app.updateNavSelectorSplit();
        app.updateActionSidebarState();
        app.syncSidebarOverlay();
    }

    app.initCore = initCore;
})();
