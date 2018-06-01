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

/**
 * Convert an ArrayBuffer to a Buffer.
 */
export function toBuffer(ab: ArrayBuffer): Buffer {
  const buf = new Buffer(ab.byteLength);
  const view = new Uint8Array(ab);
  view.forEach((value, i) => {
    buf[i] = value;
  });
  return buf;
}

/**
 * Convert a Buffer or an Array of Buffers to an ArrayBuffer.
 */
export function toArrayBuffer(buf: Buffer|Buffer[]): ArrayBuffer {
  if (Array.isArray(buf)) {
    console.log('buf.length = ', buf.length);  // DEBUG
    // An Array of Buffers.
    let totalLength = 0;
    buf.forEach(buffer => {
      console.log('Adding:', buffer.length);  // DEBUG
      totalLength += buffer.length;
    });
    console.log('totalLength:', totalLength);  // DEBUG

    const ab = new ArrayBuffer(totalLength);
    const view = new Uint8Array(ab);
    let pos = 0;
    buf.forEach(buffer => {
      for (let i = 0; i < buffer.length; ++i) {
        view[pos++] = buffer[i];
      }
    });
    return ab;
  } else {
    // A single Buffer.
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
    }
    return ab;
  }
}
