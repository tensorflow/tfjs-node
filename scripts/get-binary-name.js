/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
const os = require('os');
const name = require('../package.json').name;
const version = require('../package.json').version;
// const napiVersion = require('../package.json').binary.napi_versions[0];

const isCPU = !name.includes('gpu');
const platform = os.platform();

const CPU_DARWIN = `CPU-darwin-${version}.tar.gz`;
const CPU_LINUX = `CPU-linux-${version}.tar.gz`;
const GPU_LINUX = `GPU-linux-${version}.tar.gz`;
const CPU_WINDOWS = `CPU-windows-${version}.zip`;
const GPU_WINDOWS = `GPU-windows-${version}.zip`;

let binaryName;

if (isCPU) {
  if (platform === 'linux') {
    binaryName = CPU_LINUX;
  } else if (platform === 'darwin') {
    binaryName = CPU_DARWIN;
  } else if (platform === 'win32') {
    binaryName = CPU_WINDOWS;
  }
} else {
  if (platform === 'linux') {
    binaryName = GPU_LINUX;
  } else if (platform === 'win32') {
    binaryName = GPU_WINDOWS;
  }
}

console.log(binaryName);

module.exports = {
  binaryName
};
