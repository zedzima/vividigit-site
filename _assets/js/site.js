/**
 * Site Bootstrap
 * Initializes the public-site modules in a fixed order.
 */
(function() {
    var app = window.VividigitApp = window.VividigitApp || {};
    var assetHashes = window.VividigitAssetHashes || {};
    var cartLoadCallbacks = [];
    var cartScriptRequested = false;

    function updateCartBadgeFromStorage() {
        var badge = document.getElementById('cartBadge');
        var count = 0;
        var payload;

        if (!badge) return;

        try {
            payload = JSON.parse(localStorage.getItem('vividigit_cart') || '{}');
            count = Object.keys((payload && payload.items) || {}).length;
        } catch (e) {
            count = 0;
        }

        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    }

    function pageNeedsCartImmediately() {
        return !!document.querySelector('.pricing-block, #task-picker, .task-picker-block, #cartPage')
            || (window.innerWidth >= 1600 && !!document.getElementById('cartItems'));
    }

    function flushCartCallbacks() {
        var callbacks = cartLoadCallbacks.slice();
        cartLoadCallbacks = [];
        callbacks.forEach(function(callback) {
            callback();
        });
    }

    function ensureCartLoaded(callback) {
        if (typeof callback === 'function') {
            cartLoadCallbacks.push(callback);
        }

        if (app.initCart) {
            app.initCart();
            flushCartCallbacks();
            return;
        }

        if (cartScriptRequested) return;
        cartScriptRequested = true;

        var script = document.createElement('script');
        script.src = '_assets/js/cart.js' + (assetHashes.cart ? '?v=' + assetHashes.cart : '');
        script.defer = true;
        script.onload = function() {
            app.initCart?.();
            flushCartCallbacks();
        };
        document.body.appendChild(script);
    }

    function initConsentControls() {
        var consent = window.VividigitConsent;
        var banner = document.getElementById('cookieConsent');
        var prefs = document.getElementById('cookiePreferences');
        var settingsButtons = document.querySelectorAll('[data-cookie-open]');
        var analyticsToggle = document.getElementById('cookieAnalyticsToggle');
        var marketingToggle = document.getElementById('cookieMarketingToggle');
        var acceptBtn = document.getElementById('cookieAcceptBtn');
        var manageBtn = document.getElementById('cookieManageBtn');
        var prefsSaveBtn = document.getElementById('cookiePrefsSaveBtn');
        var prefsCloseBtn = document.getElementById('cookiePrefsClose');

        if (!consent || !banner || !prefs) return;

        function openPrefs() {
            app.closeSidebars?.();
            prefs.classList.remove('hidden');
            prefs.setAttribute('aria-hidden', 'false');
        }

        function closePrefs() {
            prefs.classList.add('hidden');
            prefs.setAttribute('aria-hidden', 'true');
        }

        function syncConsentUi() {
            var state = consent.getState();
            var hasChoice = consent.hasChoice();
            var analyticsEnabled = typeof consent.allowsAnalytics === 'function'
                ? consent.allowsAnalytics()
                : !!(state && state.analytics);

            if (analyticsToggle) {
                analyticsToggle.checked = analyticsEnabled;
            }
            if (marketingToggle) {
                marketingToggle.checked = !!(state && state.marketing);
            }

            banner.classList.toggle('hidden', hasChoice);
        }

        acceptBtn?.addEventListener('click', function() {
            consent.acceptAll();
            closePrefs();
            syncConsentUi();
        });

        manageBtn?.addEventListener('click', function() {
            openPrefs();
        });

        settingsButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                openPrefs();
            });
        });

        prefsCloseBtn?.addEventListener('click', function() {
            closePrefs();
        });

        prefsSaveBtn?.addEventListener('click', function() {
            consent.save({
                analytics: !!analyticsToggle?.checked,
                marketing: !!marketingToggle?.checked
            });
            closePrefs();
            syncConsentUi();
        });

        consent.onChange(function() {
            syncConsentUi();
        });

        syncConsentUi();
    }

    app.initCore?.();
    app.initForms?.();
    app.initUi?.();
    initConsentControls();
    updateCartBadgeFromStorage();

    if (pageNeedsCartImmediately()) {
        ensureCartLoaded();
    } else {
        document.getElementById('cartHeaderBtn')?.addEventListener('click', function() {
            ensureCartLoaded();
        }, { once: true });
    }
})();
