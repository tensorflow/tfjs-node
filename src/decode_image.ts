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

import {DataType, Tensor4D} from '@tensorflow/tfjs-core';
import * as fs from 'fs';
import {nodeBackend} from './ops/op_utils';

const JPEG = 'jpeg';
const PNG = 'png';
const GIF = 'gif';

export function decodeJpeg(
    contents: Uint8Array, channels: number = 3, ratio: number = 1,
    fancyUpscaling: boolean = true, tryRecoverTruncated: boolean = false,
    acceptableFraction: number = 1, dctMethod: string = '') {
  const backend = nodeBackend();
  return backend.decodeJpeg(
      contents, channels, ratio, fancyUpscaling, tryRecoverTruncated,
      acceptableFraction, dctMethod);
}

export function decodePng(
    contents: Uint8Array, channels: number = 3, dtype?: DataType) {
  const backend = nodeBackend();
  return backend.decodePng(contents, channels /*, dtype */);
}

// export function decodeBmp(contents: Uint8Array, channels?: number) {
//   const backend = nodeBackend();
//   return backend.decodeBmp(contents, channels);
// }

export function decodeGif(contents: Uint8Array) {
  const backend = nodeBackend();
  return backend.decodeGif(contents);
}

export function decodeImage(
    path: string, channels: number = 3, ratio: number = 1,
    fancyUpscaling: boolean = true, tryRecoverTruncated: boolean = false,
    acceptableFraction: number = 1, dctMethod: string = ''): Tensor4D {
  const image = fs.readFileSync(path);
  const buf = Buffer.from(image);
  const imageType = getImageType(buf);
  const backend = nodeBackend();
  const uint8array = new Uint8Array(buf);


  // The return tensor has dtype uint8, which is not supported in TensorFlow.js,
  // casting it to int32 which is the default dtype for image tensor. If the
  // image is JPEG or PNG type, expanding the tensors shape so it becomes
  // Tensor4D, which is the default tensor shape for image
  // ([batch,imageHeight,imageWidth, depth]).
  switch (imageType) {
    case JPEG:
      return backend
          .decodeJpeg(
              uint8array, channels, ratio, fancyUpscaling, tryRecoverTruncated,
              acceptableFraction, dctMethod)
          .toInt()
          .expandDims(0);
    case PNG:
      return backend.decodePng(uint8array, channels).toInt().expandDims(0);
    case GIF:
      return backend.decodeGif(uint8array).toInt();
    default:
      return null;
  }
}

function getImageType(buf: Buffer): string {
  // Classify the contents of a file based on starting bytes (the magic number:
  // https://en.wikipedia.org/wiki/Magic_number_(programming)#Magic_numbers_in_files)
  // C code of classifying file type:
  // https://github.com/tensorflow/tensorflow/blob/4213d5c1bd921f8d5b7b2dc4bbf1eea78d0b5258/tensorflow/core/kernels/decode_image_op.cc#L44
  if (buf.length > 3 && buf[0] === 255 && buf[1] === 216 && buf[2] === 255) {
    // JPEG byte chunk starts with `ff d8 ff`
    return JPEG;
  } else if (
      buf.length > 4 && buf[0] === 71 && buf[1] === 73 && buf[2] === 70 &&
      buf[3] === 56) {
    // GIF byte chunk starts with `47 49 46 38`
    return GIF;
  } else if (
      buf.length > 8 && buf[0] === 137 && buf[1] === 80 && buf[2] === 78 &&
      buf[3] === 71 && buf[4] === 13 && buf[5] === 10 && buf[6] === 26 &&
      buf[7] === 10) {
    // PNG byte chunk starts with `\211 P N G \r \n \032 \n (89 50 4E 47 0D 0A
    // 1A 0A)`
    return PNG;
  } else {
    throw new Error(
        'Expected image (JPEG, PNG, or GIF), but got unsupported image type');
  }
}
