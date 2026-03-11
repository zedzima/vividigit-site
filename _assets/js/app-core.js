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
        app.btnAction = document.getElementById('btnAction');
        app.sidebarNav = document.getElementById('sidebarNav');
        app.sidebarAction = document.getElementById('sidebarAction');
        app.overlay = document.getElementById('overlay');

        app.syncSidebarOverlay = function() {
            var navOpen = !!app.sidebarNav?.classList.contains('open');
            var actionOpen = !!app.sidebarAction?.classList.contains('open');
            var isOpen = navOpen || actionOpen;

            app.overlay?.classList.toggle('active', isOpen);
            document.body.classList.toggle('sidebar-open', isOpen);
        };

        app.closeSidebars = function() {
            app.sidebarNav?.classList.remove('open');
            app.sidebarAction?.classList.remove('open');
            app.syncSidebarOverlay();
        };

        app.btnMenu?.addEventListener('click', function() {
            var shouldOpen = !app.sidebarNav?.classList.contains('open');
            app.sidebarNav?.classList.toggle('open', shouldOpen);
            app.sidebarAction?.classList.remove('open');
            app.syncSidebarOverlay();
        });

        app.btnAction?.addEventListener('click', function() {
            var shouldOpen = !app.sidebarAction?.classList.contains('open');
            app.sidebarAction?.classList.toggle('open', shouldOpen);
            app.sidebarNav?.classList.remove('open');
            app.syncSidebarOverlay();
        });

        app.overlay?.addEventListener('click', app.closeSidebars);
        app.syncSidebarOverlay();
    }

    app.initCore = initCore;
})();
