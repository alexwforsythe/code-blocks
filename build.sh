#!/usr/bin/env bash

set -e

dist_dir="dist"
mkdir -p ${dist_dir}

gas () {
    cp server/*.js ${dist_dir}
}

js () {
    # wrap bundled js in script tags and rename as html
    input_file="client/sidebar.js"
    output_file="${dist_dir}/bundle.min.js.html"
    echo "<script>" > ${output_file}
    browserify -t 'uglifyify' ${input_file} | uglifyjs >> ${output_file}
    echo "</script>" >> ${output_file}
}

html () {
    cp client/*.html ${dist_dir}
}

css () {
    test_file="sidebar.min.css"
    output_file="${dist_dir}/styles.html"

    optimizations="optimizeBackground:off;"
    optimizations+="replaceMultipleZeros:off;"
    optimizations+="specialComments:off"

    # wrap all theme css in style tags and bundle into html
    echo "<html>" > ${output_file}
    for filename in node_modules/highlight.js/styles/*.css; do
        theme_name=$(basename ${filename} .css)
        if [[ ${theme_name} != 'darkula' ]]; then
            theme="<style id=\"${theme_name}\">"
            theme+=$(cleancss --debug -O1 ${optimizations} ${filename})
            theme+="</style>"
            echo ${theme} >> ${output_file}
        fi
    done
    echo "</html>" >> ${output_file}
}

case "$1" in
    "gas")    gas;;
    "js")     js;;
    "html")   html;;
    "css")    css;;
    "static") html && css;;
    *)
        echo "invalid command: $1"
        exit 1
        ;;
esac
