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
            background: 'BACKGROUND_COLOR',
            bold: 'BOLD',
            bolder: 'BOLD',
            '700': 'BOLD', // juice transforms bold to 700
            normal: undefined, // to reset bold
            '400': undefined,
            color: 'FOREGROUND_COLOR',
            italic: 'ITALIC',
            'line-through': 'STRIKETHROUGH',
            underline: 'UNDERLINE'
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
