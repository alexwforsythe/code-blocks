var $ = require('jquery');
var juice = require('juice/client');
var hljs = require('highlight.js');

// element ids
const ids = {
    language: '#language',
    theme: '#theme',
    themes: '#themes',
    noBackground: '#no-background',
    previewButtons: '#preview-buttons',
    showPreview: '#show-preview',
    preview: '#preview',
    paste: '#insert-preview',
    highlightButtons: '#insert-buttons',
    highlight: '#highlight-selection',
    error: '#error'
};

const defaultTheme = 'default';
const defaultBgc = '#f0f0f0';
const languageAuto = 'Auto';
const languages = hljs.listLanguages().sort();

/**
 * On document load, try to load languages and themes, try to load the
 * user's preferences if previously set, and assign click handlers to each button.
 */
$(function () {
    // populate language input options
    languages.forEach(function addLanguageOption(lang) {
        $(ids.theme).append(
            '<option value="' + lang + '">' + lang + '</option>'
        );
    });

    google.script.run
        .withFailureHandler(showErrorThemes)
        .withSuccessHandler(function (result, element) {
            loadThemes(result.themes);
            loadPreferences(result.prefs, result.themes);
        })
        .getPreferencesAndThemes();

    $(ids.highlight).click(highlightSelection);
    $(ids.showPreview).click(showPreview);
    $(ids.paste).click(insertPreview);
});

function loadThemes(themes) {
    const themeSelect = $(ids.theme);

    // todo: does this mean that we can remove css caching for default theme?
    // remove 'default', because its CSS is already in HTML as a fallback
    var i = themes.indexOf(defaultTheme);
    if (i !== -1) {
        themes.splice(i, 1);
    }

    // populate theme input options
    themes.forEach(function addThemeOption(theme) {
        themeSelect.append(
            '<option value="' + theme + '">' + theme + '</option>'
        );
    });
}

/**
 * Callback function that populates inputs elements with user preferences
 * from the server.
 *
 * @param {Object} prefs The saved preferences.
 * @param themes
 */
function loadPreferences(prefs, themes) {
//        console.log(languages);
//        console.log(themes);
//        console.log(prefs);

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
    if (prefs.noBackground === 'true') {
        $(ids.noBackground).prop('checked', true);
    }

    // enable forms
    [
        ids.language,
        ids.theme,
        ids.highlight,
        ids.showPreview
    ].forEach(function enable(id) {
        $(id).prop('disabled', false);
    });
}

function replaceSpecialChars(html) {
    return html
        .replace(/[\u2018\u2019\u201A\uFFFD]/g, '\'')
        .replace(/[\u201c\u201d\u201e]/g, '"')
        .replace(/\u02C6/g, '^')
        .replace(/\u2039/g, '<')
        .replace(/\u203A/g, '>')
        .replace(/\u2013/g, '-')
        .replace(/\u2014/g, '--')
        .replace(/\u2026/g, '...')
        .replace(/\u00A9/g, '(c)')
        .replace(/\u00AE/g, '(r)')
        .replace(/\u2122/g, 'TM')
        .replace(/\u00BC/g, '1/4')
        .replace(/\u00BD/g, '1/2')
        .replace(/\u00BE/g, '3/4')
        .replace(/[\u02DC|\u00A0]/g, ' ');
}

// button function to show code preview
/**
 * Runs a server-side function to translate the user-selected text and update
 * the sidebar UI with the resulting translation.
 */
function showPreview() {
    this.disabled = true;
    $(ids.error).remove();

    const language = $(ids.language + ' option:selected').text();
    const theme = $(ids.theme + ' option:selected').text();
    const noBackground = $(ids.noBackground).is(':checked');

    google.script.run
        .withFailureHandler(showErrorPreviewButtons)
        .withSuccessHandler(
            function (result, element) {
                const block = createHighlightedBlock(
                    result.selection,
                    result.css,
                    language,
                    noBackground
                );

                // render preview
                $(ids.preview).replaceWith(block);
                $(ids.paste).prop('disabled', false);

                element.disabled = false;
            })
        .withUserObject(this)
        .getSelectionAndThemeStyle(language, theme, noBackground);
}

function createHighlightedBlock(text, css, language, noBackground) {
    text = replaceSpecialChars(text);

    var block = $(ids.preview).clone();
    block.removeClass();
    block.removeAttr('style');
    block.text(text);
    if (language !== languageAuto) {
        block.addClass(language);
    }
    hljs.highlightBlock(block[0]); // todo: why [0]?

    var highlighted = block.prop('outerHTML');
    if (css) {
        highlighted = juice.inlineContent(highlighted, css);
    }

    block = $($.parseHTML(highlighted));
    if (noBackground) {
        block.css('background', defaultBgc);
    }

    return block;
}

/**
 * todo: button function to highlight selection
 */
function highlightSelection() {
    this.disabled = true;
    $(ids.error).remove();

    const language = $(ids.language + ' option:selected').text();
    const theme = $(ids.theme + ' option:selected').text();
    const noBackground = $(ids.noBackground).is(':checked');

    google.script.run
        .withFailureHandler(showErrorHighlightButtons)
        .withSuccessHandler(
            function (result, element) {
                const selection = result.selection;
                const css = result.css;

                const block = createHighlightedBlock(selection, css, language);
                const html = block.prop('outerHTML');

                google.script.run
                    .withFailureHandler(showErrorHighlightButtons)
                    .withSuccessHandler(focusEditor)
                    .withUserObject(element)
                    .insertCode(html, noBackground);
            })
        .withUserObject(this)
        .getSelectionAndThemeStyle(language, theme, noBackground);
}

/**
 * todo: button function to insert preview
 */
function insertPreview() {
    this.disabled = true;
    $(ids.error).remove();

    const noBackground = $(ids.noBackground).is(':checked');
    const html = $(ids.preview).prop('outerHTML');

    google.script.run
        .withFailureHandler(showErrorPreviewButtons)
        .withSuccessHandler(focusEditor)
        .withUserObject(this)
        .insertCode(html, noBackground);
}

//noinspection JSUnusedLocalSymbols
function focusEditor(result, element) {
    google.script.host.editor.focus();
    element.disabled = false;
}

//noinspection JSUnusedLocalSymbols
function showErrorThemes(msg, element) {
    showError(msg, $(ids.themes));
//        element.disabled = false;

    // enable other forms even if getting themes fails
    [
        ids.language,
        ids.theme,
        ids.highlight,
        ids.showPreview
    ].forEach(function enable(id) {
        $(id).prop('disabled', false);
    });
}

function showErrorPreviewButtons(msg, element) {
    showError(msg, $(ids.previewButtons));
    element.disabled = false;
}

function showErrorHighlightButtons(msg, element) {
    showError(msg, $(ids.highlightButtons));
    element.disabled = false;
}

/**
 * Inserts a div that contains an error message after a given element.
 *
 * @param msg The error message to display.
 * @param element The element after which to display the error.
 */

function showError(msg, element) {
    const div = $('<div id="error" class="error">' + msg + '</div>');
    $(element).after(div);
}
