import * as tf from './index';

(async function main() {
  console.log(tf.version);
  const summaryWriter =
      await tf.createSummaryWriter('/tmp/tfjs_tb_logdir_6', 0, 0);
  console.log(summaryWriter);
  console.log('About to call scalar();');  // DEBUG
  summaryWriter.scalar(1, 'loss1', tf.scalar(42));
  summaryWriter.scalar(2, 'loss1', tf.scalar(41));
  summaryWriter.scalar(3, 'loss1', tf.scalar(100));
})();
