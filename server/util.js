/**
 * @returns {Object} The user's preferences, if they exist.
 */
/**
 * @returns {Object} the users's preferences
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
        noBackground: userProps.noBackground === 'true'
    }
}

/**
 * @param {Object} prefs
 * @param {string} prefs.language
 * @param {string} prefs.theme
 * @param {boolean} prefs.noBackground
 */
function saveUserPrefs(prefs) {
    PropertiesService.getUserProperties().setProperties(prefs);
}

/**
 * todo: doc
 *
 * @param {Object} prefs
 * @param {string} prefs.language
 * @param {string} prefs.theme
 * @param {boolean} prefs.noBackground
 * @returns {boolean}
 */
function alreadySaved(prefs) {
    var userPrefs = getUserPrefs();
    return prefs.language === userPrefs.language &&
        prefs.theme === userPrefs.theme &&
        prefs.noBackground === userPrefs.noBackground;
}

/**
 * todo: doc
 *
 * @param {string} selectedText
 * @returns {boolean}
 */
function alreadySelected(selectedText) {
    var userCache = CacheService.getUserCache();
    var previewTextDigest = userCache.get(constants.cache.previewText);
    previewTextDigest = JSON.parse(previewTextDigest);
    if (previewTextDigest) {
        var selectedTextDigest = Utilities.computeDigest(
            Utilities.DigestAlgorithm.MD5, selectedText
        );
    }
    return arraysAreEqual(selectedTextDigest, previewTextDigest);
}

/**
 * todo: doc
 *
 * @param {string} selectedText
 */
function cacheSelection(selectedText) {
    var userCache = CacheService.getUserCache();
    var hash = Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5, selectedText
    );
    var hashVal = JSON.stringify(hash);
    userCache.put(constants.cache.previewText, hashVal);
}

/**
 * Gets the list of supported color themes, caching their CSS if necessary.
 *
 * @param {GoogleAppsScript.Cache.Cache} scriptCache
 * @returns {Array.<string>} a list of all theme names
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
 * @param {*} lhs
 * @param {*} rhs
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
