const cp = require('child_process');
const os = require('os');

// Skip the node-gyp rebuild step when building NPM tfjs-node-gpu package.
if(!(process.argv[2] === 'compile-npm' && os.platform() !== 'linux')) {
  console.log('node-gyp rebuild');
  cp.exec('node-gyp rebuild', (err) => {
    if (err) {
      // node couldn't execute the command
      console.log(err);
      return;
    }
  });
}
