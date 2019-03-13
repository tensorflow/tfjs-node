import * as tf from '@tensorflow/tfjs-node';

const a = tf.tensor2d([1, 2, 3, 4], [2, 2], 'float32');
const b = tf.tensor2d([5, 6, 7, 8], [2, 2], 'float32');
const c = a.matMul(b);
console.log(c.dataSync());
