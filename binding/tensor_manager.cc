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

#include "tensor_manager.h"
#include <cstdlib>
#include <cstring>
#include "../deps/tensorflow/include/tensorflow/c/eager/c_api.h"
#include "tensor_util.h"
#include "utils.h"

namespace tfnodejs {

TensorManager::TensorManager() {}

TensorManager::~TensorManager() {}

void TensorManager::RegisterTensor(napi_env env, uint32_t tensor_id) {
  // TODO - handle already regisered
  if (handle_map.find(tensor_id) == handle_map.end()) {
    WrappedTensorHandle* handle = new WrappedTensorHandle();
    handle->handle = nullptr;
    handle->env = env;
    handle_map[tensor_id] = new WrappedTensorHandle();
  }
}

void TensorManager::CopyJSBuffer(napi_env env, uint32_t tensor_id,
                                 int64_t* shape, uint32_t shape_length,
                                 TF_DataType dtype,
                                 napi_value typed_array_value) {
  if (handle_map.find(tensor_id) == handle_map.end()) {
    // TODO - throw error.
  }
  WrappedTensorHandle* handle = handle_map[tensor_id];
  TCopyJSBuffer(env, handle, shape, shape_length, dtype, typed_array_value);
}

void TensorManager::DataSync(napi_env env, napi_value context_value,
                             uint32_t tensor_id, napi_value* result) {
  if (handle_map.find(tensor_id) == handle_map.end()) {
    // TODO - throw error.
  }
  WrappedTensorHandle* handle = handle_map[tensor_id];
  TensorData(env, context_value, handle, result);
}

}  // namespace tfnodejs
