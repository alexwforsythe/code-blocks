#!/usr/bin/env bash

set -e

gen_dir="./.gen"
mkdir -p ${gen_dir}

### client

# copy html files
cp ./client/*.html ${gen_dir}

# wrap bundled js in script tags and rename as html
input_file="client/bundle.min.js"
output_file="${gen_dir}/bundle.min.js.html"
echo "<script>" > ${output_file}
cat ${input_file} >> ${output_file}
echo "</script>" >> ${output_file}

# wrap all theme css in style tags and bundle into html
output_file="${gen_dir}/styles.html"
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

# minify styles bundle
html-minifier --remove-comments --minify-css -o ${output_file} ${output_file}
[[ -f "${output_file}-e" ]] && rm "${output_file}-e"

### server

# copy gas files
cp ./server/*.js ${gen_dir}
