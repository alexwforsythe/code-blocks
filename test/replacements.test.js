'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { replaceSpecialChars, replacements } = require('../client/replacements');

test('replaceSpecialChars converts curly quotes to straight quotes', () => {
  assert.equal(
    replaceSpecialChars('“hi” and ‘yo’'),
    '"hi" and \'yo\''
  );
});

test('replaceSpecialChars converts en/em dashes and the ellipsis', () => {
  assert.equal(
    replaceSpecialChars('a – b — c …'),
    'a - b -- c ...'
  );
});

test('replaceSpecialChars replaces a non-breaking space with a regular space', () => {
  assert.equal(replaceSpecialChars('a b'), 'a b');
});

test('replaceSpecialChars leaves ordinary ascii source untouched', () => {
  assert.equal(
    replaceSpecialChars('const x = "y"; // ok'),
    'const x = "y"; // ok'
  );
});

test('replacements is a non-empty map keyed by single characters', () => {
  const keys = Object.keys(replacements);
  assert.ok(keys.length > 5);
  assert.ok(keys.every((k) => k.length === 1));
});
