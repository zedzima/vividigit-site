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
            facets.categories ||
            (s.relationships && s.relationships.services) ||
            []
        );
        var industryRefs = toArray(s.industries || facets.industries || (s.tags && s.tags.industries) || []);
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
            avatar: s.avatar || ((s.config && s.config.avatar) || ''),
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
            ? '<p class="specialist-summary">' + esc(d.description) + '</p>'
            : '';
        var metricTags = [];
        if (d.industryCount > 0) {
            metricTags.push('<span class="specialist-tag specialist-tag-count">' + esc(pluralize(d.industryCount, 'industry', 'industries')) + '</span>');
        }
        if (d.serviceCount > 0) {
            metricTags.push('<span class="specialist-tag specialist-tag-count">' + esc(pluralize(d.serviceCount, 'service', 'services')) + '</span>');
        }
        var countries = d.countries.map(function(c) {
            var label = resolveLabel(opts.countryLabel, c);
            var flag = resolveCountryFlag(opts.countryFlagMap, c);
            var value = flag || label;
            if (!value) return '';
            var className = 'specialist-tag country ' + (flag ? 'country-flag' : 'country-label');
            return '<span class="' + className + '" title="' + esc(label || defaultLabel(c)) + '">' + esc(value) + '</span>';
        }).filter(Boolean);
        var languages = d.languages.map(function(l) {
            var code = resolveLangCode(opts.langCodeMap, l);
            var label = resolveLabel(opts.languageLabel, l);
            return '<span class="specialist-tag lang" title="' + esc(label || defaultLabel(l)) + '">' + esc(code) + '</span>';
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

        return '<a href="' + d.url + '" class="specialist-card">' +
            '<div class="specialist-card-top">' +
            '<div class="specialist-info"><h3>' + esc(d.title) + '</h3>' +
            (d.role ? '<div class="specialist-role">' + esc(d.role) + '</div>' : '') +
            '</div>' +
            avatarHtml +
            '</div>' +
            summary +
            tagsHtml +
            '<div class="specialist-card-footer">' +
            '<span class="specialist-case-count">' + esc(pluralize(d.caseCount, 'case', 'cases')) + '</span>' +
            '<span class="specialist-cta">View Profile →</span>' +
            '</div>' +
            '</a>';
    }

    window.CMSCards = window.CMSCards || {};
    window.CMSCards.renderSpecialistCard = renderSpecialistCard;
})();
