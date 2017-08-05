# Code Blocks

[Code Blocks](https://chrome.google.com/webstore/detail/code-blocks/ebieibfdjgmmimpldgengceekpfefmfd) is a syntax highlighter add-on for Google Docs.

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
$ npm run build
```

### Pushing Changes

**Note:** this only works for the project maintainer, since it requires
Google Drive authentication credentials.

```
$ npm run push
```

## Resources

* https://gsuite-developers.googleblog.com/2015/12/advanced-development-process-with-apps.html
