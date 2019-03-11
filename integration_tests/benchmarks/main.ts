import * as tf from '../../dist';

async function main() {
  console.log(tf.version);

  const xs = tf.randomNormal([2, 2]);
  const ys = xs.matMul(xs);
  ys.print();
} 

main();
