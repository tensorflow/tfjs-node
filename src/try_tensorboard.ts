import * as tf from './index';

const summaryWriter = tf.node.summaryFileWriter('/tmp/tfjs_tb_logdir');
for (let i = -1e3; i < 1e3; i += 10) {
  summaryWriter.scalar('loss', i * i * i * i, i);
  summaryWriter.scalar('acc', -i * i * i * i, i);
}
