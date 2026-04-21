/*
 * Shared card renderers.
 * Single source of truth for expert card markup.
 */
(function() {
    function esc(str) {
        var d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    function toArray(value) {
        if (Array.isArray(value)) return value;
        if (value === undefined || value === null || value === '') return [];
        return [value];
    }

    function getInitials(name) {
        return (name || '')
            .split(' ')
            .map(function(w) { return w[0] || ''; })
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    function defaultLabel(slug) {
        return String(slug || '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, function(ch) { return ch.toUpperCase(); });
    }

    function normalizeCardUrl(value, fallback) {
        var href = value === undefined || value === null || value === '' ? (fallback || '#') : String(value).trim();
        if (!href) href = fallback || '#';

        if (/^(https?:\/\/|mailto:|tel:|javascript:|#)/i.test(href)) return href;

        var normalized = href.replace(/\\/g, '/');
        var comparable = normalized.replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();
        if (
            comparable === 'contact' ||
            comparable.indexOf('contact/') === 0 ||
            comparable.indexOf('contact?') === 0
        ) {
            return '#sidebar-contact';
        }

        var clean = normalized.replace(/^\.\//, '').replace(/^\/+/, '');
        return clean ? ('/' + clean) : '/';
    }

    function resolveLabel(resolver, slug) {
        if (!slug) return '';
        if (typeof resolver === 'function') return resolver(slug);
        if (resolver && typeof resolver === 'object') return resolver[slug] || defaultLabel(slug);
        return defaultLabel(slug);
    }

    function resolveLangCode(langCodeMap, slug) {
        if (!slug) return '';
        if (langCodeMap && langCodeMap[slug]) return langCodeMap[slug];
        return String(slug).toUpperCase().slice(0, 2);
    }

    function resolveCountryFlag(countryFlagMap, slug) {
        var fallbackMap = {
            // Europe
            austria: '🇦🇹', belgium: '🇧🇪', bulgaria: '🇧🇬', croatia: '🇭🇷',
            'czech-republic': '🇨🇿', czechia: '🇨🇿', denmark: '🇩🇰', estonia: '🇪🇪',
            finland: '🇫🇮', france: '🇫🇷', germany: '🇩🇪', greece: '🇬🇷',
            hungary: '🇭🇺', iceland: '🇮🇸', ireland: '🇮🇪', italy: '🇮🇹',
            latvia: '🇱🇻', lithuania: '🇱🇹', luxembourg: '🇱🇺', netherlands: '🇳🇱',
            norway: '🇳🇴', poland: '🇵🇱', portugal: '🇵🇹', romania: '🇷🇴',
            serbia: '🇷🇸', slovakia: '🇸🇰', slovenia: '🇸🇮', spain: '🇪🇸',
            sweden: '🇸🇪', switzerland: '🇨🇭', uk: '🇬🇧', ukraine: '🇺🇦',
            // Americas
            usa: '🇺🇸', canada: '🇨🇦', mexico: '🇲🇽', brazil: '🇧🇷',
            argentina: '🇦🇷', chile: '🇨🇱', colombia: '🇨🇴', peru: '🇵🇪',
            // Asia & Pacific
            china: '🇨🇳', japan: '🇯🇵', 'south-korea': '🇰🇷', korea: '🇰🇷',
            india: '🇮🇳', indonesia: '🇮🇩', singapore: '🇸🇬', thailand: '🇹🇭',
            vietnam: '🇻🇳', philippines: '🇵🇭', malaysia: '🇲🇾', taiwan: '🇹🇼',
            australia: '🇦🇺', 'new-zealand': '🇳🇿',
            // Middle East & Africa
            israel: '🇮🇱', turkey: '🇹🇷', uae: '🇦🇪', 'saudi-arabia': '🇸🇦',
            'south-africa': '🇿🇦', egypt: '🇪🇬', nigeria: '🇳🇬', kenya: '🇰🇪',
            // CIS
            russia: '🇷🇺', kazakhstan: '🇰🇿', belarus: '🇧🇾', georgia: '🇬🇪'
        };
        if (!slug) return '';
        if (countryFlagMap && countryFlagMap[slug]) return countryFlagMap[slug];
        return fallbackMap[slug] || '';
    }

    function resolveCountryName(countryLabel, slug) {
        if (!slug) return '';
        if (typeof countryLabel === 'function') return countryLabel(slug);
        if (countryLabel && typeof countryLabel === 'object' && countryLabel[slug]) return countryLabel[slug];
        if (String(slug).length <= 3) return String(slug).toUpperCase();
        return defaultLabel(slug);
    }

    function normalizeCount(value, fallback) {
        var n = Number(value);
        if (isFinite(n) && n >= 0) return n;
        return Number(fallback) || 0;
    }

    function pluralize(count, singular, plural) {
        return count + ' ' + (count === 1 ? singular : plural);
    }

    function buildChip(label, className, title) {
        if (!label) return '';
        return '<span class="' + className + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + esc(label) + '</span>';
    }

    function buildLabelChip(label, extraClasses) {
        return buildChip(label, 'entity-chip entity-chip-label ' + (extraClasses || 'entity-chip-wide'));
    }

    function buildCountryChip(slug, options) {
        var label = resolveCountryName(options && options.countryLabel, slug);
        var flag = resolveCountryFlag(options && options.countryFlagMap, slug);
        return buildChip(flag || label, 'entity-chip entity-chip-soft entity-chip-flag', label);
    }

    function buildLanguageChip(slug, options) {
        var label = resolveLabel(options && options.languageLabel, slug);
        var code = resolveLangCode(options && options.langCodeMap, slug);
        return buildChip(code, 'entity-chip entity-chip-soft entity-chip-code', label || defaultLabel(slug));
    }

    function buildCountChip(label) {
        return buildChip(label, 'entity-card-stat');
    }

    function buildSingleLabelOrCount(refs, countValue, resolver, singular, plural, extraClasses) {
        var values = toArray(refs).filter(Boolean);
        var count = normalizeCount(countValue, values.length);

        if (count <= 0) {
            return { exactChip: '', countChip: '' };
        }
        if (count === 1 && values.length === 1) {
            return {
                exactChip: buildLabelChip(resolveLabel(resolver, values[0]), extraClasses),
                countChip: ''
            };
        }
        return {
            exactChip: '',
            countChip: buildCountChip(pluralize(count, singular, plural))
        };
    }

    function formatAuthorName(author) {
        return defaultLabel(author);
    }

    function formatDate(value) {
        if (!value) return '';
        var d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getCardAvatarSrc(path) {
        var value = String(path || '');
        if (!value || value.indexOf('/team/') === -1) return value;
        return value
            .replace('/team/', '/team/cards/')
            .replace(/\.[a-z0-9]+$/i, '.jpg');
    }

    function mediaVersion() {
        return (window.VividigitAssetHashes && window.VividigitAssetHashes.media) || '';
    }

    function mediaUrl(path) {
        var value = String(path || '');
        var version = mediaVersion();
        if (!value || !version || value.indexOf('_media/') === -1) return value;
        if (/[?&]v=/.test(value)) {
            return value.replace(/([?&])v=[^&#]*/g, '$1v=' + version);
        }
        return value + (value.indexOf('?') === -1 ? '?v=' : '&v=') + version;
    }

    function mediaIconUrl(name) {
        return mediaUrl('/_media/icons/' + name + '.svg');
    }

    function buildExactRow(chips, extraClass) {
        var items = (chips || []).filter(Boolean);
        if (!items.length) return '';
        return '<div class="entity-card-exact-row' + (extraClass ? ' ' + extraClass : '') + '">' + items.join('') + '</div>';
    }

    function buildExactRows(rows) {
        var items = (rows || []).filter(Boolean);
        if (!items.length) return '';
        return '<div class="entity-card-exact-chips">' + items.join('') + '</div>';
    }

    function buildCountRow(chips, extraClass) {
        var items = (chips || []).filter(Boolean);
        if (!items.length) return '';
        return '<div class="' + (extraClass ? extraClass + ' ' : '') + 'entity-card-meta-row">' + items.join('') + '</div>';
    }

    function fitExactChipRows(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var rows = scope.querySelectorAll('.entity-card-exact-row');

        if (!rows.length) return;

        rows.forEach(function(row) {
            var more = row.querySelector('.entity-chip-more');
            var availableWidth;
            var chipWidths;
            var hiddenCount = 0;
            var visibleWidth;
            var moreChip;
            var rowStyle;
            var gap;
            if (more) more.remove();

            var chips = Array.from(row.children).filter(function(node) {
                return !node.classList.contains('entity-chip-more');
            });
            chips.forEach(function(chip) { chip.hidden = false; });

            if (chips.length <= 1) return;

            availableWidth = row.clientWidth;
            if (!availableWidth) return;

            rowStyle = window.getComputedStyle(row);
            gap = parseFloat(rowStyle.columnGap || rowStyle.gap || '0') || 0;
            chipWidths = chips.map(function(chip) {
                return chip.getBoundingClientRect().width;
            });
            visibleWidth = chipWidths.reduce(function(sum, width) {
                return sum + width;
            }, 0) + (Math.max(0, chips.length - 1) * gap);

            if (visibleWidth <= availableWidth + 1) return;

            moreChip = document.createElement('span');
            moreChip.className = 'entity-chip entity-chip-more';
            row.appendChild(moreChip);

            for (var i = chips.length - 1; i > 0; i--) {
                hiddenCount += 1;
                visibleWidth -= chipWidths[i];
                visibleWidth -= gap;
                moreChip.textContent = '+' + hiddenCount + ' more';
                if (visibleWidth + gap + moreChip.getBoundingClientRect().width <= availableWidth + 1) break;
            }

            if (hiddenCount === 0) {
                moreChip.remove();
                return;
            }

            for (var j = chips.length - hiddenCount; j < chips.length; j++) {
                chips[j].hidden = true;
            }
        });
    }

    function normalizeExpertCardData(s) {
        var facets = s.facets || {};
        var serviceRefs = toArray(
            s.services ||
            facets.services ||
            (s.relationships && s.relationships.services) ||
            []
        );
        var industryRefs = toArray(s.industries || facets.industries || (s.relationships && s.relationships.industries) || []);
        var languageRefs = toArray(s.languages || (s.relationships && s.relationships.languages) || []);
        var countryRefs = toArray(s.countries || (s.relationships && s.relationships.countries) || []);
        var caseRefs = toArray(facets.cases || s.cases || (s.relationships && s.relationships.cases) || []);
        var articleRefs = toArray(facets['blog-posts'] || []);

        return {
            slug: s.slug || '',
            url: normalizeCardUrl(s.url || ('/team/' + (s.slug || '')), '#'),
            title: s.title || s.menu || s.name || s.slug || 'Expert',
            description: s.description || '',
            role: s.role || '',
            avatar: s.avatar || '',
            experienceValue: s.experience_value || '',
            projects: s.projects || null,
            industries: industryRefs,
            industryCount: normalizeCount(s.industry_count, industryRefs.length),
            services: serviceRefs,
            serviceCount: normalizeCount(s.service_count, serviceRefs.length),
            languages: languageRefs,
            countries: countryRefs,
            caseCount: normalizeCount(s.case_count, caseRefs.length),
            articleCount: normalizeCount(s.article_count, articleRefs.length),
        };
    }

    function renderExpertCard(s, options) {
        var opts = options || {};
        var d = normalizeExpertCardData(s || {});
        var initials = getInitials(d.title || d.slug);
        var avatarSrc = getCardAvatarSrc(d.avatar);
        var avatarHtml = d.avatar
            ? '<div class="expert-avatar"><img src="' + esc(mediaUrl(avatarSrc)) + '" alt="' + esc(d.title) + '" loading="lazy" fetchpriority="low" decoding="async" width="56" height="56" onerror="this.onerror=null;this.src=\'' + esc(mediaUrl(d.avatar)) + '\'"></div>'
            : '<div class="expert-avatar"><div class="expert-avatar-initials">' + esc(initials) + '</div></div>';
        var summary = d.description
            ? '<p class="expert-summary entity-card-copy">' + esc(d.description) + '</p>'
            : '';
        var serviceRelation = buildSingleLabelOrCount(d.services, d.serviceCount, opts.serviceLabel, 'service', 'services', 'entity-chip-wide');
        var industryRelation = buildSingleLabelOrCount(d.industries, d.industryCount, opts.industryLabel, 'industry', 'industries', 'entity-chip-compact');
        var metricTags = [];
        if (serviceRelation.countChip) {
            metricTags.push(serviceRelation.countChip);
        }
        if (industryRelation.countChip) {
            metricTags.push(industryRelation.countChip);
        }
        if (d.caseCount > 0) {
            metricTags.push(buildCountChip(pluralize(d.caseCount, 'case', 'cases')));
        }
        if (d.articleCount > 0) {
            metricTags.push(buildCountChip(pluralize(d.articleCount, 'article', 'articles')));
        }
        var countries = d.countries.map(function(c) { return buildCountryChip(c, opts); }).filter(Boolean);
        var languages = d.languages.map(function(l) {
            return buildLanguageChip(l, opts);
        }).filter(Boolean);
        var exactRows = buildExactRows([
            buildExactRow([serviceRelation.exactChip], 'expert-tag-row expert-tag-row-services'),
            buildExactRow([industryRelation.exactChip], 'expert-tag-row expert-tag-row-industries'),
            buildExactRow(countries, 'expert-tag-row expert-tag-row-countries'),
            buildExactRow(languages, 'expert-tag-row expert-tag-row-languages')
        ]);
        var metricRow = buildCountRow(metricTags, 'expert-tag-row expert-tag-row-metrics');

        return '<a href="' + d.url + '" class="expert-card entity-card entity-card-padded">' +
            '<div class="expert-card-top">' +
            '<div class="expert-info"><div class="entity-card-title">' + esc(d.title) + '</div>' +
            (d.role ? '<div class="expert-role type-meta">' + esc(d.role) + '</div>' : '') +
            '</div>' +
            avatarHtml +
            '</div>' +
            summary +
            exactRows +
            metricRow +
            '<div class="expert-card-footer entity-card-footer">' +
            (d.experienceValue ? '<div class="expert-experience case-result"><span class="result-value">' + esc(d.experienceValue) + '</span><span class="result-label">Years experience</span></div>' : '<span></span>') +
            '<span class="expert-cta entity-card-cta">View Profile</span>' +
            '</div>' +
            '</a>';
    }

    window.CMSCards = window.CMSCards || {};
    window.CMSCards.renderExpertCard = renderExpertCard;

    function renderScopeCard(s, options) {
        var opts = options || {};
        var facets = s.facets || {};
        var services = toArray(s.services || facets.services || (s.relationships && s.relationships.services) || []);
        if (!services.length && s.service) services = [s.service];
        var domains = toArray(s.domains || facets.domains || (s.relationships && s.relationships.domains) || []);
        var industries = toArray(s.industries || facets.industries || (s.relationships && s.relationships.industries) || []);
        var serviceCount = normalizeCount(s.service_count, services.length);
        var domainCount = normalizeCount(s.domain_count, domains.length);
        var industryCount = normalizeCount(s.industry_count, industries.length);
        var countryCount = normalizeCount(s.country_count, toArray(s.countries || facets.countries).length);
        var languageCount = normalizeCount(s.language_count, toArray(s.languages || facets.languages).length);
        var taskCount = normalizeCount(s.task_count, 0);
        var price = normalizeCount(s.price || s.from_price, 0);
        var url = normalizeCardUrl(s.url || ('/scopes/' + (s.slug || '')), '#');
        var iconName = s.icon || (opts.serviceIconMap && opts.serviceIconMap[services[0]]) || 'settings';
        var domainRelation = buildSingleLabelOrCount(domains, domainCount, opts.domainLabel, 'domain', 'domains', 'entity-chip-wide');
        var serviceRelation = buildSingleLabelOrCount(services, serviceCount, opts.serviceLabel, 'service', 'services', 'entity-chip-wide');
        var industryRelation = buildSingleLabelOrCount(industries, industryCount, opts.industryLabel, 'industry', 'industries', 'entity-chip-compact');
        var metricTags = [];
        if (domainRelation.countChip) metricTags.push(domainRelation.countChip);
        if (serviceRelation.countChip) metricTags.push(serviceRelation.countChip);
        if (industryRelation.countChip) metricTags.push(industryRelation.countChip);
        if (countryCount > 0) metricTags.push(buildCountChip(pluralize(countryCount, 'country', 'countries')));
        if (languageCount > 0) metricTags.push(buildCountChip(pluralize(languageCount, 'language', 'languages')));
        if (taskCount > 0) metricTags.push(buildCountChip(pluralize(taskCount, 'task', 'tasks')));

        return '<a href="' + url + '" class="scope-card entity-card entity-card-padded">' +
            '<div class="service-card-header"><div class="entity-card-title">' + esc(s.menu || s.title) + '</div>' +
            '<div class="service-card-icon" style="--icon-url: url(' + mediaIconUrl(iconName) + ')"></div></div>' +
            '<p class="entity-card-copy">' + esc(s.description || '') + '</p>' +
            buildExactRows([
                buildExactRow([domainRelation.exactChip], 'scope-chip-row scope-chip-row-domains'),
                buildExactRow([serviceRelation.exactChip], 'scope-chip-row scope-chip-row-services'),
                buildExactRow([industryRelation.exactChip], 'scope-chip-row scope-chip-row-industries')
            ]) +
            buildCountRow(metricTags, 'scope-card-meta') +
            '<div class="scope-card-footer entity-card-footer">' +
            (price > 0 ? '<span class="scope-price entity-card-price">From $' + Math.round(price) + '</span>' : '<span></span>') +
            '<span class="scope-cta entity-card-cta">View Scope</span></div></a>';
    }

    window.CMSCards.renderScopeCard = renderScopeCard;

    function renderCaseCard(s, options) {
        var opts = options || {};
        var facets = s.facets || {};
        var url = normalizeCardUrl(s.url || ('/cases/' + (s.slug || '')), '#');
        var title = s.card_title || s.menu || s.title || 'Case';
        var letter = (s.client || title || 'C').charAt(0).toUpperCase();
        var imageMode = s.image_mode || '';
        var imageClass = 'case-image' + (imageMode ? (' case-image-' + imageMode) : '');
        var imageHtml = s.image
            ? '<div class="' + imageClass + '"><img src="' + esc(mediaUrl(s.image)) + '" alt="' + esc(title) + '" loading="lazy"></div>'
            : '<div class="' + imageClass + '"><div class="case-image-placeholder"><span>' + esc(letter) + '</span></div></div>';
        var service = s.service || toArray(facets.services)[0] || '';
        var industry = s.industry || toArray(facets.industries)[0] || '';
        var country = s.country || toArray(facets.countries)[0] || '';
        var language = s.language || toArray(facets.languages)[0] || '';
        var exactRows = buildExactRows([
            buildExactRow([
                service ? buildLabelChip(resolveLabel(opts.serviceLabel, service), 'entity-chip-wide') : '',
                industry ? buildLabelChip(resolveLabel(opts.industryLabel, industry), 'entity-chip-compact') : ''
            ], 'case-tag-row case-tag-row-primary'),
            buildExactRow([
                country ? buildCountryChip(country, opts) : '',
                language ? buildLanguageChip(language, opts) : ''
            ], 'case-tag-row case-tag-row-locales')
        ]);
        var clientHtml = s.client ? '<div class="case-meta"><span class="case-client-chip">' + esc(s.client) + '</span></div>' : '';
        var primary = s.primary_result || (toArray(s.results)[0] || null);
        var footerClass = 'case-card-footer entity-card-footer' + (primary ? '' : ' entity-card-footer-end');

        return '<a href="' + url + '" class="case-card entity-card">' + imageHtml +
            '<div class="case-content"><div class="entity-card-title">' + esc(title) + '</div>' +
            clientHtml +
            '<p class="entity-card-copy">' + esc(s.description || '') + '</p>' +
            exactRows +
            '<div class="' + footerClass + '">' +
            (primary ? '<div class="case-result"><span class="result-value">' + esc(primary.value) + '</span><span class="result-label">' + esc(primary.label) + '</span></div>' : '') +
            '<span class="case-cta entity-card-cta">View Case</span></div></div></a>';
    }

    window.CMSCards.renderCaseCard = renderCaseCard;

    function renderBlogCard(s, options) {
        var opts = options || {};
        var url = normalizeCardUrl(s.url || ('/blog/' + (s.slug || '')), '#');
        if (url && url.slice(-1) !== '/') url += '/';
        var services = toArray(s.services || s.service || []);
        if (!services.length && s.service) services = [s.service];
        var scopes = toArray(s.scopes || s.scope || []);
        if (!scopes.length && s.scope) scopes = [s.scope];
        var industries = toArray(s.industries || s.industry || []);
        if (!industries.length && s.industry) industries = [s.industry];
        var countries = toArray(s.countries || s.country || []).filter(Boolean);
        if (!countries.length && s.country) countries = [s.country];
        var languages = toArray(s.languages || s.language || []);
        if (!languages.length && s.language) languages = [s.language];
        var serviceCount = normalizeCount(s.service_count, services.length);
        var scopeCount = normalizeCount(s.scope_count, scopes.length);
        var industryCount = normalizeCount(s.industry_count, industries.length);
        var serviceRelation = buildSingleLabelOrCount(services, serviceCount, opts.serviceLabel, 'service', 'services', 'entity-chip-wide');
        var scopeRelation = buildSingleLabelOrCount(scopes, scopeCount, opts.scopeLabel, 'scope', 'scopes', 'entity-chip-wide');
        var industryRelation = buildSingleLabelOrCount(industries, industryCount, opts.industryLabel, 'industry', 'industries', 'entity-chip-compact');

        var primaryRowChips = [];
        if (serviceRelation.exactChip) primaryRowChips.push(serviceRelation.exactChip);
        if (scopeRelation.exactChip) primaryRowChips.push(scopeRelation.exactChip);
        if (industryRelation.exactChip) primaryRowChips.push(industryRelation.exactChip);

        var exactRows = buildExactRows([
            buildExactRow(primaryRowChips, 'blog-card-chip-row blog-card-chip-row-primary'),
            countries.length ? buildExactRow(countries.map(function(country) {
                return buildCountryChip(country, opts);
            }), 'blog-card-chip-row blog-card-chip-row-countries') : '',
            languages.length ? buildExactRow(languages.map(function(language) {
                return buildLanguageChip(language, opts);
            }), 'blog-card-chip-row blog-card-chip-row-languages') : ''
        ]);
        var relationCountTags = [];
        if (serviceRelation.countChip) relationCountTags.push(serviceRelation.countChip);
        if (scopeRelation.countChip) relationCountTags.push(scopeRelation.countChip);
        if (industryRelation.countChip) relationCountTags.push(industryRelation.countChip);
        var metricRow = buildCountRow(relationCountTags, 'blog-card-chip-row blog-card-chip-row-metrics');

        var tagHtml = s.type
            ? '<div class="blog-card-tags"><span class="blog-chip entity-chip entity-chip-blog">' + esc(defaultLabel(s.type)) + '</span></div>'
            : '';
        var metaParts = [];
        if (s.date) metaParts.push('<span>' + esc(formatDate(s.date)) + '</span>');
        if (s.author) metaParts.push('<span>By ' + esc(formatAuthorName(s.author)) + '</span>');
        var readingTime = normalizeCount(s.reading_time, 0);

        return '<a href="' + url + '" class="blog-card entity-card entity-card-padded">' +
            tagHtml +
            '<div class="blog-card-title entity-card-title">' + esc(s.title || s.menu) + '</div>' +
            (metaParts.length ? '<div class="blog-card-meta type-meta">' + metaParts.join('') + '</div>' : '') +
            '<p class="blog-card-excerpt entity-card-copy">' + esc(s.description || '') + '</p>' +
            exactRows +
            metricRow +
            '<div class="blog-card-footer entity-card-footer">' +
            (readingTime > 0 ? '<div class="blog-card-reading case-result"><span class="result-value">' + esc(readingTime + ' min') + '</span><span class="result-label">Reading time</span></div>' : '<span></span>') +
            '<span class="blog-card-cta entity-card-cta">Read</span></div></a>';
    }

    window.CMSCards.renderBlogCard = renderBlogCard;

    function renderSolutionCard(s, options) {
        var opts = options || {};
        var facets = s.facets || {};
        var domains = toArray(s.domains || facets.domains || (s.relationships && s.relationships.domains) || []);
        var domainCount = normalizeCount(s.domain_count, domains.length);
        var serviceRefs = toArray(s.services || facets.services || (s.relationships && s.relationships.services) || []);
        if (!serviceRefs.length && s.service) serviceRefs = [s.service];
        var serviceCount = normalizeCount(s.service_count, serviceRefs.length);
        var firstService = s.service || serviceRefs[0] || '';
        var scopeRefs = toArray(s.scopes || s.scope || facets.scopes || (s.relationships && s.relationships.scopes) || []);
        if (!scopeRefs.length && s.scope) scopeRefs = [s.scope];
        var scopeCount = normalizeCount(s.scope_count, scopeRefs.length);
        var industryRefs = toArray(s.industries || s.industry || facets.industries || (s.relationships && s.relationships.industries) || []);
        if (!industryRefs.length && s.industry) industryRefs = [s.industry];
        var industryCount = normalizeCount(s.industry_count, industryRefs.length);
        var expertRefs = toArray(facets.experts || (s.relationships && s.relationships.experts) || []);
        var expertCount = normalizeCount(s.expert_count, expertRefs.length);
        var caseCount = normalizeCount(s.case_count, toArray(facets.cases).length);
        var countryCount = normalizeCount(s.country_count, toArray(facets.countries).length);
        var languageCount = normalizeCount(s.language_count, toArray(facets.languages).length);
        var price = normalizeCount(s.starting_price || s.price, 0);
        var url = normalizeCardUrl(s.url || ('/solutions/' + (s.slug || '')), '#');
        var iconName = s.icon || (opts.serviceIconMap && opts.serviceIconMap[firstService]) || 'settings';
        var domainRelation = buildSingleLabelOrCount(domains, domainCount, opts.domainLabel, 'domain', 'domains', 'entity-chip-wide');
        var serviceRelation = buildSingleLabelOrCount(serviceRefs, serviceCount, opts.serviceLabel, 'service', 'services', 'entity-chip-wide');
        var scopeRelation = buildSingleLabelOrCount(scopeRefs, scopeCount, opts.scopeLabel, 'scope', 'scopes', 'entity-chip-wide');
        var industryRelation = buildSingleLabelOrCount(industryRefs, industryCount, opts.industryLabel, 'industry', 'industries', 'entity-chip-compact');
        var expertRelation = buildSingleLabelOrCount(expertRefs, expertCount, opts.expertLabel, 'expert', 'experts', 'entity-chip-wide');
        var metricTags = [];
        if (domainRelation.countChip) metricTags.push(domainRelation.countChip);
        if (serviceRelation.countChip) metricTags.push(serviceRelation.countChip);
        if (scopeRelation.countChip) metricTags.push(scopeRelation.countChip);
        if (industryRelation.countChip) metricTags.push(industryRelation.countChip);
        if (expertRelation.countChip) metricTags.push(expertRelation.countChip);
        if (caseCount > 0) metricTags.push(buildCountChip(pluralize(caseCount, 'case', 'cases')));
        if (countryCount > 0) metricTags.push(buildCountChip(pluralize(countryCount, 'country', 'countries')));
        if (languageCount > 0) metricTags.push(buildCountChip(pluralize(languageCount, 'language', 'languages')));

        return '<a href="' + url + '" class="solution-card entity-card entity-card-padded">' +
            '<div class="service-card-header"><div class="entity-card-title">' + esc(s.menu || s.title) + '</div>' +
            '<div class="service-card-icon" style="--icon-url: url(' + mediaIconUrl(iconName) + ')"></div></div>' +
            '<p class="entity-card-copy">' + esc(s.description || '') + '</p>' +
            buildExactRows([
                buildExactRow([domainRelation.exactChip], 'solution-chip-row solution-chip-row-domains'),
                buildExactRow([
                    serviceRelation.exactChip,
                    scopeRelation.exactChip,
                    industryRelation.exactChip
                ], 'solution-chip-row solution-chip-row-primary'),
                buildExactRow([expertRelation.exactChip], 'solution-chip-row solution-chip-row-experts')
            ]) +
            buildCountRow(metricTags, 'solution-card-meta') +
            '<div class="solution-card-footer entity-card-footer">' +
            (price > 0 ? '<span class="solution-price entity-card-price">From $' + Math.round(price) + '</span>' : '<span></span>') +
            '<span class="solution-cta entity-card-cta">Explore</span></div></a>';
    }

    window.CMSCards.renderSolutionCard = renderSolutionCard;
    window.CMSCards.mediaUrl = mediaUrl;
    window.CMSCards.mediaIconUrl = mediaIconUrl;
    window.CMSCards.cardUrl = normalizeCardUrl;

    /* === Position Card === */
    function normalizePositionCardData(p) {
        var facets = p.facets || {};
        var serviceRefs = toArray(
            p.services || facets.services ||
            (p.relationships && p.relationships.services) || []
        );
        if (!serviceRefs.length && p.service) {
            serviceRefs = [p.service];
        }
        var countryRefs = toArray(
            p.countries || facets.countries ||
            (p.relationships && p.relationships.countries) || []
        );
        var languageRefs = toArray(
            p.languages || facets.languages ||
            (p.relationships && p.relationships.languages) || []
        );
        var industryRefs = toArray(
            p.industries || facets.industries ||
            (p.relationships && p.relationships.industries) || []
        );
        var expertRefs = toArray(
            facets.experts ||
            p.experts ||
            (p.relationships && p.relationships.experts) || []
        );

        return {
            slug: p.slug || '',
            url: normalizeCardUrl(p.url || ('/positions/' + (p.slug || '')), '#'),
            title: p.title || p.menu || p.slug || 'Position',
            description: p.description || '',
            expert_count: normalizeCount(p.expert_count, expertRefs.length),
            service_count: normalizeCount(p.service_count, serviceRefs.length),
            industry_count: normalizeCount(p.industry_count, industryRefs.length),
            services: serviceRefs,
            experts: expertRefs,
            countries: countryRefs,
            languages: languageRefs,
            industries: industryRefs,
            hiring: p.hiring || {}
        };
    }

    function renderPositionCard(p, options) {
        var opts = options || {};
        var d = normalizePositionCardData(p || {});

        var hiringBadge = '';
        var hiringStatus = d.hiring && d.hiring.status;
        if (hiringStatus === 'active') {
            hiringBadge = '<div class="position-hiring-badge position-hiring-active">Actively Hiring</div>';
        } else if (hiringStatus === 'moderate') {
            hiringBadge = '<div class="position-hiring-badge position-hiring-moderate">Moderate Hiring</div>';
        } else if (hiringStatus === 'paused') {
            hiringBadge = '<div class="position-hiring-badge position-hiring-paused">Hiring Paused</div>';
        }

        var metricTags = [];
        var serviceRelation = buildSingleLabelOrCount(d.services, d.service_count, opts.serviceLabel, 'service', 'services', 'entity-chip-wide');
        var industryRelation = buildSingleLabelOrCount(d.industries, d.industry_count, opts.industryLabel, 'industry', 'industries', 'entity-chip-compact');
        var expertRelation = buildSingleLabelOrCount(d.experts, d.expert_count, opts.expertLabel, 'expert', 'experts', 'entity-chip-wide');
        if (serviceRelation.countChip) metricTags.push(serviceRelation.countChip);
        if (industryRelation.countChip) metricTags.push(industryRelation.countChip);
        if (expertRelation.countChip) metricTags.push(expertRelation.countChip);

        var countries = d.countries.map(function(c) { return buildCountryChip(c, opts); }).filter(Boolean);

        var languages = d.languages.map(function(l) {
            return buildLanguageChip(l, opts);
        }).filter(Boolean);

        var exactRows = buildExactRows([
            buildExactRow([serviceRelation.exactChip], 'position-tag-row position-tag-row-services'),
            buildExactRow([industryRelation.exactChip], 'position-tag-row position-tag-row-industries'),
            buildExactRow([expertRelation.exactChip], 'position-tag-row position-tag-row-experts'),
            buildExactRow(countries, 'position-tag-row position-tag-row-countries'),
            buildExactRow(languages, 'position-tag-row position-tag-row-languages')
        ]);
        var metricRow = buildCountRow(metricTags, 'position-tag-row position-tag-row-metrics');

        return '<a href="' + d.url + '" class="position-card entity-card entity-card-padded">' +
            hiringBadge +
            '<div class="entity-card-title">' + esc(d.title) + '</div>' +
            (d.description ? '<p class="position-summary entity-card-copy">' + esc(d.description) + '</p>' : '') +
            exactRows +
            metricRow +
            '<div class="position-card-footer entity-card-footer entity-card-footer-end">' +
            '<span class="position-cta entity-card-cta">View Position</span>' +
            '</div></a>';
    }

    window.CMSCards.renderPositionCard = renderPositionCard;
    window.CMSCards.fitExactChipRows = fitExactChipRows;
    document.dispatchEvent(new Event('cmscards:ready'));

    function runExactChipFit() {
        if (!window.CMSCards || typeof window.CMSCards.fitExactChipRows !== 'function') return;
        window.CMSCards.fitExactChipRows(document);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runExactChipFit, { once: true });
    } else {
        runExactChipFit();
    }

    var resizeTimer = null;
    window.addEventListener('resize', function() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(runExactChipFit, 120);
    });
})();
