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

import {toBuffer} from './io_utils';

export class NodeFileSystem implements tfc.io.IOHandler {
  static readonly URL_SCHEME = 'file://';

  protected readonly path: string;

  readonly MODEL_JSON_FILENAME = 'model.json';
  readonly WEIGHTS_BINARY_FILENAME = 'weights.bin';

  constructor(path: string) {
    this.path = resolve(path);
  }

  async save(modelArtifacts: ModelArtifacts): Promise<SaveResult> {
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
        // TODO(cais): Add weightManifest;
      };
      // const topology = JSON.stringify();
      // const weightSpecs = JSON.stringify(modelArtifacts.weightSpecs);
      const modelJSONPath = join(this.path, this.MODEL_JSON_FILENAME);
      console.log(`modelJSONPath = ${modelJSONPath}`);  // DEBUG

      fs.writeFileSync(modelJSONPath, JSON.stringify(modelJSON));
      // const weightStream = fs.createWriteStream(weightsBinPath);

      console.log('Writing:', modelArtifacts.weightData);  // DEBUG
      fs.writeFileSync(
          weightsBinPath, toBuffer(modelArtifacts.weightData), 'binary');

      return getModelArtifactsInfoForJSON(modelArtifacts);
    }
  }

  async load(): Promise<ModelArtifacts> {
    if (!fs.existsSync(this.path)) {
      throw new Error(`Path ${this.path} does not exist: loading failed.`);
    }

    // `this.path` can be either a directory or a file. If it is a file, assume
    // it is mode.json file.
    if (fs.statSync(this.path).isFile()) {
      const modelJSON = JSON.parse(fs.readFileSync(this.path));

      if (modelJSON.weightsManifest != null) {
        const dirName = dirname(this.path);
        for (let i = 0; i < modelJSON.weightsManifest.length; ++i) {
          const group = modelJSON.weightsManifest[i];

          // const buffers: Buffer[] = [];
          group.paths.forEach(path => {
            const buffer =
                new Buffer(fs.readFileSync(join(dirName, path), 'binary'));
            console.log(buffer);  // DEBUG
          });
          console.log('paths:', JSON.stringify(group.paths));  // DEBUG
          console.log(Object.keys(tfc.io));                    // DEBUG
        }
      }

      return {
        modelTopology: modelJSON.modelTopology,
      };
    } else {
      throw new Error('Loading from directory is not implemented yet');
    }
  }

  /**
   * Create a directory at `this.path` or verify that the directory exists.
   */
  protected createOrVerifyDirectory() {
    if (fs.existsSync(this.path)) {
      if (fs.statSync(this.path).isFile()) {
        throw new Error(
            `Path ${this.path} exists as a file. The path must be ` +
            `nonexistent or point to a directory.`);
      }
    } else {
      fs.mkdirSync(this.path);
    }
  }
}

export const nodeFileSystemRouter: tfc.io.IORouter = (url: string) => {
  if (tfc.ENV.get('IS_BROWSER')) {
    return null;
  } else {
    if (url.startsWith(NodeFileSystem.URL_SCHEME)) {
      return browserLocalStorage(url.slice(NodeFileSystem.URL_SCHEME.length));
    } else {
      return null;
    }
  }
};
tfc.io.registerSaveRouter(nodeFileSystemRouter);
tfc.io.registerLoadRouter(nodeFileSystemRouter);

// TODO(cais): Deduplicate with tfjs-core.
/**
 * Populate ModelArtifactsInfo fields for a model with JSON topology.
 * @param modelArtifacts
 * @returns A ModelArtifactsInfo object.
 */
export function getModelArtifactsInfoForJSON(
    modelArtifacts: tfc.io.ModelArtifacts): tfc.io.ModelArtifactsInfo {
  if (modelArtifacts.modelTopology instanceof ArrayBuffer) {
    throw new Error('Expected JSON model topology, received ArrayBuffer.');
  }

  return {
    dateSaved: new Date(),
    modelTopologyType: 'JSON',
  };
}
