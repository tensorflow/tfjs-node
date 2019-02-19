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
let path = require('path');
const rimraf = require('rimraf');
const util = require('util');
const cp = require('child_process');
const os = require('os');
const {depsPath, depsLibPath, depsLibTensorFlowPath} =
    require('./deps-constants.js');
const resources = require('./resources');

const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const rimrafPromise = util.promisify(rimraf);

const BASE_URI =
    'https://storage.googleapis.com/tensorflow/libtensorflow/libtensorflow-';
const CPU_DARWIN = 'cpu-darwin-x86_64-1.12.0.tar.gz';
const CPU_LINUX = 'cpu-linux-x86_64-1.12.0.tar.gz';
const GPU_LINUX = 'gpu-linux-x86_64-1.12.0.tar.gz';
const CPU_WINDOWS = 'cpu-windows-x86_64-1.12.0.zip';
const GPU_WINDOWS = 'gpu-windows-x86_64-1.12.0.zip';

const TF_HEADERS_URI =
    'https://storage.googleapis.com/tf-builds/tensorflow-headers-1.12.zip';

const platform = os.platform();
let libType = process.argv[2] === undefined ? 'cpu' : process.argv[2];
let forceDownload = process.argv[3] === undefined ? undefined : process.argv[3];

/**
 * Returns the libtensorflow hosted path of the current platform.
 */
function getPlatformLibtensorflowUri() {
  let targetUri = BASE_URI;
  if (platform === 'linux') {
    if (os.arch() === 'arm') {
      targetUri =
          'https://storage.googleapis.com/tf-builds/libtensorflow_r1_12_linux_arm.tar.gz';
    } else {
      if (libType === 'gpu') {
        targetUri += GPU_LINUX;
      } else {
        targetUri += CPU_LINUX;
      }
    }
  } else if (platform === 'darwin') {
    targetUri += CPU_DARWIN;
  } else if (platform === 'win32') {
    // Use windows path
    path = path.win32;
    if (libType === 'gpu') {
      targetUri += GPU_WINDOWS;
    } else {
      targetUri += CPU_WINDOWS;
    }
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return targetUri;
}

/**
 * Ensures a directory exists, creates as needed.
 */
async function ensureDir(dirPath) {
  if (!await exists(dirPath)) {
    await mkdir(dirPath);
  }
}

/**
 * Deletes the deps directory if it exists, and creates a fresh deps folder.
 */
async function cleanDeps() {
  if (await exists(depsPath)) {
    await rimrafPromise(depsPath);
  }
  await mkdir(depsPath);
}

/**
 * Downloads libtensorflow and notifies via a callback when unpacked.
 */
async function downloadLibtensorflow(callback) {
  // Ensure dependencies staged directory is available:
  await ensureDir(depsPath);

  // The deps folder and resources do not exist, download and callback as
  // needed:
  console.error('* Downloading libtensorflow');

  resources.downloadAndUnpackResource(getPlatformLibtensorflowUri(), () => {
    if (platform === 'win32') {
    } else {
      // No other work is required on other platforms.
      callback();
    }
  });
  // TODO - download...

  //           // TODO - this is getting moved....
  //           // Some windows packages for GPU are missing the `include` and
  //           `lib`
  //           // directory. Create and move if that is the case.
  //           const depsIncludePath = path.join(depsPath, 'include');
  //           if (!await exists(depsIncludePath)) {
  //             // Move
  //           }
  //           if (!await exists(depsLibPath)) {
  //             await ensureDir(depsLibPath);
  //             // Move
  //           }
}

/**
 * Calls node-gyp for Node.js Tensorflow binding after lib is downloaded.
 */
async function build() {
  console.error('* Building TensorFlow Node.js bindings');
  cp.exec('node-gyp rebuild', (err) => {
    if (err) {
      throw new Error('node-gyp rebuild failed with: ' + err);
    }
  });
}

/**
 * Ensures libtensorflow requirements are met for building the binding.
 */
async function run() {
  // First check if deps library exists:
  if (forceDownload !== 'download' && await exists(depsLibTensorFlowPath)) {
    // Library has already been downloaded, then compile and simlink:
    await build();
  } else {
    // Library has not been downloaded, download, then compile and symlink:
    await cleanDeps();
    await downloadLibtensorflow(build);
  }
}

run();
