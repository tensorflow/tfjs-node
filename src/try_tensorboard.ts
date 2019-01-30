import * as tf from './index';

(async function main() {
  const summaryWriter = await tf.createSummaryWriter('/tmp/tfjs_tb_logdir');

  // for (let i = -1e10; i < 1e10; i += 1e8) {
  for (let i = -1e3; i < 1e3; i += 10) {
    summaryWriter.scalar(i, 'loss', i * i * i * i);
    summaryWriter.scalar(i, 'acc', -i * i * i * i);
  }
  summaryWriter.flush();
})();
