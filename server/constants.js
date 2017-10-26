var constants = {
    title: 'Code Blocks',
    cache: {
        ttl: 14400, // in seconds
        previewText: 'preview_text'
    },
    errors: {
        insert: 'Can\'t insert here.',
        getUserPreferences: 'Couldn\'t get user preferences.',
        selectText: 'Please select some text.',
        themeNotFound: 'Couldn\'t get theme.',
        getSelection: 'Couldn\'t get selection.',
        multipleBlocks: 'Can\'t format multiple blocks.'
    },
    themes: {
        base: 'default'
    },
    document: {
        font: 'Consolas',
        /**
         * A map of CSS attributes to document attributes.
         */
        docAttrs: {
            background: DocumentApp.Attribute.BACKGROUND_COLOR,
            bold: DocumentApp.Attribute.BOLD,
            bolder: DocumentApp.Attribute.BOLD,
            '700': DocumentApp.Attribute.BOLD, // juice transforms bold to 700
            normal: undefined, // to reset bold
            '400': undefined,
            color: DocumentApp.Attribute.FOREGROUND_COLOR,
            italic: DocumentApp.Attribute.ITALIC,
            'line-through': DocumentApp.Attribute.STRIKETHROUGH,
            underline: DocumentApp.Attribute.UNDERLINE
        },
        cssAttrs: {
            fontWeight: 'font-weight',
            fontStyle: 'font-style',
            textDecoration: 'text-decoration',
            background: 'background',
            color: 'color'
        }
    }
};
