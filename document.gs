// a map of css attributes to document attributes
const ATTRIBUTES = {
    'background': DocumentApp.Attribute.BACKGROUND_COLOR,
    'bold': DocumentApp.Attribute.BOLD,
    'color': DocumentApp.Attribute.FOREGROUND_COLOR,
    'italic': DocumentApp.Attribute.ITALIC,
    'line-through': DocumentApp.Attribute.STRIKETHROUGH,
    'underline': DocumentApp.Attribute.UNDERLINE
};

const ERR_SELECT_TEXT = 'Please select some text.';

/**
 * Gets the text the user has selected. If there is no selection,
 * this function displays an error message.
 *
 * @return {Array.<string>} The selected text.
 */
function getSelectedText() {
    var selection = DocumentApp.getActiveDocument().getSelection();
    if (!selection) {
        throw ERR_SELECT_TEXT;
    }

    var text = [];
    var elements = selection.getSelectedElements();
    var element;
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].isPartial()) {
            var e = elements[i],
                startIndex = e.getStartOffset(),
                endIndex = e.getEndOffsetInclusive();

            elementText = e.getElement().asText()
                .getText()
                .substring(startIndex, endIndex + 1);

            text.push(elementText);
        } else {
            element = elements[i].getElement();
            if (element.editAsText) {
                var elementText = element.asText().getText();
                // todo: check if image gets here and is empty string
                text.push(elementText);
            }
        }
    }

    if (text.length === 0) {
        throw ERR_SELECT_TEXT;
    }

    return text;
}

/**
 * todo
 *
 * @param selection
 * @param html
 * @param noBackground
 */
function replaceSelection(selection, html, noBackground) {
    var replaced = false;
    var elements = selection.getRangeElements();

    for (var i = elements.length - 1; i >= 0; i--) {
        var rangeElement = elements[i];
        var element = rangeElement.getElement();

        // Logger.log(i);
        // Logger.log('rangeElement: ' + rangeElement + ', isPartial: ' + rangeElement.isPartial());
        // Logger.log('element: ' + element + ', type: ' + element.getType());

        if (rangeElement.isPartial()) {
            // Logger.log('parent type: ' + rangeElement.getElement().getParent().getType());
            var start = rangeElement.getStartOffset(),
                end = rangeElement.getEndOffsetInclusive(),
                before = element.editAsText().getText().substring(0, start),
                after = element.editAsText().getText().substring(end + 1),
                parent = element.getParent(),
                attrs = parent.getAttributes();

            // clearText(parent);
            parent.clear();

            var text;
            if (after !== '') {
                text = parent.insertText(0, after);
                text.setAttributes(attrs);
            }
            if (!replaced) {
                if (before === '' && after === '') {
                    appendTableWithHTML(parent, html, noBackground);
                    parent.removeFromParent();
                } else {
                    insertHTMLAsText(parent, 0, html, noBackground);
                }
                replaced = true;
            }
            if (before !== '') {
                text = parent.insertText(0, before);
                text.setAttributes(attrs);
            }
        } else {
            if (element.getType() === DocumentApp.ElementType.TEXT) {
                logError(ERR_FAILED_TO_INSERT, 'text element should not be a container');
                throw ERR_FAILED_TO_INSERT;
            }

            if (!replaced) {
                appendTableWithHTML(element, html, noBackground);
                removeElement(element);
                replaced = true;
            } else {
                removeElement(element);
            }
        }
    }
}

/**
 * todo
 *
 * @param html
 * @param noBackground
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

    var surroundingText = cursor.getSurroundingText(),
        surroundingTextOffset = cursor.getSurroundingTextOffset(),
        surroundingString = surroundingText.getText(),
        attrs = surroundingText.getAttributes(),
        before = surroundingString.substring(0, surroundingTextOffset),
        after = surroundingString.substring(surroundingTextOffset);

    clearText(element);

    // create temporary text to get access to text interface
    var text = cursor.insertText('temp');
    clearText(text);

    var parent = text.getParent();
    if (after !== '') {
        text = parent.insertText(0, after);
        text.setAttributes(attrs);
    }
    insertHTMLAsText(parent, 0, html, noBackground);
    if (before !== '') {
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
    var block = XmlService.parse(html);
    // var output = XmlService.getPrettyFormat().format(block);
    // Logger.log('block: ' + output);

    var attrs = {};
    attrs[DocumentApp.Attribute.FONT_FAMILY] = 'Consolas';

    // disable font style attrs by default so they don't carry over to new elements
    // todo: might not be necessary now that we're handling it up the stack
    attrs[DocumentApp.Attribute.BOLD] = false;
    attrs[DocumentApp.Attribute.ITALIC] = false;
    attrs[DocumentApp.Attribute.UNDERLINE] = false;
    attrs[DocumentApp.Attribute.STRIKETHROUGH] = false;

    var root = block.getRootElement();

    // set cell background color inserting a table
    if (cell !== undefined && !noBackground) {
        var style = root.getAttribute('style');
        var rootAttrs = addStyleAttrs({}, style);
        var cellAttrs = cell.getAttributes();
        cellAttrs[DocumentApp.Attribute.BACKGROUND_COLOR] =
            rootAttrs[DocumentApp.Attribute.BACKGROUND_COLOR];
        cell.setAttributes(cellAttrs);

        // todo: doesn't always work
        // cell.setBackgroundColor(rootAttrs[DocumentApp.Attribute.BACKGROUND_COLOR]);
    }

    insertNode(element, index, root, attrs, noBackground);
}

function insertNode(element, index, node, attrs, noBackground) {
    if (node.getType() === XmlService.ContentTypes.TEXT) {
        var str = node.getText();
        // Logger.log('text: ' + str);
        var text = element.insertText(index, str);
        text.setAttributes(attrs);
        return;
    }

    if (node.getType() === XmlService.ContentTypes.ELEMENT) {
        var child = node.asElement();
        var style = child.getAttribute('style');
        // Logger.log('style: ' + style);

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
    // Logger.log('styles: ' + styles);
    for (var i = 0; i < styles.length; i++) {
        var pieces = styles[i].split(':');
        if (pieces.length === 2) {
            addStyleAttr(attrs, pieces[0], pieces[1], noBackground);
        }
    }

    return attrs;
}

function addStyleAttr(attrs, key, val, noBackground) {
    key = key.trim().toLowerCase();
    val = val.trim().toLowerCase();

    // handle special cases
    switch (key) {
        // font style
        case 'font-weight':
        case 'font-style':
        case 'text-decoration':
            attr = ATTRIBUTES[val];
            if (attr !== undefined) {
                attrs[attr] = true;
            }
            return;
        case 'background':
            if (noBackground) {
                return;
            }
        case 'color':
            val = colorToHex(val);
            break;
    }

    // everything else
    var attr = ATTRIBUTES[key];
    if (attr !== undefined) {
        attrs[attr] = val;
    }
}

// util function to deep copy doc text attributes
function copyAttrs(attrs) {
    // todo: do literal copy if possible for performance
    return JSON.parse(JSON.stringify(attrs));
}

// util function to remove an element
function removeElement(element) {
    // Logger.log('removing element');

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

// util function to clear all text from an element
function clearText(element) {
    // Logger.log('clearing text');

    if (element.editAsText) {
        var text = element.editAsText();
        var len = text.getText().length;
        if (len > 0) {
            return text.deleteText(0, len - 1);
        }
    }
}
