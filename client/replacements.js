'use strict';

/**
 * Typographic characters that Google Docs substitutes automatically (smart
 * quotes, en/em dashes, ellipsis, non-breaking space, ...), mapped back to
 * their plain ASCII equivalents. highlight.js grammars expect straight
 * quotes and plain punctuation, so code copied out of a doc has to be
 * normalised before it is tokenised.
 */
var replacements = {
    '‘': '\'',
    '’': '\'',
    '‚': '\'',
    '�': '\'',
    '“': '"',
    '”': '"',
    '„': '"',
    'ˆ': '^',
    '‹': '<',
    '›': '>',
    '–': '-',
    '—': '--',
    '…': '...',
    '©': '(c)',
    '®': '(r)',
    '™': 'TM',
    '¼': '1/4',
    '½': '1/2',
    '¾': '3/4',
    '˜': ' ',
    ' ': ' '
};

/**
 * @param {string} text
 * @returns {string} the text with typographic characters replaced by ASCII
 */
function replaceSpecialChars(text) {
    var re = new RegExp(Object.keys(replacements).join('|'), 'g');
    return text.replace(re, function getReplacement(match) {
        return replacements[match];
    });
}

module.exports = {
    replacements: replacements,
    replaceSpecialChars: replaceSpecialChars
};
