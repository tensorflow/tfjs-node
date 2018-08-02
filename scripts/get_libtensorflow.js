const https = require('https');
const fs = require('fs');
const path = require('path');
const tar = require('tar');

console.log('argv: ', process.argv);

const BASE_URI = 'https://storage.googleapis.com/tf-builds/';
const CPU_DARWIN = 'libtensorflow_r1_9_darwin.tar.gz';
const CPU_LINUX = 'libtensorflow_r1_9_linux_cpu.tar.gz';
const GPU_LINUX = 'libtensorflow_r1_9_linux_gpu.tar.gz';

const targetDir = process.argv[2];
const platform = process.argv[3];

let targetUri = BASE_URI;
let targetPath;
if (platform === 'linux-cpu') {
  targetUri += CPU_LINUX;
} else if (platform === 'linux-gpu') {
  targetUri += GPU_LINUX;
} else if (platform === 'darwin') {
  targetUri += CPU_DARWIN;
} else {
  throw new Error(`Unsupported platform: ${platform}`);
}

console.log(`* Target path: ${targetDir}`);
console.log(`* Platform: ${platform}`);
console.log(`* URI: ${targetUri}`);

// TODO - determine where to store this stuff.
const request = https.get(targetUri, (response) => {
  response.pipe(tar.t()).on('entry', entry => {
    let name = path.basename(entry.header.path);
    let ext = path.extname(name);

    console.log(`ext: ${ext}`);
  });
});

// request.on('close', () => {
//   console.log('.... Closed!');

//   const tarPath = path.join(__dirname, '..', 'test.download');
//   console.log(`Extracting: ${tarPath}`);

//   tar.t({
//     file: tarPath,
//     onwarn: console.warn,
//     onentry(entry) {
//       let name = path.basename(entry.header.path);
//       let ext = path.extname(name);

//       console.log(`ext: ${ext}`);
//     }
//   });
// });
request.end();
