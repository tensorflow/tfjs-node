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
import * as tf from '.';
import {getImageType, ImageType} from './decode_image';


fdescribe('encode images', () => {
  it('encodeJpeg', async () => {
    const imageTensor = tf.tensor3d(new Uint8Array([239, 100, 0, 46, 48, 47, 92, 49, 0, 194, 98, 47]), [2, 2, 3]);
    const jpegEncodedData = await tf.node.encodeJpeg(imageTensor);
    imageTensor.dispose();
    expect(getImageType(jpegEncodedData)).toEqual(ImageType.JPEG);
  });
});
