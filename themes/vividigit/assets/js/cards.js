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

    function normalizeSpecialistCardData(s) {
        var facets = s.facets || {};
        return {
            slug: s.slug || '',
            url: (s.url || ('/team/' + (s.slug || ''))).replace(/^\//, ''),
            title: s.title || s.menu || s.name || s.slug || 'Specialist',
            role: s.role || '',
            avatar: s.avatar || ((s.config && s.config.avatar) || ''),
            projects: s.projects || null,
            industries: toArray(s.industries || facets.industries || (s.tags && s.tags.industries) || []),
            languages: toArray(s.languages || (s.relationships && s.relationships.languages) || []),
            countries: toArray(s.countries || (s.relationships && s.relationships.countries) || []),
            caseCount: (typeof s.case_count === 'number')
                ? s.case_count
                : toArray(facets.cases || s.cases || (s.relationships && s.relationships.cases) || []).length,
            articleCount: (typeof s.article_count === 'number')
                ? s.article_count
                : toArray(facets['blog-posts']).length,
        };
    }

    function renderSpecialistCard(s, options) {
        var opts = options || {};
        var d = normalizeSpecialistCardData(s || {});
        var initials = getInitials(d.title || d.slug);
        var avatarHtml = d.avatar
            ? '<div class="specialist-avatar"><img src="' + esc(d.avatar) + '" alt="' + esc(d.title) + '"></div>'
            : '<div class="specialist-avatar"><div class="specialist-avatar-initials">' + esc(initials) + '</div></div>';

        var industries = d.industries.map(function(i) {
            return '<span class="specialist-tag">' + esc(resolveLabel(opts.industryLabel, i)) + '</span>';
        }).join('');
        var languages = d.languages.map(function(l) {
            return '<span class="specialist-tag lang">' + esc(resolveLangCode(opts.langCodeMap, l)) + '</span>';
        }).join('');
        var countries = d.countries.map(function(c) {
            return '<span class="specialist-tag">' + esc(resolveLabel(opts.countryLabel, c)) + '</span>';
        }).join('');

        return '<a href="' + d.url + '" class="specialist-card">' +
            avatarHtml +
            '<div class="specialist-card-top">' +
            '<div class="specialist-info"><h3>' + esc(d.title) + '</h3>' +
            (d.role ? '<div class="specialist-role">' + esc(d.role) + '</div>' : '') +
            '</div></div>' +
            '<div class="specialist-stats">' +
            (d.projects ? '<div class="specialist-stat"><span class="specialist-stat-value">' + esc(String(d.projects)) + '</span><span class="specialist-stat-label">Projects</span></div>' : '') +
            '<div class="specialist-stat"><span class="specialist-stat-value">' + d.caseCount + '</span><span class="specialist-stat-label">Cases</span></div>' +
            '<div class="specialist-stat"><span class="specialist-stat-value">' + d.articleCount + '</span><span class="specialist-stat-label">Articles</span></div>' +
            '</div>' +
            '<div class="specialist-tags">' +
            (industries ? '<div class="specialist-tag-row">' + industries + '</div>' : '') +
            (languages ? '<div class="specialist-tag-row">' + languages + '</div>' : '') +
            (countries ? '<div class="specialist-tag-row">' + countries + '</div>' : '') +
            '</div>' +
            '<div class="specialist-card-footer">' +
            '<span class="specialist-cta">View Profile →</span></div></a>';
    }

    window.CMSCards = window.CMSCards || {};
    window.CMSCards.renderSpecialistCard = renderSpecialistCard;
})();
