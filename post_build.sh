#!/bin/sh

set -xe

temp_bundle="bundle.min.js.temp"
bundle="bundle.min.js"

echo "<script>" > ${temp_bundle}
cat "bundle.min.js" >> ${temp_bundle}
echo "</script>" >> ${temp_bundle}
mv ${temp_bundle} ${bundle}
