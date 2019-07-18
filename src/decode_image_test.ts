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

import {test_util} from '@tensorflow/tfjs-core';
import {decodeImage} from './decode_image';

describe('decode images', () => {
  it('decode png', async () => {
    const imageTensor = decodeImage('src/image_png_test.png', 3);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([1, 2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [238, 101, 0, 50, 50, 50, 100, 50, 0, 200, 100, 50]);
  });

  it('decode png 4 channels', async () => {
    const imageTensor = decodeImage('src/image_png_4_channel_test.png', 4);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([1, 2, 2, 4]);
    test_util.expectArraysEqual(await imageTensor.data(), [
      238, 101, 0, 255, 50, 50, 50, 255, 100, 50, 0, 255, 200, 100, 50, 255
    ]);
  });

  it('decode bmp', async () => {
    const imageTensor = decodeImage('src/image_bmp_test.bmp', 3);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([1, 2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [238, 101, 0, 50, 50, 50, 100, 50, 0, 200, 100, 50]);
  });

  it('decode bmp 0 channels, use the number of channels in the BMP-encoded ' +
         'image',
     async () => {
       const imageTensor = decodeImage('src/image_bmp_test.bmp', 0);
       expect(imageTensor.dtype).toBe('int32');
       expect(imageTensor.shape).toEqual([1, 2, 2, 3]);
       test_util.expectArraysEqual(
           await imageTensor.data(),
           [238, 101, 0, 50, 50, 50, 100, 50, 0, 200, 100, 50]);
     });

  it('decode jpg', async () => {
    const imageTensor = decodeImage('src/image_jpeg_test.jpeg');
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([1, 2, 2, 3]);
    test_util.expectArraysEqual(
        await imageTensor.data(),
        [239, 100, 0, 46, 48, 47, 92, 49, 0, 194, 98, 47]);
  });

  it('decode jpg with 0 channels, use the number of channels in the ' +
         'JPEG-encoded image',
     async () => {
       const imageTensor = decodeImage('src/image_jpeg_test.jpeg', 0);
       expect(imageTensor.dtype).toBe('int32');
       expect(imageTensor.shape).toEqual([1, 2, 2, 3]);
       test_util.expectArraysEqual(
           await imageTensor.data(),
           [239, 100, 0, 46, 48, 47, 92, 49, 0, 194, 98, 47]);
     });

  it('decode jpg with downscale', async () => {
    const imageTensor = decodeImage('src/image_jpeg_test.jpeg', 0, 2);
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([1, 1, 1, 3]);
    test_util.expectArraysEqual(await imageTensor.data(), [147, 75, 25]);
  });

  it('decode gif', async () => {
    const imageTensor = decodeImage('src/gif_test.gif');
    expect(imageTensor.dtype).toBe('int32');
    expect(imageTensor.shape).toEqual([2, 2, 2, 3]);
    test_util.expectArraysEqual(await imageTensor.data(), [
      238, 101, 0,  50, 50, 50,  100, 50, 0,   200, 100, 50,
      200, 100, 50, 34, 68, 102, 170, 0,  102, 255, 255, 255
    ]);
  });
});
