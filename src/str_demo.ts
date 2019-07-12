import * as tf from './index';

const a = tf.tensor(['a', 'b']);
const b = a.reshape([2, 1, 1]);
console.log('a: ' + a.dataSync());
console.log('b: ' + b.dataSync());
