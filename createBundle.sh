#!/bin/sh

folder_path="./build"
archive_name="translate.alfredworkflow"

cd "$folder_path"
zip -r "$archive_name" ./*
find . -mindepth 1 -maxdepth 1 ! -name "$archive_name" -exec rm -rf {} \;