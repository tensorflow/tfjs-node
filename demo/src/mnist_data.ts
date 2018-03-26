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

import {equal} from 'assert';
// tslint:disable-next-line:max-line-length
import * as dl from 'deeplearn';
import {TypedArray} from 'deeplearn/dist/types';
import {createWriteStream, existsSync, readFileSync} from 'fs';
import {get} from 'https';
import {createGunzip} from 'zlib';

const BASE_URL = 'https://storage.googleapis.com/cvdf-datasets/mnist/';
const TRAIN_IMAGES_FILE = 'train-images-idx3-ubyte';
const TRAIN_LABELS_FILE = 'train-labels-idx1-ubyte';

const NUM_TRAIN_EXAMPLES = 60000;
const IMAGE_HEADER_BYTES = 16;
const IMAGE_DIMENSION_SIZE = 28;
const LABEL_HEADER_BYTES = 8;
const LABEL_RECORD_BYTE = 1;

function downloadFile(filename: string): Promise<string> {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${filename}.gz`;
    if (existsSync(filename)) {
      resolve();
    } else {
      const file = createWriteStream(filename);
      console.log('  * Downloading from ', url);
      get(url, (response) => {
        const unzip = createGunzip();
        response.pipe(unzip).pipe(file);
        unzip.on('end', () => {
          resolve();
        });
      });
    }
  });
}

function loadHeaderValues(buffer: Buffer, headerLength: number): number[] {
  const headerValues = [];
  for (let i = 0; i < headerLength / 4; i++) {
    // Header data is stored in-order (aka BE)
    headerValues[i] = buffer.readUInt32BE(i * 4);
  }
  return headerValues;
}

function loadImages(filename: string): Promise<TypedArray[]> {
  return new Promise<TypedArray[]>(async (resolve, reject) => {
    await downloadFile(filename);

    const buffer = readFileSync(filename);

    const headerBytes = IMAGE_HEADER_BYTES;
    const recordBytes = IMAGE_DIMENSION_SIZE * IMAGE_DIMENSION_SIZE;

    const headerValues = loadHeaderValues(buffer, headerBytes);
    equal(headerValues[0], 2051);  // magic number for images
    equal(headerValues[1], NUM_TRAIN_EXAMPLES);
    equal(headerValues[2], IMAGE_DIMENSION_SIZE);
    equal(headerValues[3], IMAGE_DIMENSION_SIZE);

    const downsize = 1.0 / 255.0;

    const images = [];
    let index = headerBytes;
    while (index < buffer.byteLength) {
      const array = new Float32Array(recordBytes);
      for (let i = 0; i < recordBytes; i++) {
        array[i] = buffer.readUInt8(index++) * downsize;
      }
      images.push(array);
    }

    equal(images.length, headerValues[1]);
    resolve(images);
  });
}

function loadLabels(filename: string): Promise<TypedArray[]> {
  return new Promise<TypedArray[]>(async (resolve, reject) => {
    await downloadFile(filename);

    const buffer = readFileSync(filename);

    const headerBytes = LABEL_HEADER_BYTES;
    const recordBytes = LABEL_RECORD_BYTE;

    const headerValues = loadHeaderValues(buffer, headerBytes);
    equal(headerValues[0], 2049);  // magic number for labels
    equal(headerValues[1], NUM_TRAIN_EXAMPLES);

    const labels = [];
    let index = headerBytes;
    while (index < buffer.byteLength) {
      const array = new Uint8Array(recordBytes);
      for (let i = 0; i < recordBytes; i++) {
        array[i] = buffer.readUInt8(index++);
      }
      labels.push(array);
    }

    equal(labels.length, headerValues[1]);
    resolve(labels);
  });
}

export class MnsitDataset {
  protected dataset: TypedArray[][]|null;
  protected batchIndex = 0;

  loadData(): Promise<void> {
    return new Promise(async (resolve) => {
      this.dataset = await Promise.all(
          [loadImages(TRAIN_IMAGES_FILE), loadLabels(TRAIN_LABELS_FILE)]);
      console.log('-- loaded all images and labels');
      resolve();
    });
  }

  reset() {
    this.batchIndex = 0;
  }

  hasMoreData(): boolean {
    return this.batchIndex < NUM_TRAIN_EXAMPLES;
  }

  nextTrainBatch(batchSize: number): {image: dl.Tensor2D, label: dl.Tensor2D} {
    let image: dl.Tensor2D = null;
    let label: dl.Tensor2D = null;

    let size = this.batchIndex + batchSize > NUM_TRAIN_EXAMPLES ?
        NUM_TRAIN_EXAMPLES - this.batchIndex :
        batchSize + this.batchIndex;

    for (; this.batchIndex < size; this.batchIndex++) {
      const imageFlat = dl.tensor2d(this.dataset[0][this.batchIndex], [1, 784]);
      if (image == null) {
        image = imageFlat;
      } else {
        image = image.concat(imageFlat);
      }

      const labelFlat =
          dl.oneHot(dl.tensor1d(this.dataset[1][this.batchIndex], 'int32'), 10);
      if (label == null) {
        label = labelFlat;
      } else {
        label = label.concat(labelFlat);
      }
    }

    label = dl.cast(label, 'float32');
    return {image, label};
  }
}
