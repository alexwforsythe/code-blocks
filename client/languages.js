'use strict';

var hljs = require('highlight.js/lib/highlight');

/**
 * A map of language names to their respective highlight.js libraries. New
 * languages should be added here.
 *
 * Each lib must be "required" explicitly (i.e. not inside a loop) for
 * browserify to recognize it as part of the dependency graph.
 *
 * @type {Object}
 */
const languages = {
    apache: require('highlight.js/lib/languages/apache'),
    autohotkey: require('highlight.js/lib/languages/autohotkey'),
    bash: require('highlight.js/lib/languages/bash'),
    coffeescript: require('highlight.js/lib/languages/coffeescript'),
    cpp: require('highlight.js/lib/languages/cpp'),
    cs: require('highlight.js/lib/languages/cs'),
    css: require('highlight.js/lib/languages/css'),
    diff: require('highlight.js/lib/languages/diff'),
    dockerfile: require('highlight.js/lib/languages/dockerfile'),
    go: require('highlight.js/lib/languages/go'),
    gradle: require('highlight.js/lib/languages/gradle'),
    http: require('highlight.js/lib/languages/http'),
    ini: require('highlight.js/lib/languages/ini'),
    java: require('highlight.js/lib/languages/java'),
    javascript: require('highlight.js/lib/languages/javascript'),
    json: require('highlight.js/lib/languages/json'),
    kotlin: require('highlight.js/lib/languages/kotlin'),
    lua: require('highlight.js/lib/languages/lua'),
    makefile: require('highlight.js/lib/languages/makefile'),
    markdown: require('highlight.js/lib/languages/markdown'),
    matlab: require('highlight.js/lib/languages/matlab'),
    nginx: require('highlight.js/lib/languages/nginx'),
    objectivec: require('highlight.js/lib/languages/objectivec'),
    perl: require('highlight.js/lib/languages/perl'),
    php: require('highlight.js/lib/languages/php'),
    powershell: require('highlight.js/lib/languages/powershell'),
    python: require('highlight.js/lib/languages/python'),
    r: require('highlight.js/lib/languages/r'),
    ruby: require('highlight.js/lib/languages/ruby'),
    scala: require('highlight.js/lib/languages/scala'),
    sql: require('highlight.js/lib/languages/sql'),
    shell: require('highlight.js/lib/languages/shell'),
    swift: require('highlight.js/lib/languages/swift'),
    thrift: require('highlight.js/lib/languages/thrift'),
    typescript: require('highlight.js/lib/languages/typescript'),
    x86asm: require('highlight.js/lib/languages/x86asm'),
    xml: require('highlight.js/lib/languages/xml'),
    yaml: require('highlight.js/lib/languages/yaml')
};

/**
 * @returns {hljs} an instance of the highlight.js library with
 * each configured language registered to it
 */
function register() {
    Object.keys(languages).forEach(function register(name) {
        hljs.registerLanguage(name, languages[name]);
    });

    return hljs;
}

module.exports = {
    register: register
};
