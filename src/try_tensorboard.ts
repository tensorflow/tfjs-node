import * as tf from './index';

(async function main() {
  console.log(tf.version);
  tf.createSummaryWriter('/tmp/tfjs_tb_logdir');

  // const x = tf.scalar(21.0);
  // const y = tf.neg(x);
  // const z = tf.reciprocal(y);

  // const x = tf.tensor1d([1.1, 2.2]);
  // const y = tf.tensor1d([3.3]);
  // let z = tf.concat([x, y]);
  // z.print();
  // z = tf.concat([z, x]);
  // z.print();
  // z.print();
  // z.print();
})();
