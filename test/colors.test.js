'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadServer } = require('./helpers/gas');

function colors() {
  return loadServer(['colors.js']);
}

test('colorToHex passes through a full six-digit hex colour', () => {
  assert.equal(colors().colorToHex('#0000ff'), '#0000ff');
});

test('colorToHex expands three-digit shorthand hex', () => {
  assert.equal(colors().colorToHex('#fff'), '#ffffff');
});

test('colorToHex resolves a named colour', () => {
  assert.equal(colors().colorToHex('red'), '#ff0000');
});

test('colorToHex converts a plain rgb() triple', () => {
  assert.equal(colors().colorToHex('rgb(0, 0, 255)'), '#0000ff');
});

test('colorToHex zero-pads each rgb channel to two hex digits', () => {
  // 1 -> "01", 2 -> "02", 255 -> "ff"
  assert.equal(colors().colorToHex('rgb(1, 2, 255)'), '#0102ff');
});

test('colorToHex keeps single-digit rgb channels from colliding with shorthand', () => {
  // "1"+"2"+"3" must not be read back as the shorthand #123 -> #112233
  assert.equal(colors().colorToHex('rgb(1, 2, 3)'), '#010203');
});

test('colorToHex drops the alpha channel from rgba()', () => {
  assert.equal(colors().colorToHex('rgba(255, 0, 0, 0.5)'), '#ff0000');
});

test('colorToHex converts hsl() to hex', () => {
  assert.equal(colors().colorToHex('hsl(0, 100%, 50%)'), '#ff0000');
});

test('colorToHex converts hsla() to hex, dropping alpha', () => {
  assert.equal(colors().colorToHex('hsla(120, 100%, 50%, 0.3)'), '#00ff00');
});

test('colorToHex expands four-digit hex and drops its alpha', () => {
  assert.equal(colors().colorToHex('#f00c'), '#ff0000');
});

test('colorToHex drops the alpha channel from eight-digit hex', () => {
  assert.equal(colors().colorToHex('#ff0000cc'), '#ff0000');
});

test('colorToHex resolves rebeccapurple', () => {
  assert.equal(colors().colorToHex('rebeccapurple'), '#663399');
});

test('colorToHex returns null for an unrecognised colour token', () => {
  assert.equal(colors().colorToHex('not-a-real-colour'), null);
});

test('colorToHex returns null for keywords with no hex equivalent', () => {
  assert.equal(colors().colorToHex('transparent'), null);
});
