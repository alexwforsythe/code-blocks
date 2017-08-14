/**
 * Gets the user's current selection if it exists or throws an error otherwise.
 *
 * @returns {GoogleAppsScript.Document.Range}
 */
function getSelection() {
    var selection = DocumentApp.getActiveDocument().getSelection();
    if (!selection) {
        throw constants.errors.selectText;
    }
    return selection;
}

/**
 * Gets the text the user has selected. If there is no selection,
 * this function displays an error message.
 *
 * @param {GoogleAppsScript.Document.Range} selection
 * @return {string} the selected text
 */
function getSelectedText(selection) {
    var elements = selection.getSelectedElements();
    try {
        var result = elements.map(function (e) {
            var element = e.getElement();
            var text = element.asText().getText();

            if (e.isPartial()) {
                var startIndex = e.getStartOffset();
                var endIndex = e.getEndOffsetInclusive();
                return text.slice(startIndex, endIndex + 1);
            } else if (element.editAsText) {
                return text;
            }
        });
    } catch (err) {
        logError(constants.errors.getSelection, err);
        throw constants.errors.getSelection;
    }

    if (!result) {
        throw constants.errors.selectText;
    }

    return result.join('\n');
}

/**
 * Replaces the current selection with the provided HTML. This is gnarly.
 *
 * @param {GoogleAppsScript.Document.Range} selection
 * @param {string} html
 * @param {boolean} noBackground
 */
function replaceSelection(selection, html, noBackground) {
    var block = XmlService.parse(html);
    var root = block.getRootElement();

    var replaced = false;
    var ranges = selection.getRangeElements();
    for (var i = ranges.length - 1; i >= 0; i--) {
        var range = ranges[i];
        var element = range.getElement();

        // handle partials first
        if (range.isPartial()) {
            var parent = element.getParent();
            var asText = element.editAsText();
            var text = asText.getText();
            var start = range.getStartOffset();
            var end = range.getEndOffsetInclusive();

            // keep copies of surrounding text
            var before = start !== -1 && text.slice(0, start);
            var after = end !== -1 && text.slice(end + 1);
            var beforeEndsWithCr = before &&
                before.charAt(before.length - 1) === '\r';
            var afterStartsWithCr = after &&
                after.charAt(0) === '\r';

            if (beforeEndsWithCr && afterStartsWithCr) {
                // e.g. selection is full line with text above and below
                if (!replaced) {
                    // copy before & after as text elements (with attrs)
                    var copyBefore = asText.copy();
                    var copyAfter = asText.copy();
                    copyBefore = copyBefore.deleteText(start, text.length - 1);
                    copyAfter = copyAfter.deleteText(0, end);

                    // remove original element
                    element.removeFromParent();

                    // append to parent: before, table, after
                    parent.appendText(copyBefore);
                    var table = appendTableWithHtml(parent, root, noBackground);
                    var body = DocumentApp.getActiveDocument().getBody();
                    var index = body.getChildIndex(table);
                    var par = body.insertParagraph(index + 1, '');
                    par.appendText(copyAfter);
                    replaced = true;
                }
            } else if (before || after) {
                // e.g. selection is full line with empty line above or below
                if (!after && beforeEndsWithCr) {
                    if (!replaced) {
                        appendTableWithHtml(parent, root, noBackground);
                        replaced = true;
                    }
                } else if (!before && afterStartsWithCr) {
                    if (!replaced) {
                        var nextContainer =
                            element.getParent().getPreviousSibling();
                        appendTableWithHtml(nextContainer, root, noBackground);
                        replaced = true;
                    }
                }
                // e.g. selection is part of a line
                asText.deleteText(start, end);
                if (!replaced) {
                    // just insert text with no table
                    insertHtmlAsText(element, root, start, noBackground);
                    replaced = true;
                }
            } else if (!replaced) {
                // e.g. selection is line with empty lines above and below
                appendTableWithHtml(parent, root, noBackground);
                parent.removeFromParent();
                replaced = true;
            }
        } else {
            // e.g. selection is full container element
            if (!replaced) {
                appendTableWithHtml(element, root, noBackground);
                replaced = true;
            }
            element.removeFromParent();
        }
    }
}

