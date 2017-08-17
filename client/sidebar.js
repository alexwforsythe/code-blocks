'use strict';

var $ = require('jquery');
var juice = require('juice/client');
var hljs = require('./languages').register();

const defaultBgc = '#f0f0f0';
const languageAuto = 'Auto';
const languages = hljs.listLanguages().sort();

const ids = {
    language: '#language',
    theme: '#theme',
    themes: '#themes',
    noBackground: '#no-background',
    preview: '#preview',
    formatButtons: '#format-buttons',
    format: '#format-selection',
    showPreview: '#show-preview',
    error: '#error'
};

/**
 * On document load, try to load languages and themes, try to load the user's
 * preferences if previously set, and assign click handlers to each button.
 */
$(function () {
    populateLanguages();

    google.script.run
        .withFailureHandler(showErrorThemes)
        .withSuccessHandler(function onSuccess(result) {
            populateThemes(result.themes);
            populateUserPrefs(result.prefs, result.themes);

            $(ids.format).click(format);
            $(ids.showPreview).click(preview);

            enableUiElements();
        })
        .getThemesAndUserPrefs();
});

/**
 * Runs a server-side function to format the user-selected text and update
 * the sidebar UI with the resulting block.
 */
function preview() {
    // noinspection JSUnusedGlobalSymbols
    this.disabled = true;
    $(ids.error).remove();

    const language = $(ids.language + ' option:selected').text();
    const theme = $(ids.theme + ' option:selected').text();
    const noBackground = $(ids.noBackground).is(':checked');

    google.script.run
        .withFailureHandler(showErrorButtons)
        .withSuccessHandler(function renderPreview(result, element) {
            const block = createHighlightedBlock(
                result.selection,
                result.css,
                language,
                noBackground
            );

            // render preview
            $(ids.preview).replaceWith(block);

            element.disabled = false;
        })
        .withUserObject(this)
        .getSelectionAndThemeCssForPreview({
            language: language,
            theme: theme,
            noBackground: noBackground
        });
}

/**
 * Runs a server-side function to format the user-selected text and replaces
 * that text in the active document with the resulting block.
 */
function format() {
    // noinspection JSUnusedGlobalSymbols
    this.disabled = true;
    $(ids.error).remove();

    const language = $(ids.language + ' option:selected').text();
    const theme = $(ids.theme + ' option:selected').text();
    const noBackground = $(ids.noBackground).is(':checked');

    const html = $(ids.preview).prop('outerHTML');
    google.script.run
        .withFailureHandler(showErrorButtons)
        .withSuccessHandler(function onSuccess(result, element) {
            if (!result) {
                // code has already been inserted from preview
                return focusEditor(result, element);
            }

            const block = createHighlightedBlock(
                result.selection, result.css, language, noBackground
            );
            const html = block.prop('outerHTML');

            google.script.run
                .withFailureHandler(showErrorButtons)
                .withSuccessHandler(focusEditor)
                .withUserObject(element)
                .insertCode(html, noBackground);
        })
        .withUserObject(this)
        .insertCodeOrGetSelectionAndThemeCss(html, {
            language: language,
            theme: theme,
            noBackground: noBackground
        });
}

/*
 * Utilities
 */

/**
 * Populate the language input options.
 */
function populateLanguages() {
    const languageSelect = $(ids.language);
    languageSelect.append(languages.map(function toOption(language) {
        return '<option value="' + language + '">' + language + '</option>';
    }));
}

/**
 * Populates the theme input options.
 */
function populateThemes(themes) {
    const themeSelect = $(ids.theme);
    themeSelect.append(themes.map(function toOption(theme) {
        return '<option value="' + theme + '">' + theme + '</option>';
    }));
}

/**
 * Populates the inputs elements with user preferences from the server.
 *
 * @param {Object} prefs the saved preferences
 * @param {Array.<string>} themes the list of themes
 */
function populateUserPrefs(prefs, themes) {
    if (prefs.language) {
        const language = $(ids.language);
        const selectionIsValid = languages.some(function matchesPref(l) {
            return l === prefs.language;
        });
        if (selectionIsValid) {
            language.val(prefs.language)
        }
    }

    if (prefs.theme) {
        const theme = $(ids.theme);
        const selectionIsValid = themes.some(function matchesPref(t) {
            return t === prefs.theme;
        });
        if (selectionIsValid) {
            theme.val(prefs.theme);
        }
    }

    if (prefs.noBackground && prefs.noBackground.toString() === 'true') {
        $(ids.noBackground).prop('checked', true);
    }
}

/**
 * @param {string} text the text to highlight
 * @param {string} css the theme style as CSS
 * @param {string} language the language to use, defaults to 'auto'
 * @param {boolean} noBackground whether to use the default background color
 * @returns {string} the highlighted block as HTML with inline CSS
 */
function createHighlightedBlock(text, css, language, noBackground) {
    text = replaceSpecialChars(text);

    var block = $(ids.preview).clone();
    block.removeClass();
    block.removeAttr('style');
    block.text(text);
    if (language !== languageAuto) {
        block.addClass(language);
    }

    const node = block[0];
    hljs.highlightBlock(node);

    var highlighted = block.prop('outerHTML');
    if (css) {
        const params = {
            applyHeightAttributes: false,
            applyWidthAttributes: false,
            inlinePseudoElements: false,
            preserveFontFaces: false,
            preserveMediaQueries: false
        };
        highlighted = juice.inlineContent(highlighted, css, params);
    }

    block = $($.parseHTML(highlighted));
    if (noBackground) {
        block.css('background', defaultBgc);
    }

    return block;
}

function enableUiElements() {
    [
        ids.language,
        ids.theme,
        ids.format,
        ids.showPreview
    ].forEach(function enable(id) {
        $(id).prop('disabled', false);
    });
}

//noinspection JSUnusedLocalSymbols
function focusEditor(result, element) {
    google.script.host.editor.focus();
    element.disabled = false;
}

//noinspection JSUnusedLocalSymbols
function showErrorThemes(msg, element) {
    showError(msg, $(ids.themes));

    // enable other forms even if getting themes fails
    enableUiElements();
}

function showErrorButtons(msg, element) {
    showError(msg, $(ids.formatButtons));
    element.disabled = false;
}

/**
 * Inserts a div that contains an error message after a given element.
 *
 * @param {string} msg the error message
 * @param {string} elementId the element to display the error under
 */
function showError(msg, elementId) {
    const div = $('<div id="error" class="error">' + msg + '</div>');
    $(elementId).after(div);
}

/**
 *
 * @param {string} text
 * @returns {string} the text with special characters replaced
 */
function replaceSpecialChars(text) {
    var re = new RegExp(Object.keys(replacements).join('|'), 'g');
    return text.replace(re, function getReplacement(match) {
        return replacements[match];
    });
}

const replacements = {
    '\u2018': '\'',
    '\u2019': '\'',
    '\u201A': '\'',
    '\uFFFD': '\'',
    '\u201c': '"',
    '\u201d': '"',
    '\u201e': '"',
    '\u02C6': '^',
    '\u2039': '<',
    '\u203A': '>',
    '\u2013': '-',
    '\u2014': '--',
    '\u2026': '...',
    '\u00A9': '(c)',
    '\u00AE': '(r)',
    '\u2122': 'TM',
    '\u00BC': '1/4',
    '\u00BD': '1/2',
    '\u00BE': '3/4',
    '\u02DC': ' ',
    '\u00A0': ' '
};
