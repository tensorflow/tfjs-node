import './index';
import * as tf from '@tensorflow/tfjs-core';
tf.setBackend('tensorflow');

const a = tf.tensor2d([1, 2, -3, 5], [2, 2]);
const dy = tf.tensor2d([1, 2, 3, 4], [2, 2]);

const z = tf.tensor2d([4, 3, 2], [1, 3]);
tf.relu(z);

const da = tf.grad(a => tf.logSigmoid(a))(a, dy);

const aVals = a.dataSync();
const dyVals = dy.dataSync();
const zVals = z.dataSync();
console.log('aVals : ', aVals);
console.log('dyVals: ', dyVals);
console.log('zVals :', zVals);

// const expected = [];
// for (let i = 0; i < a.size; i++) {
//   const y = 1 / (1 + Math.exp(aVals[i]));
//   expected[i] = dyVals[i] * y;
// }

// console.log(`expected : ${expected}`);
// console.log(`da       : ${da.dataSync()}`);
