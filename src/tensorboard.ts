
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

import {Scalar, Tensor} from '@tensorflow/tfjs';
import {NodeJSKernelBackend} from './nodejs_kernel_backend';
import {nodeBackend} from './ops/op_utils';

export class SummaryWriter {
  backend: NodeJSKernelBackend;

  constructor(private readonly resourceHandle: Tensor) {
    // TODO(cais): Deduplicate backend with createSummaryWriter.
    // TODO(cais): Use writer cache.
    this.backend = nodeBackend();
  }

  scalar(
      name: string, value: Scalar|number, step: number, description?: string) {
    // N.B.: Unlike the Python TensorFlow API, step is a required parameter,
    // because the construct of global step does not exist in TensorFlow.js.
    if (description != null) {
      throw new Error('scalar() does not support description yet');
    }

    this.backend.writeScalarSummary(this.resourceHandle, step, name, value);
  }

  flush() {
    this.backend.flushSummaryWriter(this.resourceHandle);
  }
}

export async function summaryFileWriter(
    logdir: string, maxQueue?: number, flushMillis?: number,
    filenameSuffix = '.v2'): Promise<SummaryWriter> {
  const backend = nodeBackend();
  const writerResource = backend.summaryWriter();
  // const resourceHandle = (await writerResource.data()) as Uint8Array;

  backend.createSummaryFileWriter(
      writerResource, logdir, maxQueue, flushMillis, filenameSuffix);

  return new SummaryWriter(writerResource);
}
