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
const symlink = util.promisify(fs.symlink);
const {libName, depsLibPath} = require('./constants.js');

const destLibPath = path.join(process.argv[2], libName);

if (destLibPath === undefined) {
  throw new Error('Destination path not supplied!');
}

symlink(depsLibPath, destLibPath);

/**
 * Moves the deps library path to the destination path.
 */
async function moveDepsLib() {
  await rename(depsLibPath, destLibPath);
}
