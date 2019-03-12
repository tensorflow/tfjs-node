/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 * =============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';

import * as tf from '../../dist';

process.on('unhandledRejection', (reason, promise) => {
  console.error(reason);
  process.exit(1);
});

tf.ENV.set('PROD', true);

interface BenchmarkConfig {
  FIT_BURNIN_EPOCHS: number;
  PREDICT_BURNINS: number;
  PREDICT_RUNS: number;
};

interface BenchmarkData {
  name: string;
  description: string;
  optimizer: string;
  loss: string;
  input_shape: tf.Shape;
  target_shape: tf.Shape;
  batch_size: number;
  predict_time: number;
  train_epochs?: number;
  train_time?: number;
};

interface BenchmarkMetadata {
  keras_version: string;
  tensorflow_version: string;
  tensorflow_uses_gpu: boolean;
}

interface BenchmarksJSON {
  metadata: BenchmarkMetadata;
  config: BenchmarkConfig;
  models: string[];
}

const optimizerMap: {[pyOptimizerName: string]: string} = {
  'RMSPropOptimizer': 'rmsprop',
  'AdamOptimizer': 'adam',
  'GradientDescentOptimizer': 'sgd'
};

const lossMap: {[pyLossName: string]: string} = {
  mean_squared_error: 'meanSquaredError',
  categorical_crossentropy: 'categoricalCrossentropy',
};

async function runBenchmark(artifactsDir: string,
                            modelName: string,
                            config: BenchmarkConfig): Promise<{
    pyBenchmark: BenchmarkData,
    predictTimeMs: number,
    trainTimeMs: number}> {
  // Note: currently we load only the topology. The weight values don't matter
  // for the benchmarks and are initialized according to the initializer.
  const modelDir = path.join(artifactsDir, modelName);
  const modelJSON = JSON.parse(fs.readFileSync(
      path.join(modelDir, 'model.json'), {encoding: 'utf-8'}));
  const model = await tf.models.modelFromJSON(modelJSON['modelTopology']);

  const benchmarkData = JSON.parse(fs.readFileSync(
      path.join(modelDir, 'data.json'), {encoding: 'utf-8'})) as BenchmarkData;
  
  // TODO(cais): Maybe TF.js Layers should tolerate these Python-style names
  // for losses.
  const [xs, ys] = getRandomInputsAndOutputs(model, benchmarkData.batch_size);

  if (benchmarkData.train_epochs > 0) {
    const optimizer =
        optimizerMap[benchmarkData.optimizer] || benchmarkData.optimizer;
    model.compile({
      optimizer,
      loss: lossMap[benchmarkData.loss],
    });
  }

  // Perform fit() burn-in.
  if (benchmarkData.train_epochs > 0) {
    await model.fit(xs, ys, {
      batchSize: benchmarkData.batch_size,
      epochs: config.FIT_BURNIN_EPOCHS,
      yieldEvery: 'never',
      verbose: 0
    });
    model.trainableWeights[0].read().dataSync();
  }

  let trainTimeMs: number;
  if (benchmarkData.train_epochs > 0) {
    const trainBeginMs = tf.util.now();
    await model.fit(xs, ys, {
      batchSize: benchmarkData.batch_size,
      epochs: benchmarkData.train_epochs,
      yieldEvery: 'never',
      verbose: 0
    });
    // After the fit() call, call dataSync() to let the scheduled GPU
    // operations to complete before proceeding.
    model.trainableWeights[0].read().dataSync();
    const trainEndMs = tf.util.now();
    trainTimeMs = (trainEndMs - trainBeginMs) / benchmarkData.train_epochs;
  }

  // Perform predict() burn-in.
  for (let i = 0; i < config.PREDICT_BURNINS; ++i) {
    tf.dispose(model.predict(xs));
  }
  // Time predict() a number of times and take the average.
  let output: tf.Tensor|tf.Tensor[];
  const predictBeginMs = tf.util.now();
  for (let i = 0; i < config.PREDICT_RUNS; ++i) {
    output = model.predict(xs);
    // After the model.predict() call, invoke dataSync() once to let the
    // scheduled GPU operations complete before proceeding.
    if (Array.isArray(output)) {
      output.forEach(out => out.dataSync());
    } else {
      output.dataSync();
    }
    tf.dispose(output);
  }  

  const predictEndMs = tf.util.now();
  const predictTimeMs = (predictEndMs - predictBeginMs) / config.PREDICT_RUNS;

  tf.dispose([xs, ys]);

  return {
    pyBenchmark: benchmarkData,
    predictTimeMs: predictTimeMs,
    trainTimeMs: trainTimeMs,
  };
}

/**
 * Synthesize random inputs and outputs based on the model's specs.
 *
 * @param model LayersModel for which the inputs and outputs will
 *   be synthesized.
 * @returns xs {tf.Tensor | tf.Tensor[]} Synthesized random feature
 *   tensors.
 *   ys {tf.Tensor | tf.Tensor[]} Synthesized random target tensors.
 */
