import * as tf from './index';

(async function main() {
  console.log(tf.version);
  const summaryWriter = await tf.createSummaryWriter('/tmp/tfjs_tb_logdir_2');
  console.log(summaryWriter);
  summaryWriter.scalar(1, 'loss1', tf.scalar(42));
})();
