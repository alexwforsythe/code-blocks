var title = 'Code Blocks';

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
 * @param {object} e The event parameter for a simple onInstall trigger.
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
        .setTitle(title);

    DocumentApp.getUi().showSidebar(ui);
}

// noinspection JSUnusedGlobalSymbols
/**
 * todo: doc
 * todo: find a way to document exposed functions vs lib functions
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
 * @returns {string[]}
 */
function getThemes() {
    var cache = CacheService.getScriptCache();
    var html = HtmlService.createHtmlOutputFromFile('styles.html');
    var xml = XmlService.parse(html.getContent());
    var root = xml.getRootElement();
    var styles = root.getChildren();

    return styles.map(function cacheCss(style) {
        var filename = style.getAttribute('id').getValue();
        var themeName = filename.slice(0, -'.css'.length);
        var css = style.getText();

        try {
            cache.put(themeName, css, constants.defaultTtl);
        } catch (e) {
            logError('Failed to cache CSS', e);
        }

        return themeName;
    });
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
 * todo: doc
 *
 * @param language
 * @param theme
 * @param noBackground
 * @returns {{css: string, selection: string}}
 */
function getSelectionAndThemeStyle(language, theme, noBackground) {
    // save user preferences
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(constants.props.language, language);
    userProperties.setProperty(constants.props.theme, theme);
    userProperties.setProperty(constants.props.noBackground, noBackground);

    // prepend default css to the theme
    var css = getTheme(constants.themes['default']);
    if (theme !== constants.themes['default']) {
        css += getTheme(theme);
    }

    var text = getSelectedText();
    var selection = text.join('\n');

    return {
        css: css,
        selection: selection
    };
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
 * todo: doc
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

// noinspection JSUnusedGlobalSymbols
/**
 * Helper function that puts external JS / CSS into the HTML file.
 * @param {string} filename
 * @returns {string} file contents
 */
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function logError(msg, err) {
    Logger.log(msg + ': %s', err);
}
