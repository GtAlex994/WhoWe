#!/bin/bash

# Runs as the "functions" codebase's predeploy hook (see firebase.json), from
# the project root. `firebase.json`'s functions "source" is just `functions/`,
# so nothing outside that directory is bundled with the deployed function —
# this copies the Next.js build output in before Firebase zips it up.

set -e

rm -rf functions/.next functions/public
mkdir -p functions/.next/standalone/.next
cp -r .next/standalone/. functions/.next/standalone/
cp -r .next/static functions/.next/standalone/.next/static
cp -r public functions/public
