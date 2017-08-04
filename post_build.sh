#!/bin/sh

set -xe

temp_bundle="client/bundle.min.js.temp"
bundle="client/bundle.min.js"

echo "<script>" > ${temp_bundle}
cat ${bundle} >> ${temp_bundle}
echo "</script>" >> ${temp_bundle}
mv ${temp_bundle} ${bundle}
