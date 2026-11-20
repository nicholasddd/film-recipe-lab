#!/bin/sh
# Release Film Recipe Lab.
#
# Bumps the cache-busting ?v= on every local <script> in index.html (so browsers never
# mix an old cached file with a new one), then commits and pushes if you give a message.
# GitHub Pages rebuilds the live site about a minute after the push.
#
#   tools/release.sh                      # bump the version only
#   tools/release.sh "Add Foggy City"     # bump, commit everything, push
set -e
cd "$(dirname "$0")/.."

v=$(date +%Y%m%d-%H%M)
# -i.bak works with both BSD (macOS) and GNU sed
sed -i.bak -E "s/\?v=[0-9A-Za-z-]+\"/?v=$v\"/g" index.html && rm -f index.html.bak
echo "Script version: $v"

if [ -n "$1" ]; then
  git add -A
  git commit -m "$1"
  git push
  echo "Pushed. The live site updates in about a minute: https://nicholasddd.github.io/film-recipe-lab/"
fi
