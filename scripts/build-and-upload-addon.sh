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
# 1) Remove the existing pre-built addon tarball.
# 2) Run `yarn install-from-source` to build binding from source
# 3) Compress and upload the pre-built addon tarball.

set -e

# get package name based on os and processor
PACKAGE_NAME=$(node scripts/get-addon-name.js)
# get NAPI version
NAPI_VERSION=`node -p "process.versions.napi"`
# remove the pre-built addon tarball if it already exist
rm -f $PACKAGE_NAME
yarn install-from-source
if [ "$1" = "upload" ]; then
  # build a new pre-built addon tarball
  tar -czvf $PACKAGE_NAME -C lib napi-v$NAPI_VERSION/tfjs_binding.node
  # upload pre-built addon tarball to gcloud
  PACKAGE_HOST=`node -p "require('./package.json').binary.host.split('.com/')[1] + '/napi-v' + process.versions.napi + '/' + require('./package.json').version + '/'"`
  gsutil cp $PACKAGE_NAME gs://$PACKAGE_HOST
fi

# Build and upload native node addon for Windows, do the following steps:
# 1) Delete deps and lib folder
# 2) run "yarn" to download libtensorflow c library and compile native node addon
# 3) Copy and paste the following commands in cmd to compress and upload the
#     addon to GCloud
# -----------------------------------------------------------------------------
# for /f %i in ('node scripts/get-addon-name.js') do set PACKAGE_NAME=%i
# for /f %i in ('node -p "process.versions.napi"') do set NAPI_VERSION=%i
# tar -czvf %PACKAGE_NAME% -C lib napi-v%NAPI_VERSION%/tfjs_binding.node
# for /f %i in ('node scripts/print-full-package-host') do set PACKAGE_HOST=%i
# gsutil cp %PACKAGE_NAME% gs://%PACKAGE_HOST%
# ------------------------------------------------------------------------------
#
# 4) Change field "name" in package.json to "@tensorflow/tfjs-node-gpu"
# 5) Copy and paste the following commands in cmd to compress and upload the
#     GPU addon to GCloud
# -----------------------------------------------------------------------------
# node scripts/install.js gpu download && yarn && yarn build-from-source
# for /f %i in ('node scripts/get-addon-name.js') do set PACKAGE_NAME=%i
# for /f %i in ('node -p "process.versions.napi"') do set NAPI_VERSION=%i
# tar -czvf %PACKAGE_NAME% -C lib napi-v%NAPI_VERSION%/tfjs_binding.node
# for /f %i in ('node scripts/print-full-package-host') do set PACKAGE_HOST=%i
# gsutil cp %PACKAGE_NAME% gs://%PACKAGE_HOST%
# ------------------------------------------------------------------------------
