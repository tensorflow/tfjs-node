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

# This script do the following steps:
# 1) Remove the existing pre-built binary tarball.
# 2) Run `yarn install-from-source` to build binding from source
# 3) Compress and upload the pre-built binary tarball.

set -e

# get package name based on os and processor
PACKAGE_NAME=$(node scripts/get-binary-name.js)
# get NAPI version
NAPI_VERSION=`node -p "process.versions.napi"`
# remove the pre-built binary tarball if it already exist
rm -f $PACKAGE_NAME
yarn install-from-source
if [ "$1" = "upload" ]; then
  # build a new pre-built binary tarball
  tar -czvf $PACKAGE_NAME -C lib/binding napi-v$NAPI_VERSION
  # upload pre-built binary tarball to gcloud
  PACKAGE_HOST=`node -p "require('./package.json').binary.host.split('.com/')[1] + '/napi-v' + process.versions.napi + '/' + require('./package.json').version + '/'"`
  gsutil cp $PACKAGE_NAME gs://$PACKAGE_HOST
fi
