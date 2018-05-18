import './index';
import * as tf from '@tensorflow/tfjs-core';
tf.setBackend('tensorflow');

// expectArraysClose(tf.equalStrict(a, b), [0, 0, 0, 0, 0, 1]);

// Nans:
// const a = tf.tensor1d([1, -2, 0, 3, -0.1, NaN]);
// const result = tf.relu(a);
// console.log('result', result.toString());

// Gradients:
// const x = tf.tensor2d([10, 0, -1, 5, 4, 3], [2, 3]);
// const y = tf.softmax(x);
// const dy = tf.tensor2d([3, 2, 1, 1, 2, 3], [2, 3]);
// const dx = tf.grad((x) => x.softmax())(x, dy);

// const axis = -1;
// const totalSum = tf.sum(tf.mulStrict(dy, y), axis);

// const values = [
//   (dy.get(0, 0) - totalSum.get(0)) * y.get(0, 0),
//   (dy.get(0, 1) - totalSum.get(0)) * y.get(0, 1),
//   (dy.get(0, 2) - totalSum.get(0)) * y.get(0, 2),
//   (dy.get(1, 0) - totalSum.get(1)) * y.get(1, 0),
//   (dy.get(1, 1) - totalSum.get(1)) * y.get(1, 1),
//   (dy.get(1, 2) - totalSum.get(1)) * y.get(1, 2)
// ];

// const dxValues = dx.dataSync();
// for (let i = 0; i < dxValues.length; i++) {
//   console.log(`${values[i]} vs ${dxValues[i]}`);
// }

// Softmax:
const logits = tf.tensor1d([1, 2, 3]);
const labels = tf.tensor1d([0.3, 0.6, 0.1]);

const softmaxLogits = tf.softmax(logits);
console.log('softmax', softmaxLogits.dataSync());

const y = tf.losses.softmaxCrossEntropy(labels, logits);
console.log('y', y.dataSync());

const t = -Math.log(softmaxLogits.get(0)) * labels.get(0) +
    -Math.log(softmaxLogits.get(1)) * labels.get(1) +
    -Math.log(softmaxLogits.get(2)) * labels.get(2);

console.log(softmaxLogits.get(0));
console.log(softmaxLogits.get(1));
console.log(softmaxLogits.get(2));

console.log(`yV: ${y.dataSync()}, t: ${t}`);
