---
layout: page
---

# Contributing

[![clasp](https://img.shields.io/badge/built%20with-clasp-4285f4.svg)](https://github.com/google/clasp)

## Setup

```sh
npm install
```

## Building

```sh
npm run build
```

## Testing

```sh
npm test
```

Unit tests use the built-in Node test runner (`node --test`, Node 22+) and
have no extra dependencies. The server files are loaded into a `node:vm`
sandbox with stubbed Google services (see `test/helpers/gas.js`).

## Pushing changes

Each command pushes to the script project configured in `.clasp.json`. Run
`clasp login` first, and `clasp create` once to make your own project (see
[Running a local copy](README.md#running-a-local-copy) for the full flow,
including installing it as a test add-on).

| Command               | Description       |
| --------------------- | ----------------- |
| `npm run push:gas`    | just GAS files    |
| `npm run push:js`     | just `sidebar.js` |
| `npm run push:static` | just HTML & CSS   |
| `npm run push`        | everything        |

## Google Apps Script Resources

- <https://developers.google.com/apps-script/guides/clasp>
- <https://github.com/google/clasp/blob/master/docs/typescript.md>
- <https://developers.google.com/apps-script/guides/support/best-practices>
- <https://gsuite-developers.googleblog.com/2015/12/advanced-development-process-with-apps.html>
- <http://googleappsscript.blogspot.com/2010/06/optimizing-spreadsheet-operations.html>
