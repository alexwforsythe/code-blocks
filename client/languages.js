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
    actionscript: require('highlight.js/lib/languages/actionscript'),
    apache: require('highlight.js/lib/languages/apache'),
    autohotkey: require('highlight.js/lib/languages/autohotkey'),
    bash: require('highlight.js/lib/languages/bash'),
    clojure: require('highlight.js/lib/languages/clojure'),
    clojurerepl: require('highlight.js/lib/languages/clojure-repl'),
    coffeescript: require('highlight.js/lib/languages/coffeescript'),
    cpp: require('highlight.js/lib/languages/cpp'),
    arduino: require('highlight.js/lib/languages/arduino'), // depends on cpp
    cs: require('highlight.js/lib/languages/cs'),
    css: require('highlight.js/lib/languages/css'),
    diff: require('highlight.js/lib/languages/diff'),
    dockerfile: require('highlight.js/lib/languages/dockerfile'),
    elixir: require('highlight.js/lib/languages/elixir'),
    erlang: require('highlight.js/lib/languages/erlang'),
    go: require('highlight.js/lib/languages/go'),
    gradle: require('highlight.js/lib/languages/gradle'),
    haskell: require('highlight.js/lib/languages/haskell'),
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
    processing: require('highlight.js/lib/languages/processing'),
    protobuf: require('highlight.js/lib/languages/protobuf'),
    python: require('highlight.js/lib/languages/python'),
    r: require('highlight.js/lib/languages/r'),
    ruby: require('highlight.js/lib/languages/ruby'),
    rust: require('highlight.js/lib/languages/rust'),
    scala: require('highlight.js/lib/languages/scala'),
    scss: require('highlight.js/lib/languages/scss'),
    sql: require('highlight.js/lib/languages/sql'),
    shell: require('highlight.js/lib/languages/shell'),
    stata: require('highlight.js/lib/languages/stata'),
    swift: require('highlight.js/lib/languages/swift'),
    thrift: require('highlight.js/lib/languages/thrift'),
    typescript: require('highlight.js/lib/languages/typescript'),
    verilog: require('highlight.js/lib/languages/verilog'),
    vhdl: require('highlight.js/lib/languages/vhdl'),
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
