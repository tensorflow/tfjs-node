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
  private lossOrMetricTags: string[];
  private lossOrMetricNames: string[];
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
        console.log(`this.numTrainBatchesPerEpoch = ${
            this.numTrainBatchesPerEpoch}`);  // DEBUG
      },
      onEpochBegin: async (epoch: number, logs?: Logs) => {
        // console.log('params:', this.params);
        this.currentEpoch = epoch;
      },
      onBatchEnd: async (batch: number, logs?: Logs) => {
        // console.log(JSON.stringify());
        // console.log(logs.batch);
        if (batch === 0) {
          // console.log(
          //     `Epoch ${this.currentEpoch + 1} / ${this.params['epochs']}`);
          this.lossOrMetricTags = [];
          this.lossOrMetricNames = [];
          Object.keys(logs).forEach(key => {
            if (key !== 'batch' && key !== 'size') {
              this.lossOrMetricTags.push(`${key}Tag`);
              this.lossOrMetricNames.push(`${key}`);
            }
          });
          let progressBarSpec = 'eta=:eta :bar ';
          for (let i = 0; i < this.lossOrMetricTags.length; ++i) {
            progressBarSpec +=
                `:${this.lossOrMetricTags[i]}=:${this.lossOrMetricNames[i]}`;
            if (i < this.lossOrMetricTags.length - 1) {
              progressBarSpec += ' ';
            }
          }
          this.progressBar = new ProgressBar(
              progressBarSpec,
              {total: this.numTrainBatchesPerEpoch, head: `>`});
        }
        // if (batch === this.numTrainBatchesPerEpoch - 1) {
        //   millisPerStep =
        //       (tf.util.now() - epochBeginTime) / numTrainExamplesPerEpoch;
        // }
        const tickData: {[key: string]: string} = {};
        this.lossOrMetricNames.forEach((name, i) => {
          const tag = this.lossOrMetricTags[i];
          tickData[tag] = name;
          // console.log(`tag = ${tag}, name = ${name}`);    // DEBUG
          // console.log(`logs = ${JSON.stringify(logs)}`);  // DEBUG
          tickData[name] = logs[name].toFixed(2);
        });
        this.progressBar.tick(tickData);
        await nextFrame();
      },
      onEpochEnd: async (epoch: number, logs?: Logs) => {
        console.log(JSON.stringify(logs));
      },
    });

    
  }
}
