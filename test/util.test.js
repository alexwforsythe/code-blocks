'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadServer, stubCache, plain } = require('./helpers/gas');

const BASE = ['constants.js', 'colors.js', 'util.js'];

test('arraysAreEqual is true for element-wise equal arrays', () => {
  const ctx = loadServer(BASE);
  assert.equal(ctx.arraysAreEqual([1, 2, 3], [1, 2, 3]), true);
});

test('arraysAreEqual is false for different lengths', () => {
  const ctx = loadServer(BASE);
  assert.equal(ctx.arraysAreEqual([1, 2], [1, 2, 3]), false);
});

test('arraysAreEqual is false when one side is null', () => {
  const ctx = loadServer(BASE);
  assert.equal(ctx.arraysAreEqual(null, [1]), false);
});

test('getUserPrefs maps stored string properties into a typed object', () => {
  const ctx = loadServer(BASE, {
    PropertiesService: {
      getUserProperties: () => ({
        getProperties: () => ({
          language: 'python',
          theme: 'agate',
          noBackground: 'true',
        }),
      }),
    },
  });
  assert.deepEqual(plain(ctx.getUserPrefs()), {
    language: 'python',
    theme: 'agate',
    noBackground: true,
  });
});

test('saveUserPrefs stores only the known keys, coerced to strings', () => {
  let stored;
  const ctx = loadServer(BASE, {
    PropertiesService: {
      getUserProperties: () => ({
        setProperties: (obj) => {
          stored = obj;
        },
      }),
    },
  });

  ctx.saveUserPrefs({
    language: 'go',
    theme: 'nord',
    noBackground: true,
    injected: 'should not be persisted',
  });

  assert.deepEqual(plain(stored), {
    language: 'go',
    theme: 'nord',
    noBackground: 'true',
  });
});

test('alreadySaved compares the incoming prefs against stored prefs', () => {
  const ctx = loadServer(BASE, {
    PropertiesService: {
      getUserProperties: () => ({
        getProperties: () => ({
          language: 'go',
          theme: 'nord',
          noBackground: 'false',
        }),
      }),
    },
  });

  assert.equal(
    ctx.alreadySaved({ language: 'go', theme: 'nord', noBackground: false }),
    true
  );
  assert.equal(
    ctx.alreadySaved({ language: 'go', theme: 'nord', noBackground: true }),
    false
  );
});

test('cacheSelection namespaces the cache key by document id', () => {
  const cache = stubCache();
  const ctx = loadServer(BASE, {
    DocumentApp: { getActiveDocument: () => ({ getId: () => 'DOC-123' }) },
    CacheService: { getUserCache: () => cache },
  });

  ctx.cacheSelection('some selected text');

  const keys = [...cache._store.keys()];
  assert.equal(keys.length, 1);
  assert.ok(
    keys[0].includes('DOC-123'),
    `expected cache key ${JSON.stringify(keys[0])} to include the document id`
  );
});

test('alreadySelected only matches a digest cached for the same document', () => {
  const docA = stubCache();
  const ctx = loadServer(BASE, {
    DocumentApp: { getActiveDocument: () => ({ getId: () => 'DOC-A' }) },
    CacheService: { getUserCache: () => docA },
  });

  ctx.cacheSelection('hello world');
  assert.equal(ctx.alreadySelected('hello world'), true);
  assert.equal(ctx.alreadySelected('different text'), false);
});
