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
const BMP = 'BMP';

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

export function decodeBmp(contents: Uint8Array, channels?: number) {
  const backend = nodeBackend();
  return backend.decodeBmp(contents, channels);
}

export function decodeGif(contents: Uint8Array) {
  const backend = nodeBackend();
  return backend.decodeGif(contents);
}



/**
 * Detects whether an image is a BMP, GIF, JPEG, or PNG, and performs the
 * appropriate operation (decodePng, decodeJpeg, decodeBmp, decodeGif) to
 * convert the provided file into a Tensor of int32.
 *
 * @param path Path to the encoded image.
 * @param channels An optional int. Defaults to 3. Number of color channels for
 *     the decoded image. It is used when image is type Png, Bmp, or Jpeg.
 * @param ratio An optional int. Defaults to 1. Downscaling ratio. It is used
 *     when image is type Jpeg.
 * @param fancyUpscaling An optional bool. Defaults to True. If true use a
 *     slower but nicer upscaling of the chroma planes. It is used when image is
 *     type Jpeg.
 * @param tryRecoverTruncated An optional bool. Defaults to False. If true try
 *     to recover an image from truncated input. It is used when image is type
 *     Jpeg.
 * @param acceptableFraction An optional float. Defaults to 1. The minimum
 *     required fraction of lines before a truncated input is accepted. It is
 *     used when image is type Jpeg.
 * @param dctMethod An optional string. Defaults to "". string specifying a hint
 *     about the algorithm used for decompression. Defaults to "" which maps to
 *     a system-specific default. Currently valid values are ["INTEGER_FAST",
 *     "INTEGER_ACCURATE"]. The hint may be ignored (e.g., the internal jpeg
 *     library changes to a version that does not have that specific option.) It
 *     is used when image is type Jpeg.
 * @returns A Tensor of type int32.
 */
/**
 * @doc {heading: 'Node.js', namespace: 'node'}
 */
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
  // image is BMP, JPEG or PNG type, expanding the tensors shape so it becomes
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
    case BMP:
      return backend.decodeBmp(uint8array, channels).toInt().expandDims(0);
    default:
      return null;
  }
}

/** Helper function to get image type based on starting bytes of the file. */
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
  } else if (buf.length > 3 && buf[0] === 66 && buf[1] == 77) {
    // BMP byte chunk starts with `42 4d`
    return BMP;
  } else {
    throw new Error(
      'Expected image (JPEG, PNG, or GIF), but got unsupported image type');
  }
}
