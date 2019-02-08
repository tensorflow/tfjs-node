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

import {CustomCallback, Logs, nextFrame, util} from '@tensorflow/tfjs';
import * as path from 'path';
import * as ProgressBar from 'progress';

import {summaryFileWriter, SummaryFileWriter} from './tensorboard';

// A helper class created for testing with the jasmine `spyOn` method, which
// operates only on member methods of objects.
// tslint:disable-next-line:no-any
export const progressBarHelper: {ProgressBar: any, log: Function} = {
  ProgressBar,
  log: console.log
};

/**
 * Terminal-based progress bar callback for tf.Model.fit().
 */
export class ProgbarLogger extends CustomCallback {
  private numTrainBatchesPerEpoch: number;
  private progressBar: ProgressBar;
  private currentEpochBegin: number;
  private epochDurationMillis: number;
  private usPerStep: number;
  private batchesInLatestEpoch: number;

  /**
   * Construtor of LoggingCallback.
   */
  constructor() {
    super({
      onTrainBegin: async (logs?: Logs) => {
        const samples = this.params.samples as number;
        const batchSize = this.params.batchSize as number;
        const steps = this.params.steps as number;
        if (samples != null || steps != null) {
          this.numTrainBatchesPerEpoch =
              samples != null ? Math.ceil(samples / batchSize) : steps;
        } else {
          // Undetermined number of batches per epoch, e.g., due to
          // `fitDataset()` without `batchesPerEpoch`.
          this.numTrainBatchesPerEpoch = 0;
        }
      },
      onEpochBegin: async (epoch: number, logs?: Logs) => {
        progressBarHelper.log(`Epoch ${epoch + 1} / ${this.params.epochs}`);
        this.currentEpochBegin = util.now();
        this.epochDurationMillis = null;
        this.usPerStep = null;
        this.batchesInLatestEpoch = 0;
      },
      onBatchEnd: async (batch: number, logs?: Logs) => {
        this.batchesInLatestEpoch++;
        if (batch === 0) {
          this.progressBar = new progressBarHelper.ProgressBar(
              'eta=:eta :bar :placeholderForLossesAndMetrics',
              {total: this.numTrainBatchesPerEpoch + 1, head: `>`});
        }
        const tickTokens = {
          placeholderForLossesAndMetrics: this.formatLogsAsMetricsContent(logs)
        };
        if (this.numTrainBatchesPerEpoch === 0) {
          // Undetermined number of batches per epoch.
          this.progressBar.tick(0, tickTokens);
        } else {
          this.progressBar.tick(tickTokens);
        }
        await nextFrame();
        if (batch === this.numTrainBatchesPerEpoch - 1) {
          this.epochDurationMillis = util.now() - this.currentEpochBegin;
          this.usPerStep = this.params.samples != null ?
              this.epochDurationMillis / (this.params.samples as number) * 1e3 :
              this.epochDurationMillis / this.batchesInLatestEpoch * 1e3;
        }
      },
      onEpochEnd: async (epoch: number, logs?: Logs) => {
        if (this.epochDurationMillis == null) {
          // In cases where the number of batches per epoch is not determined,
          // the calculation of the per-step duration is done at the end of the
          // epoch. N.B., this includes the time spent on validation.
          this.epochDurationMillis = util.now() - this.currentEpochBegin;
          this.usPerStep =
              this.epochDurationMillis / this.batchesInLatestEpoch * 1e3;
        }
        this.progressBar.tick({placeholderForLossesAndMetrics: ''});
        const lossesAndMetricsString = this.formatLogsAsMetricsContent(logs);
        progressBarHelper.log(
            `${this.epochDurationMillis.toFixed(0)}ms ` +
            `${this.usPerStep.toFixed(0)}us/step - ` +
            `${lossesAndMetricsString}`);
        await nextFrame();
      },
    });
  }

  private formatLogsAsMetricsContent(logs: Logs): string {
    let metricsContent = '';
    const keys = Object.keys(logs).sort();
    for (const key of keys) {
      if (this.isFieldRelevant(key)) {
        const value = logs[key];
        const decimalPlaces = getDisplayDecimalPlaces(value);
        metricsContent += `${key}=${value.toFixed(decimalPlaces)} `;
      }
    }
    return metricsContent;
  }

  private isFieldRelevant(key: string) {
    return key !== 'batch' && key !== 'size';
  }
}

/**
 * Determine the number of decimal places to display.
 *
 * @param x Number to display.
 * @return Number of decimal places to display for `x`.
 */
