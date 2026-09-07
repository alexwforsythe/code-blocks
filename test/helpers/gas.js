'use strict';

/**
 * Test harness for the Apps Script server code.
 *
 * The server files are plain scripts that Apps Script concatenates into one
 * global scope (no module system). We reproduce that here by evaluating them
 * in a shared `node:vm` context seeded with just enough of the Apps Script
 * API surface for the code under test.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const SERVER_DIR = path.join(ROOT, 'server');

function attributeEnum() {
  return {
    BACKGROUND_COLOR: 'BACKGROUND_COLOR',
    FOREGROUND_COLOR: 'FOREGROUND_COLOR',
    BOLD: 'BOLD',
    ITALIC: 'ITALIC',
    UNDERLINE: 'UNDERLINE',
    STRIKETHROUGH: 'STRIKETHROUGH',
    FONT_FAMILY: 'FONT_FAMILY',
  };
}

function elementTypeEnum() {
  return {
    TABLE: 'TABLE',
    TABLE_CELL: 'TABLE_CELL',
    TABLE_ROW: 'TABLE_ROW',
    PARAGRAPH: 'PARAGRAPH',
    TEXT: 'TEXT',
    BODY_SECTION: 'BODY_SECTION',
  };
}

function stubCache() {
  const store = new Map();
  return {
    _store: store,
    get: (k) => (store.has(k) ? store.get(k) : null),
    getAll: (keys) => {
      const out = {};
      keys.forEach((k) => {
        if (store.has(k)) out[k] = store.get(k);
      });
      return out;
    },
    put: (k, v) => store.set(k, v),
    putAll: (obj) => Object.keys(obj).forEach((k) => store.set(k, obj[k])),
    remove: (k) => store.delete(k),
  };
}

function defaultStubs() {
  return {
    console,
    DocumentApp: {
      Attribute: attributeEnum(),
      ElementType: elementTypeEnum(),
    },
    PropertiesService: {
      getUserProperties: () => ({
        getProperties: () => ({}),
        setProperties: () => {},
      }),
    },
    CacheService: {
      getScriptCache: () => stubCache(),
      getUserCache: () => stubCache(),
    },
    Utilities: {
      DigestAlgorithm: { MD5: 'MD5' },
      // Deterministic byte-array "digest" good enough for equality checks.
      computeDigest: (_algo, str) =>
        Array.from(Buffer.from(String(str))).slice(0, 16),
    },
    HtmlService: {
      createHtmlOutputFromFile: () => ({ getContent: () => '<html></html>' }),
      createTemplateFromFile: () => ({
        evaluate: () => ({ setTitle: () => ({}) }),
      }),
      SandboxMode: { IFRAME: 'IFRAME' },
    },
    XmlService: {
      parse: () => ({
        getRootElement: () => ({
          getChildren: () => [],
          getText: () => '',
          getAttribute: () => null,
          getAllContent: () => [],
        }),
      }),
      ContentTypes: { TEXT: 'TEXT', ELEMENT: 'ELEMENT' },
    },
    Logger: { log: () => {} },
  };
}

function isPlainObject(value) {
  return (
    value != null && typeof value === 'object' && !Array.isArray(value)
  );
}

function deepMerge(base, override) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const key of Object.keys(override || {})) {
    if (isPlainObject(override[key]) && isPlainObject(base[key])) {
      out[key] = deepMerge(base[key], override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

/**
 * Evaluate one or more server files in a fresh shared context.
 *
 * @param {string[]} files    file names relative to `server/`
 * @param {object}   overrides partial Apps Script stubs, deep-merged over the
 *                             defaults (e.g. `{ DocumentApp: { getActiveDocument } }`)
 * @returns {object} the context global; server globals are properties on it
 */
function loadServer(files, overrides = {}) {
  const sandbox = deepMerge(defaultStubs(), overrides);
  const context = vm.createContext(sandbox);
  for (const file of files) {
    const code = fs.readFileSync(path.join(SERVER_DIR, file), 'utf8');
    vm.runInContext(code, context, { filename: `server/${file}` });
  }
  return context;
}

/**
 * Deep-clone a value out of the vm realm into a plain host object, so that
 * `node:assert/strict` deepEqual (which also compares prototypes) can be used
 * against ordinary object literals in the test file.
 */
function plain(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

module.exports = {
  loadServer,
  stubCache,
  plain,
  attributeEnum,
  elementTypeEnum,
  ROOT,
  SERVER_DIR,
};
