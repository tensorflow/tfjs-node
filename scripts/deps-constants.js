/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
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
const path = require('path');
const name = require('../package.json').name;
const version = require('../package.json').version;

let libName = 'libtensorflow';
let frameworkLibName = 'libtensorflow_framework';
if (os.platform() === 'win32') {
  libName = 'tensorflow.dll';
  frameworkLibName = '';  // Not supported on Windows
} else if (os.platform() === 'darwin') {
  libName += '.dylib';
  frameworkLibName += '.dylib';
} else if (os.platform() === 'linux') {
  libName += '.so';
  frameworkLibName += '.so';
} else {
  throw Exception('Unsupported platform: ' + os.platform());
}

const depsPath = path.join(__dirname, '..', 'deps');
const depsLibPath = path.join(depsPath, 'lib');
const depsLibTensorFlowPath = path.join(depsLibPath, libName);
const depsLibTensorFlowFrameworkPath = path.join(depsLibPath, frameworkLibName);


let processor = '';
if (name.includes('gpu')) {
  processor = 'gpu';
} else {
  processor = 'cpu';
}

const CPU_DARWIN = `${processor}-darwin-${version}-v{napi_build_version}.tar.gz`;
const CPU_LINUX = `${processor}-linux-${version}-v{napi_build_version}.tar.gz`;
const GPU_LINUX = `${processor}-linux-${version}-v{napi_build_version}.tar.gz`;
const CPU_WINDOWS = `${processor}-windows-x86_64-1.13.1.zip`;
const GPU_WINDOWS = `${processor}-windows-x86_64-1.13.1.zip`;

module.exports = {
  depsLibPath,
  depsLibTensorFlowFrameworkPath,
  depsLibTensorFlowPath,
  depsPath,
  frameworkLibName,
  libName,
  CPU_DARWIN,
  CPU_LINUX,
  GPU_LINUX,
  CPU_WINDOWS,
  GPU_WINDOWS
};
