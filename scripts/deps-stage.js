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

const fs = require('fs');
const path = require('path');
const util = require('util');

const copy = util.promisify(fs.copyFile);
const os = require('os');
const rename = util.promisify(fs.rename);
const symlink = util.promisify(fs.symlink);
const {
  depsLibTensorFlowFrameworkPath,
  depsLibTensorFlowPath,
  frameworkLibName,
  libName
} = require('./deps-constants.js');

/**
 * Symlinks the extracted libtensorflow library to the destination path. If the
 * symlink fails, a copy is made.
 */
async function symlinkDepsLib(
    libPath, frameworkPath, destLibPath, destFrameworkPath) {
  if (destLibPath == null || destFrameworkPath == null) {
    throw new Error('Destination path not supplied!');
  }
  try {
    await symlink(libPath, destLibPath);
    if (frameworkLibName !== '') {
      await symlink(frameworkPath, destFrameworkPath);
    }
  } catch (e) {
    console.error(
        `  * Symlink of ${destLibPath} failed, creating a copy on disk.`);
    await copy(libPath, destLibPath);
    if (frameworkLibName !== '') {
      await copy(frameworkPath, destFrameworkPath);
    }
  }
}

/**
 * Moves the deps library path to the destination path.
 */
async function moveDepsLib(
    libPath, frameworkPath, destLibPath, destFrameworkPath) {
  await rename(libPath, destLibPath);
  if (frameworkLibName !== '') {
    await rename(frameworkPath, destFrameworkPath);
  }
}

/**
 * Symlink or move libtensorflow for building the binding.
 */
async function run() {
  // Some windows machines contain a trailing " char:
  if (targetDir != undefined && targetDir.endsWith('"')) {
    targetDir = targetDir.substr(0, targetDir.length - 1);
  }

  const libPath = depsLibTensorFlowPath;
  const frameworkPath = depsLibTensorFlowFrameworkPath;
  const destLibPath = path.join(targetDir, libName);
  const destFrameworkPath = path.join(targetDir, frameworkLibName);

  if (action.endsWith('symlink')) {
    // Symlink will happen during `node-gyp rebuild`
    await symlinkDepsLib(
        libPath, frameworkPath, destLibPath, destFrameworkPath);
  } else if (action.endsWith('move')) {
    // Move action is used when installing this module as a package.
    await moveDepsLib(libPath, frameworkPath, destLibPath, destFrameworkPath);
  } else {
    throw new Error('Invalid action: ' + action);
  }
}

const action = process.argv[2];
let targetDir = process.argv[3];

// Run as a script if there are command-line arguments.
if (action != null && targetDir != null) {
  run();
}
// Otherwise use the utility methods in other scripts.
module.exports = {symlinkDepsLib};
