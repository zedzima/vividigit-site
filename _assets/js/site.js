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

    app.initCore?.();
    app.initForms?.();
    app.initUi?.();
    updateCartBadgeFromStorage();

    if (pageNeedsCartImmediately()) {
        ensureCartLoaded();
    } else {
        document.getElementById('cartHeaderBtn')?.addEventListener('click', function() {
            ensureCartLoaded();
        }, { once: true });
    }
})();
