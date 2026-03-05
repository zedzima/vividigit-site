/**
 * Cart Module
 * Local cart state, sidebar order UI, and cart page rendering.
 */
(function() {
    var app = window.VividigitApp = window.VividigitApp || {};
    var _billingPeriod = 'monthly';
    var _billingDiscount = 0;

    function getConfig() {
        return app.config || {
            cartStorageKey: 'vividigit_cart',
            langPct: 0.6,
            countryPct: 0.4
        };
    }

    function normalizeCartItemType(value) {
        var normalized = String(value || '').trim().toLowerCase();
        if (normalized === 'scope') return 'Scope';
        if (normalized === 'solution') return 'Solution';
        if (normalized === 'service' || normalized === 'package') return 'Service';
        return 'Service';
    }

    function isServiceCartItem(itemOrType) {
        var itemType = typeof itemOrType === 'string'
            ? itemOrType
            : (itemOrType && itemOrType.itemType);

        return normalizeCartItemType(itemType) === 'Service';
    }

    var DEFAULT_BILLING = Object.freeze({
        oneTime: true,
        monthly: false,
        yearly: false
    });

    var SERVICE_BILLING_DEFAULTS = Object.freeze({
        oneTime: false,
        monthly: true,
        yearly: false
    });

    function cloneBilling(defaults) {
        return Object.assign({}, defaults || DEFAULT_BILLING);
    }

    function readBillingFromDataset(el, defaults) {
        var billing = cloneBilling(defaults);
        var dataset = el && el.dataset ? el.dataset : {};

        if (dataset.oneTime !== undefined) billing.oneTime = dataset.oneTime === 'true';
        if (dataset.monthly !== undefined) billing.monthly = dataset.monthly === 'true';
        if (dataset.yearly !== undefined) billing.yearly = dataset.yearly === 'true';

        return billing;
    }

    function normalizeCartBilling(item) {
        var billing;

        if (!item) return item;

        item.itemType = normalizeCartItemType(item.itemType);
        billing = item.billing || {};
        billing = {
            oneTime: billing.oneTime !== false,
            monthly: !!billing.monthly,
            yearly: !!billing.yearly
        };

        if (!isServiceCartItem(item)) {
            item.billing = cloneBilling(DEFAULT_BILLING);
            item.payment = 'one-time';
            item.discount = 0;
            return item;
        }

        if (!billing.oneTime && !billing.monthly && !billing.yearly) {
            billing.oneTime = true;
        }

        if (item.payment === 'monthly' && !billing.monthly) {
            item.payment = billing.oneTime ? 'one-time' : (billing.yearly ? 'yearly' : 'one-time');
        } else if (item.payment === 'yearly' && !billing.yearly) {
            item.payment = billing.monthly ? 'monthly' : (billing.oneTime ? 'one-time' : 'one-time');
        } else if (item.payment !== 'one-time' && item.payment !== 'monthly' && item.payment !== 'yearly') {
            item.payment = billing.oneTime ? 'one-time' : (billing.monthly ? 'monthly' : (billing.yearly ? 'yearly' : 'one-time'));
        } else if (item.payment === 'one-time' && !billing.oneTime) {
            item.payment = billing.monthly ? 'monthly' : (billing.yearly ? 'yearly' : 'one-time');
        }

        item.billing = billing;
        return item;
    }

    function updateCartCtaState() {
        var cta = document.getElementById('cartCta');
        var hasItems;

        if (!cta) return;

        hasItems = Object.keys(cart.items).length > 0;
        cta.classList.toggle('btn-disabled', !hasItems);
        cta.setAttribute('aria-disabled', hasItems ? 'false' : 'true');
        cta.tabIndex = hasItems ? 0 : -1;
    }

    function updateCartBadge() {
        var badge = document.getElementById('cartBadge');
        var count;

        if (!badge) return;

        count = Object.keys(cart.items).length;
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    }

    var cart = {
        items: {},

        load: function() {
            try {
                var saved = localStorage.getItem(getConfig().cartStorageKey);
                if (saved) {
                    var data = JSON.parse(saved);
                    this.items = data.items || {};

                    for (var slug of Object.keys(this.items)) {
                        var item = this.items[slug];
                        if (!item.payment) {
                            item.payment = item.delivery === 'monthly'
                                ? (item.billingPeriod === 'yearly' ? 'yearly' : 'monthly')
                                : 'one-time';
                            item.discount = item.billingDiscount || item.discount || 0;
                            if (!item.billing) item.billing = cloneBilling(DEFAULT_BILLING);
                            if (!item.itemType) {
                                var pagePath = String(item.page || '');
                                if (/^\/solutions\/[^/]+\/?$/.test(pagePath)) item.itemType = 'Solution';
                                else if (/^\/scopes\/[^/]+\/?$/.test(pagePath)) item.itemType = 'Scope';
                                else item.itemType = 'Service';
                            }
                            delete item.delivery;
                            delete item.billingPeriod;
                            delete item.billingDiscount;
                        }
                        normalizeCartBilling(item);
                    }
                }
            } catch (e) {
                /* ignore parse errors */
            }
        },

        save: function() {
            try {
                localStorage.setItem(getConfig().cartStorageKey, JSON.stringify({
                    items: this.items
                }));
            } catch (e) {
                /* ignore storage errors */
            }
            updateCartBadge();
            updateCartCtaState();
        },

        add: function(slug, title, tierName, tierLabel, price, custom, payment, billing, itemType) {
            var prev = this.items[slug];

            this.items[slug] = {
                title: title,
                tierName: tierName,
                tierLabel: tierLabel,
                price: price,
                custom: custom,
                payment: payment || 'one-time',
                discount: _billingDiscount,
                billing: billing || cloneBilling(DEFAULT_BILLING),
                itemType: normalizeCartItemType(itemType),
                page: window.location.pathname,
                langCount: prev ? prev.langCount || 0 : 0,
                countryCount: prev ? prev.countryCount || 0 : 0
            };

            normalizeCartBilling(this.items[slug]);
            this.save();
            this.renderSidebar();
        },

        remove: function(slug) {
            delete this.items[slug];

            var cb = document.querySelector('.task-select-cb[data-slug="' + slug + '"]');
            if (cb) {
                cb.checked = false;
                cb.closest('.task-picker-item')?.classList.remove('selected');
            }

            this.save();
            this.renderSidebar();
        },

        updateTier: function(slug, tierName, tierLabel, price, custom, billing) {
            if (!this.items[slug]) return;

            this.items[slug].tierName = tierName;
            this.items[slug].tierLabel = tierLabel;
            this.items[slug].price = price;
            this.items[slug].custom = custom;
            if (billing) this.items[slug].billing = billing;

            normalizeCartBilling(this.items[slug]);
            this.save();
            this.renderSidebar();
        },

        _backup: null,

        clear: function() {
            this._backup = JSON.parse(JSON.stringify(this.items));
            this.items = {};
            this.save();
            this.renderSidebar();

            document.querySelectorAll('.task-select-cb:checked').forEach(function(cb) {
                cb.checked = false;
                cb.closest('.task-picker-item')?.classList.remove('selected');
            });
        },

        clearCurrentPage: function(pagePath) {
            var currentPage = pagePath || window.location.pathname;
            for (var slug of Object.keys(this.items)) {
                if (this.items[slug].page === currentPage) delete this.items[slug];
            }
        },

        restore: function() {
            if (!this._backup) return false;
            this.items = this._backup;
            this._backup = null;
            this.save();
            this.renderSidebar();
            return true;
        },

        getEffectivePrice: function(item) {
            if (item.payment === 'yearly' && item.discount > 0) {
                return Math.round(item.price * (100 - item.discount) / 100);
            }
            return item.price;
        },

        getItemTotal: function(item) {
            var config = getConfig();
            var base = this.getEffectivePrice(item);
            var langExtra = Math.round(base * config.langPct) * (item.langCount || 0);
            var countryExtra = Math.round(base * config.countryPct) * (item.countryCount || 0);
            return base + langExtra + countryExtra;
        },

        getTotal: function() {
            var total = 0;
            var hasCustom = false;

            for (var slug of Object.keys(this.items)) {
                var item = this.items[slug];
                if (item.custom) hasCustom = true;
                total += this.getItemTotal(item);
            }

            return { total: total, hasCustom: hasCustom };
        },

        buildOrderEmail: function(comment) {
            var config = getConfig();
            var keys = Object.keys(this.items);
            var lines = ['ORDER DETAILS', ''];
            var num = 1;

            for (var slug of keys) {
                var item = this.items[slug];
                var lc = item.langCount || 0;
                var cc = item.countryCount || 0;
                var paymentLabel = item.payment === 'yearly'
                    ? 'Yearly'
                    : (item.payment === 'monthly' ? 'Monthly' : 'One-time');
                var effectivePrice = this.getEffectivePrice(item);
                var itemTotal = this.getItemTotal(item);
                var perLang = Math.round(effectivePrice * config.langPct);
                var perCountry = Math.round(effectivePrice * config.countryPct);

                lines.push(num + '. ' + item.title + (item.tierName ? ' (' + item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + ')' : ''));
                lines.push('   Type: ' + normalizeCartItemType(item.itemType));
                lines.push('   Payment: ' + paymentLabel);
                if (item.payment === 'yearly' && item.discount) lines.push('   Discount: -' + item.discount + '% (yearly)');
                if (lc > 0) lines.push('   Languages: +' + lc + ' × $' + perLang + ' (60%) = $' + (lc * perLang));
                if (cc > 0) lines.push('   Countries: +' + cc + ' × $' + perCountry + ' (40%) = $' + (cc * perCountry));
                lines.push('   Subtotal: ' + (effectivePrice > 0 ? '$' + itemTotal.toLocaleString() : 'Custom quote'));
                lines.push('');
                num++;
            }

            var totals = this.getTotal();
            lines.push('GRAND TOTAL: ' + (totals.hasCustom ? 'From ' : '') + '$' + totals.total.toLocaleString());
            if (comment) {
                lines.push('');
                lines.push('COMMENT:');
                lines.push(comment);
            }

            return lines.join('\n');
        },

        renderSidebar: function() {
            var container = document.getElementById('cartItems');
            var modifiers = document.getElementById('cartModifiers');
            var totalsEl = document.getElementById('cartTotals');
            var currentPage;
            var pageItems = {};
            var keys;
            var html;
            var subtotal;
            var hasCustom;
            var grandTotal;
            var modifierTotal;
            var subtotalEl;
            var feesEl;
            var totalEl;
            var billingBadge;

            if (!container) return;

            currentPage = window.location.pathname;
            for (var slug of Object.keys(this.items)) {
                if (this.items[slug].page === currentPage) pageItems[slug] = this.items[slug];
            }
            keys = Object.keys(pageItems);

            if (keys.length === 0) {
                container.innerHTML = '<p class="cart-empty-msg">Select a package or tasks to build your order.</p>';
                if (modifiers) modifiers.classList.add('hidden');
                if (totalsEl) totalsEl.classList.add('hidden');
                return;
            }

            if (modifiers) modifiers.classList.remove('hidden');
            if (totalsEl) totalsEl.classList.remove('hidden');

            html = '';
            subtotal = 0;
            hasCustom = false;

            for (var itemSlug of keys) {
                var item = pageItems[itemSlug];
                var effectivePrice;
                var paymentLabel = '';

                if (item.custom) hasCustom = true;
                effectivePrice = cart.getEffectivePrice(item);
                subtotal += effectivePrice;

                if (item.payment === 'monthly') paymentLabel = ' (Monthly)';
                else if (item.payment === 'yearly') paymentLabel = ' (Yearly)';

                html += '<div class="cart-line-item">' +
                    '<div class="cart-item-info">' +
                        '<span class="cart-item-title">' + item.title + paymentLabel + '</span>' +
                        '<span class="cart-item-tier">' + item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + '</span>' +
                    '</div>' +
                    '<div class="cart-item-actions">' +
                        '<span class="cart-item-price">' + (effectivePrice > 0 ? '$' + effectivePrice.toLocaleString() : 'Custom') + '</span>' +
                        '<button class="cart-item-remove" data-slug="' + itemSlug + '" title="Remove">&times;</button>' +
                    '</div>' +
                '</div>';
            }
            container.innerHTML = html;

            container.querySelectorAll('.cart-item-remove').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    cart.remove(btn.dataset.slug);
                });
            });

            var langCount = parseInt(document.getElementById('langCount')?.textContent) || 0;
            var countryCount = parseInt(document.getElementById('countryCount')?.textContent) || 0;

            for (var pageSlug of keys) {
                pageItems[pageSlug].langCount = langCount;
                pageItems[pageSlug].countryCount = countryCount;
            }
            cart.save();

            grandTotal = 0;
            for (var totalSlug of keys) {
                grandTotal += cart.getItemTotal(pageItems[totalSlug]);
            }
            modifierTotal = grandTotal - subtotal;

            subtotalEl = document.getElementById('cartSubtotal');
            feesEl = document.getElementById('cartFees');
            totalEl = document.getElementById('cartTotal');

            if (subtotalEl) subtotalEl.textContent = (hasCustom ? 'From $' : '$') + subtotal.toLocaleString();
            if (feesEl) feesEl.textContent = modifierTotal > 0 ? '+$' + modifierTotal.toLocaleString() : '$0';
            if (totalEl) totalEl.textContent = (hasCustom ? 'From $' : '$') + grandTotal.toLocaleString();

            billingBadge = document.getElementById('cartBillingBadge');
            if (billingBadge) billingBadge.remove();
        }
    };

    function initBillingState() {
        var el = document.querySelector('[data-discount]');
        if (el) _billingDiscount = parseInt(el.dataset.discount) || 0;
    }

    function bindTaskPickerEvents() {
        document.addEventListener('taskToggled', function(e) {
            var d = e.detail;
            var billing = d.billing || cloneBilling(DEFAULT_BILLING);
            var payment = billing.monthly ? _billingPeriod : 'one-time';

            if (d.replaceAll) {
                cart.clearCurrentPage();
                cart.add(d.slug, d.title, d.tierName, d.tierLabel, d.price, d.custom, payment, billing, 'Scope');
            } else if (d.selected) {
                cart.add(d.slug, d.title, d.tierName, d.tierLabel, d.price, d.custom, payment, billing, 'Scope');
            } else {
                cart.remove(d.slug);
            }
        });

        document.addEventListener('tierChanged', function(e) {
            var d = e.detail;
            cart.updateTier(d.taskSlug, d.tierName, d.tierLabel, d.price, d.custom, d.billing);
        });

        document.addEventListener('billingPeriodChanged', function(e) {
            var currentPage = window.location.pathname;

            _billingPeriod = e.detail.period;
            _billingDiscount = e.detail.discount;

            for (var slug of Object.keys(cart.items)) {
                var item = cart.items[slug];
                if (item.page !== currentPage) continue;
                if (!isServiceCartItem(item)) {
                    normalizeCartBilling(item);
                    continue;
                }
                item.discount = _billingDiscount;
                if (item.payment !== 'one-time') {
                    item.payment = _billingPeriod;
                }
                normalizeCartBilling(item);
            }

            cart.save();
            cart.renderSidebar();
        });
    }

    function initSidebarCart() {
        var curPageInit;
        var currentPage;
        var hasPageItems = false;

        if (!document.getElementById('cartItems')) return;

        curPageInit = window.location.pathname;
        for (var savedSlug of Object.keys(cart.items)) {
            if (cart.items[savedSlug].page === curPageInit) {
                var langEl = document.getElementById('langCount');
                var countryEl = document.getElementById('countryCount');
                if (langEl && cart.items[savedSlug].langCount) langEl.textContent = cart.items[savedSlug].langCount;
                if (countryEl && cart.items[savedSlug].countryCount) countryEl.textContent = cart.items[savedSlug].countryCount;
                break;
            }
        }

        cart.renderSidebar();

        currentPage = window.location.pathname;
        for (var slug of Object.keys(cart.items)) {
            if (cart.items[slug].page === currentPage) {
                hasPageItems = true;
                break;
            }
        }

        if (hasPageItems) return;

        document.querySelectorAll('.task-select-cb:checked').forEach(function(cb) {
            var item = cb.closest('.task-picker-item');
            var activeTier = item?.querySelector('.tier-btn.active');
            var billing = readBillingFromDataset(cb, DEFAULT_BILLING);
            var payment = billing.monthly ? _billingPeriod : 'one-time';

            cart.add(
                cb.dataset.slug,
                cb.dataset.title,
                activeTier ? activeTier.dataset.tierName : 'S',
                activeTier ? activeTier.dataset.tierLabel : '',
                activeTier ? (parseInt(activeTier.dataset.price) || 0) : 0,
                activeTier ? activeTier.dataset.custom === 'true' : false,
                payment,
                billing,
                'Scope'
            );
        });
    }

    function initModifierCounters() {
        document.querySelectorAll('.cart-counter').forEach(function(counter) {
            counter.querySelector('.counter-minus')?.addEventListener('click', function() {
                var valEl = counter.querySelector('.counter-value');
                var val = parseInt(valEl.textContent) || 0;
                val = Math.max(0, val - 1);
                valEl.textContent = val;
                cart.renderSidebar();
            });

            counter.querySelector('.counter-plus')?.addEventListener('click', function() {
                var valEl = counter.querySelector('.counter-value');
                var val = parseInt(valEl.textContent) || 0;
                val++;
                valEl.textContent = val;
                cart.renderSidebar();
            });
        });
    }

    function initPricingCartIntegration() {
        if (!document.getElementById('cartItems')) return;

        document.querySelectorAll('.pricing-package .btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var pkg = btn.closest('.pricing-package');
                var grid = pkg.closest('.pricing-packages-grid');
                var nameEl = pkg.querySelector('.package-header h3');
                var priceEl = pkg.querySelector('.price-current');
                var pkgName;
                var serviceName;
                var slug;
                var price;
                var billing;
                var payment;
                var monthlyPrice;

                if (!nameEl || !priceEl) return;

                e.preventDefault();
                pkgName = nameEl.textContent.trim();
                serviceName = (grid && grid.dataset.service) ? grid.dataset.service : '';
                slug = (serviceName ? serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' : '') + pkgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                price = parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;

                document.querySelectorAll('.pricing-package').forEach(function(option) {
                    option.classList.remove('pricing-package-selected');
                });
                pkg.classList.add('pricing-package-selected');

                billing = readBillingFromDataset(pkg, SERVICE_BILLING_DEFAULTS);
                payment = billing.monthly ? _billingPeriod : 'one-time';
                monthlyPrice = parseInt(priceEl.dataset.monthly) || price;

                cart.clearCurrentPage();
                cart.add(slug, serviceName || pkgName, pkgName, '', monthlyPrice, false, payment, billing, 'Service');
            });
        });

        document.querySelectorAll('.pricing-simple-cta').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var section = btn.closest('.pricing-block');
                var titleEl = section ? section.querySelector('h2') : null;
                var priceEl = section ? section.querySelector('.price-current') : null;
                var title;
                var slug;
                var price;
                var card;
                var billing;
                var payment;

                if (!titleEl || !priceEl) return;

                e.preventDefault();
                title = titleEl.textContent.trim();
                slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                price = parseInt(priceEl.dataset.monthly) || parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;
                card = btn.closest('.pricing-simple-card');
                billing = readBillingFromDataset(card, SERVICE_BILLING_DEFAULTS);
                payment = billing.monthly ? _billingPeriod : 'one-time';

                cart.clearCurrentPage();
                cart.add(slug, title, '', '', price, false, payment, billing, 'Solution');

                if (window.innerWidth < 2200) {
                    app.btnAction?.click();
                }
            });
        });

        document.querySelectorAll('.pricing-tier').forEach(function(tier) {
            tier.style.cursor = 'pointer';
            tier.addEventListener('click', function() {
                var nameEl = tier.querySelector('.tier-name');
                var priceEl = tier.querySelector('.tier-price');
                var tierName;
                var section;
                var headerEl;
                var serviceName;
                var slug;
                var price;
                var ctaCard;
                var billing;
                var payment;

                if (!nameEl || !priceEl) return;

                tierName = nameEl.textContent.trim();
                section = tier.closest('.pricing-block');
                headerEl = section ? section.querySelector('.pricing-header h2') : null;
                serviceName = headerEl ? headerEl.textContent.trim() : '';
                slug = (serviceName ? serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' : '') + tierName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                price = parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;

                document.querySelectorAll('.pricing-tier').forEach(function(option) {
                    option.classList.remove('active');
                });
                tier.classList.add('active');

                ctaCard = section ? section.querySelector('.pricing-cta-card') : null;
                billing = readBillingFromDataset(ctaCard, SERVICE_BILLING_DEFAULTS);
                payment = billing.monthly ? _billingPeriod : 'one-time';

                cart.clearCurrentPage();
                cart.add(slug, serviceName || tierName, tierName, '', price, false, payment, billing, 'Service');
            });
        });
    }

    function initCartCta() {
        var cartCta = document.getElementById('cartCta');

        updateCartCtaState();
        if (!cartCta) return;

        cartCta.addEventListener('click', function(e) {
            if (Object.keys(cart.items).length > 0) return;
            e.preventDefault();
            alert('Please select services to build your order.');
        });
    }

    function initCartPage() {
        var cartPage = document.getElementById('cartPage');

        if (!cartPage) return;

        function readCartFormState() {
            return {
                comment: document.getElementById('cartComment')?.value || '',
                name: document.getElementById('cartName')?.value || '',
                phone: document.getElementById('cartPhone')?.value || '',
                email: document.getElementById('cartEmail')?.value || '',
                source: document.getElementById('cartSource')?.value || ''
            };
        }

        function restoreCartFormState(formState) {
            if (formState.comment) document.getElementById('cartComment').value = formState.comment;
            if (formState.name) document.getElementById('cartName').value = formState.name;
            if (formState.phone) document.getElementById('cartPhone').value = formState.phone;
            if (formState.email) document.getElementById('cartEmail').value = formState.email;
            if (formState.source) document.getElementById('cartSource').value = formState.source;
            if (typeof app.initSourceSelectDropdowns === 'function') {
                app.initSourceSelectDropdowns();
            }
        }

        function renderEmptyCartPage() {
            cartPage.innerHTML = '<div class="cart-page-empty">' +
                '<p>Your cart is empty</p>' +
                '<div class="cart-actions" style="justify-content:center;">' +
                    '<a href="services/" class="btn btn-primary">Browse Services</a>' +
                    (cart._backup ? '<button class="btn btn-secondary" id="cartRestore">Restore Cart</button>' : '') +
                '</div>' +
            '</div>';

            document.getElementById('cartRestore')?.addEventListener('click', function() {
                cart.restore();
                renderCartPage();
            });
        }

        function buildCartTable(keys) {
            var html = '<div class="cart-table-wrap"><table class="cart-table"><thead><tr>' +
                '<th>Item</th>' +
                '<th>Type</th>' +
                '<th>Payment</th>' +
                '<th>Languages</th>' +
                '<th>Countries</th>' +
                '<th class="text-right">Total</th>' +
                '<th></th>' +
            '</tr></thead><tbody>';
            var grandTotal = 0;
            var hasCustom = false;
            var config = getConfig();

            for (var slug of keys) {
                var item = cart.items[slug];
                var lc;
                var cc;
                var effectivePrice;
                var itemTotal;
                var perLang;
                var perCountry;
                var itemType;
                var basePriceStr;
                var paymentLabel = '';
                var tierStr;
                var billing;
                var paymentCell = '<span class="cart-payment-label">One-time</span>';

                normalizeCartBilling(item);
                if (item.custom) hasCustom = true;

                lc = item.langCount || 0;
                cc = item.countryCount || 0;
                effectivePrice = cart.getEffectivePrice(item);
                itemTotal = cart.getItemTotal(item);
                perLang = Math.round(effectivePrice * config.langPct);
                perCountry = Math.round(effectivePrice * config.countryPct);
                itemType = normalizeCartItemType(item.itemType);

                grandTotal += itemTotal;

                basePriceStr = effectivePrice > 0 ? '$' + effectivePrice.toLocaleString() : 'Custom';
                if (item.payment === 'monthly') paymentLabel = ' (Monthly)';
                else if (item.payment === 'yearly') paymentLabel = ' (Yearly)';
                tierStr = item.tierName ? item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + ' — ' : '';

                billing = item.billing || cloneBilling(DEFAULT_BILLING);
                if (isServiceCartItem(itemType)) {
                    paymentCell = '<div class="cart-payment-tabs">';
                    paymentCell += '<button class="cart-payment-opt' + (item.payment === 'one-time' ? ' active' : '') + (billing.oneTime ? '' : ' disabled') + '" data-slug="' + slug + '" data-val="one-time"' + (billing.oneTime ? '' : ' disabled') + '>One-time</button>';
                    paymentCell += '<button class="cart-payment-opt' + (item.payment === 'monthly' ? ' active' : '') + (billing.monthly ? '' : ' disabled') + '" data-slug="' + slug + '" data-val="monthly"' + (billing.monthly ? '' : ' disabled') + '>Monthly</button>';
                    paymentCell += '<button class="cart-payment-opt' + (item.payment === 'yearly' ? ' active' : '') + (billing.yearly ? '' : ' disabled') + '" data-slug="' + slug + '" data-val="yearly"' + (billing.yearly ? '' : ' disabled') + '>Yearly</button>';
                    paymentCell += '</div>';
                }

                html += '<tr>' +
                    '<td>' +
                        '<span class="cart-item-name">' + item.title + paymentLabel + '</span>' +
                        '<span class="cart-item-tier">' + tierStr + basePriceStr + '</span>' +
                    '</td>' +
                    '<td>' + itemType + '</td>' +
                    '<td>' + paymentCell + '</td>' +
                    '<td>' +
                        '<div class="cart-inline-counter">' +
                            '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="langCount" data-action="minus">−</button>' +
                            '<span class="cart-inline-val">' + lc + '</span>' +
                            '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="langCount" data-action="plus">+</button>' +
                        '</div>' +
                        (lc > 0 ? '<span class="cart-inline-fee">+$' + (perLang * lc).toLocaleString() + '</span>' : '') +
                    '</td>' +
                    '<td>' +
                        '<div class="cart-inline-counter">' +
                            '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="countryCount" data-action="minus">−</button>' +
                            '<span class="cart-inline-val">' + cc + '</span>' +
                            '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="countryCount" data-action="plus">+</button>' +
                        '</div>' +
                        (cc > 0 ? '<span class="cart-inline-fee">+$' + (perCountry * cc).toLocaleString() + '</span>' : '') +
                    '</td>' +
                    '<td class="text-right"><span class="cart-item-price">' + (effectivePrice > 0 ? '$' + itemTotal.toLocaleString() : 'Custom') + '</span></td>' +
                    '<td><button class="cart-item-remove-btn" data-slug="' + slug + '">&times;</button></td>' +
                '</tr>';
            }

            html += '</tbody></table></div>';
            return { html: html, grandTotal: grandTotal, hasCustom: hasCustom };
        }

        function buildCartRequestForm() {
            return '<div class="cart-comment-section">' +
                '<label class="cart-field-label" for="cartComment">Order Notes</label>' +
                '<textarea class="cart-field-input" id="cartComment" placeholder="Add notes or special requests..." rows="3"></textarea>' +
            '</div>' +
            '<div class="cart-request-section">' +
                '<div class="cart-request-fields">' +
                    '<input type="text" class="cart-field-input" id="cartName" placeholder="Your name" />' +
                    '<input type="email" class="cart-field-input" id="cartEmail" placeholder="Your email *" />' +
                '</div>' +
                '<div class="cart-request-fields">' +
                    '<input type="tel" class="cart-field-input" id="cartPhone" placeholder="Phone number" />' +
                    '<select class="cart-field-input" id="cartSource">' +
                        '<option value="" disabled selected>How did you hear about us?</option>' +
                        '<option value="search">Search engine</option>' +
                        '<option value="social">Social media</option>' +
                        '<option value="referral">Referral</option>' +
                        '<option value="ad">Advertisement</option>' +
                        '<option value="ai">Artificial Intelligence</option>' +
                        '<option value="friends">Friends / Colleagues</option>' +
                        '<option value="newsletter">Email Newsletter</option>' +
                        '<option value="other">Other</option>' +
                    '</select>' +
                '</div>' +
                '<div class="cart-actions">' +
                    '<button class="btn btn-primary" id="cartSendRequest">Request Quote</button>' +
                    '<button class="btn btn-secondary" id="cartPageClear">Clear Cart</button>' +
                '</div>' +
            '</div>';
        }

        function renderCartSuccess() {
            cartPage.innerHTML = '<div class="cart-page-success">' +
                '<h3>Request Sent!</h3>' +
                '<p>We\'ll review your order and get back to you within 24 hours.</p>' +
                '<div class="cart-actions">' +
                    '<a href="services/" class="btn btn-primary">Continue Shopping</a>' +
                    '<button class="btn btn-secondary" id="cartSuccessClear">Clear Cart</button>' +
                '</div>' +
            '</div>';

            document.getElementById('cartSuccessClear')?.addEventListener('click', function() {
                cart.clear();
                renderCartPage();
            });
        }

        function submitCartOrder(keys, grandTotal) {
            var email = document.getElementById('cartEmail')?.value.trim();
            var name = document.getElementById('cartName')?.value.trim() || 'Website Visitor';
            var phone = document.getElementById('cartPhone')?.value.trim() || '';
            var comment = document.getElementById('cartComment')?.value.trim();
            var source = document.getElementById('cartSource')?.value || '';
            var btn = document.getElementById('cartSendRequest');

            if (!email || !email.includes('@')) {
                alert('Please enter a valid email address.');
                return;
            }

            app.submitWeb3Form?.({
                subject: 'Order Request — ' + keys.length + ' items — Vividigit',
                from_name: name,
                replyto: email,
                name: name,
                email: email,
                phone: phone,
                message: cart.buildOrderEmail(comment),
                source: source
            }, btn, function() {
                app.pushDL?.('generate_lead', {
                    cart_items: keys.length,
                    cart_total: grandTotal,
                    email: email
                });
                renderCartSuccess();
            });
        }

        function bindCartPageEvents(keys, grandTotal) {
            cartPage.querySelectorAll('.cart-item-remove-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    cart.remove(btn.dataset.slug);
                    renderCartPage();
                });
            });

            cartPage.querySelectorAll('.cart-payment-opt').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var slug = btn.dataset.slug;
                    var val = btn.dataset.val;
                    var item = cart.items[slug];

                    if (!item || item.payment === val) return;
                    if (!isServiceCartItem(item)) return;

                    item.payment = val;
                    normalizeCartBilling(item);
                    cart.save();
                    renderCartPage();
                });
            });

            cartPage.querySelectorAll('.cart-inline-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var slug = btn.dataset.slug;
                    var field = btn.dataset.field;
                    var action = btn.dataset.action;
                    var item = cart.items[slug];
                    var val;

                    if (!item) return;

                    val = item[field] || 0;
                    if (action === 'plus') val++;
                    else val = Math.max(0, val - 1);
                    item[field] = val;
                    cart.save();
                    renderCartPage();
                });
            });

            document.getElementById('cartPageClear')?.addEventListener('click', function() {
                cart.clear();
                renderCartPage();
            });

            document.getElementById('cartSendRequest')?.addEventListener('click', function() {
                submitCartOrder(keys, grandTotal);
            });
        }

        function renderCartPage() {
            var formState = readCartFormState();
            var keys = Object.keys(cart.items);
            var table;
            var html;

            if (keys.length === 0) {
                renderEmptyCartPage();
                return;
            }

            table = buildCartTable(keys);
            html = table.html;
            html += '<div class="cart-totals">' +
                '<div>' +
                    '<div class="cart-total-amount">' + (table.hasCustom ? 'From ' : '') + '$' + table.grandTotal.toLocaleString() + '</div>' +
                    '<div class="cart-total-label">Estimated Total</div>' +
                '</div>' +
            '</div>';
            html += buildCartRequestForm();

            cartPage.innerHTML = html;
            restoreCartFormState(formState);
            bindCartPageEvents(keys, table.grandTotal);
        }

        renderCartPage();
    }

    function initCart() {
        if (app.cartInitialized) return;
        app.cartInitialized = true;

        cart.load();
        initBillingState();
        bindTaskPickerEvents();
        initSidebarCart();
        initModifierCounters();
        initPricingCartIntegration();
        initCartCta();
        updateCartBadge();
        initCartPage();
    }

    app.defaultBilling = DEFAULT_BILLING;
    app.serviceBillingDefaults = SERVICE_BILLING_DEFAULTS;
    app.readBillingFromDataset = readBillingFromDataset;
    app.normalizeCartItemType = normalizeCartItemType;
    app.isServiceCartItem = isServiceCartItem;
    app.cart = cart;
    app.initCart = initCart;
    window.cart = cart;
})();
