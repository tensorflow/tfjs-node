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
const editJsonFile = require("edit-json-file");
const cp = require('child_process');
const {
  binaryName
} = require('./get-binary-name.js');

// Update pre-built binary name based on user's platform.
const file = editJsonFile(`${__dirname}/../package.json`);
file.set('binary.package_name', binaryName);
file.save();

cp.exec('node-pre-gyp install', (err) => {
  if (err) {
    console.log('node-pre-gyp rebuild failed with: ' + err);
    console.log('Start building from source binary.')
    cp.exec('node scripts/install-from-source.js');
  }
});
