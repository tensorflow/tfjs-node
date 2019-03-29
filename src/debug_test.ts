import * as tf from './index';

const c = tf.add([1, 2], [3, 4]);
console.log(c.dataSync());
