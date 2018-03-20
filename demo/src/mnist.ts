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

const HIDDEN_1 = 128;
const HIDDEN_2 = 32;

const NUM_CLASSES = 10;
const IMAGE_SIZE = 28;
const IMAGE_PIXELS = IMAGE_SIZE * IMAGE_SIZE;

const weights1 = dl.truncatedNormal(
                     [IMAGE_PIXELS, HIDDEN_1], null,
                     1.0 / Math.sqrt(IMAGE_PIXELS)) as dl.Tensor2D;
const biases1 = dl.zeros([HIDDEN_1]);

const weights2 =
    dl.truncatedNormal([HIDDEN_1, HIDDEN_2], null, 1.0 / Math.sqrt(HIDDEN_1)) as
    dl.Tensor2D;
const biases2 = dl.zeros([HIDDEN_2]);

const weights3 = dl.truncatedNormal(
                     [HIDDEN_2, NUM_CLASSES], null,
                     1.0 / Math.sqrt(HIDDEN_2)) as dl.Tensor2D;
const biases3 = dl.zeros([NUM_CLASSES]);

function model(): dl.Tensor2D {
  const hidden1 = dl.tidy(() => {
    // TODO - bind and actually pass in images:
    const images = dl.tensor2d([IMAGE_SIZE, IMAGE_SIZE]);
    return dl.relu(dl.matMul(images, weights1).add(biases1));
  }) as dl.Tensor2D;

  const hidden2 = dl.tidy(() => {
    return dl.relu(dl.matMul(hidden1, weights2).add(biases2));
  }) as dl.Tensor2D;

  // linear
  return dl.tidy(() => {
    return dl.matMul(hidden2, weights3).add(biases3);
  }) as dl.Tensor2D;
}

function loss(labels: dl.Tensor2D, ys: dl.Tensor2D) {
  return dl.losses.softmaxCrossEntropy(labels, ys).mean() as dl.Scalar;
}

function runTraining(trainSteps: number) {
  for (let i = 0; i < trainSteps; i++) {
    // const cost = optimizer.minimize(() => {
    //   const batch = data.nextTrainBatch(BATCH_SIZE);
    //   return loss(batch.labels, model(batch.xs));
    // }, returnCost);

    // log(`loss[${i}]: ${cost.dataSync()}`);

    // await dl.nextFrame();
  }
}

tf.bindTensorFlowBackend();
runTraining(1);
