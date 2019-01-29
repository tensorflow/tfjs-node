import * as tf from './index';

(async function main() {
  console.log(tf.version);
  const summaryWriter = await tf.createSummaryWriter('/tmp/tfjs_tb_logdir');
  console.log(summaryWriter);
  console.log('About to call scalar();');  // DEBUG

  for (let i = 0; i < 2; ++i) {
    summaryWriter.scalar(i, 'loss1', i % 2 === 0 ? 20 : 40);
    summaryWriter.scalar(i, 'acc', i % 2 === 0 ? 30 : 10);
  }
  summaryWriter.flush();
  // summaryWriter.scalar(2, 'loss1', tf.scalar(41));
  // summaryWriter.scalar(3, 'loss1', tf.scalar(100));
})();
