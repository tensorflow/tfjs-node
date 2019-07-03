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
const CPU_WINDOWS = `CPU-windows-${version}.zip`;
const GPU_WINDOWS = `GPU-windows-${version}.zip`;

let addonName;

if (isCPU) {
  if (platform === 'linux') {
    addonName = CPU_LINUX;
  } else if (platform === 'darwin') {
    addonName = CPU_DARWIN;
  } else if (platform === 'win32') {
    addonName = CPU_WINDOWS;
  }
} else {
  if (platform === 'linux') {
    addonName = GPU_LINUX;
  } else if (platform === 'win32') {
    addonName = GPU_WINDOWS;
  }
}

console.log(addonName);

module.exports = {
  addonName: addonName
};
