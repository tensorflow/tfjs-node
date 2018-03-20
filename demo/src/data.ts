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

// tslint:disable-next-line:max-line-length
import {equal} from 'assert';
import {InMemoryDataset, Tensor, tensor1d, tensor2d} from 'deeplearn';
import {createWriteStream, existsSync, readFileSync} from 'fs';
import {get} from 'https';
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

function loadImages(filename: string): Promise<Tensor[]> {
  return new Promise<Tensor[]>(async (resolve, reject) => {
    await downloadFile(filename);

    const buffer = readFileSync(filename);

    const headerBytes = 16;
    const recordBytes = 28 * 28;

    const headerValues = loadHeaderValues(buffer, headerBytes);
    equal(headerValues[0], 2051);
    equal(headerValues[1], 60000);
    equal(headerValues[2], 28);
    equal(headerValues[3], 28);

    const images = [];
    let index = headerBytes;
    while (index < buffer.byteLength) {
      const array = new Uint8Array(recordBytes);
      for (let i = 0; i < recordBytes; i++) {
        array[i] = buffer.readUInt8(index++);
      }
      images.push(tensor2d(array, [28, 28]));
    }

    equal(images.length, headerValues[1]);
    resolve(images);
  });
}

function loadLabels(filename: string): Promise<Tensor[]> {
  return new Promise<Tensor[]>(async (resolve, reject) => {
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
      labels.push(tensor1d(array));
    }

    equal(labels.length, headerValues[1]);
    resolve(labels);
  });
}

export class MnsitDataset extends InMemoryDataset {
  fetchData(): Promise<void> {
    return new Promise(async (resolve) => {
      this.dataset = await Promise.all(
          [loadImages(TRAIN_IMAGES_FILE), loadLabels(TRAIN_LABELS_FILE)]);
      console.log('-- loaded all images and labels');
      resolve();
    });
  }
}

export function createDataset(): MnsitDataset {
  return new MnsitDataset([[28, 28, 1], [10]]);
}

async function loadTest() {
  const dataset = createDataset();
  await dataset.fetchData();

  console.log(`dataset: ${dataset.getData().length}`);

  // Examine a random image:
  const idx = 7;
  const images = dataset.getData()[0];
  const data = images[idx].dataSync();
  console.log(`--- Label: ${dataset.getData()[1][idx].dataSync()}`);
  let test = '';
  for (let i = 0; i < data.length; i++) {
    if (i !== 0 && i % 28 === 0) {
      console.log(test);
      test = '';
    }

    if (data[i] === 0) {
      test += '    ';
    } else {
      test += ' ' + data[i];
      if (data[i] < 10) {
        test += '00';
      } else if (data[i] < 100) {
        test += '0';
      }
    }
  }

  await setTimeout(() => {}, 5000);
}

loadTest();
