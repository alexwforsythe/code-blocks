var constants = {
    title: 'Code Blocks',
    cache: {
        ttl: 3600 // in seconds
    },
    errors: {
        insert: 'Can\'t insert here.',
        getUserPreferences: 'Couldn\'t get user preferences.',
        selectText: 'Please select some text.',
        themeNotFound: 'Couldn\'t get theme.'
    },
    props: {
        language: 'language',
        theme: 'theme',
        noBackground: 'no_background'
    },
    themes: {
        base: 'default'
    },
    document: {
        /**
         * A map of CSS attributes to document attributes
         */
        docAttrs: {
            background: DocumentApp.Attribute.BACKGROUND_COLOR,
            bold: DocumentApp.Attribute.BOLD,
            color: DocumentApp.Attribute.FOREGROUND_COLOR,
            italic: DocumentApp.Attribute.ITALIC,
            'line-through': DocumentApp.Attribute.STRIKETHROUGH,
            underline: DocumentApp.Attribute.UNDERLINE
        },
        htmlAttrs: {
            fontWeight: 'font-weight',
            fontStyle: 'font-style',
            textDecoration: 'text-decoration',
            background: 'background',
            color: 'color'
        },
        fonts: {
            consolas: 'Consolas'
        }
    }
};
