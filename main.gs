/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

//noinspection JSUnusedLocalSymbols
/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
    DocumentApp.getUi().createAddonMenu()
        .addItem('Start', 'showSidebar')
        .addToUi();
}

//noinspection JSUnusedGlobalSymbols
/**
 * Runs when the add-on is installed.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
    onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
    var ui = HtmlService.createTemplateFromFile('sidebar').evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setTitle(config.title);

    DocumentApp.getUi().showSidebar(ui);
}

/**
 * todo
 *
 * @returns {{themes: string[], prefs: {language: string, theme: string, noBackground: string}}}
 */
function getPreferencesAndThemes() {
    return {
        themes: getThemes(),
        prefs: getPreferences()
    };
}

/**
 * Gets the stored user preferences, if they exist.
 *
 * @returns {{language: string, theme: string, noBackground: string}} The user's preferences, if they exist.
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
 * todo: button function to get themes from cdnjs
 *
 * @returns {string[]}
 */
function getThemes() {
    // first, try to get urls from the script cache
    var scriptCache = CacheService.getScriptCache();
    var themeUrls = scriptCache.get(constants.cache.themeUrlsKey);

    if (themeUrls) {
        themeUrls = JSON.parse(themeUrls);
        // todo: necessary?
        cacheDefaultThemeCSS(themeUrls);
        return Object.keys(themeUrls);
    }

    getThemesFromCdnjs(function onGetThemes(err, themeUrls) {
        if (err) {
            logError(constants.errors.getThemes, err);
            throw constants.errors.getThemes;
        }

        // cache the theme urls
        // data in the cache is stored as a string
        scriptCache.put(
            constants.cache.themeUrlsKey,
            JSON.stringify(themeUrls),
            config.cache.defaultTtl
        );

        // cache each url individually for faster lookup
        scriptCache.putAll(themeUrls, config.cache.defaultTtl + 10);
        cacheDefaultThemeCSS(themeUrls);

        return Object.keys(themeUrls);
    });
}

function cacheDefaultThemeCSS(themeUrls) {
    // cache default theme, because it contains the base css
    var defaultUrl = themeUrls[constants.themes.default];
    if (defaultUrl) {
        getThemeStyle(defaultUrl);
    }
}

function getThemesFromCdnjs(callback) {
    try {
        var resp = UrlFetchApp.fetch(config.hljs.urls.cdnjsLib);
    } catch (err) {
        logError(constants.errors.getThemes, err);
        return getThemesFromGh(next);
    }

    var respJson = resp.getContentText();
    var respData = JSON.parse(respJson);
    var assets = respData['assets'];

    // get the latest version in assets
    var version = config.hljs.useLatest ?
        respData.version :
        config.hljs.defaultVersion;
    var hasLatest = assets.some(function matches(asset) {
        return asset.version === version;
    });
    var latest = hasLatest ? version : assets[0];

    var cssPaths = latest.files.filter(function isCssPath(file) {
        return file.indexOf('styles') === 0 &&
            file.indexOf('.css', file.length - 4) !== -1;
    });

    var themeUrls = {};
    // todo: use map?
    cssPaths.forEach(function setThemeUrl(file) {
        var theme = file.split('styles/').pop().split('.')[0];
        if (theme) {
            themeUrls[theme] = buildThemeUrl(theme, version);
        }
    });

    return callback(null, themeUrls);
}

function getThemesFromGh(callback) {
    try {
        var resp = UrlFetchApp.fetch(config.hljs.urls.ghThemes);
    } catch (err) {
        logError(constants.errors.getThemes, err);
        callback(constants.errors.getThemes);
    }

    var respJson = resp.getContentText();
    var respData = JSON.parse(respJson);

    var cssEntries = respData.filter(function isCssEntry(entry) {
        return entry.type === 'file' &&
            entry.name &&
            entry.name.indexOf('.css', file.length - 4) !== -1;
    });

    var themeUrls = {};
    // todo: use map?
    cssEntries.forEach(function setThemeUrl(entry) {
        var theme = entry.name.split('.')[0];
        if (theme) {
            themeUrls[theme] = buildThemeUrl(theme);
        }
    });

    return callback(null, themeUrls);
}

