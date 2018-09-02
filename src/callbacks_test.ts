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

import {ProgressBarHelper} from './callbacks';
import * as tfn from './index';

describe('progbarLogger', () => {
  // Fake progbar class written for testing.
  class FakeProgbar {
    readonly tickConfigs: Array<{}> = [];

    constructor(readonly specs: string, readonly config?: {}) {}

    tick(tickConfig: {}) {
      this.tickConfigs.push(tickConfig);
    }
  }

  it('Model.fit with loss, metric and validation', async () => {
    let fakeProgbars: FakeProgbar[] = [];
    spyOn(ProgressBarHelper, 'ProgressBar')
        .and.callFake((specs: string, config: {}) => {
          const fakeProgbar = new FakeProgbar(specs, config);
          fakeProgbars.push(fakeProgbar);
          return fakeProgbar;
        });
    const consoleMessages: string[] = [];
    spyOn(ProgressBarHelper, 'log').and.callFake((message: string) => {
      consoleMessages.push(message);
    });

    const model = tfl.sequential();
    model.add(
        tfl.layers.dense({units: 10, inputShape: [8], activation: 'relu'}));
    model.add(tfl.layers.dense({units: 1}));
    model.compile(
        {loss: 'meanSquaredError', optimizer: 'sgd', metrics: ['acc']});

    const numSamples = 40;
    const epochs = 2;
    const batchSize = 8;
    const validationSplit = 0.15;
    const xs = tfc.randomNormal([numSamples, 8]);
    const ys = tfc.randomNormal([numSamples, 1]);
    await model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      callbacks:
          tfn.progbarLogger(batchSize, numSamples * (1 - validationSplit))
    });

    // A progbar object is created for each epoch.
    expect(fakeProgbars.length).toEqual(2);
    for (const fakeProgbar of fakeProgbars) {
      const tickConfigs = fakeProgbar.tickConfigs;
      // There are 5 batchs per epoch. There should be 1 tick for epoch batch,
      // plus a tick at the end of the epoch.
      expect(tickConfigs.length).toEqual(6);
      for (let i = 0; i < 5; ++i) {
        expect(Object.keys(tickConfigs[i])).toEqual([
          'placeholderForLossesAndMetrics'
        ]);
        expect(tickConfigs[i]['placeholderForLossesAndMetrics'])
            .toMatch(/acc=.* loss=.*/);
      }
      expect(tickConfigs[5]).toEqual({placeholderForLossesAndMetrics: ''});
    }

    expect(consoleMessages[0]).toEqual('Epoch 1 / 2');
    expect(consoleMessages[1]).toMatch(/acc=.* loss=.* val_acc=.* val_loss=.*/);
    expect(consoleMessages[2]).toEqual('Epoch 2 / 2');
    expect(consoleMessages[3]).toMatch(/acc=.* loss=.* val_acc=.* val_loss=.*/);
  });
});

// (async function() {
//   const model = tfl.sequential();
//   model.add(
//       tfl.layers.dense({units: 1000, inputShape: [8], activation:
//       'relu'}));
//   model.add(tfl.layers.dense({units: 1}));
//   model.compile({loss: 'meanSquaredError', optimizer: 'sgd', metrics:
//   ['acc']}); model.summary();

//   const numSamples = 4000;
//   const xs = tfc.randomNormal([numSamples, 8]);
//   const ys = tfc.randomNormal([numSamples, 1]);
//   xs.print();
//   ys.print();
//   const epochs = 2;
//   const batchSize = 8;
//   const validationSplit = 0.15;
//   await model.fit(xs, ys, {
//     epochs,
//     batchSize,
//     validationSplit,
//     callbacks: tfn.progbarLogger(batchSize, numSamples * (1 -
//     validationSplit))
//   });
// })();
