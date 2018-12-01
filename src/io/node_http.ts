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

import {io} from '@tensorflow/tfjs-core';

const fetch = require('node-fetch');  // tslint:disable:no-require-imports

// For testing: Enables jasmine `spyOn()` with `fetch`.
export const fetchWrapper = {fetch};

export class NodeHTTPRequest extends io.BrowserHTTPRequest {
  // Override the base getFetchFunc() method in order to use node-fetch.
  protected getFetchFunc(): Function {
    return fetchWrapper.fetch;
  }
}

export function nodeHTTPRequest(
    path: string|string[], requestInit?: RequestInit,
    weightPathPrefix?: string): io.IOHandler {
  return new NodeHTTPRequest(path, requestInit, weightPathPrefix);
}

export const ndoeHTTPRequestRouter = (url: string|string[]) => {
  let isHTTP = true;
  if (Array.isArray(url)) {
    isHTTP = url.every(urlItem => io.isHTTPScheme(urlItem));
  } else {
    isHTTP = io.isHTTPScheme(url);
  }
  if (isHTTP) {
    return nodeHTTPRequest(url);
  }
  return null;
};
