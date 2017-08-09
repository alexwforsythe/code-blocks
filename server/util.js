/**
 * @returns {{language: string, theme: string, noBackground: string}}
 * The user's preferences, if they exist.
 */
function getUserPrefs() {
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
 * @returns {Array.<string>} a list of all theme names
 */
function getThemes() {
    var scriptCache = CacheService.getScriptCache();
    var html = HtmlService.createHtmlOutputFromFile('styles.html');
    var xml = XmlService.parse(html.getContent());
    var root = xml.getRootElement();
    var styles = root.getChildren();

    var defaultCss = scriptCache.get(constants.themes['default']);
    // todo: remove http check once cache is flushed after next deployment
    if (defaultCss && defaultCss.slice(0, 4) !== 'http') {
        // themes are still cached
        return styles.map(function getName(style) {
            var filename = style.getAttribute('id').getValue();
            return filename.slice(0, -'.css'.length);
        });
    }

    return styles.map(function cacheCss(style) {
        var filename = style.getAttribute('id').getValue();
        var themeName = filename.slice(0, -'.css'.length);
        var css = style.getText();

        try {
            scriptCache.put(themeName, css, constants.cache.ttl);
        } catch (e) {
            logError('Failed to cache CSS', e);
        }

        return themeName;
    });
}

/**
 * Retrieves a theme's CSS, caching it if necessary.
 *
 * @param {string} themeName
 * @returns {string} the theme CSS
 */
function getThemeCss(themeName) {
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
