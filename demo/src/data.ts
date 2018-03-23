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
import {ENV, Environment, InMemoryDataset, oneHot, Tensor, tensor1d, tensor2d, Tensor2D} from 'deeplearn';
import {TypedArray} from 'deeplearn/dist/types';
import {createWriteStream, existsSync, readFileSync} from 'fs';
import {get} from 'https';
import {NodeJSKernelBackend} from 'tfjs-node';
import {createGunzip} from 'zlib';

const BASE_URL = 'https://storage.googleapis.com/cvdf-datasets/mnist/';
const TRAIN_IMAGES_FILE = 'train-images-idx3-ubyte';
const TRAIN_LABELS_FILE = 'train-labels-idx1-ubyte';

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

    const headerBytes = 16;
    const recordBytes = 28 * 28;

    const headerValues = loadHeaderValues(buffer, headerBytes);
    equal(headerValues[0], 2051);
    equal(headerValues[1], 60000);
    equal(headerValues[2], 28);
    equal(headerValues[3], 28);

    const downsize = 1.0 / 255.0;

    const images = [];
    let index = headerBytes;
    while (index < buffer.byteLength) {
      const array = new Float32Array(recordBytes);
      for (let i = 0; i < recordBytes; i++) {
        array[i] = buffer.readUInt8(index++) * downsize;
      }
      // TODO - store as typed-arrays in memory. Use dl.variable() to swap out
      // as needed
      // images.push(tensor2d(array, [1, 784]));
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

    const headerBytes = 8;
    const recordBytes = 1;

    const headerValues = loadHeaderValues(buffer, headerBytes);
    equal(headerValues[0], 2049);
    equal(headerValues[1], 60000);

    const labels = [];
    let index = headerBytes;
    while (index < buffer.byteLength) {
      const array = new Uint8Array(recordBytes);
      for (let i = 0; i < recordBytes; i++) {
        array[i] = buffer.readUInt8(index++);
      }
      // labels.push(oneHot(tensor1d(array, 'int32'), 10));
      labels.push(array);
    }

    equal(labels.length, headerValues[1]);
    resolve(labels);
  });
}

function backend(): NodeJSKernelBackend {
  return ENV.findBackend('tensorflow') as NodeJSKernelBackend;
}

export class MnsitDataset {
  protected dataset: TypedArray[][]|null;
  protected batchIndex: 0;

  loadData(): Promise<void> {
    return new Promise(async (resolve) => {
      this.dataset = await Promise.all(
          [loadImages(TRAIN_IMAGES_FILE), loadLabels(TRAIN_LABELS_FILE)]);
      console.log('-- loaded all images and labels');
      resolve();
    });
  }

  nextTrainBatch(batchSize: number): {image: Tensor2D, label: Tensor2D} {
    let image: Tensor2D = null;
    let label: Tensor2D = null;

    // TODO - make this check boundaries...
    for (let i = 0; i < batchSize; i++) {
      const imageFlat = tensor2d(this.dataset[0][i], [1, 784]);
      if (image == null) {
        image = imageFlat;
      } else {
        image = image.concat(imageFlat, 0);
      }

      const labelFlat = oneHot(tensor1d(this.dataset[1][i], 'int32'), 10);
      if (label == null) {
        label = labelFlat;
      } else {
        label = label.concat(labelFlat, 0);
      }

      this.batchIndex++;
    }

    // if (Environment.getBackend() === 'tensorflow') {
    //   label = backend().cast(label, 'float32');
    // }

    return {image, label};
  }
}

export function createDataset(): MnsitDataset {
  return new MnsitDataset();
}
