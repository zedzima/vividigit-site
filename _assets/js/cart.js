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

    function formatMoney(value) {
        return '$' + Math.round(value || 0);
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

        getEffectiveMonthlyPrice: function(item) {
            var monthlyPrice = parseInt(item && item.price, 10) || 0;

            if (isServiceCartItem(item) && item.payment === 'yearly' && item.discount > 0) {
                return Math.round(monthlyPrice * (100 - item.discount) / 100);
            }

            return monthlyPrice;
        },

        getBillingMultiplier: function(item) {
            return isServiceCartItem(item) && item.payment === 'yearly' ? 12 : 1;
        },

        getEffectivePrice: function(item) {
            return this.getEffectiveMonthlyPrice(item) * this.getBillingMultiplier(item);
        },

        getModifierUnitPrice: function(item, pct, useListPrice) {
            var baseMonthly = useListPrice
                ? (parseInt(item && item.price, 10) || 0)
                : this.getEffectiveMonthlyPrice(item);

            return Math.round(baseMonthly * pct) * this.getBillingMultiplier(item);
        },

        getEquivalentMonthlyTotal: function(item) {
            var config = getConfig();
            var base = this.getEffectiveMonthlyPrice(item);
            var langExtra = Math.round(base * config.langPct) * (item.langCount || 0);
            var countryExtra = Math.round(base * config.countryPct) * (item.countryCount || 0);
            return base + langExtra + countryExtra;
        },

        getAnnualSavings: function(item) {
            var config = getConfig();
            var monthlyBase;
            var listMonthlyTotal;

            if (!isServiceCartItem(item) || item.payment !== 'yearly' || item.discount <= 0) {
                return 0;
            }

            monthlyBase = parseInt(item && item.price, 10) || 0;
            listMonthlyTotal = monthlyBase
                + (Math.round(monthlyBase * config.langPct) * (item.langCount || 0))
                + (Math.round(monthlyBase * config.countryPct) * (item.countryCount || 0));

            return (listMonthlyTotal * 12) - this.getItemTotal(item);
        },

        getItemPricingMeta: function(item) {
            var itemType = normalizeCartItemType(item.itemType);
            var baseAmount = this.getEffectivePrice(item);
            var totalAmount = this.getItemTotal(item);
            var detailLines = [];
            var suffix = '';

            if (item.custom) {
                return {
                    baseLabel: 'Custom',
                    totalLabel: 'Custom',
                    detailLines: detailLines
                };
            }

            if (isServiceCartItem(item)) {
                if (item.payment === 'monthly') {
                    suffix = '/mo';
                    detailLines.push('Monthly subscription');
                } else if (item.payment === 'yearly') {
                    suffix = '/year';
                    detailLines.push('Billed upfront · ' + formatMoney(this.getEquivalentMonthlyTotal(item)) + '/mo equivalent');
                    if (this.getAnnualSavings(item) > 0) {
                        detailLines.push('Save ' + formatMoney(this.getAnnualSavings(item)) + '/year');
                    }
                } else {
                    detailLines.push('One-time service engagement');
                }
            } else if (itemType === 'Solution') {
                detailLines.push('One-time solution audit');
            } else if (itemType === 'Scope') {
                detailLines.push('One-time scope deliverable');
            } else {
                detailLines.push('One-time deliverable');
            }

            return {
                baseLabel: formatMoney(baseAmount) + suffix,
                totalLabel: formatMoney(totalAmount) + suffix,
                detailLines: detailLines
            };
        },

        getSelectionSummary: function(items) {
            var summary = {
                dueToday: 0,
                monthlyRecurring: 0,
                yearlyEquivalentMonthly: 0,
                yearlySavings: 0,
                hasCustom: false
            };
            var list = Array.isArray(items) ? items : Object.values(items || {});

            list.forEach(function(item) {
                if (!item) return;

                normalizeCartBilling(item);
                if (item.custom) summary.hasCustom = true;

                if (isServiceCartItem(item) && item.payment === 'monthly') {
                    summary.monthlyRecurring += cart.getItemTotal(item);
                }

                summary.dueToday += cart.getItemTotal(item);

                if (isServiceCartItem(item) && item.payment === 'yearly') {
                    summary.yearlyEquivalentMonthly += cart.getEquivalentMonthlyTotal(item);
                    summary.yearlySavings += cart.getAnnualSavings(item);
                }
            });

            return summary;
        },

        getItemTotal: function(item) {
            var config = getConfig();
            var base = this.getEffectivePrice(item);
            var langExtra = this.getModifierUnitPrice(item, config.langPct) * (item.langCount || 0);
            var countryExtra = this.getModifierUnitPrice(item, config.countryPct) * (item.countryCount || 0);
            return base + langExtra + countryExtra;
        },

        getTotal: function() {
            var summary = this.getSelectionSummary(this.items);
            return {
                total: summary.dueToday,
                hasCustom: summary.hasCustom,
                summary: summary
            };
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
                    ? 'Yearly prepay'
                    : (item.payment === 'monthly' ? 'Monthly subscription' : 'One-time');
                var effectivePrice = this.getEffectivePrice(item);
                var itemTotal = this.getItemTotal(item);
                var periodSuffix = item.payment === 'monthly' ? '/mo' : (item.payment === 'yearly' ? '/year' : '');
                var perLang = this.getModifierUnitPrice(item, config.langPct);
                var perCountry = this.getModifierUnitPrice(item, config.countryPct);

                lines.push(num + '. ' + item.title + (item.tierName ? ' (' + item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + ')' : ''));
                lines.push('   Type: ' + normalizeCartItemType(item.itemType));
                lines.push('   Payment: ' + paymentLabel);
                if (item.payment === 'yearly') {
                    lines.push('   Equivalent monthly: ' + formatMoney(this.getEquivalentMonthlyTotal(item)) + '/mo');
                    if (this.getAnnualSavings(item) > 0) {
                        lines.push('   Savings: ' + formatMoney(this.getAnnualSavings(item)) + '/year');
                    }
                }
                if (lc > 0) lines.push('   Languages: +' + lc + ' × ' + formatMoney(perLang) + periodSuffix + ' = ' + formatMoney(lc * perLang));
                if (cc > 0) lines.push('   Countries: +' + cc + ' × ' + formatMoney(perCountry) + periodSuffix + ' = ' + formatMoney(cc * perCountry));
                lines.push('   Base: ' + (effectivePrice > 0 ? formatMoney(effectivePrice) + periodSuffix : 'Custom quote'));
                lines.push('   Subtotal: ' + (effectivePrice > 0 ? formatMoney(itemTotal) + periodSuffix : 'Custom quote'));
                lines.push('');
                num++;
            }

            var totals = this.getTotal();
            if (totals.summary.dueToday > 0) {
                lines.push('DUE TODAY: ' + (totals.hasCustom ? 'From ' : '') + formatMoney(totals.summary.dueToday));
            }
            if (totals.summary.monthlyRecurring > 0) {
                lines.push('MONTHLY RECURRING: ' + (totals.hasCustom ? 'From ' : '') + formatMoney(totals.summary.monthlyRecurring) + '/mo');
            }
            if (totals.summary.yearlyEquivalentMonthly > 0) {
                lines.push('YEARLY EQUIVALENT: ' + formatMoney(totals.summary.yearlyEquivalentMonthly) + '/mo');
            }
            if (totals.summary.yearlySavings > 0) {
                lines.push('ANNUAL SAVINGS: ' + formatMoney(totals.summary.yearlySavings) + '/year');
            }
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
            var subtotalLabelEl;
            var feesLabelEl;
            var totalLabelEl;
            var summaryMetaEl;
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

            var langCount = parseInt(document.getElementById('langCount')?.textContent) || 0;
            var countryCount = parseInt(document.getElementById('countryCount')?.textContent) || 0;

            for (var pageSlug of keys) {
                pageItems[pageSlug].langCount = langCount;
                pageItems[pageSlug].countryCount = countryCount;
            }

            html = '';
            subtotal = 0;
            hasCustom = false;

            for (var itemSlug of keys) {
                var item = pageItems[itemSlug];
                var effectivePrice;
                var pricingMeta;
                var sidebarBaseLabel;
                var sidebarTotalLabel;
                var tierLine;

                if (item.custom) hasCustom = true;
                effectivePrice = cart.getEffectivePrice(item);
                pricingMeta = cart.getItemPricingMeta(item);
                sidebarBaseLabel = (item.payment === 'yearly' || item.payment === 'monthly')
                    ? pricingMeta.baseLabel.replace(/\/(?:mo|year)$/, '')
                    : pricingMeta.baseLabel;
                sidebarTotalLabel = (item.payment === 'yearly' || item.payment === 'monthly')
                    ? pricingMeta.totalLabel.replace(/\/(?:mo|year)$/, '')
                    : pricingMeta.totalLabel;
                subtotal += effectivePrice;
                tierLine = item.tierName
                    ? item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + ' — ' + sidebarBaseLabel
                    : sidebarBaseLabel;

                html += '<div class="cart-line-item">' +
                    '<div class="cart-item-info">' +
                        '<span class="cart-item-title">' + item.title + '</span>' +
                        '<span class="cart-item-tier">' + tierLine + '</span>' +
                        pricingMeta.detailLines.map(function(line) {
                            return '<span class="cart-billing-note">' + line + '</span>';
                        }).join('') +
                    '</div>' +
                    '<div class="cart-item-actions">' +
                        '<span class="cart-item-price">' + sidebarTotalLabel + '</span>' +
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
            cart.save();

            grandTotal = 0;
            for (var totalSlug of keys) {
                grandTotal += cart.getItemTotal(pageItems[totalSlug]);
            }
            modifierTotal = grandTotal - subtotal;

            subtotalEl = document.getElementById('cartSubtotal');
            feesEl = document.getElementById('cartFees');
            totalEl = document.getElementById('cartTotal');
            subtotalLabelEl = document.getElementById('cartSubtotalLabel');
            feesLabelEl = document.getElementById('cartFeesLabel');
            totalLabelEl = document.getElementById('cartTotalLabel');
            summaryMetaEl = document.getElementById('cartSummaryMeta');

            var pageSummary = cart.getSelectionSummary(pageItems);
            var summaryLines = [];

            if (subtotalEl) subtotalEl.textContent = (hasCustom ? 'From ' : '') + formatMoney(subtotal);
            if (feesEl) feesEl.textContent = modifierTotal > 0 ? '+' + formatMoney(modifierTotal) : '$0';
            if (subtotalLabelEl) subtotalLabelEl.textContent = pageSummary.monthlyRecurring > 0 && pageSummary.dueToday === 0 ? 'Base / mo' : (pageSummary.yearlyEquivalentMonthly > 0 && pageSummary.monthlyRecurring === 0 ? 'Base / year' : 'Base');
            if (feesLabelEl) feesLabelEl.textContent = pageSummary.monthlyRecurring > 0 && pageSummary.dueToday === 0 ? 'Modifiers / mo' : (pageSummary.yearlyEquivalentMonthly > 0 && pageSummary.monthlyRecurring === 0 ? 'Modifiers / year' : 'Modifiers');
            if (totalEl) {
                if (pageSummary.monthlyRecurring > 0 && pageSummary.dueToday === 0) {
                    totalEl.textContent = (hasCustom ? 'From ' : '') + formatMoney(pageSummary.monthlyRecurring);
                } else {
                    totalEl.textContent = (hasCustom ? 'From ' : '') + formatMoney(pageSummary.dueToday);
                }
            }
            if (totalLabelEl) {
                totalLabelEl.textContent = pageSummary.monthlyRecurring > 0 && pageSummary.dueToday === 0 ? 'Monthly Total' : 'Due Today';
            }
            if (pageSummary.monthlyRecurring > 0 && pageSummary.dueToday > 0) {
                summaryLines.push('<div class="cart-summary-line"><span>Monthly recurring</span><strong>' + formatMoney(pageSummary.monthlyRecurring) + '/mo</strong></div>');
            }
            if (pageSummary.yearlyEquivalentMonthly > 0) {
                summaryLines.push('<div class="cart-summary-line"><span>Equivalent monthly</span><strong>' + formatMoney(pageSummary.yearlyEquivalentMonthly) + '/mo</strong></div>');
            }
            if (pageSummary.yearlySavings > 0) {
                summaryLines.push('<div class="cart-summary-line"><span>You save</span><strong>' + formatMoney(pageSummary.yearlySavings) + '/year</strong></div>');
            }
            if (summaryMetaEl) {
                summaryMetaEl.innerHTML = summaryLines.join('');
                summaryMetaEl.classList.toggle('hidden', summaryLines.length === 0);
            }

            billingBadge = document.getElementById('cartBillingBadge');
            if (billingBadge) billingBadge.remove();
        }
    };

    function initBillingState() {
        var el = document.querySelector('[data-discount]');
        if (el) _billingDiscount = parseInt(el.dataset.discount) || 0;
    }

    function revealOrderTabForSelection() {
        if (typeof app.openOrderSidebar === 'function') {
            app.openOrderSidebar({ openSidebar: false, scroll: false });
            return;
        }

        var orderTab = document.querySelector('.sidebar-tabs .sidebar-tab[data-tab="order"]');
        if (orderTab && !orderTab.classList.contains('active')) {
            orderTab.click();
        }
    }

    function bindTaskPickerEvents() {
        document.addEventListener('taskToggled', function(e) {
            var d = e.detail;
            var billing = d.billing || cloneBilling(DEFAULT_BILLING);
            var payment = billing.monthly ? _billingPeriod : 'one-time';

            if (d.replaceAll) {
                cart.clearCurrentPage();
                cart.add(d.slug, d.title, d.tierName, d.tierLabel, d.price, d.custom, payment, billing, 'Scope');
                revealOrderTabForSelection();
            } else if (d.selected) {
                cart.add(d.slug, d.title, d.tierName, d.tierLabel, d.price, d.custom, payment, billing, 'Scope');
                revealOrderTabForSelection();
            } else {
                cart.remove(d.slug);
            }
        });

        document.addEventListener('tierChanged', function(e) {
            var d = e.detail;
            cart.updateTier(d.taskSlug, d.tierName, d.tierLabel, d.price, d.custom, d.billing);
            revealOrderTabForSelection();
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
                revealOrderTabForSelection();
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
                var itemType;

                if (!titleEl || !priceEl) return;

                e.preventDefault();
                title = titleEl.textContent.trim();
                slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                price = parseInt(priceEl.dataset.monthly) || parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;
                card = btn.closest('.pricing-simple-card');
                itemType = /^\/solutions\/[^/]+\/?$/.test(window.location.pathname) ? 'Solution' : 'Service';
                billing = itemType === 'Service' ? readBillingFromDataset(card, SERVICE_BILLING_DEFAULTS) : cloneBilling(DEFAULT_BILLING);
                payment = itemType === 'Service' && billing.monthly ? _billingPeriod : 'one-time';

                cart.clearCurrentPage();
                cart.add(slug, title, '', '', price, false, payment, billing, itemType);
                revealOrderTabForSelection();

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
                revealOrderTabForSelection();
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
                var tierStr;
                var billing;
                var pricingMeta;
                var paymentCell = '<span class="cart-cell-main">One-time</span>';

                normalizeCartBilling(item);
                if (item.custom) hasCustom = true;

                lc = item.langCount || 0;
                cc = item.countryCount || 0;
                effectivePrice = cart.getEffectivePrice(item);
                itemTotal = cart.getItemTotal(item);
                perLang = cart.getModifierUnitPrice(item, config.langPct);
                perCountry = cart.getModifierUnitPrice(item, config.countryPct);
                itemType = normalizeCartItemType(item.itemType);
                pricingMeta = cart.getItemPricingMeta(item);

                grandTotal += itemTotal;

                basePriceStr = pricingMeta.baseLabel;
                tierStr = item.tierName ? item.tierName + (item.tierLabel ? ' — ' + item.tierLabel : '') + ' — ' : '';

                billing = item.billing || cloneBilling(DEFAULT_BILLING);
                if (isServiceCartItem(itemType)) {
                    paymentCell = '<div class="cart-payment-tabs">';
                    if (billing.oneTime && !billing.monthly && !billing.yearly) {
                        paymentCell += '<button class="cart-payment-opt active" data-slug="' + slug + '" data-val="one-time">One-time</button>';
                    }
                    if (billing.monthly) {
                        paymentCell += '<button class="cart-payment-opt' + (item.payment === 'monthly' ? ' active' : '') + '" data-slug="' + slug + '" data-val="monthly">Monthly</button>';
                    }
                    if (billing.yearly) {
                        paymentCell += '<button class="cart-payment-opt' + (item.payment === 'yearly' ? ' active' : '') + '" data-slug="' + slug + '" data-val="yearly">Yearly</button>';
                    }
                    paymentCell += '</div>';
                }

                html += '<tr>' +
                    '<td>' +
                        '<span class="cart-item-name">' + item.title + '</span>' +
                        '<span class="cart-item-tier">' + tierStr + basePriceStr + '</span>' +
                        pricingMeta.detailLines.map(function(line) {
                            return '<span class="cart-billing-note">' + line + '</span>';
                        }).join('') +
                    '</td>' +
                    '<td class="cart-col-type"><span class="cart-cell-main">' + itemType + '</span></td>' +
                    '<td class="cart-col-payment">' + paymentCell + '</td>' +
                    '<td>' +
                        '<div class="cart-inline-counter">' +
                            '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="langCount" data-action="minus">−</button>' +
                            '<span class="cart-inline-val">' + lc + '</span>' +
                            '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="langCount" data-action="plus">+</button>' +
                        '</div>' +
                        (lc > 0 ? '<span class="cart-inline-fee">+' + formatMoney(perLang * lc) + '</span>' : '') +
                    '</td>' +
                    '<td>' +
                        '<div class="cart-inline-counter">' +
                            '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="countryCount" data-action="minus">−</button>' +
                            '<span class="cart-inline-val">' + cc + '</span>' +
                            '<button class="cart-inline-btn" data-slug="' + slug + '" data-field="countryCount" data-action="plus">+</button>' +
                        '</div>' +
                        (cc > 0 ? '<span class="cart-inline-fee">+' + formatMoney(perCountry * cc) + '</span>' : '') +
                    '</td>' +
                    '<td class="text-right"><span class="cart-item-price">' + pricingMeta.totalLabel + '</span></td>' +
                    '<td><button class="cart-item-remove-btn" data-slug="' + slug + '">&times;</button></td>' +
                '</tr>';
            }

            html += '</tbody></table></div>';
            return {
                html: html,
                grandTotal: grandTotal,
                hasCustom: hasCustom,
                summary: cart.getSelectionSummary(keys.map(function(itemSlug) {
                    return cart.items[itemSlug];
                }))
            };
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
                    '<label class="sr-only" for="cartSource">How did you hear about us?</label>' +
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
            var primaryTotalLabel;
            var primaryTotalValue;
            var summaryLines = [];

            if (keys.length === 0) {
                renderEmptyCartPage();
                return;
            }

            table = buildCartTable(keys);
            html = table.html;
            if (table.summary.monthlyRecurring > 0) {
                summaryLines.push('<div class="cart-summary-line"><span>Monthly recurring</span><strong>' + formatMoney(table.summary.monthlyRecurring) + '/mo</strong></div>');
            }
            if (table.summary.yearlyEquivalentMonthly > 0) {
                summaryLines.push('<div class="cart-summary-line"><span>Equivalent monthly</span><strong>' + formatMoney(table.summary.yearlyEquivalentMonthly) + '/mo</strong></div>');
            }
            if (table.summary.yearlySavings > 0) {
                summaryLines.push('<div class="cart-summary-line"><span>You save</span><strong>' + formatMoney(table.summary.yearlySavings) + '/year</strong></div>');
            }
            primaryTotalLabel = table.summary.monthlyRecurring > 0 && table.summary.dueToday === 0 ? 'Monthly Recurring' : 'Due Today';
            primaryTotalValue = table.summary.monthlyRecurring > 0 && table.summary.dueToday === 0
                ? formatMoney(table.summary.monthlyRecurring) + '/mo'
                : formatMoney(table.summary.dueToday);
            html += '<div class="cart-totals">' +
                '<div class="cart-totals-group">' +
                    (summaryLines.length ? '<div class="cart-page-summary cart-summary-items">' + summaryLines.join('') + '</div>' : '') +
                    '<div class="cart-total-panel">' +
                        '<div class="cart-total-amount">' + (table.hasCustom ? 'From ' : '') + primaryTotalValue + '</div>' +
                        '<div class="cart-total-label">' + primaryTotalLabel + '</div>' +
                    '</div>' +
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
