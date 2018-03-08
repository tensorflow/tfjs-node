import * as dl from 'deeplearn';
import * as tf from 'tfjs-node';

const HIDDEN_1 = 128;
const HIDDEN_2 = 32;

const NUM_CLASSES = 10;
const IMAGE_SIZE = 28;
const IMAGE_PIXELS = IMAGE_SIZE * IMAGE_SIZE;

function runTraining() {
  dl.tidy(() => {
    // TODO - bind and actually pass in images:
    const images = dl.tensor2d([IMAGE_SIZE, IMAGE_SIZE]);
    const weights = dl.truncatedNormal(
        [IMAGE_PIXELS, HIDDEN_1], null, 1.0 / Math.sqrt(IMAGE_PIXELS));
    const biases = dl.zeros([HIDDEN_1]);

    // TODO - assign to param.
    dl.relu(dl.matMul(images, weights as dl.Tensor2D).add(biases));
  });
}

tf.bindTensorFlowBackend();
runTraining();
