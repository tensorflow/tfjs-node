#!/usr/bin/env bash
# Copyright 2018 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =============================================================================

set -e

# The binding builds with a symlink by default, for NPM packages change the
# download option to move libtensorflow next to the prebuilt binary.
sed -i -e 's/symlink/move/' binding.gyp

# Build CPU:
rimraf dist/
# get package name based on os and processor
PACKAGE_NAME=$(node scripts/print-module-name.js)
echo $PACKAGE_NAME
# remove the pre-built binary tarball if it already exist
rm -f $PACKAGE_NAME
# update package name in package.json.binary
sed -i -e 's/temp_package_name/'$PACKAGE_NAME'/' package.json
yarn install-local
if [ "$1"=="upload" ]; then
  # build a new pre-built binary tarball
  tar -czvf $PACKAGE_NAME -C lib/binding napi-v3
  # upload pre-built binary tarball to gcloud
  PACKAGE_HOST=`node -p "require('./package.json').binary.host.split('.com/')[1] + '/napi-v3/' + require('./package.json').version + '/'"`
  gsutil cp $PACKAGE_NAME gs://$PACKAGE_HOST
fi
yarn prep
tsc --sourceMap false
npm pack
sed -i -e 's/'$PACKAGE_NAME'/temp_package_name/' package.json


# Build GPU:
# sed -i -e 's/tfjs-node"/tfjs-node-gpu"/' package.json
# sed -i -e 's/install.js"/install.js gpu download"/' package.json
# rimraf deps/
# rimraf dist/
# yarn
# yarn prep
# tsc --sourceMap false
# npm pack

# Revert GPU changes:
# git checkout .
