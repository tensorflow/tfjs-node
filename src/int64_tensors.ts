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

import {Shape} from '@tensorflow/tfjs';

/**
 * Node.js-specific tensor type: int64-type scalar.
 *
 * This class is created for a specifici purpose: to support
 * writing `step`s to TensorBoard via op-kernel bindings.
 * `step` is required to have an int64 dtype, but TensorFlow.js
 * (tfjs-core) doesn't have a built-in int64 dtype. This is
 * related to a lack of `Int64Array` or `Uint64Array` typed
 * array in basic JavaScript.
 *
 * This class is introduced as a work around.
 */
export class Int64Scalar {
  readonly dtype: string = 'int64';
  readonly rank: number = 1;
  private valueArray_: Int32Array;

  constructor(readonly value: number) {
    console.log(`In Int64Scalar ctor: value = ${value}`);  // DEBUG
    if (value < -2147483648 || value > 2147483647) {
      throw new Error(
          `Value ${value} is out of bound of Int32Array, which is how int64 ` +
          `values are represented in Node.js-TensorFlow binding currently.`);
    }
    this.valueArray_ = new Int32Array([value]);
  }

  get shape(): Shape {
    return [];
  }

  get valueArray(): Int32Array {
    return this.valueArray_;
  }
}
