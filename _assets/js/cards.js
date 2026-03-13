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
            usa: '🇺🇸',
            uk: '🇬🇧',
            germany: '🇩🇪',
            austria: '🇦🇹',
            france: '🇫🇷',
            spain: '🇪🇸',
            italy: '🇮🇹',
            canada: '🇨🇦',
            china: '🇨🇳',
            japan: '🇯🇵',
            russia: '🇷🇺'
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
            title: s.title || s.menu || s.name || s.slug || 'Specialist',
            description: s.description || '',
            role: s.role || '',
            avatar: s.avatar || '',
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
        var metricTags = [];
        if (d.industryCount > 0) {
            metricTags.push('<span class="specialist-tag specialist-tag-count entity-chip entity-chip-count">' + esc(pluralize(d.industryCount, 'industry', 'industries')) + '</span>');
        }
        if (d.caseCount > 0) {
            metricTags.push('<span class="specialist-tag specialist-tag-count entity-chip entity-chip-count">' + esc(pluralize(d.caseCount, 'case', 'cases')) + '</span>');
        }
        var countries = d.countries.map(function(c) {
            var label = resolveLabel(opts.countryLabel, c);
            var flag = resolveCountryFlag(opts.countryFlagMap, c);
            var value = flag || label;
            if (!value) return '';
            var className = 'specialist-tag country entity-chip entity-chip-soft ' + (flag ? 'country-flag entity-chip-flag' : 'country-label');
            return '<span class="' + className + '" title="' + esc(label || defaultLabel(c)) + '">' + esc(value) + '</span>';
        }).filter(Boolean);
        var languages = d.languages.map(function(l) {
            var code = resolveLangCode(opts.langCodeMap, l);
            var label = resolveLabel(opts.languageLabel, l);
            return '<span class="specialist-tag lang entity-chip entity-chip-soft entity-chip-code" title="' + esc(label || defaultLabel(l)) + '">' + esc(code) + '</span>';
        });
        var metricRow = metricTags.length
            ? '<div class="specialist-tag-row specialist-tag-row-metrics">' + metricTags.join('') + '</div>'
            : '';
        var countryRow = countries.length
            ? '<div class="specialist-tag-row specialist-tag-row-countries">' + countries.join('') + '</div>'
            : '';
        var languageRow = languages.length
            ? '<div class="specialist-tag-row specialist-tag-row-languages">' + languages.join('') + '</div>'
            : '';
        var tagsHtml = (metricRow || countryRow || languageRow)
            ? '<div class="specialist-tags">' + metricRow + countryRow + languageRow + '</div>'
            : '';

        return '<a href="' + d.url + '" class="specialist-card entity-card entity-card-padded">' +
            '<div class="specialist-card-top">' +
            '<div class="specialist-info"><div class="entity-card-title">' + esc(d.title) + '</div>' +
            (d.role ? '<div class="specialist-role type-meta">' + esc(d.role) + '</div>' : '') +
            '</div>' +
            avatarHtml +
            '</div>' +
            summary +
            tagsHtml +
            '<div class="specialist-card-footer entity-card-footer">' +
            (d.serviceCount > 0 ? '<span class="specialist-service-count type-meta">' + esc(pluralize(d.serviceCount, 'service', 'services')) + '</span>' : '<span></span>') +
            '<span class="specialist-cta entity-card-cta">View Profile →</span>' +
            '</div>' +
            '</a>';
    }

    window.CMSCards = window.CMSCards || {};
    window.CMSCards.renderSpecialistCard = renderSpecialistCard;

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
            metricTags.push('<span class="position-tag position-tag-count entity-chip entity-chip-count">' +
                esc(pluralize(d.specialist_count, 'specialist', 'specialists')) + '</span>');
        }
        if (d.service_count > 0) {
            metricTags.push('<span class="position-tag position-tag-count entity-chip entity-chip-count">' +
                esc(pluralize(d.service_count, 'service', 'services')) + '</span>');
        }
        if (d.industry_count > 0) {
            metricTags.push('<span class="position-tag position-tag-count entity-chip entity-chip-count">' +
                esc(pluralize(d.industry_count, 'industry', 'industries')) + '</span>');
        }

        var countries = d.countries.map(function(c) {
            var label = resolveLabel(opts.countryLabel, c);
            var flag = resolveCountryFlag(opts.countryFlagMap, c);
            var value = flag || label;
            if (!value) return '';
            var className = 'position-tag country entity-chip entity-chip-soft ' + (flag ? 'country-flag entity-chip-flag' : 'country-label');
            return '<span class="' + className + '" title="' + esc(label || defaultLabel(c)) + '">' + esc(value) + '</span>';
        }).filter(Boolean);

        var languages = d.languages.map(function(l) {
            var code = resolveLangCode(opts.langCodeMap, l);
            var label = resolveLabel(opts.languageLabel, l);
            return '<span class="position-tag lang entity-chip entity-chip-soft entity-chip-code" title="' + esc(label || defaultLabel(l)) + '">' + esc(code) + '</span>';
        });

        var metricRow = metricTags.length
            ? '<div class="position-tag-row position-tag-row-metrics">' + metricTags.join('') + '</div>'
            : '';
        var countryRow = countries.length
            ? '<div class="position-tag-row position-tag-row-countries">' + countries.join('') + '</div>'
            : '';
        var languageRow = languages.length
            ? '<div class="position-tag-row position-tag-row-languages">' + languages.join('') + '</div>'
            : '';
        var tagsHtml = (metricRow || countryRow || languageRow)
            ? '<div class="position-tags">' + metricRow + countryRow + languageRow + '</div>'
            : '';

        return '<a href="' + d.url + '" class="position-card entity-card entity-card-padded">' +
            hiringBadge +
            '<div class="entity-card-title">' + esc(d.title) + '</div>' +
            (d.description ? '<p class="position-summary entity-card-copy">' + esc(d.description) + '</p>' : '') +
            tagsHtml +
            '<div class="position-card-footer entity-card-footer entity-card-footer-end">' +
            '<span class="position-cta entity-card-cta">View Position →</span>' +
            '</div></a>';
    }

    window.CMSCards.renderPositionCard = renderPositionCard;
    document.dispatchEvent(new Event('cmscards:ready'));
})();
