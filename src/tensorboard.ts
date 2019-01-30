
/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
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

import {Scalar, Tensor, util} from '@tensorflow/tfjs';
import {NodeJSKernelBackend} from './nodejs_kernel_backend';
import {nodeBackend} from './ops/op_utils';

export class SummaryFileWriter {
  backend: NodeJSKernelBackend;

  constructor(private readonly resourceHandle: Tensor) {
    // TODO(cais): Deduplicate backend with createSummaryWriter.
    // TODO(cais): Use writer cache.
    this.backend = nodeBackend();
  }

  /**
   * Write a scalar summary.
   *
   * @param name A name of the summary. The summary tag for TensorBoard will be
   *   this name.
   * @param value A real numeric scalar value, as `tf.Scalar` or a JavaScript
   *   `number`.
   * @param step Required `int64`-castable, monotically-increasing step value.
   * @param description Optinal long-form description for this summary, as a
   *   `string`. *Not implemented yet*.
   */
  scalar(
      name: string, value: Scalar|number, step: number, description?: string) {
    // N.B.: Unlike the Python TensorFlow API, step is a required parameter,
    // because the construct of global step does not exist in TensorFlow.js.
    if (description != null) {
      throw new Error('scalar() does not support description yet');
    }

    this.backend.writeScalarSummary(this.resourceHandle, step, name, value);
  }

  /**
   * Force summary writer to send all buffered data to storage.
   */
  flush() {
    this.backend.flushSummaryWriter(this.resourceHandle);
  }
}

/**
 * Use a cache for `SummaryFileWriter` instance.
 *
 * Using multiple instances of `SummaryFileWriter` pointing to the same
 * logdir has potential problems. Using this cache avoids those problems.
 */
const summaryFileWriterCache: {[logdir: string]: SummaryFileWriter} = {};

/**
 * Create a summary file writer for TensorBoard.
 *
 * @param logdir Log directory in which the summary data will be written.
 * @param maxQueue Maximum queue length (default: `10`).
 * @param flushMillis Flush every __ milliseconds (default: `120e3`, i.e,
 *   `120` seconds).
 * @param filenameSuffix Suffix of the protocol buffer file names to be
 *   written in the `logdir` (default: `.v2`).
 * @returns An instance of `SummaryFileWriter`.
 */
export async function summaryFileWriter(
    logdir: string, maxQueue = 10, flushMillis = 120000,
    filenameSuffix = '.v2'): Promise<SummaryFileWriter> {
  util.assert(
      logdir != null && typeof logdir === 'string' && logdir.length > 0,
      `logdir is null, undefined, not a string, or an empty string`);
  if (!(logdir in summaryFileWriterCache)) {
    const backend = nodeBackend();
    const writerResource = backend.summaryWriter();
    // const resourceHandle = (await writerResource.data()) as Uint8Array;

    backend.createSummaryFileWriter(
        writerResource, logdir, maxQueue, flushMillis, filenameSuffix);

    summaryFileWriterCache[logdir] = new SummaryFileWriter(writerResource);
  }
  return summaryFileWriterCache[logdir];
}
