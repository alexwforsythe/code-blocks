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
 * Replaces the current selection with the provided html.
 *
 * @param {GoogleAppsScript.Document.Range} selection
 * @param {string} html
 * @param {boolean} noBackground
 */
function replaceSelection(selection, html, noBackground) {
    var body = DocumentApp.getActiveDocument().getBody();

    var replaced = false;
    var elements = selection.getRangeElements();
    for (var i = elements.length - 1; i >= 0; i--) {
        var rangeElement = elements[i];
        var e = rangeElement.getElement();

        // todo: figure out what different selections look like
        // Logger.log(i);
        // Logger.log('rangeElement: ' + rangeElement + ', isPartial: ' + rangeElement.isPartial());
        // Logger.log('element: ' + e + ', type: ' + e.getType());

        if (rangeElement.isPartial()) {
            // first or last line
            // Logger.log('parent type: ' + rangeElement.getElement().getParent().getType());
            var start = rangeElement.getStartOffset();
            var end = rangeElement.getEndOffsetInclusive();

            // keep copies of surrounding text
            var before = e.editAsText().getText().substring(0, start);
            var after = e.editAsText().getText().substring(end + 1);

            var parent = e.getParent();
            var oldAttrs = parent.getAttributes();
            // clearText(parent);
            parent.clear();

            var text;
            if (after) {
                // insert "after" text first
                text = parent.insertText(0, after);
                text.setAttributes(oldAttrs);
            }
            if (!replaced) {
                if (!before && !after) {
                    // use a table if surrounding text is empty
                    appendTableWithHtml(body, parent, html, noBackground);
                    parent.removeFromParent();
                } else {
                    // otherwise just highlight the partial
                    insertHtmlAsText(parent, 0, html, noBackground, undefined);
                }
                replaced = true;
            }
            if (before) {
                // finally, insert the "before" text
                text = parent.insertText(0, before);
                text.setAttributes(oldAttrs);
            }
        } else {
            if (e.getType() === DocumentApp.ElementType.TEXT) {
                // todo: repro this?
                throw 'text element should not be a container'
            }

            // no surrounding text, so just insert a table
            if (!replaced) {
                appendTableWithHtml(body, e, html, noBackground);
                replaced = true;
            }

            removeElement(e);
        }
    }
}

function appendTableWithHtml(body, element, html, noBackground) {
    // insert table
    var index = body.getChildIndex(element) + 1;
    var table = body.insertTable(index);

    // remove border
    table.setBorderWidth(0);

    // append cell with paragraph
    var cell = table.appendTableRow().appendTableCell();
    var par = cell.appendParagraph('');

    insertHtmlAsText(par, 0, html, noBackground, cell);

    // clean up cell (remove initial paragraph)
    cell.getChild(0).removeFromParent();

    return table;
}

/**
 * Parses an HTML block as XML and inserts all of it's children into the
 * document, respecting the 'style' attribute when possible. Each child node
 * inherits style properties from its parent.
 *
 * @param {GoogleAppsScript.Document.Element} element
 * @param {number} index
 * @param {string} html
 * @param {boolean} noBackground
 * @param {GoogleAppsScript.Document.TableCell|undefined} cell
 */
function insertHtmlAsText(element, index, html, noBackground, cell) {
    var block = XmlService.parse(html);
    var root = block.getRootElement();

    // Logger.log('block: %s', XmlService.getPrettyFormat().format(block));

    // set cell background color
    if (cell && !noBackground) {
        var style = root.getAttribute('style');
        var rootAttrs = extendFromStyle({}, style);
        var rootBgc = rootAttrs[DocumentApp.Attribute.BACKGROUND_COLOR];
        if (rootBgc) {
            rootBgc = colorToHex(rootBgc);
            cell.setBackgroundColor(rootBgc);
        }
    }

    var baseAttrs = {};
    baseAttrs[DocumentApp.Attribute.FONT_FAMILY] = constants.document.font;
    // disable font style attrs so they don't carry over to new elements
    baseAttrs[DocumentApp.Attribute.BOLD] = false;
    baseAttrs[DocumentApp.Attribute.ITALIC] = false;
    baseAttrs[DocumentApp.Attribute.UNDERLINE] = false;
    baseAttrs[DocumentApp.Attribute.STRIKETHROUGH] = false;

    insertChildren(element, index, root, baseAttrs, noBackground);
}

function insertChildren(element, index, node, attrs, noBackground) {
    if (node.getType() === XmlService.ContentTypes.TEXT) {
        var str = node.getText();
        var text = element.insertText(index, str);
        text.setAttributes(attrs);
        return;
    }

    // reverse pre-order traversal
    if (node.getType() === XmlService.ContentTypes.ELEMENT) {
        var child = node.asElement();
        var style = child.getAttribute('style');

        // pass new style attributes down the stack
        var childAttrs = extendFromStyle(attrs, style, noBackground);

        var children = child.getAllContent();
        for (var i = children.length - 1; i >= 0; i--) {
            insertChildren(element, index, children[i], childAttrs);
        }
    }
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

function removeElement(element) {
    if (element.getNextSibling()) {
        return element.removeFromParent();
    }

    if (!element.editAsText()) {
        element.appendParagraph('');
        return element.removeFromParent();
    }

    // Logger.log('unable to remove, clearing text instead');
    clearText(element);
}

/**
 * Clears all text from an element iff it is a Text element.
 *
 * @param {GoogleAppsScript.Document.Element} element
 * @returns {GoogleAppsScript.Document.Text|null}
 */
function clearText(element) {
    if (element.editAsText) {
        var text = element.editAsText();
        if (text) {
            return text.deleteText(0, text.length - 1);
        }
    }

    return null;
}
