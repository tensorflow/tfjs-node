const tf = require('./dist/index');

// Uncomment to use vanilla cpu backend.
// tf.setBackend('cpu');
const N = 1000000;
const a = tf.zeros([1, 1]);
const start = process.hrtime();
for (let i = 0; i < N; i++) {
  tf.reshape(a, [1]);
  // tf.slice(a, [0, 0], [1, 1]);
}
const end = process.hrtime(start);
const elapsed = end[0] * 1000 + end[1] / 1000000;
console.log(Math.round(N / elapsed) + ' ops/ms');
