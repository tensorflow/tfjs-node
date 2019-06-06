#!/usr/bin/env bash
# Copyright 2019 Google Inc. All Rights Reserved.
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

# Before you run this script, do this:
# 1) Checkout the master branch of this repo.
# 2) Run `yarn install-local` to build binding from source
# 3) Run this script as `./scripts/compress-and-upload-binary.sh` from the project base dir.

set -e

# BRANCH=`git rev-parse --abbrev-ref HEAD`
# ORIGIN=`git config --get remote.origin.url`

# if [ "$BRANCH" != "master" ] && [ "$BRANCH" != "0.3.x" ]; then
#   echo "Error: Switch to the master or a release branch before uploading binary."
#   exit
# fi

# if ! [ -z "$(git status --porcelain)" ]; then
#   echo "Error: Please clear local changes before compress and upload pre-built binary."
#   exit
# fi

# if ! [[ "$ORIGIN" =~ tensorflow/tfjs-node ]]; then
#   echo "Error: Switch to the main repo (tensorflow/tfjs-node) before uploading binary."
#   exit
# fi

# get package name based on os and processor
PACKAGE_NAME=$(node scripts/print-module-name.js)
sed -i -e 's/temp_package_name/'$PACKAGE_NAME'/' package.json

# remove the pre-built binary tarball if it already exist
rm -f napi-v3.tar.gz
# build a new pre-built binary tarball
tar -czvf napi-v3.tar.gz -C lib/binding napi-v3
# upload pre-built binary tarball to gcloud
PACKAGE_HOST=`node -p "require('./package.json').binary.host.split('.com/')[1] + '/' + require('./package.json').version + '/'"`
gsutil cp napi-v3.tar.gz gs://$PACKAGE_HOST
