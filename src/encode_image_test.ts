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

import {test_util} from '@tensorflow/tfjs-core';
import * as tf from './index';
import {getUint8ArrayFromImage} from './decode_image_test';

fdescribe('encode images', () => {
  it('encodeJpeg', async () => {
    const uint8array =
        await getUint8ArrayFromImage('test_images/image_png_test.png');
    const jpegTensor = tf.tensor3d(new Uint8Array([238, 101, 0, 50, 50, 50, 100, 50, 0, 200, 100, 50]), [2, 2, 3]);
    const jpegString = await tf.node.encodeJpeg(jpegTensor);
    jpegTensor.dispose();
    console.log(jpegString)
    // TODO
    test_util.expectArraysEqual(
        new Uint8Array(Buffer.from(jpegString).buffer),
        uint8array);
  });
});
