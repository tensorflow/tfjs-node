import {bindTensorFlowBackend} from './index';
// tslint:disable-next-line:no-require-imports
const jasmineCtor = require('jasmine');
bindTensorFlowBackend();

const IGNORE_LIST: string[] = [
  // Methods using browser-specific api.
  'loadWeights', 'time',

  // Depends on backend.memory to be implemented.
  'variable',

  // Optimizers.
  'RMSPropOptimizer', 'MomentumOptimizer', 'AdagradOptimizer',
  'AdamaxOptimizer', 'AdamOptimizer', 'SGDOptimizer', 'AdadeltaOptimizer',
  'optimizer',

  // Unimplemented ops.
  'clip', 'leakyRelu', 'elu', 'expm1', 'log1p', 'resizeBilinear', 'argmin',
  'argmax', 'avgPool', 'multinomial', 'localResponseNormalization',
  'logicalXor',

  // Ops with bugs. Some are higher-level ops.
  'mean', 'relu', 'norm', 'moments',
  'sum',  // In browser we allow sum(bool), but TF requires numeric dtype.
  'max',  // Doesn't propagate NaN.
  'min',  // Doesn't propagate NaN.
];

const runner = new jasmineCtor();
runner.loadConfig({
  spec_files: [
    'src/**/*_test.ts', 'node_modules/@tensorflow/tfjs-core/dist/**/*_test.js'
  ]
});

const env = jasmine.getEnv();

// Filter method that returns boolean, if a given test should return.
env.specFilter = spec => {
  // Return false (skip the test) if the test is in the ignore list.
  for (let i = 0; i < IGNORE_LIST.length; ++i) {
    if (spec.getFullName().startsWith(IGNORE_LIST[i])) {
      return false;
    }
  }
  // Otherwise run the test.
  return true;
};

runner.execute();