function appendTableWithHtml(element, root, noBackground) {
    var body = DocumentApp.getActiveDocument().getBody();

    // insert table
    var index = body.getChildIndex(element);
    var table = body.insertTable(index + 1);

    // remove border
    table.setBorderWidth(0);

    // append cell with paragraph
    var cell = table.appendTableRow().appendTableCell();
    var par = cell.appendParagraph('');

    // set cell background color
    if (!noBackground) {
        var rootStyle = root.getAttribute('style');
        var rootAttrs = extendFromStyle({}, rootStyle);
        var rootBgc = rootAttrs[DocumentApp.Attribute.BACKGROUND_COLOR];
        if (rootBgc) {
            rootBgc = colorToHex(rootBgc);
            cell.setBackgroundColor(rootBgc);
        }
    }

    insertHtmlAsText(par, root, 0, noBackground);

    // clean up cell (remove initial paragraph)
    cell.getChild(0).removeFromParent();

    return table;
}

/**
 * Parses an HTML block as XML and inserts all of it's children into the
 * document, respecting the 'style' attribute when possible. Each child node
 * inherits style properties from its parent.
 *
 * @param {GoogleAppsScript.Document.ContainerElement} element
 * @param {GoogleAppsScript.XML.Document.Element} root
 * @param {number} index
 * @param {boolean} noBackground
 */
function insertHtmlAsText(element, root, index, noBackground) {
    var baseAttrs = {};
    baseAttrs[DocumentApp.Attribute.FONT_FAMILY] = constants.document.font;

    // disable font style attrs so they don't carry over to new elements
    delete baseAttrs[DocumentApp.Attribute.BOLD];
    delete baseAttrs[DocumentApp.Attribute.ITALIC];
    delete baseAttrs[DocumentApp.Attribute.UNDERLINE];
    delete baseAttrs[DocumentApp.Attribute.STRIKETHROUGH];

    var textToAppend = '';
    var groupedAttrs = [];

    // insert nodes
    var children = [{
        node: root,
        attrs: baseAttrs
    }];
    while (children.length > 0) {
        var child = children.pop();
        var type = child.node.getType();

        if (type === XmlService.ContentTypes.TEXT) {
            var str = child.node.getText();
            groupedAttrs.push({
                start: textToAppend.length,
                end: textToAppend.length + str.length - 1,
                attrs: child.attrs
            });
            textToAppend += str;
        } else if (type === XmlService.ContentTypes.ELEMENT) {
            // pass new style attributes down the stack
            var e = child.node.asElement();
            var style = e.getAttribute('style');
            var childAttrs = extendFromStyle(child.attrs, style, noBackground);

            var newNodes = e.getAllContent();
            for (var i = newNodes.length - 1; i >= 0; i--) {
                children.push({
                    node: newNodes[i],
                    attrs: childAttrs
                });
            }
        }
    }

    // append the full text and set it's attributes in groups
    var asText = element.editAsText();
    asText.insertText(index, textToAppend);
    groupedAttrs.forEach(function setAttrs(group) {
        asText.setAttributes(
            index + group.start,
            index + group.end,
            group.attrs
        );
    });
}

function extendFromStyle(oldAttrs, style, noBackground) {
    var attrs = cloneObj(oldAttrs);
    if (!style) {
        return attrs;
    }

    var styleVal = style.getValue();
    var styles = styleVal.split(';');

    return styles.reduce(function addStyle(result, style) {
        var pieces = style.split(':');
        if (pieces.length === 2 && pieces[0] && pieces[1]) {
            var prop = pieces[0].trim().toLowerCase();
            var val = pieces[1].trim().toLowerCase();
            setDocAttr(result, prop, val, noBackground);
        }
        return result;
    }, attrs);
}

/**
 * Sets an element's Document.Attribute based on the given CSS property.
 *
 * @param {object} attrs
 * @param {string} prop
 * @param {string} val
 * @param {boolean} noBackground
 */
function setDocAttr(attrs, prop, val, noBackground) {
    // handle special cases
    // noinspection FallThroughInSwitchStatementJS
    switch (prop) {
        // font style
        case constants.document.cssAttrs.fontWeight:
        case constants.document.cssAttrs.fontStyle:
        case constants.document.cssAttrs.textDecoration:
            attrName = constants.document.docAttrs[val];
            if (attrName) {
                attrs[attrName] = true;
            }
            return;
        case constants.document.cssAttrs.background:
            if (noBackground) {
                return;
            }
        case constants.document.cssAttrs.color:
            val = colorToHex(val);
            break;
    }

    // everything else
    var attrName = constants.document.docAttrs[prop];
    if (attrName) {
        attrs[attrName] = val;
    }
}
