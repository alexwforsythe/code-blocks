#!/usr/bin/env bash

set -e

dist_dir="./dist" && mkdir -p ${dist_dir}
bundle_filename="bundle.min.js"
bundle_file="./client/${bundle_filename}"

dist_gas () {
    cp ./server/*.js ${dist_dir}
}

bundle_js () {
    input_file="./client/sidebar.js"
    browserify -t 'uglifyify' ${input_file} | uglifyjs > ${bundle_file}
}

dist_js () {
    bundle_js

    # wrap bundled js in script tags and rename as html
    output_file="${dist_dir}/${bundle_filename}.html"
    echo "<script>" > ${output_file}
    cat ${bundle_file} >> ${output_file}
    echo "</script>" >> ${output_file}
}

dist_html () {
    cp ./client/*.html ${dist_dir}
}

bundle_css () {
    # wrap all theme css in style tags and bundle into html
    output_file="${dist_dir}/styles.html"
    echo "<html>" >> ${output_file}
    for filename in node_modules/highlight.js/styles/*.css; do
        base_name=$(basename ${filename})
        echo "<style id=\"${base_name}\">" >> ${output_file}
        cat ${filename} >> ${output_file}
        echo "</style>" >> ${output_file}
    done
    echo "</html>" >> ${output_file}

    # replace weird block comment specifiers ("/*!" -> "/**")
    sed -i -e s:\/\*\!:\*: ${output_file}
}

dist_css () {
    bundle_css

    # minify css
    html-minifier --remove-comments --minify-css -o ${output_file} ${output_file}
    [[ -f "${output_file}-e" ]] && rm "${output_file}-e"
}

dist_static () {
    dist_html
    dist_css
}
