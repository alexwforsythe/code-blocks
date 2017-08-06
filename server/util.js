/**
 * Gets the stored user preferences, if they exist.
 *
 * @returns {{language: string, theme: string, noBackground: string}}
 * The user's preferences, if they exist.
 */
function getPreferences() {
    try {
        var userProperties = PropertiesService.getUserProperties();
    } catch (err) {
        logError(constants.errors.getUserPreferences, err);
        throw constants.errors.getUserPreferences;
    }

    return {
        language: userProperties.getProperty(constants.props.language),
        theme: userProperties.getProperty(constants.props.theme),
        noBackground: userProperties.getProperty(constants.props.noBackground)
    };
}

/**
 * todo: doc
 * todo: to constants
 *
 * button function to load themes into cache
 *
 * @returns {string[]} a list of all theme names
 */
function getThemes() {
    var scriptCache = CacheService.getScriptCache();
    var html = HtmlService.createHtmlOutputFromFile('styles.html');
    var xml = XmlService.parse(html.getContent());
    var root = xml.getRootElement();
    var styles = root.getChildren();

    var themesAreCached = scriptCache.get(constants.cache.themesCachedKey);
    if (themesAreCached === 'true') {
        return styles.map(function getName(style) {
            var filename = style.getAttribute('id').getValue();
            return filename.slice(0, -'.css'.length);
        });
    }

    var themes = styles.map(function cacheCss(style) {
        var filename = style.getAttribute('id').getValue();
        var themeName = filename.slice(0, -'.css'.length);

        var css = scriptCache.get(themeName);
        if (css === null) {
            css = style.getText();
            try {
                scriptCache.put(themeName, css, constants.cache.ttl);
            } catch (e) {
                logError('Failed to cache CSS', e);
            }
        }

        return themeName;
    });

    scriptCache.put(
        constants.cache.themesCachedKey, 'true',
        constants.cache.ttl - 10);

    return themes;
}

/**
 * Retrieves a theme's CSS, caching it if necessary.
 *
 * @param themeName
 * @returns {string} the theme CSS
 */
function getTheme(themeName) {
    var scriptCache = CacheService.getScriptCache();

    var css = scriptCache.get(themeName);
    if (css === null) {
        // reload and cache the themes
        getThemes();

        css = scriptCache.get(themeName);
        if (css === null) {
            throw constants.errors.themeNotFound;
        }
    }

    return css;
}

function logError(msg, err) {
    Logger.log(msg + ': %s', err);
}
