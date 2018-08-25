/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tfc from '@tensorflow/tfjs-core';
import * as tfl from '@tensorflow/tfjs-layers'

import {ProgbarLogger} from './callbacks';

(async function() {
  const model = tfl.sequential();
  model.add(
      tfl.layers.dense({units: 1000, inputShape: [8], activation: 'relu'}));
  model.add(tfl.layers.dense({units: 1}));
  model.compile({loss: 'meanSquaredError', optimizer: 'sgd', metrics: ['acc']});
  model.summary();

  const numSamples = 4000;
  const xs = tfc.randomNormal([numSamples, 8]);
  const ys = tfc.randomNormal([numSamples, 1]);
  xs.print();
  ys.print();
  const epochs = 2;
  const batchSize = 8;
  const validationSplit = 0.15;
  await model.fit(xs, ys, {
    epochs,
    batchSize,
    validationSplit,
    callbacks: new ProgbarLogger(batchSize, numSamples * (1 - validationSplit))
  });
})();
