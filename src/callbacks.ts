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

import {nextFrame, util} from '@tensorflow/tfjs-core';
import {CustomCallback, Logs} from '@tensorflow/tfjs-layers';
import * as ProgressBar from 'progress';

// tslint:disable-next-line:no-any
export const progressBarHelper: {ProgressBar: any, log: Function} = {
  ProgressBar,
  log: console.log
};
// A helper class created for testing with the jasmine `spyOn` method, which
// operates only on member methods of objects.

/**
 * Terminal-based progress bar callback for tf.Model.fit().
 */
export class ProgbarLogger extends CustomCallback {
  private numTrainBatchesPerEpoch: number;
  private progressBar: ProgressBar;

  /**
   * Construtor of LoggingCallback.
   */
  constructor() {
    super({
      onTrainBegin: async (logs?: Logs) => {
        const samples = this.params.samples as number;
        const batchSize = this.params.batchSize as number;
        util.assert(
            samples != null,
            'ProgbarLogger cannot operate when samples is undefined or null.');
        util.assert(
            batchSize != null,
            'ProgbarLogger cannot operate when batchSize is undefined or ' +
                'null.');
        this.numTrainBatchesPerEpoch = Math.ceil(samples / batchSize);
      },
      onEpochBegin: async (epoch: number, logs?: Logs) => {
        progressBarHelper.log(`Epoch ${epoch + 1} / ${this.params.epochs}`);
      },
      onBatchEnd: async (batch: number, logs?: Logs) => {
        if (batch === 0) {
          this.progressBar = new progressBarHelper.ProgressBar(
              'eta=:eta :bar :placeholderForLossesAndMetrics',
              {total: this.numTrainBatchesPerEpoch + 1, head: `>`});
        }
        this.progressBar.tick({
          placeholderForLossesAndMetrics: this.formatLogsAsMetricsContent(logs)
        });
        await nextFrame();
      },
      onEpochEnd: async (epoch: number, logs?: Logs) => {
        this.progressBar.tick({placeholderForLossesAndMetrics: ''});
        progressBarHelper.log(this.formatLogsAsMetricsContent(logs));
        await nextFrame();
      },
    });
  }

  private formatLogsAsMetricsContent(logs: Logs): string {
    let metricsContent = '';
    const keys = Object.keys(logs).sort();
    for (const key of keys) {
      if (this.isFieldRelevant(key)) {
        metricsContent += `${key}=${logs[key].toFixed(2)} `;
      }
    }
    return metricsContent;
  }

  private isFieldRelevant(key: string) {
    return key !== 'batch' && key !== 'size';
  }
}

/**
 * Creates progress-bar callback for tf.Model.fit() (Node.js only).
 *
 * The logger is analogous to ProgbarLogger in Keras. It renders a
 * command-line-interface progress bar during each epoch of a tf.Model.fit()
 * call. It also prints the latest loss and metrics values alongside the
 * progress bar.
 *
 * Example:
 * ```js
 * const tf = require('@tensorflow/tfjs');
 * const tfn = require('@tensorflow/tfjs-node');
 *
 * const model = tf.sequential({layers: [
 *   tf.layers.dense({units: 1, inputShape: [2]})
 * ]});
 * model.compile({loss: 'meanSquaredError'});
 *
 * const xs = tf.ones([100, 2]);
 * const ys = tf.zeros([100, 1]);
 *
 * await model.fit(xs, ys,{
 *   batchSize: 16,
 *   epochs: 5,
 *   callbacks: tfn.progbarLogger()
 * });
 * ```
 */
export function progbarLogger() {
  return new ProgbarLogger();
}
