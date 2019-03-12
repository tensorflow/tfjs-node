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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "${SCRIPT_DIR}"
pip install -r requirements.txt

# Build the NPM package for tfjs-node.
# TODO(cais): Add a flag for GPU vs non-GPU.
cd "${SCRIPT_DIR}/../.."
rm -rf ./dist
yarn
yarn build-npm

# Run the reference Python benchmarks.
cd "${SCRIPT_DIR}"

DATA_ROOT="${SCRIPT_DIR}/data"
python benchmarks.py "${DATA_ROOT}"

# Run the tfjs-node benchmarks in TypeScript.
yarn
yarn ts-node benchmarks.ts
