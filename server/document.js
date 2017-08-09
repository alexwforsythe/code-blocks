/**
 * Gets the text the user has selected. If there is no selection,
 * this function displays an error message.
 *
 * x@return {Array.<string>} the selected text
 */
function getSelectedText() {
    var selection = DocumentApp.getActiveDocument().getSelection();
    if (!selection) {
        throw constants.errors.selectText;
    }

    var elements = selection.getSelectedElements();

    var result = [];
    elements.forEach(function(e) {
        if (e.isPartial()) {
            var startIndex = e.getStartOffset();
            var endIndex = e.getEndOffsetInclusive();

            text = e.getElement().asText()
                .getText()
                .substring(startIndex, endIndex + 1);

            result.push(text);
        } else {
            var element = e.getElement();
            if (element.editAsText) {
                var text = element.asText().getText();
                // todo: check if image gets here and is empty string
                result.push(text);
            }
        }
    });

    if (result.length === 0) {
        throw constants.errors.selectText;
    }

    return result;
}

/**
 * Replaces the current selection with the provided html.
 *
 * @param {GoogleAppsScript.Document.Range} selection
 * @param {string} html todo
 * @param {boolean} noBackground
 */
function replaceSelection(selection, html, noBackground) {
    var replaced = false;
    var elements = selection.getRangeElements();

    for (var i = elements.length - 1; i >= 0; i--) {
        var rangeElement = elements[i];
        var e = rangeElement.getElement();

        // Logger.log(i);
        // Logger.log('rangeElement: ' + rangeElement + ', isPartial: ' + rangeElement.isPartial());
        // Logger.log('element: ' + element + ', type: ' + element.getType());

        if (rangeElement.isPartial()) {
            // Logger.log('parent type: ' + rangeElement.getElement().getParent().getType());
            var start = rangeElement.getStartOffset();
            var end = rangeElement.getEndOffsetInclusive();
            var before = e.editAsText().getText().substring(0, start);
            var after = e.editAsText().getText().substring(end + 1);
            var parent = e.getParent();
            var attrs = parent.getAttributes();

            // clearText(parent);
            parent.clear();

            var text;
            if (after) {
                text = parent.insertText(0, after);
                text.setAttributes(attrs);
            }
            if (!replaced) {
                if (!before && !after) {
                    appendTableWithHTML(parent, html, noBackground);
                    parent.removeFromParent();
                } else {
                    insertHTMLAsText(parent, 0, html, noBackground);
                }
                replaced = true;
            }
            if (before) {
                text = parent.insertText(0, before);
                text.setAttributes(attrs);
            }
        } else {
            if (e.getType() === DocumentApp.ElementType.TEXT) {
                var msg = 'text element should not be a container';
                logError(constants.errors.insert, msg);
                throw constants.errors.insert;
            }

            if (!replaced) {
                appendTableWithHTML(e, html, noBackground);
                removeElement(e);
                replaced = true;
            } else {
                removeElement(e);
            }
        }
    }
}

/**
 * todo
 *
 * @param html
 * @param {Boolean} noBackground
 */
function insertAtCursor(html, noBackground) {
    var cursor = DocumentApp.getActiveDocument().getCursor();
    var element = cursor.getElement();

    if (element.getType() === DocumentApp.ElementType.PARAGRAPH &&
        element.asParagraph().getNumChildren() === 0) {
        appendTableWithHTML(element, html, noBackground);
        removeElement(element);
        return;
    }

    var surroundingText = cursor.getSurroundingText();
    var surroundingTextOffset = cursor.getSurroundingTextOffset();
    var surroundingString = surroundingText.getText();
    var attrs = surroundingText.getAttributes();
    var before = surroundingString.substring(0, surroundingTextOffset);
    var after = surroundingString.substring(surroundingTextOffset);

    clearText(element);

    // create temporary text to get access to text interface
    // todo: hacky
    var text = cursor.insertText('temp');
    clearText(text);

    var parent = text.getParent();
    if (after) {
        text = parent.insertText(0, after);
        text.setAttributes(attrs);
    }
    insertHTMLAsText(parent, 0, html, noBackground);
    if (before) {
        text = parent.insertText(0, before);
        text.setAttributes(attrs);
    }
}

