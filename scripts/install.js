var cp = require('child_process');

// Skip the node-gyp rebuild step when building NPM tfjs-node-gpu package.
if(process.argv[2] !== "compile-npm") {
  cp.exec('node-gyp rebuild', (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}
