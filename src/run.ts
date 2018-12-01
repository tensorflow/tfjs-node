import * as tfc from '@tensorflow/tfjs-core';
import * as tfl from '@tensorflow/tfjs-layers';
require('@tensorflow/tfjs-node');

(async function() {
  const model = tfl.sequential();
  model.add(tfl.layers.dense({units: 1, inputShape: [1]}));
  model.summary();
  model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

  const xs = tfc.zeros([8, 1]);
  const ys = tfc.ones([8, 1]);
  const history = await model.fit(xs, ys, {epochs: 10, verbose: 1});

  console.log(history.history);  // DEBUG
})();
