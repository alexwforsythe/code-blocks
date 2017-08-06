var constants = {
    errors: {
        insert: 'Can\'t insert here.',
        getUserPreferences: 'Couldn\'t get user preferences.',
        selectText: 'Please select some text.'
    },
    props: {
        language: 'language',
        theme: 'theme',
        noBackground: 'no_background'
    },
    themes: {
        'default': 'default'
    },
    document: {
        /**
         * A map of CSS attributes to document attributes
         */
        attrs: {
            background: DocumentApp.Attribute.BACKGROUND_COLOR,
            bold: DocumentApp.Attribute.BOLD,
            color: DocumentApp.Attribute.FOREGROUND_COLOR,
            italic: DocumentApp.Attribute.ITALIC,
            'line-through': DocumentApp.Attribute.STRIKETHROUGH,
            underline: DocumentApp.Attribute.UNDERLINE
        },
        fonts: {
            consolas: 'Consolas'
        }
    }
};
