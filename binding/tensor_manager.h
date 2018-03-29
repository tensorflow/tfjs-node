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

#ifndef TF_NODEJS_TENSOR_MANAGER_H_
#define TF_NODEJS_TENSOR_MANAGER_H_

#include <node_api.h>
#include <map>
#include "tensor_handle.h"

namespace tfnodejs {

class TensorManager {
 public:
  TensorManager();
  virtual ~TensorManager();

  void RegisterTensor(napi_env env, uint32_t tensor_id);

  void CopyJSBuffer(napi_env env, uint32_t tensor_id, int64_t* shape,
                    uint32_t shape_length, TF_DataType dtype,
                    napi_value typed_array_value);

  void DataSync(napi_env env, uint32_t tensor_id, napi_value* result);

 private:
  std::map<uint32_t, WrappedTensorHandle*> handle_map;
};

}  // namespace tfnodejs

#endif  // TF_NODEJS_TENSOR_MANAGER_H_
