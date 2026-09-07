'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadServer, plain } = require('./helpers/gas');

const BASE = ['constants.js', 'colors.js', 'util.js', 'document.js'];

/* ------------------------------------------------------------------ *
 * element predicates
 * ------------------------------------------------------------------ */

test('isCell recognises a table cell element', () => {
  const ctx = loadServer(BASE);
  assert.equal(ctx.isCell({ getType: () => 'TABLE_CELL' }), true);
  assert.equal(ctx.isCell({ getType: () => 'PARAGRAPH' }), false);
});

test('hasMultipleCells is true when more than one cell is in the range', () => {
  const ctx = loadServer(BASE);
  const cell = { getElement: () => ({ getType: () => 'TABLE_CELL' }) };
  const para = { getElement: () => ({ getType: () => 'PARAGRAPH' }) };
  assert.equal(ctx.hasMultipleCells({ getRangeElements: () => [cell, cell] }), true);
  assert.equal(ctx.hasMultipleCells({ getRangeElements: () => [cell, para] }), false);
});

test('hasMultipleCells is true when the range contains a whole table', () => {
  const ctx = loadServer(BASE);
  const table = { getElement: () => ({ getType: () => 'TABLE' }) };
  assert.equal(ctx.hasMultipleCells({ getRangeElements: () => [table] }), true);
});

/* ------------------------------------------------------------------ *
 * style -> document attribute mapping
 * ------------------------------------------------------------------ */

test('extendFromStyle maps colour and weight declarations to doc attributes', () => {
  const ctx = loadServer(BASE);
  const attrs = ctx.extendFromStyle(
    {},
    { getValue: () => 'color: #fff; font-weight: bold' },
    false
  );
  assert.deepEqual(plain(attrs), { FOREGROUND_COLOR: '#ffffff', BOLD: true });
});

test('setDocAttr does not set a colour attribute for an unresolved colour', () => {
  const ctx = loadServer(BASE);
  const attrs = {};
  ctx.setDocAttr(attrs, 'color', 'not-a-real-colour', false);
  assert.deepEqual(attrs, {});
});

test('setDocAttr clears bold on "font-weight: normal"', () => {
  const ctx = loadServer(BASE);
  const attrs = {};
  ctx.setDocAttr(attrs, 'font-weight', 'normal', false);
  assert.equal(attrs.BOLD, false);
});

test('setDocAttr clears italic on "font-style: normal"', () => {
  const ctx = loadServer(BASE);
  const attrs = {};
  ctx.setDocAttr(attrs, 'font-style', 'normal', false);
  assert.equal(attrs.ITALIC, false);
});

test('setDocAttr ignores background declarations when noBackground is set', () => {
  const ctx = loadServer(BASE);
  const attrs = {};
  ctx.setDocAttr(attrs, 'background', '#ffffff', true);
  assert.deepEqual(attrs, {});
});

/* ------------------------------------------------------------------ *
 * selection helpers
 * ------------------------------------------------------------------ */

test('getTextFromSelection ignores range elements that hold no editable text', () => {
  const ctx = loadServer(BASE);
  const textEl = {
    isPartial: () => false,
    getElement: () => ({
      asText: () => ({ getText: () => 'printf("hi");' }),
      editAsText: () => ({}),
    }),
  };
  const imageEl = {
    isPartial: () => false,
    getElement: () => ({ asText: () => ({ getText: () => '' }) }),
  };
  const selection = { getRangeElements: () => [textEl, imageEl] };

  assert.equal(ctx.getTextFromSelection(selection), 'printf("hi");');
});

test('getSelection asks the user to select text when there is no selection or cursor', () => {
  const ctx = loadServer(BASE, {
    DocumentApp: {
      getActiveDocument: () => ({
        getSelection: () => null,
        getCursor: () => null,
      }),
    },
  });

  assert.throws(
    () => ctx.getSelection(),
    (err) => {
      assert.equal(err, 'Please select some text.');
      return true;
    }
  );
});

test('getSelection returns an existing single-cell selection unchanged', () => {
  const selection = {
    getRangeElements: () => [
      { getElement: () => ({ getType: () => 'PARAGRAPH' }) },
    ],
  };
  const ctx = loadServer(BASE, {
    DocumentApp: {
      getActiveDocument: () => ({ getSelection: () => selection }),
    },
  });

  assert.equal(ctx.getSelection(), selection);
});
