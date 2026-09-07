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
    # specialComments:0 strips ALL css comments - several highlight.js theme
    # headers contain things like `<foo@bar.com>` which would otherwise make
    # styles.html invalid XML and break XmlService.parse() in loadThemes()
    css_opts='optimizeBackground:off;replaceMultipleZeros:off;specialComments:0'
    for filename in node_modules/highlight.js/styles/*.css; do
        case "${filename}" in
            *.min.css) continue ;;
        esac

        theme_name=$(basename "${filename}" .css)
        theme="<style id=\"${theme_name}\">"
        theme+=$(cleancss -O1 "${css_opts}" "${filename}")
        theme+="</style>"
        echo "${theme}" >> "${output_file}"
    done
    echo "</html>" >> "${output_file}"

    # guard against a future theme reintroducing markup that XmlService.parse
    # would choke on (a bare '<' or an unescaped '&')
    stray=$(sed -E 's#</?(style|html)[^>]*>##g' "${output_file}" \
        | perl -ne 'print "$.\n" if /<|&(?!amp;|lt;|gt;|quot;|apos;|#)/')
    if [ -n "${stray}" ]; then
        echo "css: ${output_file} has stray '<' or '&' (line ${stray}) - XmlService.parse will fail" >&2
        exit 1
    fi
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
