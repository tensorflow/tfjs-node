const https = require('https');
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const util = require('util');

const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const symlink = util.promisify(fs.symlink);

const BASE_URI = 'https://storage.googleapis.com/tf-builds/';
const CPU_DARWIN = 'libtensorflow_r1_9_darwin.tar.gz';
const CPU_LINUX = 'libtensorflow_r1_9_linux_cpu.tar.gz';
const GPU_LINUX = 'libtensorflow_r1_9_linux_gpu.tar.gz';

const platform = process.argv[2];
const targetDir = process.argv[3];

// TODO(kreeger): Handle windows (dll) support:
// https://github.com/tensorflow/tfjs/issues/548
let targetUri = BASE_URI;
let libName = 'libtensorflow';
if (platform === 'linux-cpu') {
  targetUri += CPU_LINUX;
  libName += '.so';
} else if (platform === 'linux-gpu') {
  targetUri += GPU_LINUX;
  libName += '.so';
} else if (platform === 'darwin') {
  targetUri += CPU_DARWIN;
  libName += '.so';
} else {
  throw new Error(`Unsupported platform: ${platform}`);
}

const depsPath = path.join(__dirname, '..', 'deps');
const depsLibPath = path.join(depsPath, 'lib', libName);
const destLibPath =
    targetDir !== undefined ? path.join(targetDir, libName) : undefined;

/**
 * Ensures a directory exists, creates as needed.
 */
async function ensureDir(dirPath) {
  if (!await exists(dirPath)) {
    await mkdir(dirPath);
  }
}

/**
 * Symlinks the extracted libtensorflow library to the desired directory.
 */
async function symlinkDepsLib() {
  await symlink(depsLibPath, destLibPath);
}

/**
 * Ensures libtensorflow requirements are met for building the binding.
 */
async function run() {
  // Ensure dependencies staged directory is available:
  await ensureDir(depsPath);

  // This script can optionally only download and not symlink:
  const shouldSymlink = destLibPath !== undefined;

  if (!shouldSymlink || !await exists(destLibPath)) {
    if (shouldSymlink && await exists(depsLibPath)) {
      // Deps library exists, symlink to destination:
      await symlinkDepsLib();
    } else {
      // Deps library does not exist, download resource package and symlink when
      // unpacked.
      console.error('  * Downloading libtensorflow');
      const request = https.get(targetUri, response => {
        response
            .pipe(tar.x({
              C: depsPath,
            }))
            .on('close', async () => {
              if (shouldSymlink) {
                await symlinkDepsLib();
              }
            });
        request.end();
      });
    }
  }
}

run();
