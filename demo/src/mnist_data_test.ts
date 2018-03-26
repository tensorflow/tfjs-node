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
import {Timer} from './timer';

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

  const testBatch = dataset.nextTrainBatch(3);
  testPrint(testBatch.image, testBatch.label);

  dataset.reset();
  const timer = new Timer();
  timer.start();
  for (let i = 0; i < 2000 && dataset.hasMoreData(); i++) {
    dataset.nextTrainBatch(100);
  }
  timer.end();
  console.log(`Looped through 2000 batches at 100: ${timer.seconds()} seconds`);
}

loadTest();
