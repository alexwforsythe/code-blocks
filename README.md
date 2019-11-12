![img](https://repository-images.githubusercontent.com/68638466/d3069380-02d3-11ea-8d09-bb881c87c125)

[![clasp](https://img.shields.io/badge/built%20with-clasp-4285f4.svg)](https://github.com/google/clasp) [![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/alexwforsythe)

## Usage

### Installation

Code Blocks is available on the [G Suite Marketplace](https://chrome.google.com/webstore/detail/code-blocks/ebieibfdjgmmimpldgengceekpfefmfd).
Select **Install** to begin using it in Google Docs.

### Starting the add-on

![starting](https://user-images.githubusercontent.com/1639061/68648430-3b709300-04d5-11ea-912f-2e767f37db56.gif)

### Formatting inline code

![inline-formatting](https://user-images.githubusercontent.com/1639061/68643446-48d25100-04c6-11ea-96e8-090333e95559.gif)

### Formatting code blocks

![blocks-formatting](https://user-images.githubusercontent.com/1639061/68649759-51338780-04d8-11ea-9e39-5793dec16a4e.gif)

### Reformatting code blocks

![reformatting-blocks](https://user-images.githubusercontent.com/1639061/68648457-4297a100-04d5-11ea-9787-6e9ecbedfdc1.gif)

### Previewing themes

Examples of the different color themes applied to various languages can be
found on the [highlight.js demo page](https://highlightjs.org/static/demo/).

### Unformatting code

To clear formatting in Docs, highlight the text and select
`Format > Clear Formatting` from the toolbar. The keyboard shortcut is
<kbd>Cmd</kbd>+<kbd>/</kbd> on OS X and <kbd>Ctrl</kbd>+<kbd>/</kbd> on
Windows:
https://support.google.com/docs/answer/179738

This will not remove the table that the text lives in if it's a "code block".
To do that, you'll have to copy the text and paste it outside the table, then
right-click the table and select **Delete table**.

## Limitations

### New language support

Code Blocks is built with [highlight.js](https://highlightjs.org/) and can only
provide syntax highlighting for languages that are supported by that library.
If you'd like to see Code Blocks support a language that is not yet implemented
by highlight.js, please refer to their page on requesting new languages, found
[here](http://highlightjs.readthedocs.io/en/latest/language-requests.html).

### Real-time syntax highlighting

Codes Blocks uses Google's
[Apps Script](https://developers.google.com/apps-script/), a server-side
JavaScript platform, to interact with Docs and format code. Each time the add-on
formats a snippet of code, a request is made to the Apps Script backend to
modify the current Doc. There are a few limitations of this platform that
prevent Code Blocks from formatting code as you type:
* The [`onEdit`](https://developers.google.com/apps-script/guides/triggers#onedite)
event that fires when a user modifies content is only available in Sheets
* [Time-driven triggers](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers)
can only be used once per hour at most
* Each request to modify the current Doc can take multiple seconds, so code
formatting cannot be performed in real-time
* The number of requests needed to update a Doc in near real-time may exceed
the service API quotas

### Keyboard Shortcuts

Keyboard shortcuts can only be handled by Code Blocks if the add-on sidebar is
focused, which would require users to click the sidebar anyway.

Keyboard events in the active document cannot currently be handled by Docs
add-ons:
https://issuetracker.google.com/issues/79461369

## Contributing

### Setup

```
$ npm install
```

### Building

```
$ npm run build
```

### Pushing Changes

**NOTE:** The following commands only work for the project maintainer
because they require Google Drive authorization.

| Command | Description |
| --- | --- |
| `npm run push:gas` | just GAS files |
| `npm run push:js` | just `sidebar.js` |
| `npm run push:static` | just HTML & CSS |
| `npm run push` | everything |

## Google Apps Script Resources

* https://developers.google.com/apps-script/guides/clasp
* https://github.com/google/clasp/blob/master/docs/typescript.md
* https://developers.google.com/apps-script/guides/support/best-practices
* https://gsuite-developers.googleblog.com/2015/12/advanced-development-process-with-apps.html
* http://googleappsscript.blogspot.com/2010/06/optimizing-spreadsheet-operations.html

---

[Homepage](https://www.alexwforsythe.com/code-blocks/) | [G Suite Marketplace](https://chrome.google.com/webstore/detail/code-blocks/ebieibfdjgmmimpldgengceekpfefmfd) | [Privacy Policy](https://www.alexwforsythe.com/code-blocks/privacy-policy) | [Terms of Service](https://www.alexwforsythe.com/code-blocks/terms-of-service)