export function getDisplayDecimalPlaces(x: number): number {
  const BASE_NUM_DIGITS = 2;
  if (!Number.isFinite(x) || x === 0 || x > 1 || x < -1) {
    return BASE_NUM_DIGITS;
  } else {
    return BASE_NUM_DIGITS - Math.floor(Math.log10(Math.abs(x)));
  }
}

export interface TensorBoardCallbackArgs {
  /**
   * The frequency at which loss and metric values are written to logs.
   *
   * Default: 'epoch';
   */
  updateFreq?: 'batch'|'epoch';
}

/**
 * Callback for logging to TensorBoard durnig traning.
 *
 * Users are expected to access this class through the `tensorBoardCallback()`
 * factory method instead.
 */
export class TensorBoard extends CustomCallback {
  private trainWriter: SummaryFileWriter;
  private valWriter: SummaryFileWriter;
  private batchesSeen: number;
  private epochsSeen: number;
  private readonly args: TensorBoardCallbackArgs;

  constructor(readonly logdir = './logs', args?: TensorBoardCallbackArgs) {
    super({
      onBatchEnd: async (batch: number, logs?: Logs) => {
        this.batchesSeen++;
        if (this.args.updateFreq !== 'epoch') {
          this.logMetrics(logs, 'batch_', this.batchesSeen);
        }
      },
      onEpochEnd: async (epoch: number, logs?: Logs) => {
        this.epochsSeen++;
        this.logMetrics(logs, 'epoch_', this.epochsSeen);
      },
      onTrainEnd: async (logs?: Logs) => {
        this.trainWriter.flush();
      }
    });

    this.args = args == null ? {} : args;
    if (this.args.updateFreq == null) {
      this.args.updateFreq = 'epoch';
    }
    util.assert(
        ['batch', 'epoch'].indexOf(this.args.updateFreq) !== -1,
        `Expected updateFreq to be 'batch' or 'epoch', but got ` +
            `${this.args.updateFreq}`);
    this.batchesSeen = 0;
    this.epochsSeen = 0;
  }

  private logMetrics(logs: Logs, prefix: string, step: number) {
    for (const key in logs) {
      if (key === 'batch' || key === 'size' || key === 'num_steps') {
        continue;
      }

      const VAL_PREFIX = 'val_';
      if (key.startsWith(VAL_PREFIX)) {
        this.ensureValWriterCreated();
        const scalarName = prefix + key.slice(VAL_PREFIX.length);
        this.valWriter.scalar(scalarName, logs[key], step);
      } else {
        this.ensureTrainWriterCreated();
        this.trainWriter.scalar(`${prefix}${key}`, logs[key], step);
      }
    }
  }

  private ensureTrainWriterCreated() {
    this.trainWriter = summaryFileWriter(path.join(this.logdir, 'train'));
  }

  private ensureValWriterCreated() {
    this.valWriter = summaryFileWriter(path.join(this.logdir, 'val'));
  }
}

/**
 * Callback for logging to TensorBoard durnig traning.
 *
 * This callback logs loss and metric values (if any) generated during a call
 * to the `fit()` or `fitDataset()` method of  to a specific log
 * directory (logdir), which can be ingested and visualized by the TensorBoard
 * binary.
 *
 * Usage example:
 * ```js
 * // Constructor a toy multilayer-perceptron regressor for demo purpose.
 * const model = tf.sequential();
 * model.add(
 *     tf.layers.dense({units: 100, activation: 'relu', inputShape: [200]}));
 * model.add(tf.layers.dense({units: 1}));
 * model.compile({
 *   loss: 'meanSquaredError',
 *   optimizer: 'sgd',
 *   metrics: ['MAE']
 * });
 *
 * // Generate some random fake data for demo purpose.
 * const xs = tf.randomUniform([10000, 200]);
 * const ys = tf.randomUniform([10000, 1]);
 * const valXs = tf.randomUniform([1000, 200]);
 * const valYs = tf.randomUniform([1000, 1]);
 *
 * // Start model training process.
 * await model.fit(xs, ys, {
 *   epochs: 100,
 *   validationData: [valXs, valYs],
 *    // Add the tensorBoard callback here.
 *   callbacks: tf.node.tensorBoard('/tmp/fit_logs_1')
 * });
 * ```
 */
export function tensorBoard(logdir = './logs', args?: TensorBoardCallbackArgs) {
  return new TensorBoard(logdir, args);
}
