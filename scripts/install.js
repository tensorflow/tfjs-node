const editJsonFile = require("edit-json-file");
const cp = require('child_process');
<<<<<<< HEAD
const {
  binaryName
} = require('./get-binary-name.js');
const package_name = require('../package.json').name;

let INSTALL_FROM_SOURCE_COMMAND = 'node scripts/install-from-source.js';
if (package_name.endsWith('-gpu')) {
  INSTALL_FROM_SOURCE_COMMAND = INSTALL_FROM_SOURCE_COMMAND + ' gpu';
=======
const os = require('os');
const {depsPath, depsLibPath, depsLibTensorFlowPath} =
    require('./deps-constants.js');
const resources = require('./resources');

const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);
const rimrafPromise = util.promisify(rimraf);

const BASE_URI =
    'https://storage.googleapis.com/tensorflow/libtensorflow/libtensorflow-';
const CPU_DARWIN = 'cpu-darwin-x86_64-1.14.0.tar.gz';
const CPU_LINUX = 'cpu-linux-x86_64-1.14.0.tar.gz';
const GPU_LINUX = 'gpu-linux-x86_64-1.14.0.tar.gz';
const CPU_WINDOWS = 'cpu-windows-x86_64-1.14.0.zip';
const GPU_WINDOWS = 'gpu-windows-x86_64-1.14.0.zip';

// TODO(kreeger): Update to TensorFlow 1.13:
// https://github.com/tensorflow/tfjs/issues/1369
const TF_WIN_HEADERS_URI =
    'https://storage.googleapis.com/tf-builds/tensorflow-headers-1.14.zip';

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
      // TODO(kreeger): Update to TensorFlow 1.14:
      // https://github.com/tensorflow/tfjs/issues/1370
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
>>>>>>> 5a0ab50877996930d3b37cbe8f7d8e0a8b5cd53d
}

const file = editJsonFile(`${__dirname}/../package.json`);

file.set('binary.package_name', binaryName);
file.save();
cp.exec('node-pre-gyp install', (err) => {
  if (err) {
    console.log('node-pre-gyp rebuild failed with: ' + err);
    console.log('Start building from source binary.');
    cp.exec(INSTALL_FROM_SOURCE_COMMAND);
  }
});
