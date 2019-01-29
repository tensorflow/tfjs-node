
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
    this.backend = nodeBackend();
  }

  scalar(step: number, name: string, value: Scalar|number, family?: string) {
    // N.B.: Unlike the Python TensorFlow API, step is a required parameter,
    // because the construct of global step does not exist in TensorFlow.js.
    if (family != null) {
      throw new Error('family support for scalar() is not implemented yet');
    }

    this.backend.writeScalarSummary(this.resourceHandle, step, name, value);
  }

  flush() {
    this.backend.flushSummaryWriter(this.resourceHandle);
  }

  // TODO(cais): Add close(), calling into the CloseSummaryWriter() op.
}

export async function createSummaryWriter(
    logdir: string, maxQueue?: number, flushMillis?: number,
    filenameSuffix?: string): Promise<SummaryWriter> {
  // TODO(cais): Use more specific typing for ResourceHandle.
  console.log('In createSummaryWriter()');  // DEBUG
  const backend = nodeBackend();
  const writerResource = backend.summaryWriter();
  console.log(writerResource);  // DEBUG
  // backend.createSummaryFileWriter2(writeRe)
  const resourceHandle = (await writerResource.data()) as Uint8Array;
  console.log(typeof resourceHandle);  // DEBUG
  console.log(resourceHandle.length);  // DEBUG

  backend.createSummaryFileWriter2(
      writerResource, logdir, maxQueue, flushMillis, filenameSuffix);

  return new SummaryWriter(writerResource);
}
