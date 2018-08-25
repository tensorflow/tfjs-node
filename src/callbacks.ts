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

import {nextFrame} from '@tensorflow/tfjs-core';
import {CustomCallback, Logs} from '@tensorflow/tfjs-layers';
import * as ProgressBar from 'progress';

/**
 * Terminal-based progress bar callback for tf.Model.fit().
 */
export class ProgbarLogger extends CustomCallback {
  private numTrainBatchesPerEpoch: number;
  private currentEpoch: number;
  private progressBar: ProgressBar;

  /**
   * Construtor of LoggingCallback
   * @param totalEpochs
   * @param batchSize
   * @param numTrainExamples
   */
  constructor(readonly batchSize: number, readonly numTrainExamples: number) {
    // TODO(cais): Replace batchSize and numTrainExamples with params fields.
    super({
      onTrainBegin: async (logs?: Logs) => {
        this.numTrainBatchesPerEpoch = Math.ceil(numTrainExamples / batchSize);
      },
      onEpochBegin: async (epoch: number, logs?: Logs) => {
        console.log(`Epoch ${epoch + 1} / ${this.params.epochs}`);
        this.currentEpoch = epoch;
      },
      onBatchEnd: async (batch: number, logs?: Logs) => {
        if (batch === 0) {
          this.progressBar = new ProgressBar(
              'eta=:eta :bar :metricePlaceholderLongName',
              {total: this.numTrainBatchesPerEpoch + 1, head: `>`});
        }
        this.progressBar.tick({
          metricePlaceholderLongName: this.formatLogsAsMetricsContent(logs)
        });
        await nextFrame();
      },
      onEpochEnd: async (epoch: number, logs?: Logs) => {
        this.progressBar.tick({
          metricePlaceholderLongName: this.formatLogsAsMetricsContent(logs)
        });
        await nextFrame();
      },
    });
  }

  private formatLogsAsMetricsContent(logs: Logs): string {
    let metricsContent: string = '';
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
