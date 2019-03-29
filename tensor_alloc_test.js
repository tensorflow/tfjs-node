const tf = require('./dist/index');

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function run() {
  // console.log('waiting...');
  // await sleep(20000);
  // console.log('running...');

  // Uncomment to use vanilla cpu backend.
  // tf.setBackend('cpu');
  const N = 1000000;
  const a = tf.zeros([1, 1]);
  const start = process.hrtime();
  for (let i = 0; i < N; i++) {
    // tf.reshape(a, [1]);  // This is bad - a goes GC
    tf.slice(a, [0, 0], [1, 1]);
  }
  const end = process.hrtime(start);
  const elapsed = end[0] * 1000 + end[1] / 1000000;
  console.log(Math.round(N / elapsed) + ' ops/ms');

  // await sleep(10000);
}

run();
