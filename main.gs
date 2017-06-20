// add-on title
const TITLE = 'Code Blocks';

// highlight.js config
const HLJS_USE_LATEST = false;
const HLJS_DEFAULT_VERSION = '9.7.0';
const HLJS_CDNJS_URL = 'https://api.cdnjs.com/libraries/highlight.js';
const HLJS_CDN_URL_PRE = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/';
const HLJS_GH_BUILD_URL = 'https://api.github.com/repos/highlightjs/cdn-release/contents/build';
const HLJS_GH_THEMES_URL = HLJS_GH_BUILD_URL + '/styles?ref=master';
const THEME_DEFAULT = 'default';

// user preferences
const PROPERTY_LANGUAGE = 'language';
const PROPERTY_THEME = 'theme';
const PROPERTY_NO_BACKGROUND = 'no_background';

// cache config
const DEFAULT_TTL = 3600;
const KEY_THEME_URLS = 'theme_urls';

// errors
const ERR_FAILED_TO_INSERT = "Can't insert here.";
const ERR_GETTING_USER_PREFERENCES = "Couldn't get user preferences.";
const ERR_GETTING_THEMES = "Couldn't get themes.";
const ERR_THEME_NOT_FOUND = "Couldn't get theme.";

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
        .setTitle(TITLE);

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
        return {
            language: userProperties.getProperty(PROPERTY_LANGUAGE),
            theme: userProperties.getProperty(PROPERTY_THEME),
            noBackground: userProperties.getProperty(PROPERTY_NO_BACKGROUND)
        };
    } catch (e) {
        logError(ERR_GETTING_USER_PREFERENCES, e);
        throw ERR_GETTING_USER_PREFERENCES;
    }
}

/**
 * todo: button function to get themes from cdnjs
 *
 * @returns {string[]}
 */
function getThemes() {
    try {
        return execute();
    } catch (e) {
        logError(ERR_GETTING_THEMES, e);
        throw ERR_GETTING_THEMES;
    }

    function execute() {
        // try to get urls from cache
        var scriptCache = CacheService.getScriptCache();
        // scriptCache.remove(KEY_THEME_URLS);
        var themeUrls = scriptCache.get(KEY_THEME_URLS);

        if (themeUrls !== null) {
            // data in the cache must be stored as a string
            themeUrls = JSON.parse(themeUrls);
        } else {
            // try cdnjs
            try {
                themeUrls = getThemesFromCdnjs();
            } catch (e) {
                logError(ERR_GETTING_THEMES, e);
                // try github
                try {
                    themeUrls = getThemesFromGh();
                } catch (e2) {
                    logError(ERR_GETTING_THEMES, e2);
                    throw ERR_GETTING_THEMES;
                }
            }

            // cache the theme urls
            scriptCache.put(KEY_THEME_URLS, JSON.stringify(themeUrls), DEFAULT_TTL);

            // cache each url individually for faster lookup
            scriptCache.putAll(themeUrls, DEFAULT_TTL + 10);
        }

        // cache default theme, because it contains the base css
        var defaultUrl = themeUrls[THEME_DEFAULT];
        if (defaultUrl !== undefined) {
            getThemeStyle(defaultUrl);
        }

        return Object.keys(themeUrls);
    }
}

function getThemesFromCdnjs() {
    var r = UrlFetchApp.fetch(HLJS_CDNJS_URL);
    var jsn = r.getContentText();
    var data = JSON.parse(jsn);

    var version;
    if (HLJS_USE_LATEST === true) {
        version = data.version;
    } else {
        version = HLJS_DEFAULT_VERSION;
    }
    var assets = data.assets;
    var latest = assets[0];
    for (var i = 1; i < assets.length; i++) {
        if (assets[i].version === version) {
            latest = assets[i];
            break;
        }
    }
    var files = latest.files;

    var themeUrls = {};
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.indexOf('styles') === 0 &&
            file.indexOf('.css', file.length - 4) !== -1) {
            var theme = file.split('styles/').pop().split('.')[0];
            if (theme !== undefined) {
                themeUrls[theme] = buildThemeUrl(theme, version);
            }
        }
    }

    return themeUrls;
}

function getThemesFromGh() {
    var r = UrlFetchApp.fetch(HLJS_GH_THEMES_URL);
    var jsn = r.getContentText();
    var data = JSON.parse(jsn);

    var result = {};
    for (var i = 0; i < data.length; i++) {
        var entry = data[i];
        if (entry.type === 'file' &&
            entry.name !== undefined &&
            entry.name.indexOf('.css', file.length - 4) !== -1) {
            var theme = entry.name.split('.')[0];
            // to function
            if (theme !== undefined) {
                result[theme] = buildThemeUrl(theme);
            }
        }
    }

    return result;
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
    userProperties.setProperty(PROPERTY_LANGUAGE, language);
    userProperties.setProperty(PROPERTY_THEME, theme);
    userProperties.setProperty(PROPERTY_NO_BACKGROUND, noBackground);

    var result = {'css': ''};
    var scriptCache = CacheService.getScriptCache();

    // prepend default css for other themes
    var themeUrl;
    if (theme !== THEME_DEFAULT) {
        themeUrl = getThemeUrl(THEME_DEFAULT);
        result.css += getThemeStyle(themeUrl);
    }
    themeUrl = getThemeUrl(theme);
    result.css = getThemeStyle(themeUrl);

    var text = getSelectedText();
    result['selection'] = text.join('\n');

    return result;
}

function getThemeUrl(theme) {
    var scriptCache = CacheService.getScriptCache();
    var themeUrl = scriptCache.get(theme);
    if (themeUrl !== null) {
        return themeUrl;
    }

    // themeUrls might have expired, try fetching them again
    getThemes();

    // try looking it up one more time
    themeUrl = scriptCache.get(theme);
    if (themeUrl !== null) {
        return themeUrl;
    }

    throw ERR_THEME_NOT_FOUND;
}

// gets and caches theme style
function getThemeStyle(themeUrl) {
    var scriptCache = CacheService.getScriptCache();
    // todo: debug?
//  var css = scriptCache.get(themeUrl);
    var css = null;
    if (css === null) {
        var r = UrlFetchApp.fetch(themeUrl);
        css = r.getContentText();

        // try to cache the css
        try {
            scriptCache.put(themeUrl, css);
        } catch (e) {
            logError('Failed to cache CSS', e);
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

/**
 * todo
 *
 * @param html
 * @param noBackground
 * @returns {undefined}
 */
function insertCode(html, noBackground) {
    try {
        return execute(html, noBackground);
    } catch (e) {
        logError(ERR_FAILED_TO_INSERT, e);
        throw ERR_FAILED_TO_INSERT;
    }

    function execute(html, noBackground) {
        // save user preferences
        var userProperties = PropertiesService.getUserProperties();
        userProperties.setProperty(userProperties.noBackground, noBackground);

        var selection = DocumentApp.getActiveDocument().getSelection();
        if (selection) {
            replaceSelection(selection, html, noBackground);
        } else {
            insertAtCursor(html, noBackground);
        }
    }
}

function buildThemeUrl(theme, version) {
    if (version === undefined) {
        version = HLJS_DEFAULT_VERSION;
    }
    return HLJS_CDN_URL_PRE + version + '/styles/' + theme + '.min.css';
}

// Helper function that puts external JS / CSS into the HTML file.
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function logError(msg, error) {
    Logger.log(msg + ': %s', error);
}
