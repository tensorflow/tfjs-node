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

// tslint:disable-next-line:no-require-imports
import bindings = require('bindings');
import {TFJSBinding} from './tfjs_binding';
const binding = bindings('tfjs_binding.node') as TFJSBinding;

describe('Exposes TF_DataType enum values', () => {
  it('contains TF_FLOAT', () => {
    expect(binding.TF_FLOAT).toEqual(1);
  });
  it('contains TF_INT32', () => {
    expect(binding.TF_INT32).toEqual(3);
  });
  it('contains TF_BOOL', () => {
    expect(binding.TF_BOOL).toEqual(10);
  });
});

describe('Exposes TF_AttrType enum values', () => {
  it('contains TF_ATTR_STRING', () => {
    expect(binding.TF_ATTR_STRING).toEqual(0);
  });
  it('contains TF_ATTR_INT', () => {
    expect(binding.TF_ATTR_INT).toEqual(1);
  });
  it('contains TF_ATTR_FLOAT', () => {
    expect(binding.TF_ATTR_FLOAT).toEqual(2);
  });
  it('contains TF_ATTR_BOOL', () => {
    expect(binding.TF_ATTR_BOOL).toEqual(3);
  });
  it('contains TF_ATTR_TYPE', () => {
    expect(binding.TF_ATTR_TYPE).toEqual(4);
  });
  it('contains TF_ATTR_SHAPE', () => {
    expect(binding.TF_ATTR_SHAPE).toEqual(5);
  });
});

describe('Exposes TF Version', () => {
  it('contains a version string', () => {
    expect(binding.TF_Version).toBeDefined();
  });
});

describe('Context', () => {
  it('creates an instance', () => {
    expect(new binding.Context()).toBeDefined();
  });
});

describe('TensorHandle', () => {
  it('should create with default constructor', () => {
    expect(new binding.TensorHandle()).toBeDefined();
  });

  it('throws exception when shape is called on default constructor', () => {
    expect(() => {
      // tslint:disable-next-line:no-unused-expression
      new binding.TensorHandle().shape;
    }).toThrowError();
  });

  it('throws exception when dtype is called on default constructor', () => {
    expect(() => {
      // tslint:disable-next-line:no-unused-expression
      new binding.TensorHandle().dtype;
    }).toThrowError();
  });

  it('throws exception when bindBuffer() is called on default constructor',
     () => {
       expect(() => {
         // tslint:disable-next-line:no-unused-expression
         new binding.TensorHandle().bindBuffer(new Float32Array([1]));
       }).toThrowError();
     });

  it('throws exception when dataSync() is called on default constructor',
     () => {
       expect(() => {
         // tslint:disable-next-line:no-unused-expression
         new binding.TensorHandle().dataSync();
       }).toThrowError();
     });

  it('creates a valid handle with shape and type', () => {
    const handle = new binding.TensorHandle([2], binding.TF_INT32);
    expect(handle).toBeDefined();
    expect(handle.shape).toEqual([2]);
    expect(handle.dtype).toEqual(binding.TF_INT32);
  });

  it('reads and writes data to valid handle', () => {
    const handle = new binding.TensorHandle([2], binding.TF_INT32);
    handle.bindBuffer(new Int32Array([1, 2]));
    expect(handle.dataSync()).toEqual(new Int32Array([1, 2]));
  });

  it('throws exception when data does not match dtype', () => {
    // TensorHandle w/ TF_INT32 and mismatched typed arrays:
    expect(() => {
      new binding.TensorHandle([2], binding.TF_INT32)
          .bindBuffer(new Float32Array([1, 2]));
    }).toThrowError();
    expect(() => {
      new binding.TensorHandle([2], binding.TF_INT32)
          .bindBuffer(new Uint8Array([1, 0]));
    }).toThrowError();
    // TensorHandle w/ TF_FLOAT and mismatched typed arrays:
    expect(() => {
      new binding.TensorHandle([2], binding.TF_FLOAT)
          .bindBuffer(new Int32Array([1, 2]));
    }).toThrowError();
    expect(() => {
      new binding.TensorHandle([2], binding.TF_FLOAT)
          .bindBuffer(new Uint8Array([1, 0]));
    }).toThrowError();
    // TensorHandle w/ TF_BOOL and mismatched typed arrays:
    expect(() => {
      new binding.TensorHandle([2], binding.TF_BOOL).bindBuffer(new Int32Array([
        1, 2
      ]));
    }).toThrowError();
    expect(() => {
      new binding.TensorHandle([2], binding.TF_BOOL)
          .bindBuffer(new Float32Array([1, 0]));
    }).toThrowError();
  });

  it('throws eception when shape does not match data', () => {
    expect(() => {
      new binding.TensorHandle([2], binding.TF_INT32)
          .bindBuffer(new Int32Array([1, 2, 3]));
    }).toThrowError();
    expect(() => {
      new binding.TensorHandle([4], binding.TF_INT32)
          .bindBuffer(new Int32Array([1, 2, 3]));
    }).toThrowError();
  });

  it('throws exception with invalid dtype', () => {
    expect(() => {
      // tslint:disable-next-line:no-unused-expression
      new binding.TensorHandle([1], 1000);
    }).toThrowError();
  });
});
