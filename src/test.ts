import './index';
import * as tf from '@tensorflow/tfjs-core';
tf.setBackend('tensorflow');

const a = tf.tensor1d([1, -2, 0, 3, -0.1, NaN]);
const result = tf.relu(a);
console.log('result', result.toString());
