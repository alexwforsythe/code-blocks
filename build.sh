#!/usr/bin/env bash

set -euo pipefail

dist_dir="dist"
mkdir -p "${dist_dir}"

gas () {
    cp appsscript.json "${dist_dir}"
    cp server/*.js "${dist_dir}"
}

js () {
    input_file="client/sidebar.js"
    output_file="${dist_dir}/bundle.min.js.html"

    # bundle the sidebar, minify, and wrap in a <script> tag for HtmlService
    echo "<script>" > "${output_file}"
    browserify "${input_file}" | terser --compress --mangle >> "${output_file}"
    echo "</script>" >> "${output_file}"
}

html () {
    cp client/*.html "${dist_dir}"

    # stamp the real package version into the sidebar (replaces {{VERSION}})
    version=$(node -p "require('./package.json').version")
    perl -pi -e "s/\\{\\{VERSION\\}\\}/${version}/g" "${dist_dir}/sidebar.html"
}

css () {
    output_file="${dist_dir}/styles.html"

    # wrap every highlight.js theme in a <style id="theme-name"> and bundle
    # them into one html file that the add-on parses at runtime
    echo "<html>" > "${output_file}"
    for filename in node_modules/highlight.js/styles/*.css; do
        case "${filename}" in
            *.min.css) continue ;;
        esac

        theme_name=$(basename "${filename}" .css)
        theme="<style id=\"${theme_name}\">"
        theme+=$(cleancss -O0 "${filename}")
        theme+="</style>"
        echo "${theme}" >> "${output_file}"
    done
    echo "</html>" >> "${output_file}"
}

case "${1:-}" in
    "gas")    gas ;;
    "js")     js ;;
    "html")   html ;;
    "css")    css ;;
    "static") html && css ;;
    *)
        echo "usage: build.sh {gas|js|html|css|static}" >&2
        exit 1
        ;;
esac
