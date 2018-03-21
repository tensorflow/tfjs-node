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

import * as dl from 'deeplearn';
import * as tf from 'tfjs-node';

import {createDataset, MnsitDataset} from './data';

function testPrint(dataset: MnsitDataset, index: number) {
  const images = dataset.getData()[0];
  const data = images[index].dataSync();

  const label = dataset.getData()[1][index] as dl.Tensor1D;
  console.log(`--- Label: ${label.dataSync()}`);
  console.log(`-- one_hot: ${dl.oneHot(label, 10)}`);
  let test = '';
  for (let i = 0; i < data.length; i++) {
    if (i !== 0 && i % 28 === 0) {
      console.log(test);
      test = '';
    }

    if (data[i] === 0) {
      test += '     ';
    } else {
      test += ' ' + data[i].toFixed(1);
    }
  }
}

async function loadTest() {
  tf.bindTensorFlowBackend();
  const dataset = createDataset();
  await dataset.fetchData();

  // Examine a random image:
  testPrint(dataset, 20);
  testPrint(dataset, 7);

  const batch = dataset.nextTrainBatch(64);
  console.log(`batch.image.shape: ${batch.image.shape}`);
  console.log(`batch.label.shape: ${batch.label.shape}`);

  // await setTimeout(() => {}, 10000);
}

loadTest();
