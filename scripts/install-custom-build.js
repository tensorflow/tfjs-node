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

const {symlinkDepsLib} = require('./deps-stage.js');
const path = require('path');
const os = require('os');
const {frameworkLibName, libName} = require('./deps-constants.js');

let sourceDir = process.argv[2];
if (sourceDir == null) {
  throw new Error(
      'Please specify the directory of the TF repo. ' +
      'Usage: install-custom-build sourceDir');
}
sourceDir = path.join(sourceDir, 'bazel-bin', 'tensorflow');
const targetDir = path.join(__dirname, '..', 'build', 'Release');

const libPath = path.join(sourceDir, libName);
const frameworkPath = path.join(sourceDir, frameworkLibName);
const destLibPath = path.join(targetDir, libName);
const destFrameworkPath = path.join(targetDir, frameworkLibName);
console.log(libPath, frameworkPath, destLibPath, destFrameworkPath);
// symlinkDepsLib(libPath, frameworkPath, destLibPath, destFrameworkPath);
