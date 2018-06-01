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

import * as tfc from '@tensorflow/tfjs-core';
import * as fs from 'fs';
import {dirname, join, resolve} from 'path';

import {toArrayBuffer, toBuffer} from './io_utils';

export class NodeFileSystem implements tfc.io.IOHandler {
  static readonly URL_SCHEME = 'file://';

  protected readonly path: string|string[];

  readonly MODEL_JSON_FILENAME = 'model.json';
  readonly WEIGHTS_BINARY_FILENAME = 'weights.bin';

  constructor(path: string|string[]) {
    if (Array.isArray(path)) {
      this.path = path.map(p => resolve(p));
    } else {
      this.path = resolve(path);
    }
  }

  async save(modelArtifacts: tfc.io.ModelArtifacts):
      Promise<tfc.io.SaveResult> {
    if (Array.isArray(this.path)) {
      throw new Error('Cannot perform saving to multiple paths.');
    }

    this.createOrVerifyDirectory();

    if (modelArtifacts.modelTopology instanceof ArrayBuffer) {
      throw new Error(
          'NodeFileSystem.save() does not support saving model topology ' +
          'in binary formats yet.');
    } else {
      const weightsBinPath = join(this.path, this.WEIGHTS_BINARY_FILENAME);
      const weightsManifest = [{
        paths: [this.WEIGHTS_BINARY_FILENAME],
        weights: modelArtifacts.weightSpecs
      }];
      const modelJSON = {
        modelTopology: modelArtifacts.modelTopology,
        weightsManifest,
      };
      const modelJSONPath = join(this.path, this.MODEL_JSON_FILENAME);
      fs.writeFileSync(modelJSONPath, JSON.stringify(modelJSON));

      fs.writeFileSync(
          weightsBinPath, toBuffer(modelArtifacts.weightData), 'binary');

      return {
        // tslint:disable-next-line:no-any
        modelArtifactsInfo: getModelArtifactsInfoForJSON(modelArtifacts) as any
      };
    }
  }

  async load(): Promise<tfc.io.ModelArtifacts> {
    if (Array.isArray(this.path)) {
      throw new Error('Loading from multiple paths is not supported yet.');
    }

    if (!fs.existsSync(this.path)) {
      throw new Error(`Path ${this.path} does not exist: loading failed.`);
    }

    // `this.path` can be either a directory or a file. If it is a file, assume
    // it is mode.json file.
    if (fs.statSync(this.path).isFile()) {
      const modelJSON = JSON.parse(fs.readFileSync(this.path, 'utf8'));

      const modelArtifacts: tfc.io.ModelArtifacts = {
        modelTopology: modelJSON.modelTopology,
      };
      if (modelJSON.weightsManifest != null) {
        const dirName = dirname(this.path);
        const buffers: Buffer[] = [];
        const weightSpecs: tfc.io.WeightsManifestEntry[] = [];
        for (const group of modelJSON.weightsManifest) {
          group.paths.forEach((path: string) => {
            console.log('pushing data from path = ' + path);  // DEBUG
            buffers.push(
                new Buffer(fs.readFileSync(join(dirName, path), 'binary')));
          });
          weightSpecs.push(...group.weights);
        }
        modelArtifacts.weightSpecs = weightSpecs;
        modelArtifacts.weightData = toArrayBuffer(buffers);
      }
      return modelArtifacts;
    } else {
      throw new Error(
          'The path to load from must be a file. Loading from a directory ' +
          'is not supported yet.');
    }
  }

  /**
   * Create a directory at `this.path` or verify that the directory exists.
   */
  protected createOrVerifyDirectory() {
    for (const path of Array.isArray(this.path) ? this.path : [this.path]) {
      if (fs.existsSync(path)) {
        if (fs.statSync(path).isFile()) {
          throw new Error(
              `Path ${path} exists as a file. The path must be ` +
              `nonexistent or point to a directory.`);
        }
      } else {
        fs.mkdirSync(path);
      }
    }
  }
}

export const nodeFileSystemRouter = (url: string) => {
  if (tfc.ENV.get('IS_BROWSER')) {
    return null;
  } else {
    if (url.startsWith(NodeFileSystem.URL_SCHEME)) {
      return new NodeFileSystem(url.slice(NodeFileSystem.URL_SCHEME.length));
    } else {
      return null;
    }
  }
};
tfc.io.registerSaveRouter(nodeFileSystemRouter);
tfc.io.registerLoadRouter(nodeFileSystemRouter);

// TODO(cais): Deduplicate with tfjs-core once the dependency version is
//   updated to >= 0.11.3.
/**
 * Populate ModelArtifactsInfo fields for a model with JSON topology.
 * @param modelArtifacts
 * @returns A ModelArtifactsInfo object.
 */
export function getModelArtifactsInfoForJSON(
    modelArtifacts: tfc.io.ModelArtifacts) {
  if (modelArtifacts.modelTopology instanceof ArrayBuffer) {
    throw new Error('Expected JSON model topology, received ArrayBuffer.');
  }

  return {
    dateSaved: new Date(),
    modelTopologyType: 'JSON',
  };
}
