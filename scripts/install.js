const editJsonFile = require("edit-json-file");
const cp = require('child_process');
const { binaryName } = require('./get-binary-name.js');

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

