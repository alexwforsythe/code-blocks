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

    return {
        language: userProps.language,
        theme: userProps.theme,
        noBackground: userProps.noBackground
    }
}

/**
 * @param {string} language
 * @param {theme} theme
 * @param {noBackground} noBackground
 */
function setUserPrefs(language, theme, noBackground) {
    PropertiesService.getUserProperties().setProperties({
        language: language,
        theme: theme,
        noBackground: noBackground
    });
}

/**
 * Gets the list of supported color themes, caching their CSS if necessary.
 *
 * @param {GoogleAppsScript.Cache.Cache} scriptCache
 * @returns {Array<string>} a list of all theme names
 */
function loadThemes(scriptCache) {
    var html = HtmlService.createHtmlOutputFromFile('styles.html');
    var xml = XmlService.parse(html.getContent());
    var root = xml.getRootElement();
    var styles = root.getChildren();

    var defaultCss = scriptCache.get(constants.themes.base);
    if (defaultCss) {
        // css is still cached
        return styles.map(function toThemeName(style) {
            return style.getAttribute('id').getValue();
        });
    }

    // need to cache themes
    return styles.map(function toThemeNameAndCacheCss(style) {
        var themeName = style.getAttribute('id').getValue();
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
        loadThemes(scriptCache);

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

function cloneObj(obj) {
    // todo: optimize?
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @param {Array<*>} lhs
 * @param {Array<*>} rhs
 * @returns {boolean}
 */
function arraysAreEqual(lhs, rhs) {
    if (lhs === rhs) {
        return true;
    }
    if (lhs === null || rhs === null) {
        return false;
    }
    if (lhs.length !== rhs.length) {
        return false;
    }

    for (var i = 0; i < lhs.length; i++) {
        if (lhs[i] !== rhs[i]) {
            return false;
        }
    }

    return true;
}

function logError(msg, err) {
    Logger.log(msg + ': %s', err);
}
