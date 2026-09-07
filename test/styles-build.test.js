'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ROOT } = require('./helpers/gas');

const STYLES = path.join(ROOT, 'dist', 'styles.html');

/**
 * loadThemes() runs XmlService.parse() over the bundled styles.html, so the
 * file has to be well-formed XML. highlight.js theme headers contain things
 * like `<name@example.com>`; the build must strip comments and must not leak
 * any other stray markup into the <style> text.
 */
test('build.sh css produces well-formed, comment-free styles.html', () => {
  execFileSync('bash', ['build.sh', 'css'], { cwd: ROOT, stdio: 'pipe' });

  const html = fs.readFileSync(STYLES, 'utf8').trim();

  assert.ok(html.startsWith('<html>'), 'starts with <html>');
  assert.ok(html.endsWith('</html>'), 'ends with </html>');

  const opens = html.match(/<style id="[^"]+">/g) || [];
  const closes = html.match(/<\/style>/g) || [];
  assert.equal(opens.length, closes.length, 'every <style> is closed');
  assert.ok(opens.length > 50, `expected many themes, got ${opens.length}`);

  assert.equal(html.match(/\/\*/g), null, 'no CSS comments survive');

  const body = html.replace(/<\/?(?:style|html)[^>]*>/g, '');
  assert.equal(body.match(/</g), null, 'no stray "<" in <style> text');
  assert.equal(
    body.match(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g),
    null,
    'no unescaped "&" in <style> text'
  );
});
