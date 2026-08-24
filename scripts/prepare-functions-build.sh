#!/bin/bash

# Runs as the "functions" codebase's predeploy hook (see firebase.json), from
# the project root. `firebase.json`'s functions "source" is just `functions/`,
# so nothing outside that directory is bundled with the deployed function —
# this copies the Next.js build output in before Firebase zips it up.
#
# index.js runs `.next/standalone/server.js` as a child process (the
# documented way to run a standalone build) rather than requiring it as a
# module, so `.next/static` and `public` need to land where that server
# itself expects them: inside the standalone directory.

set -e

rm -rf functions/.next functions/public
mkdir -p functions/.next/standalone/.next
cp -r .next/standalone/. functions/.next/standalone/
cp -r .next/static functions/.next/standalone/.next/static
cp -r public functions/.next/standalone/public
