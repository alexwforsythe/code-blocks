const config = {
    title: 'Code Blocks',
    cache: {
        /**
         * Cache TTL in seconds
         */
        defaultTtl: 3600
    },
    hljs: {
        useLatest: false,
        defaultVersion: '9.7.0',
        urls: {
            cdnjsLib: 'https://api.cdnjs.com/libraries/highlight.js',
            cdnjsStyles: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/',
            ghThemes: 'https://api.github.com/repos/highlightjs/' +
                'cdn-release/contents/build/styles?ref=master'
        }
    }
};
