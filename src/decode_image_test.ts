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


import * as fs from 'fs';
import {decodeJpeg, decodePng} from './decode_image';
const {StringDecoder} = require('string_decoder');
const decoder = new StringDecoder('hex');

describe('decode images', () => {
  fit('decode png', done => {
    const image = fs.readFileSync('src/tf_logo_test.png');
    const buf = Buffer.from(image);

    console.log(
        buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71 &&
        buf[4] === 13 && buf[5] === 10 && buf[6] === 26 && buf[7] === 10);

    // console.log(image.readUInt8(2));
    console.log(buf[0], buf[1], buf[2], buf[3], buf[4], buf[5], buf[6], buf[7]);
    const uint8array = new Uint8Array(buf);

    const imageTensor = decodePng(uint8array, 3);
    console.log('result: ', imageTensor);
    console.log(imageTensor.shape);
  });

  fit('decode jpg', done => {
    const image = fs.readFileSync('src/download.jpeg');
    const buf = Buffer.from(image);

    console.log(buf[0] === 255 && buf[1] === 216 && buf[2] === 255);

    // console.log(image.readUInt8(2));
    console.log(buf[0], buf[1], buf[2]);
    const uint8array = new Uint8Array(buf);

    const imageTensor = decodeJpeg(uint8array, 3, 1, true, false, 1, '');
    console.log('result: ', imageTensor);
    console.log(imageTensor.shape);
    done();
  });

  fit('decode gif', done => {
    const image = fs.readFileSync('src/test.gif');
    const buf = Buffer.from(image);

    console.log(
        buf[0] === 71 && buf[1] === 73 && buf[2] === 70 && buf[3] === 56);

    // console.log(image.readUInt8(2));
    console.log(buf[0], buf[1], buf[2], buf[3]);
    const uint8array = new Uint8Array(buf);

    const imageTensor = decodeJpeg(uint8array, 3, 1, true, false, 1, '');
    console.log('result: ', imageTensor);
    console.log(imageTensor.shape);
    done();
  });
});
