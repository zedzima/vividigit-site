/*
 * Shared card renderers.
 * Single source of truth for specialist card markup.
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

    function formatAuthorName(author) {
        return defaultLabel(author);
    }

    function formatDate(value) {
        if (!value) return '';
        var d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
        scope.querySelectorAll('.entity-card-exact-row').forEach(function(row) {
            var more = row.querySelector('.entity-chip-more');
            if (more) more.remove();

            var chips = Array.from(row.children).filter(function(node) {
                return !node.classList.contains('entity-chip-more');
            });
            chips.forEach(function(chip) { chip.hidden = false; });

            if (chips.length <= 1 || row.scrollWidth <= row.clientWidth + 1) return;

            var hiddenCount = 0;
            var moreChip = document.createElement('span');
            moreChip.className = 'entity-chip entity-chip-more';
            row.appendChild(moreChip);

            for (var i = chips.length - 1; i > 0; i--) {
                hiddenCount += 1;
                chips[i].hidden = true;
                moreChip.textContent = '+' + hiddenCount + ' more';
                if (row.scrollWidth <= row.clientWidth + 1) break;
            }

            if (hiddenCount === 0) {
                moreChip.remove();
            }
        });
    }

    function normalizeSpecialistCardData(s) {
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
            url: (s.url || ('/team/' + (s.slug || ''))).replace(/^\//, ''),
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

    function renderSpecialistCard(s, options) {
        var opts = options || {};
        var d = normalizeSpecialistCardData(s || {});
        var initials = getInitials(d.title || d.slug);
        var avatarHtml = d.avatar
            ? '<div class="specialist-avatar"><img src="' + esc(d.avatar) + '" alt="' + esc(d.title) + '"></div>'
            : '<div class="specialist-avatar"><div class="specialist-avatar-initials">' + esc(initials) + '</div></div>';
        var summary = d.description
            ? '<p class="specialist-summary entity-card-copy">' + esc(d.description) + '</p>'
            : '';
        var serviceTags = d.services.map(function(service) {
            return buildLabelChip(resolveLabel(opts.serviceLabel, service), 'entity-chip-wide');
        }).filter(Boolean);
        var metricTags = [];
        if (d.industryCount > 0) {
            metricTags.push(buildCountChip(pluralize(d.industryCount, 'industry', 'industries')));
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
            buildExactRow(serviceTags, 'specialist-tag-row specialist-tag-row-services'),
            buildExactRow(countries, 'specialist-tag-row specialist-tag-row-countries'),
            buildExactRow(languages, 'specialist-tag-row specialist-tag-row-languages')
        ]);
        var metricRow = buildCountRow(metricTags, 'specialist-tag-row specialist-tag-row-metrics');

        return '<a href="' + d.url + '" class="specialist-card entity-card entity-card-padded">' +
            '<div class="specialist-card-top">' +
            '<div class="specialist-info"><div class="entity-card-title">' + esc(d.title) + '</div>' +
            (d.role ? '<div class="specialist-role type-meta">' + esc(d.role) + '</div>' : '') +
            '</div>' +
            avatarHtml +
            '</div>' +
            summary +
            exactRows +
            metricRow +
            '<div class="specialist-card-footer entity-card-footer">' +
            (d.experienceValue ? '<div class="specialist-experience case-result"><span class="result-value">' + esc(d.experienceValue) + '</span><span class="result-label">Years experience</span></div>' : '<span></span>') +
            '<span class="specialist-cta entity-card-cta">View Profile →</span>' +
            '</div>' +
            '</a>';
    }

    window.CMSCards = window.CMSCards || {};
    window.CMSCards.renderSpecialistCard = renderSpecialistCard;

    function renderScopeCard(s, options) {
        var opts = options || {};
        var facets = s.facets || {};
        var services = toArray(s.services || facets.services || (s.relationships && s.relationships.services) || []);
        var domains = toArray(s.domains || facets.domains || (s.relationships && s.relationships.domains) || []);
        var industryCount = normalizeCount(s.industry_count, toArray(s.industries || facets.industries).length);
        var countryCount = normalizeCount(s.country_count, toArray(s.countries || facets.countries).length);
        var languageCount = normalizeCount(s.language_count, toArray(s.languages || facets.languages).length);
        var taskCount = normalizeCount(s.task_count, 0);
        var price = normalizeCount(s.price || s.from_price, 0);
        var url = (s.url || ('/scopes/' + (s.slug || ''))).replace(/^\//, '');
        var iconName = s.icon || (opts.serviceIconMap && opts.serviceIconMap[services[0]]) || 'settings';
        var domainTags = domains.map(function(domain) {
            return buildLabelChip(resolveLabel(opts.domainLabel, domain), 'entity-chip-wide');
        }).filter(Boolean);
        var serviceTags = services.map(function(service) {
            return buildLabelChip(resolveLabel(opts.serviceLabel, service), 'entity-chip-wide');
        }).filter(Boolean);
        var metricTags = [];
        if (industryCount > 0) metricTags.push(buildCountChip(pluralize(industryCount, 'industry', 'industries')));
        if (countryCount > 0) metricTags.push(buildCountChip(pluralize(countryCount, 'country', 'countries')));
        if (languageCount > 0) metricTags.push(buildCountChip(pluralize(languageCount, 'language', 'languages')));
        if (taskCount > 0) metricTags.push(buildCountChip(pluralize(taskCount, 'task', 'tasks')));

        return '<a href="' + url + '" class="scope-card entity-card entity-card-padded">' +
            '<div class="service-card-header"><div class="entity-card-title">' + esc(s.menu || s.title) + '</div>' +
            '<div class="service-card-icon" style="--icon-url: url(/_media/icons/' + iconName + '.svg)"></div></div>' +
            '<p class="entity-card-copy">' + esc(s.description || '') + '</p>' +
            buildExactRows([
                buildExactRow(domainTags, 'scope-chip-row scope-chip-row-domains'),
                buildExactRow(serviceTags, 'scope-chip-row scope-chip-row-services')
            ]) +
            buildCountRow(metricTags, 'scope-card-meta') +
            '<div class="scope-card-footer entity-card-footer">' +
            (price > 0 ? '<span class="scope-price entity-card-price">From $' + Math.round(price) + '</span>' : '<span></span>') +
            '<span class="scope-cta entity-card-cta">View Scope →</span></div></a>';
    }

    window.CMSCards.renderScopeCard = renderScopeCard;

    function renderCaseCard(s, options) {
        var opts = options || {};
        var facets = s.facets || {};
        var url = (s.url || ('/cases/' + (s.slug || ''))).replace(/^\//, '');
        var title = s.menu || s.title || 'Case';
        var letter = (s.client || title || 'C').charAt(0).toUpperCase();
        var imageHtml = s.image
            ? '<div class="case-image"><img src="' + esc(s.image) + '" alt="' + esc(title) + '" loading="lazy"></div>'
            : '<div class="case-image"><div class="case-image-placeholder"><span>' + esc(letter) + '</span></div></div>';
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
            '<span class="case-cta entity-card-cta">View Case →</span></div></div></a>';
    }

    window.CMSCards.renderCaseCard = renderCaseCard;

    function renderBlogCard(s, options) {
        var opts = options || {};
        var url = (s.url || ('/blog/' + (s.slug || ''))).replace(/^\//, '');
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

        var primaryRowChips = [];
        if (services.length === 1) primaryRowChips.push(buildLabelChip(resolveLabel(opts.serviceLabel, services[0]), 'entity-chip-wide'));
        if (scopes.length === 1) primaryRowChips.push(buildLabelChip(resolveLabel(opts.scopeLabel, scopes[0]), 'entity-chip-wide'));
        if (industries.length === 1) primaryRowChips.push(buildLabelChip(resolveLabel(opts.industryLabel, industries[0]), 'entity-chip-compact'));

        var exactRows = buildExactRows([
            buildExactRow(primaryRowChips, 'blog-card-chip-row blog-card-chip-row-primary'),
            services.length > 1 ? buildExactRow(services.map(function(service) {
                return buildLabelChip(resolveLabel(opts.serviceLabel, service), 'entity-chip-wide');
            }), 'blog-card-chip-row blog-card-chip-row-services') : '',
            scopes.length > 1 ? buildExactRow(scopes.map(function(scope) {
                return buildLabelChip(resolveLabel(opts.scopeLabel, scope), 'entity-chip-wide');
            }), 'blog-card-chip-row blog-card-chip-row-scopes') : '',
            industries.length > 1 ? buildExactRow(industries.map(function(industry) {
                return buildLabelChip(resolveLabel(opts.industryLabel, industry), 'entity-chip-compact');
            }), 'blog-card-chip-row blog-card-chip-row-industries') : '',
            countries.length ? buildExactRow(countries.map(function(country) {
                return buildCountryChip(country, opts);
            }), 'blog-card-chip-row blog-card-chip-row-countries') : '',
            languages.length ? buildExactRow(languages.map(function(language) {
                return buildLanguageChip(language, opts);
            }), 'blog-card-chip-row blog-card-chip-row-languages') : ''
        ]);

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
            '<div class="blog-card-footer entity-card-footer">' +
            (readingTime > 0 ? '<div class="blog-card-reading case-result"><span class="result-value">' + esc(readingTime + ' min') + '</span><span class="result-label">Reading time</span></div>' : '<span></span>') +
            '<span class="blog-card-cta entity-card-cta">Read →</span></div></a>';
    }

    window.CMSCards.renderBlogCard = renderBlogCard;

    function renderSolutionCard(s, options) {
        var opts = options || {};
        var facets = s.facets || {};
        var domains = toArray(s.domains || facets.domains || (s.relationships && s.relationships.domains) || []);
        var firstService = s.service || toArray(facets.services)[0] || '';
        var scope = s.scope || toArray(facets.scopes)[0] || '';
        var industry = s.industry || toArray(facets.industries)[0] || '';
        var specialistCount = normalizeCount(s.specialist_count, toArray(facets.specialists).length);
        var caseCount = normalizeCount(s.case_count, toArray(facets.cases).length);
        var countryCount = normalizeCount(s.country_count, toArray(facets.countries).length);
        var languageCount = normalizeCount(s.language_count, toArray(facets.languages).length);
        var price = normalizeCount(s.starting_price || s.price, 0);
        var url = (s.url || ('/solutions/' + (s.slug || ''))).replace(/^\//, '');
        var iconName = s.icon || (opts.serviceIconMap && opts.serviceIconMap[firstService]) || 'settings';
        var metricTags = [];
        if (specialistCount > 0) metricTags.push(buildCountChip(pluralize(specialistCount, 'expert', 'experts')));
        if (caseCount > 0) metricTags.push(buildCountChip(pluralize(caseCount, 'case', 'cases')));
        if (countryCount > 0) metricTags.push(buildCountChip(pluralize(countryCount, 'country', 'countries')));
        if (languageCount > 0) metricTags.push(buildCountChip(pluralize(languageCount, 'language', 'languages')));
        var domainTags = domains.map(function(domain) {
            return buildLabelChip(resolveLabel(opts.domainLabel, domain), 'entity-chip-wide');
        }).filter(Boolean);

        return '<a href="' + url + '" class="solution-card entity-card entity-card-padded">' +
            '<div class="service-card-header"><div class="entity-card-title">' + esc(s.menu || s.title) + '</div>' +
            '<div class="service-card-icon" style="--icon-url: url(/_media/icons/' + iconName + '.svg)"></div></div>' +
            '<p class="entity-card-copy">' + esc(s.description || '') + '</p>' +
            buildExactRows([
                buildExactRow(domainTags, 'solution-chip-row solution-chip-row-domains'),
                buildExactRow([
                    firstService ? buildLabelChip(resolveLabel(opts.serviceLabel, firstService), 'entity-chip-wide') : '',
                    scope ? buildLabelChip(resolveLabel(opts.scopeLabel, scope), 'entity-chip-wide') : '',
                    industry ? buildLabelChip(resolveLabel(opts.industryLabel, industry), 'entity-chip-compact') : ''
                ], 'solution-chip-row solution-chip-row-primary')
            ]) +
            buildCountRow(metricTags, 'solution-card-meta') +
            '<div class="solution-card-footer entity-card-footer">' +
            (price > 0 ? '<span class="solution-price entity-card-price">From $' + Math.round(price) + '</span>' : '<span></span>') +
            '<span class="solution-cta entity-card-cta">Explore →</span></div></a>';
    }

    window.CMSCards.renderSolutionCard = renderSolutionCard;

    /* === Position Card === */
    function normalizePositionCardData(p) {
        var facets = p.facets || {};
        var serviceRefs = toArray(
            p.services || facets.services ||
            (p.relationships && p.relationships.services) || []
        );
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
        var specialistRefs = toArray(
            facets.specialists || p.specialists ||
            (p.relationships && p.relationships.specialists) || []
        );

        return {
            slug: p.slug || '',
            url: (p.url || ('/positions/' + (p.slug || ''))).replace(/^\//, ''),
            title: p.title || p.menu || p.slug || 'Position',
            description: p.description || '',
            specialist_count: normalizeCount(p.specialist_count, specialistRefs.length),
            service_count: normalizeCount(p.service_count, serviceRefs.length),
            industry_count: normalizeCount(p.industry_count, industryRefs.length),
            services: serviceRefs,
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
        if (d.specialist_count > 0) {
            metricTags.push(buildCountChip(pluralize(d.specialist_count, 'expert', 'experts')));
        }
        if (d.industry_count > 0) {
            metricTags.push(buildCountChip(pluralize(d.industry_count, 'industry', 'industries')));
        }

        var serviceTags = d.services.map(function(service) {
            return buildLabelChip(resolveLabel(opts.serviceLabel, service), 'entity-chip-wide');
        }).filter(Boolean);
        var countries = d.countries.map(function(c) { return buildCountryChip(c, opts); }).filter(Boolean);

        var languages = d.languages.map(function(l) {
            return buildLanguageChip(l, opts);
        }).filter(Boolean);

        var exactRows = buildExactRows([
            buildExactRow(serviceTags, 'position-tag-row position-tag-row-services'),
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
            '<span class="position-cta entity-card-cta">View Position →</span>' +
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