function appendTableWithHTML(element, html, noBackground) {
    var body = DocumentApp.getActiveDocument().getBody();
    var index = body.getChildIndex(element) + 1;
    var table = body.insertTable(index);

    // remove border
    table.setBorderWidth(0);

    var cell = table.appendTableRow().appendTableCell();
    var par = cell.appendParagraph('');
    insertHTMLAsText(par, 0, html, noBackground, cell);

    // clean up cell (remove initial paragraph)
    cell.getChild(0).removeFromParent();

    return table;
}

function insertHTMLAsText(element, index, html, noBackground, cell) {
    var attrs = {};
    attrs[DocumentApp.Attribute.FONT_FAMILY] = constants.document.fonts.consolas;

    // disable font style attrs by default so they don't carry over to new elements
    // todo: might not be necessary now that we're handling it up the stack
    attrs[DocumentApp.Attribute.BOLD] = false;
    attrs[DocumentApp.Attribute.ITALIC] = false;
    attrs[DocumentApp.Attribute.UNDERLINE] = false;
    attrs[DocumentApp.Attribute.STRIKETHROUGH] = false;

    var block = XmlService.parse(html);
    // var output = XmlService.getPrettyFormat().format(block);
    // Logger.log('block: ' + output);
    var root = block.getRootElement();

    // set cell background color inserting a table
    if (cell && !noBackground) {
        var style = root.getAttribute('style');
        var rootAttrs = addStyleAttrs({}, style);
        var cellAttrs = cell.getAttributes();
        var rootBgc = rootAttrs[DocumentApp.Attribute.BACKGROUND_COLOR];
        rootBgc = rootBgc && colorToHex(rootBgc);
        cellAttrs[DocumentApp.Attribute.BACKGROUND_COLOR] = rootBgc;
        cell.setAttributes(cellAttrs);

        // todo: doesn't always work
        // cell.setBackgroundColor(rootBgc);
    }

    insertNode(element, index, root, attrs, noBackground);
}

function insertNode(element, index, node, attrs, noBackground) {
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
        var childAttrs = addStyleAttrs(attrs, style, noBackground);

        var children = child.getAllContent();
        for (var i = children.length - 1; i >= 0; i--) {
            insertNode(element, index, children[i], childAttrs);
        }
    }
}

function addStyleAttrs(attrs, attr, noBackground) {
    if (attr === null) {
        return attrs;
    }

    attrs = copyAttrs(attrs);
    var style = attr.getValue();
    var styles = style.split(';');
    styles.forEach(function addStyle(style) {
        var pieces = style.split(':');
        if (pieces.length === 2 && pieces[1]) {
            var key = pieces[0];
            var val = pieces[1];
            addStyleAttr(attrs, key, val, noBackground);
        }
    });

    return attrs;
}

function addStyleAttr(attrs, key, val, noBackground) {
    key = key.trim().toLowerCase();
    val = val.trim().toLowerCase();

    // handle special cases
    switch (key) {
        // font style
        case constants.document.htmlAttrs.fontWeight:
        case constants.document.htmlAttrs.fontStyle:
        case constants.document.htmlAttrs.textDecoration:
            attr = constants.document.docAttrs[val];
            if (attr) {
                attrs[attr] = true;
            }
            return;
        case constants.document.htmlAttrs.background:
            if (noBackground) {
                return;
            }
        case constants.document.htmlAttrs.color:
            val = val && colorToHex(val);
            break;
    }

    // everything else
    var attr = constants.document.docAttrs[key];
    if (attr) {
        attrs[attr] = val;
    }
}

function copyAttrs(attrs) {
    // todo: do literal copy if possible for performance
    return JSON.parse(JSON.stringify(attrs));
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
 * Clears all text from an element.
 *
 * @param {GoogleAppsScript.Document.Element} element
 * @returns {GoogleAppsScript.Document.Text}
 */
function clearText(element) {
    if (element.editAsText) {
        var text = element.editAsText();
        var textLen = text.getText().length;
        if (textLen > 0) {
            return text.deleteText(0, textLen - 1);
        }
    }
}
