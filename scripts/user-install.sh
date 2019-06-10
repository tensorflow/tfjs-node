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

set -e

# get package name based on os and processor
PACKAGE_NAME=$(node scripts/get-module-name.js)
# update package name in package.json.binary
sed -i -e 's/temp_package_name/'$PACKAGE_NAME'/' package.json
# run node-pre-gyp to load pre-built binary. Fall back to live build it node-pre-gyp fail.
node-pre-gyp install || yarn install-local
# revert package name in package.json.binary
sed -i -e 's/'$PACKAGE_NAME'/temp_package_name/' package.json