function getRandomInputsAndOutputs(model: tf.LayersModel, batchSize: number):
    Array<tf.Tensor|tf.Tensor[]> {
  return tf.tidy(() => {
    let xs;
    xs = [];
    for (const input of model.inputs) {
      xs.push(tf.randomUniform([batchSize].concat(input.shape.slice(1))));
    }
    if (xs.length === 1) {
      xs = xs[0];
    }

    let ys;
    ys = [];
    for (const output of model.outputs) {
      ys.push(tf.randomUniform([batchSize].concat(output.shape.slice(1))));
    }
    if (ys.length === 1) {
      ys = ys[0];
    }

    return [xs, ys];
  });
}

function postPad(str: string, targetLength: number, padChar = ' '): string {
  let output = str.slice();
  const inputLength = str.length;
  for (let i = 0; i < targetLength - inputLength; ++i) {
    output += padChar;
  }
  return output;
}

function relPercentageStr(value: number, ref: number) {
  const percent = (value - ref) / ref * 100;
  let percentStr = `${percent.toFixed(1)}%`;
  return percent >= 0 ? `+${percentStr}` : percentStr;
}

async function main() {
  const artifactsDir = 'data/';

  const benchmarks = JSON.parse(fs.readFileSync(
      path.join(artifactsDir, 'benchmarks.json'), {encoding: 'utf-8'})) as
      BenchmarksJSON;
  
  const modelNames: string[] = [];
  const batchSizes: number[] = [];
  const pyPredictTimeMs: number[] = [];
  const tsPredictTimeMs: number[] = [];
  const pyFitTimeMs: number[] = [];
  const tsFitTimeMs: number[] = [];

  for (let i = 0; i < benchmarks.models.length; ++i) {
    const modelName = benchmarks.models[i];
    console.log(
       `Running model (${i + 1} of ${benchmarks.models.length}): ` +
       `${modelName} ...`);
    const result =
        await runBenchmark(artifactsDir, modelName, benchmarks.config);
    modelNames.push(modelName);
    batchSizes.push(result.pyBenchmark.batch_size);
    pyPredictTimeMs.push(result.pyBenchmark.predict_time * 1e3);
    tsPredictTimeMs.push(result.predictTimeMs);
    pyFitTimeMs.push(result.pyBenchmark.train_time * 1e3);
    tsFitTimeMs.push(result.trainTimeMs);
  }

  console.log('\n');
  console.log(`TensorFlow (Python) version: ` +
      `${benchmarks.metadata.tensorflow_version}`);
  console.log(`Keras (Python) version: ` +
      `${benchmarks.metadata.keras_version}`);
  console.log(`Python uses GPU?: ` +
      `${benchmarks.metadata.tensorflow_uses_gpu}`);
  console.log(`TypeScript uses GPU?: true`);  // TODO(cais): Don't hard code.
  console.log(`predict # of runs: ${benchmarks.config.PREDICT_RUNS}`);

  const FIRST_COLUMN_WIDTH = 28;
  const CONFIG_COLUMN_WIDTH = 12;
  const OTHER_COLUMN_WIDTH = 18;
  console.log(
      postPad('Model name', FIRST_COLUMN_WIDTH) + 
      postPad('Batch size', CONFIG_COLUMN_WIDTH) + 
      postPad('py predict (ms)', OTHER_COLUMN_WIDTH) +
      postPad('ts predict (ms)', OTHER_COLUMN_WIDTH) +
      postPad('py fit (ms)', OTHER_COLUMN_WIDTH) +
      postPad('ts fit (ms)', OTHER_COLUMN_WIDTH));
  console.log(
      postPad('',
          FIRST_COLUMN_WIDTH + CONFIG_COLUMN_WIDTH + OTHER_COLUMN_WIDTH * 4,
          '-'));
  for (let i = 0; i < modelNames.length; ++i) {
    let line = 
        postPad(modelNames[i], FIRST_COLUMN_WIDTH) +
        postPad(`${batchSizes[i]}`, CONFIG_COLUMN_WIDTH) +
        postPad(pyPredictTimeMs[i].toFixed(1), OTHER_COLUMN_WIDTH) +
        postPad(`${tsPredictTimeMs[i].toFixed(1)} ` +
            `(${relPercentageStr(tsPredictTimeMs[i], pyPredictTimeMs[i])})`,
            OTHER_COLUMN_WIDTH);
    if (!isNaN(pyFitTimeMs[i]) && pyFitTimeMs[i] > 0) {
      line +=
          postPad(pyFitTimeMs[i].toFixed(1), OTHER_COLUMN_WIDTH) +
          postPad(`${tsFitTimeMs[i].toFixed(1)} ` +
            `(${relPercentageStr(tsFitTimeMs[i], pyFitTimeMs[i])})`,
            OTHER_COLUMN_WIDTH);
    }
    console.log(line);
  }
}

main();
