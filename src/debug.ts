import '.';
import * as tf from '@tensorflow/tfjs';

const c = tf.tensor1d(['asdf', 'qwerty'], 'string');
// const a = tf.scalar('test', 'string');
// const a = tf.scalar(1);
const b = c.reshape([1, 2]);
console.log('b', b);
