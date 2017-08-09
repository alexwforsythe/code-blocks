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
        .setTitle(constants.title);

    DocumentApp.getUi().showSidebar(ui);
}

// noinspection JSUnusedGlobalSymbols
/**
 *
 * @returns {{
 *   themes: string[],
 *   prefs: {language: string, theme: string, noBackground: string}
 * }}
 */
function getThemesAndUserPrefs() {
    return {
        themes: getThemes(),
        prefs: getUserPrefs()
    };
}

// noinspection JSUnusedGlobalSymbols
/**
 * todo:
 * Gets the user-selected text and translates it from the origin language to the
 * destination language. The languages are notated by their two-letter short
 * form. For example, English is 'en', and Spanish is 'es'. The origin language
 * may be specified as an empty string to indicate that Google Translate should
 * auto-detect the language.
 *
 * @param {string} language
 * @param {string} theme
 * @param {boolean} noBackground
 * @returns {{css: string, selection: string}}
 */
function getSelectionAndThemeCss(language, theme, noBackground) {
    // save user preferences
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(constants.props.language, language);
    userProperties.setProperty(constants.props.theme, theme);
    userProperties.setProperty(constants.props.noBackground, noBackground);

    // prepend default css to the theme
    var css = getThemeCss(constants.themes['default']);
    if (theme !== constants.themes['default']) {
        css += getThemeCss(theme);
    }

    var text = getSelectedText();
    var selection = text.join('\n');

    return {
        css: css,
        selection: selection
    };
}

// noinspection JSUnusedGlobalSymbols
/**
 *
 * Replaces the text of the current selection with the provided block, or
 * inserts the block at the current cursor location. (There will always be
 * either a selection or a cursor.) If multiple elements are selected, only
 * inserts the block in the first element that can contain text and removes the
 * other elements.
 *
 * @param {string} html the HTML to replace the current selection with
 * @param {boolean} noBackground
 */
function insertBlock(html, noBackground) {
    try {
        // save user preferences
        var userProps = PropertiesService.getUserProperties();
        userProps.setProperty(constants.props.noBackground, noBackground);

        var selection = DocumentApp.getActiveDocument().getSelection();
        selection ?
            replaceSelection(selection, html, noBackground) :
            insertAtCursor(html, noBackground);
    } catch (err) {
        logError(constants.errors.insert, err);
        throw constants.errors.insert;
    }
}

// noinspection JSUnusedGlobalSymbols
/**
 * Helper function that puts external JS / CSS into the HTML file.
 *
 * @param {string} filename
 * @returns {string} file contents
 */
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