/**
 * Gets the user-selected text and translates it from the origin language to the
 * destination language. The languages are notated by their two-letter short
 * form. For example, English is 'en', and Spanish is 'es'. The origin language
 * may be specified as an empty string to indicate that Google Translate should
 * auto-detect the language.
 *
 * @param {string} origin The two-letter short form for the origin language.
 * @param {string} dest The two-letter short form for the destination language.
 * @param {boolean} savePrefs Whether to save the origin and destination
 *     language preferences.
 * @return {Object} Object containing the original text and the result of the
 *     translation.
 */

// noinspection JSUnusedGlobalSymbols
/**
 * todo
 *
 * @param language
 * @param theme
 * @param noBackground
 * @returns {{css: string}}
 */
function getSelectionAndThemeStyle(language, theme, noBackground) {
    // save user preferences
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(constants.props.language, language);
    userProperties.setProperty(constants.props.theme, theme);
    userProperties.setProperty(constants.props.noBackground, noBackground);

    // prepend default css for all themes
    var defaultThemeUrl = getThemeUrl(constants.themes.default);
    var css = getThemeStyle(defaultThemeUrl);

    if (theme !== constants.themes.default) {
        var themeUrl = getThemeUrl(theme);
        css += getThemeStyle(themeUrl);
    }

    var text = getSelectedText();
    var selection = text.join('\n');

    return {
        css: css,
        selection: selection
    };
}

function getThemeUrl(theme) {
    var scriptCache = CacheService.getScriptCache();
    var themeUrl = scriptCache.get(theme);

    if (!themeUrl) {
        // themeUrls might have expired, try fetching them again
        getThemes();
        themeUrl = scriptCache.get(theme);
    }

    if (!themeUrl) {
        throw constants.errors.themeNotFound;
    }

    return themeUrl;
}

// gets and caches theme style
function getThemeStyle(themeUrl) {
    var scriptCache = CacheService.getScriptCache();
    var css = scriptCache.get(themeUrl);

    if (!css) {
        var resp = UrlFetchApp.fetch(themeUrl);
        css = resp.getContentText();

        // try to cache the css
        try {
            scriptCache.put(themeUrl, css);
        } catch (err) {
            logError(constants.errors.cacheCss, err);
        }
    }

    return css;
}

/**
 * Replaces the text of the current selection with the provided text, or
 * inserts text at the current cursor location. (There will always be either
 * a selection or a cursor.) If multiple elements are selected, only inserts the
 * translated text in the first element that can contain text and removes the
 * other elements.
 *
 * @param {string} html The HTML with which to replace the current selection.
 */

// noinspection JSUnusedGlobalSymbols
/**
 * todo
 *
 * @param html
 * @param noBackground
 * @returns {undefined}
 */
function insertCode(html, noBackground) {
    try {
        // save user preferences
        var userProps = PropertiesService.getUserProperties();
        userProps.setProperty(constants.props.noBackground, noBackground);

        var selection = DocumentApp.getActiveDocument().getSelection();
        if (selection) {
            replaceSelection(selection, html, noBackground);
        } else {
            insertAtCursor(html, noBackground);
        }
    } catch (err) {
        logError(constants.errors.insert, err);
        throw constants.errors.insert;
    }
}

function buildThemeUrl(theme, version) {
    return version ?
        config.hljs.urls.cdnjsStyles + version + '/styles/' + theme + '.min.css' :
        config.hljs.defaultVersion;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Helper function that puts external JS / CSS into the HTML file.
 * @param {string} filename
 * @returns {string}
 */
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function logError(msg, err) {
    Logger.log(msg + ': %s', err);
}
