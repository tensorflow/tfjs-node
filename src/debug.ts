import '.';
import * as tf from '@tensorflow/tfjs';

const values = ['asdf', 'qwerty'];
const c = tf.tensor1d(values, 'string');
console.log('values: ', values);
// const a = tf.scalar('test', 'string');
// const a = tf.scalar(1);
const b = c.reshape([1, 2]);
console.log('b', b.dataSync());
