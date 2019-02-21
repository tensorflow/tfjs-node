import * as tf from './index';

// const summaryWriter = tf.node.summaryFileWriter('/tmp/tfjs_tb_logdir');

// for (let i = -1e3; i < 1e3; i += 10) {
//   summaryWriter.scalar('loss', i * i * i * i, i);
//   summaryWriter.scalar('acc', -i * i * i, i);
// }

(async function main() {
  const model = tf.sequential();
  model.add(
      tf.layers.dense({units: 100, activation: 'relu', inputShape: [200]}));
  model.add(tf.layers.dense({
    units: 100,
    activation: 'relu',
  }));
  model.add(tf.layers.dense({
    units: 100,
    activation: 'relu',
  }));
  model.add(tf.layers.dense({units: 1}));
  model.compile({loss: 'meanSquaredError', optimizer: 'sgd', metrics: ['MAE']});

  const xs = tf.randomUniform([10000, 200]);
  const ys = tf.randomUniform([10000, 1]);
  const valXs = tf.randomUniform([1000, 200]);
  const valYs = tf.randomUniform([1000, 1]);
  await model.fit(xs, ys, {
    epochs: 100,
    validationData: [valXs, valYs],
    callbacks: tf.node.tensorBoard('/tmp/fit_logs_1', {updateFreq: 'batch'})
  });
})();
