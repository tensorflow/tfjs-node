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
const https = require('https');
const fs = require('fs');
let path = require('path');
const rimraf = require('rimraf');
const tar = require('tar');
const util = require('util');
const zip = require('adm-zip');
const cp = require('child_process');
const os = require('os');
const {libName, depsPath, depsLibPath} = require('./constants.js');

const copy = util.promisify(fs.copyFile);
const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);
const rimrafPromise = util.promisify(rimraf);
const symlink = util.promisify(fs.symlink);
const unlink = util.promisify(fs.unlink);

const BASE_URI = 'https://storage.googleapis.com/tf-builds/';
const CPU_DARWIN = 'libtensorflow_r1_10_darwin.tar.gz';
const CPU_LINUX = 'libtensorflow_r1_10_linux_cpu.tar.gz';
const GPU_LINUX = 'libtensorflow_r1_10_linux_gpu.tar.gz';
const CPU_WINDOWS = 'libtensorflow_r1_10_windows_cpu.zip';

const platform = os.platform();
let libType = process.argv[2] === undefined ?  'cpu' : process.argv[2];
let action = process.argv[3] === undefined ? 'symlink' : process.argv[3];
let targetDir = process.argv[4];

let targetUri = BASE_URI;

async function getTargetUri() {
  if (platform === 'linux' && libType === 'cpu') {
      targetUri += CPU_LINUX;
  } else if (platform === 'linux' && libType === 'gpu') {
    if (await verifyCUDA()) {
      targetUri += GPU_LINUX;
    } else {
      targetUri += CPU_LINUX;
    }
  } else if (platform === 'darwin') {
    targetUri += CPU_DARWIN;
  } else if (platform === 'win32') {
    targetUri += CPU_WINDOWS;
    libName = 'tensorflow.dll';

    // Some windows machines contain a trailing " char:
    if (targetDir != undefined && targetDir.endsWith('"')) {
      targetDir = targetDir.substr(0, targetDir.length - 1);
    }

    // Windows action can have a path passed in:
    if (action.startsWith('..\\')) {
      action = action.substr(3);
    }

    // Use windows path
    path = path.win32;
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
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
  await getTargetUri();
  // The deps folder and resources do not exist, download and callback as
  // needed:
  console.error('  * Downloading libtensorflow');

  // Ensure dependencies staged directory is available:
  await ensureDir(depsPath);

  const request = https.get(targetUri, response => {
    var len = parseInt(response.headers['content-length'], 10);
    var downloaded = 0;

    if (platform.endsWith('windows')) {
      // Windows stores builds in a zip file. Save to disk, extract, and delete
      // the downloaded archive.
      const tempFileName = path.join(__dirname, '_libtensorflow.zip');
      const outputFile = fs.createWriteStream(tempFileName);
      const request = https.get(targetUri, response => {
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          process.stdout.write("Downloading libtensorflow" + (100.0 * downloaded / len).toFixed(2) + "% " + downloaded + " bytes" + (downloaded===len?"\n":"\r"));
        }).pipe(outputFile).on('close', async () => {
          const zipFile = new zip(tempFileName);
          zipFile.extractAllTo(depsPath, true /* overwrite */);
          await unlink(tempFileName);

          if (callback !== undefined) {
            callback();
          }
        });
        request.end();
      });
    } else {
      // All other platforms use a tarball:
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        process.stdout.write("Downloading libtensorflow " + (100.0 * downloaded / len).toFixed(2) + "% " + downloaded + " bytes" + (downloaded===len?"\n":"\r"));
      }).pipe(tar.x({C: depsPath, strict: true})).on('close', () => {
        if (callback !== undefined) {
          callback();
        }
      });
    }
    request.end();
  });
}

/**
 * Ensures libtensorflow requirements are met for building the binding.
 */
async function run() {
  // Validate the action passed to the script:
  // - 'download' - Just downloads libtensorflow
  // - 'symlink'  - Downloads libtensorflow as needed, symlinks to dest.
  // - 'move'     - Downloads libtensorflow as needed, copies to dest.
  if (action === 'download') {
    // This action always re-downloads. Delete existing deps and start download.
    await cleanDeps();
    await downloadLibtensorflow(build);
  } else if (action === 'symlink') {
    // Symlink will happen during `node-gyp rebuild`

    // First check if deps library exists:
    if (await exists(depsLibPath)) {
      // Library has already been downloaded, then compile and simlink:
      await build();
    } else {
      // Library has not been downloaded, download, then compile and symlink:
      await cleanDeps();
      await downloadLibtensorflow(build);
    }
  } else if (action === 'move') {
    // Move action is used when installing this module as a package, always
    // clean, download, and move the lib.
    await cleanDeps();
    await downloadLibtensorflow(build);
  } else {
    throw new Error('Invalid action: ' + action);
  }
}

async function build() {
  cp.exec('node-gyp rebuild', (err) => {
    if (err) {
      throw new Error('node-gyp rebuild failed with: ' + err);
    }
  });
}

async function verifyCUDA() {
  cp.exec('nvcc --version', (err, stdout) => {
    if (err) {
      return false;
    }
    if (stdout.includes('Cuda')) {
      console.log('cuda version: '+stdout);
      return true;
    } else {
      console.error('Fail to get CUDA version, compiling with CPU.');
      return false;
    }
  });
}

run();
