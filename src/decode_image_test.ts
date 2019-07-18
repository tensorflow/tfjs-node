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

import {memory, setBackend, test_util} from '@tensorflow/tfjs-core';
import * as fs from 'fs';
import * as tf from './index';

describe('decode images', () => {
  it('decode png', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const image = fs.readFileSync('test_images/image_png_test.png');
    const buf = Buffer.from(image);
    const uint8array = new Uint8Array(buf);
    const imageTensor = await tf.node.decodePng(uint8array);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [238, 101, 0, 50, 50, 50, 100, 50, 0, 200, 100, 50]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode png 1 channels', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const imageTensor =
        await tf.node.decodeImage('test_images/image_png_test.png', 1);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 1]);
    test_util.expectArraysEqual(await imageTensor.data(), [130, 50, 59, 124]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode png 3 channels', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const imageTensor =
        await tf.node.decodeImage('test_images/image_png_test.png');
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [238, 101, 0, 50, 50, 50, 100, 50, 0, 200, 100, 50]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode png 4 channels', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const imageTensor = await tf.node.decodeImage(
        'test_images/image_png_4_channel_test.png', 4);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 4]);
    test_util.expectArraysEqual(await imageTensor.data(), [
      238, 101, 0, 255, 50, 50, 50, 255, 100, 50, 0, 255, 200, 100, 50, 255
    ]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode bmp', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const image = fs.readFileSync('test_images/image_bmp_test.bmp');
    const buf = Buffer.from(image);
    const uint8array = new Uint8Array(buf);
    const imageTensor = await tf.node.decodeBmp(uint8array);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [238, 101, 0, 50, 50, 50, 100, 50, 0, 200, 100, 50]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode bmp', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const imageTensor =
        await tf.node.decodeImage('test_images/image_bmp_test.bmp');
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [238, 101, 0, 50, 50, 50, 100, 50, 0, 200, 100, 50]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode jpg', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const image = fs.readFileSync('test_images/image_jpeg_test.jpeg');
    const buf = Buffer.from(image);
    const uint8array = new Uint8Array(buf);
    const imageTensor = await tf.node.decodeJpeg(uint8array);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [239, 100, 0, 46, 48, 47, 92, 49, 0, 194, 98, 47]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode jpg 1 channel', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const imageTensor =
        await tf.node.decodeImage('test_images/image_jpeg_test.jpeg', 1);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 1]);
    test_util.expectArraysEqual(await imageTensor.data(), [130, 47, 56, 121]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode jpg 3 channels', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const imageTensor =
        await tf.node.decodeImage('test_images/image_jpeg_test.jpeg', 3);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [239, 100, 0, 46, 48, 47, 92, 49, 0, 194, 98, 47]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode jpg with 0 channels, use the number of channels in the ' +
         'JPEG-encoded image',
     async () => {
       const beforeNumTensors: number = memory().numTensors;
       const imageTensor =
           await tf.node.decodeImage('test_images/image_jpeg_test.jpeg');
       expect(imageTensor.dtype).toBe('int32');
       expect(imageTensor.shape).toEqual([2, 2, 3]);
       test_util.expectArraysEqual(
           await imageTensor.data(),
           [239, 100, 0, 46, 48, 47, 92, 49, 0, 194, 98, 47]);
       expect(memory().numTensors).toBe(beforeNumTensors + 1);
     });

  it('decode jpg with downscale', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const imageTensor =
        await tf.node.decodeImage('test_images/image_jpeg_test.jpeg', 0, 2);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([1, 1, 3]);
    test_util.expectArraysEqual(await imageTensor.data(), [147, 75, 25]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('decode gif', async () => {
    const beforeNumTensors: number = memory().numTensors;
    const imageTensor = await tf.node.decodeImage('test_images/gif_test.gif');
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 2, 3]);
    test_util.expectArraysEqual(await imageTensor.data(), [
      238, 101, 0,  50, 50, 50,  100, 50, 0,   200, 100, 50,
      200, 100, 50, 34, 68, 102, 170, 0,  102, 255, 255, 255
    ]);
    expect(memory().numTensors).toBe(beforeNumTensors + 1);
  });

  it('throw error if backend is not tensorflow', async done => {
    try {
      setBackend('cpu');
      await tf.node.decodeImage('test_images/image_png_test.png');
      done.fail();
    } catch (err) {
      expect(err.message)
          .toBe('Expect the current backend to be tensorflow, but got cpu');
      setBackend('tensorflow');
      done();
    }
  });
});
