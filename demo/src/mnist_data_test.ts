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

import {MnsitDataset} from './mnist_data';

function testPrint(image: dl.Tensor, label: dl.Tensor) {
  const data = image.dataSync();
  console.log(`--- Label: ${label.dataSync()}`);
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
  const dataset = new MnsitDataset();
  await dataset.loadData();

  // // Test print a batch of images.
  // let batch = dataset.nextTrainBatch(1);
  // batch = dataset.nextTrainBatch(5);
  // testPrint(batch.image, batch.label);

  for (let i = 0; i < 1000 && dataset.hasMoreData(); i++) {
    dataset.nextTrainBatch(64);
    if (i % 100 === 0) {
      console.log('i', i);
    }
  }
}

loadTest();
