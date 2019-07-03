console.log(
  require('../package.json').binary.host.split('.com/')[1] +
  '/napi-v' +
  process.versions.napi +
  '/' +
  require('../package.json').version + '/');
