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

import {tensor1d, test_util} from '@tensorflow/tfjs-core';
import * as fs from 'fs';
import {promisify} from 'util';
import * as tf from './index';

describe('SavedModel', () => {
  it('load saved model int', async () => {
    const session =
        tf.node.loadSavedModel(__dirname.slice(0, -3) + 'times_two_int');
    const input = tensor1d([123], 'int32');
    const output =
        session.run([input], 'serving_default_x', 'StatefulPartitionedCall');
    test_util.expectArraysEqual(await output.data(), [123 * 2]);
    session.delete();
  });

  it('load saved model float', async () => {
    const session =
        tf.node.loadSavedModel(__dirname.slice(0, -3) + 'times_three_float');
    const input = tensor1d([123.4], 'float32');
    const output =
        session.run([input], 'serving_default_x', 'StatefulPartitionedCall');
    tf.test_util.expectArraysClose(await output.data(), [123.4 * 3]);
  });

  fit('load saved model no signature', async () => {
    const session =
        tf.node.loadSavedModel(__dirname.slice(0, -3) + 'module_no_signatures');
    const input = tensor1d([123.4], 'float32');
    const output =
        session.run([input], 'serving_default_x', 'StatefulPartitionedCall');
    tf.test_util.expectArraysClose(await output.data(), [123.4 * 3]);
  });

  it('load saved model with signature', async () => {
    const session = tf.node.loadSavedModel(
        __dirname.slice(0, -3) + 'module_with_signature');
    const input = tensor1d([123.4], 'float32');
    const output =
        session.run([input], 'serving_default_x', 'StatefulPartitionedCall');
    tf.test_util.expectArraysClose(await output.data(), [123.4 * 3]);
  });

  fit('load saved model with signature', async () => {
    const session =
        tf.node.loadSavedModel(__dirname.slice(0, -3) + 'half_plus_two');
    const input = tensor1d([123.4], 'float32');
    const output = session.run([input], 'x', 'y');
    tf.test_util.expectArraysClose(await output.data(), [123.4 / 2 + 2]);
  });
});
