/**
 * @fileoverview Description of this file.
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
const CPU_WINDOWS = `CPU-windows-x86_64-1.13.1.zip`;
const GPU_WINDOWS = `GPU-windows-x86_64-1.13.1.zip`;

if (isCPU) {
  if (platform === 'linux') {
    console.log(CPU_LINUX);
  } else if (platform === 'darwin') {
    console.log(CPU_DARWIN);
  } else if (platform === 'win32') {
    console.log(CPU_WINDOWS);
  }
} else {
  if (platform === 'linux') {
    console.log(GPU_LINUX);
  } else if (platform === 'win32') {
    console.log(GPU_WINDOWS);
  }
}
