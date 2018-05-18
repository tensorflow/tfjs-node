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

import * as tf from '@tensorflow/tfjs-core';
// tslint:disable-next-line:max-line-length
import {expectArraysClose} from '@tensorflow/tfjs-core/dist/test_util';

describe('delayed upload', () => {
  it('should handle data before op execution', () => {
    const t = tf.tensor1d([1, 2, 3]);
    expectArraysClose(t, [1, 2, 3]);

    const r = t.add(tf.tensor1d([4, 5, 6]));
    expectArraysClose(r, [5, 7, 9]);
  });

  it('should do something', () => {
    // Softmax:
    const logits = tf.tensor1d([1, 2, 3]);
    const labels = tf.tensor1d([0.3, 0.6, 0.1]);

    const softmaxLogits = tf.softmax(logits);
    console.log('softmax', softmaxLogits.dataSync());

    const y = tf.losses.softmaxCrossEntropy(labels, logits);
    console.log('y', y.dataSync());

    const t = -Math.log(softmaxLogits.get(0)) * labels.get(0) +
        -Math.log(softmaxLogits.get(1)) * labels.get(1) +
        -Math.log(softmaxLogits.get(2)) * labels.get(2);

    console.log(softmaxLogits.get(0));
    console.log(softmaxLogits.get(1));
    console.log(softmaxLogits.get(2));

    console.log(`yV: ${y.dataSync()}, t: ${t}`);
  });
});
