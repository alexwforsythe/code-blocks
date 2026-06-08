#!/usr/bin/env bash
export PATH=$PATH:./node_modules/.bin
bash build.sh gas && bash build.sh js && bash build.sh static
