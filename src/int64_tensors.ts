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
import {endianness} from 'os';

const INT32_MAX = 2147483648;

/**
 * Node.js-specific tensor type: int64-type scalar.
 *
 * This class is created for a specific purpose: to support
 * writing `step`s to TensorBoard via op-kernel bindings.
 * `step` is required to have an int64 dtype, but TensorFlow.js
 * (tfjs-core) doesn't have a built-in int64 dtype. This is
 * related to a lack of `Int64Array` or `Uint64Array` typed
 * array in basic JavaScript.
 *
 * This class is introduced as a workaround.
 */
export class Int64Scalar {
  readonly dtype: string = 'int64';
  readonly rank: number = 1;
  private valueArray_: Int32Array;

  private static endiannessOkay_: boolean;

  constructor(readonly value: number) {
    if (Int64Scalar.endiannessOkay_ == null) {
      if (endianness() !== 'LE') {
        throw new Error(
            `Int64Scalar does not support endianness of this machine: ` +
            `${endianness()}`);
      }
      Int64Scalar.endiannessOkay_ = true;
    }

    // We use two int32 elements to represent a int64 value. This assumes
    // little endian, which is checked above.
    const highPart = Math.floor(value / INT32_MAX);
    const lowPart = value % INT32_MAX;
    this.valueArray_ = new Int32Array([lowPart, highPart]);
  }

  get shape(): Shape {
    return [];
  }

  /** Get the Int32Array that represents the int64 value. */
  get valueArray(): Int32Array {
    return this.valueArray_;
  }
}
