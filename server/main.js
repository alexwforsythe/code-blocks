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
 * @returns {{
 *   themes: Array.<string>,
 *   prefs: {language: string, theme: string, noBackground: string}
 * }}
 */
function getThemesAndUserPrefs() {
    var scriptCache = CacheService.getScriptCache();

    return {
        themes: getThemesFromCache(scriptCache),
        prefs: getUserPrefs()
    };
}

// noinspection JSUnusedGlobalSymbols
/**
 * Saves the user's preferences and gets the user-selected text and CSS for
 * the selected theme.
 *
 * @param {string} language
 * @param {string} theme
 * @param {boolean} noBackground
 * @returns {{selection: string, css: string}}
 */
function getSelectionAndThemeCssForPreview(language, theme, noBackground) {
    // save user preferences
    PropertiesService.getUserProperties().setProperties({
        language: language,
        theme: theme,
        noBackground: noBackground
    });

    var selection = getSelection();
    var selectedText = getSelectedText(selection);
    var css = getThemeCss(theme);

    // hash the selected text and cache it
    var userCache = CacheService.getUserCache();
    var hash = Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5, selectedText
    );
    var hashVal = JSON.stringify(hash);
    userCache.put(constants.cache.previewText, hashVal);

    return {
        selection: selectedText,
        css: css
    };
}

// noinspection JSUnusedGlobalSymbols
/**
 * Replaces the text of the current selection with the provided block, or
 * throws an error if there is no selection. If multiple elements are selected,
 * only inserts the block in the first element that can contain text and
 * removes the other elements.
 *
 * @param {string} html the HTML to replace the current selection with
 * @param {boolean} noBackground
 * @param {GoogleAppsScript.Document.Range|undefined} selection
 */
function insertCode(html, noBackground, selection) {
    if (!selection) {
        selection = getSelection();
    }
    try {
        replaceSelection(selection, html, noBackground)
    } catch (err) {
        logError(constants.errors.insert, err);
        throw constants.errors.insert;
    }
}

// noinspection JSUnusedGlobalSymbols
/**
 * Replaces the text of the current selection with the provided block if the
 * user's selection has not changed since the last preview was rendered, or
 * gets the user-selected text and CSS for the selected theme.
 *
 * @param {string} html the preview HTML
 * @param {string} theme
 * @param {boolean} noBackground
 * @returns {{css: string, selection: string}|undefined}
 */
function insertCodeOrGetSelectionAndThemeCss(html, theme, noBackground) {
    var selection = getSelection();

    var userCache = CacheService.getUserCache();
    var previewTextDigest = userCache.get(constants.cache.previewText);
    previewTextDigest = JSON.parse(previewTextDigest);
    if (previewTextDigest) {
        var selectedText = getSelectedText(selection);
        var selectedTextDigest = Utilities.computeDigest(
            Utilities.DigestAlgorithm.MD5, selectedText
        );
    }

    if (arraysAreEqual(selectedTextDigest, previewTextDigest)) {
        var oldNoBackground = UserProperties.getProperty('noBackground');
        if (noBackground === oldNoBackground) {
            // the selection hasn't changed since the last preview,
            // so we can insert the provided html
            insertCode(html, noBackground, selection);
            return;
        }
    }

    // the selection has changed,
    // so we need to send it to the client to be highlighted
    return {
        selection: getSelectedText(selection),
        css: getThemeCss(theme)
    };
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
