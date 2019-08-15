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

import {Tensor3D} from '@tensorflow/tfjs-core';
import {ensureTensorflowBackend, nodeBackend} from './ops/op_utils';

export async function encodeJpeg(
  image: Tensor3D, format: '' | 'grayscale' | 'rgb' = '', quality: number = 95,
  progressive: boolean = false, optimize_size: boolean = false,
  chroma_downsampling: boolean = true, density_unit: 'in' | 'cm' = 'in',
  x_density: number = 300, y_density: number = 300, xmp_metadata: string = ''
  ): Promise<Uint8Array> {
  ensureTensorflowBackend();

  const imageData = new Uint8Array(await image.data())
  const encodedJpegTensor = nodeBackend().encodeJpeg(
    imageData, image.shape, format, quality,
    progressive, optimize_size, chroma_downsampling, density_unit, x_density,
    y_density, xmp_metadata);

  const encodedJpegData = (
    await encodedJpegTensor.data())[0] as any as Uint8Array;
  encodedJpegTensor.dispose();
  return encodedJpegData;
}
