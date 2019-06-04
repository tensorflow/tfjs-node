##
# @license
# Copyright 2018 Google Inc. All Rights Reserved.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =============================================================================

# Node.js TensorFlow Binding config:
{
  'variables' : {
    'tensorflow_include_dir' : '<(module_root_dir)/deps/include',
    'tensorflow_headers' : [
      '<@(tensorflow_include_dir)/tensorflow/c/c_api.h',
      '<@(tensorflow_include_dir)/tensorflow/c/eager/c_api.h',
    ],
    'tensorflow-library-action': 'move'
  },
  'targets' : [{
    'target_name' : 'tfjs_binding',
    'sources' : [
      'binding/tfjs_backend.cc',
      'binding/tfjs_binding.cc'
    ],
    'include_dirs' : [ '..', '<(tensorflow_include_dir)' ],
    'conditions' : [
      [
        'OS=="linux"', {
          'libraries' : [
            '-Wl,-rpath,\$$ORIGIN',
            '-ltensorflow',
            '-ltensorflow_framework',
          ],
          'library_dirs' : ['<(module_path)'],
          'actions': [
            {
              'action_name': 'deps-stage',
              'inputs': [
                '<(module_root_dir)/scripts/deps-stage.js'
              ],
              'outputs': [
                '<(module_path)/libtensorflow.so',
              ],
              'action': [
                'node',
                '<@(_inputs)',
                '<@(tensorflow-library-action)',
                '<(module_path)'
              ]
            }
          ],
        }
      ]
    ],
  }
  , {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "<(module_name)" ],
      "copies": [
        {
          "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
          "destination": "<(module_path)"
          # "destination": "<(PRODUCT_DIR)"
        }
      ]
    }
    ],
  "defines": [
      "NAPI_VERSION=<(napi_build_version)"
  ]
}
