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
import {Tensor5D} from '@tensorflow/tfjs-core/dist/tensor';
// tslint:disable-next-line:max-line-length
import {expectArraysClose} from '@tensorflow/tfjs-core/dist/test_util';
import {NodeJSKernelBackend} from './nodejs_kernel_backend';

describe('delayed upload', () => {
  it('should handle data before op execution', () => {
    const t = tf.tensor1d([1, 2, 3]);
    expectArraysClose(t, [1, 2, 3]);

    const r = t.add(tf.tensor1d([4, 5, 6]));
    expectArraysClose(r, [5, 7, 9]);
  });

  it('Should not cache tensors in the tensor map for device support. ', () => {
    const logits = tf.tensor1d([1, 2, 3]);
    const softmaxLogits = tf.softmax(logits);
    const data = softmaxLogits.dataSync();
    expect(softmaxLogits.dataSync()[0]).toEqual(data[0]);
    expect(softmaxLogits.dataSync()[1]).toEqual(data[1]);
    expect(softmaxLogits.dataSync()[2]).toEqual(data[2]);
  });
});

describe('type casting', () => {
  it('exp support int32', () => {
    tf.exp(tf.scalar(2, 'int32'));
  });
});

describe('conv3d dilations', () => {
  it('CPU should throw error on dilations >1', () => {
    const input = tf.ones([1, 2, 2, 2, 1]) as Tensor5D;
    const filter = tf.ones([1, 1, 1, 1, 1]) as Tensor5D;
    expect(() => {
      tf.conv3d(input, filter, 1, 'same', 'NHWC', [2, 2, 2]);
    }).toThrowError();
  });
  it('GPU should handle dilations >1', () => {
    // This test can only run locally with CUDA bindings and GPU package
    // installed.
    if ((tf.ENV.backend as NodeJSKernelBackend).isGPUPackage) {
      const input = tf.ones([1, 2, 2, 2, 1]) as Tensor5D;
      const filter = tf.ones([1, 1, 1, 1, 1]) as Tensor5D;
      tf.conv3d(input, filter, 1, 'same', 'NHWC', [2, 2, 2]);
    }
  });
});

describe('fill binding', () => {
  it('float32 default', () => {
    const x = tf.fill([2, 2], 42);
    expect(x.dtype).toEqual('float32');
    expectArraysClose(x, tf.ones([2, 2]).mul(42));
  });
  it('scalar', () => {
    const x = tf.fill([], 42);
    expect(x.dtype).toEqual('float32');
    expectArraysClose(x, tf.scalar(42));
  });
  it('float32 explicit', () => {
    const x = tf.fill([3], -7, 'float32');
    expect(x.dtype).toEqual('float32');
    expectArraysClose(x, tf.ones([3]).mul(-7));
  });
  it('int32', () => {
    const x = tf.fill([3], -7, 'int32');
    expect(x.dtype).toEqual('int32');
    expectArraysClose(x, tf.ones([3], 'int32').mul(tf.scalar(-7, 'int32')));
  });
  it('string', () => {
    const x = tf.fill([2, 2, 2], 'foo', 'string');
    expect(x.dtype).toEqual('string');
    expect(x.dataSync() as any).toEqual([
      'foo', 'foo', 'foo', 'foo', 'foo', 'foo', 'foo', 'foo'
    ]);
  });
});

describe('zerosLike binding', () => {
  it('float32', () => {
    const x = tf.ones([2, 3]);
    const y = tf.zerosLike(x)
    expectArraysClose(y, tf.zeros([2, 3]));
  });
});

describe('onesLike binding', () => {
  it('float32', () => {
    const x = tf.zeros([2, 3]);
    const y = tf.onesLike(x);
    expectArraysClose(y, tf.ones([2, 3]));
  });
});
