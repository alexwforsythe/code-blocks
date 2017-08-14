# Code Blocks

[Code Blocks](https://chrome.google.com/webstore/detail/code-blocks/ebieibfdjgmmimpldgengceekpfefmfd) is a syntax highlighter add-on for Google Docs.

#### A quick note on requesting new languages:

Code Blocks is powered by [highlight.js](https://highlightjs.org/) and
can only provide syntax highlighting for languages that it supports. If
you would like Code Blocks to add support for a language that is
implemented by highlight.js, feel free to submit a request via the
[issue tracker](https://github.com/alexwforsythe/code-blocks/issues/new).
Otherwise, please refer to their page on requesting new languages, found
[here](http://highlightjs.readthedocs.io/en/latest/language-requests.html).

## Contributing

### Setup

```
$ npm install
```

#### Webstorm

Settings:

* `Languages & Frameworks` > `JavaScript`
    1. `JavaScript language version`: `ECMAScript 5.1`
    2. Check `Prefer Strict mode`
    3. `Libraries`
        1. Click `Download...`
        2. Select `TypeScript community stubs`
        3. Select `google-apps-script-DefinitelyTyped`
        4. Click `Download and Install`

### Building

```
$ npm run dist
```

### Pushing Changes

**NOTE:** The following command only works for the project maintainer,
because it requires the user to be authenticated via Google Drive.

| Command | Description |
| --- | --- |
| npm run push:gas | just GAS files |
| npm run push:js | just `sidebar.js` |
| npm run push:static | just HTML & CSS |
| npm run push | everything |

## Resources

* https://developers.google.com/apps-script/guides/support/best-practices
* https://gsuite-developers.googleblog.com/2015/12/advanced-development-process-with-apps.html
* http://googleappsscript.blogspot.com/2010/06/optimizing-spreadsheet-operations.html
