/**
 * @returns {object} The user's preferences, if they exist.
 */
function getUserPrefs() {
    try {
        var userProps = PropertiesService.getUserProperties().getProperties();
    } catch (err) {
        logError(constants.errors.getUserPreferences, err);
        throw constants.errors.getUserPreferences;
    }

    return Object.keys(constants.props).reduce(function(result, prop) {
        var propName = constants.props[prop];
        result[propName] = userProps[propName];
        return result;
    }, {});
}

/**
 * Gets the list of supported color themes, caching their CSS if necessary.
 *
 * @param {GoogleAppsScript.Cache.Cache} scriptCache
 * @returns {Array<string>} a list of all theme names
 */
function getThemesFromCache(scriptCache) {
    function toThemeName(style) {
        var filename = style.getAttribute('id').getValue();
        return filename.slice(0, -'.css'.length);
    }

    function toThemeNameAndCacheCss(style) {
        var themeName = toThemeName(style);
        var css = style.getText();

        try {
            scriptCache.put(themeName, css, constants.cache.ttl);
        } catch (e) {
            logError('Failed to cache CSS', e);
        }

        return themeName;
    }

    var html = HtmlService.createHtmlOutputFromFile('styles.html');
    var xml = XmlService.parse(html.getContent());
    var root = xml.getRootElement();
    var styles = root.getChildren();

    var defaultCss = scriptCache.get(constants.themes.base);
    return defaultCss ?
        styles.map(toThemeName) : // css is still cached
        styles.map(toThemeNameAndCacheCss);
}

/**
 * Gets a theme's CSS, caching it if necessary.
 *
 * @param {string} themeName
 * @returns {string} the theme's CSS
 */
function getThemeCss(themeName) {
    var scriptCache = CacheService.getScriptCache();

    var css = getThemeCssFromCache(scriptCache, themeName);
    if (css === null) {
        // reload and cache the theme css
        getThemesFromCache(scriptCache);

        css = getThemeCssFromCache(scriptCache, themeName);
        if (css === null) {
            throw constants.errors.themeNotFound;
        }
    }

    return css;
}

/**
 * Gets a theme's CSS from the provided cache.
 *
 * @param {GoogleAppsScript.Cache.Cache} scriptCache
 * @param {string} themeName
 * @returns {string|null} the theme's CSS if cached, null otherwise
 */
function getThemeCssFromCache(scriptCache, themeName) {
    if (themeName !== constants.themes.base) {
        return scriptCache.get(themeName);
    }

    // prepend default css to the theme
    var cached = scriptCache.getAll([constants.themes.base, themeName]);
    var baseCss = cached[constants.themes.base];
    var css = cached[themeName];

    return (baseCss && css) ? baseCss + css : null;
}

function logError(msg, err) {
    Logger.log(msg + ': %s', err);
}
