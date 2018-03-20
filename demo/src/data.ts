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

import {createWriteStream, existsSync} from 'fs';
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
        response.pipe(createGunzip()).pipe(file);
        response.on('end', () => {
          resolve();
        });
      });
    }
  });
}

async function downloadTrain() {
  await Promise.all(
      [downloadFile(TRAIN_IMAGES_FILE), downloadFile(TRAIN_LABELS_FILE)]);
  console.log('--- done');
}

downloadTrain();
