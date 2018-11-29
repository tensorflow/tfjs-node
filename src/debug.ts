import '.';
import * as tf from '@tensorflow/tfjs';

const a = tf.scalar('test', 'string');
// const a = tf.scalar(1);
const b = a.reshape([1, 1]);
console.log('b', b);
