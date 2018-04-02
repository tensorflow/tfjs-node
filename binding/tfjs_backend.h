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

#ifndef TF_NODEJS_TFJS_BACKEND_H_
#define TF_NODEJS_TFJS_BACKEND_H_

#include <node_api.h>
#include <map>
#include "../deps/tensorflow/include/tensorflow/c/eager/c_api.h"

namespace tfnodejs {

class TFJSBackend {
 public:
  TFJSBackend();
  virtual ~TFJSBackend();

  // Initializes a new TFJS Backend.
  void Init(napi_env env);

  // Creates a new Tensor with given shape and data.
  void CreateTensor(napi_env env, int64_t* shape,
                    uint32_t shape_length, TF_DataType dtype,
                    napi_value typed_array_value,
                    napi_value* output_tensor_id);

  // Returns a typed-array as a `napi_value` with the data associated with the
  // TF/TFE pointers.
  void GetTensorData(napi_env env, int32_t tensor_id, napi_value* result);

  // Executes a TFE Op.
  void ExecuteOp(napi_env env, const char* opName, napi_value op_attr_inputs,
                 napi_value input_tensor_ids, napi_value num_output_values,
                 napi_value* output_tensor_ids);

protected:
  int32_t InsertHandle(TFE_TensorHandle* tfe_handle);

 private:
  TFE_Context* tfe_context;
  std::map<int32_t, TFE_TensorHandle*>* tfe_handle_map;
  int32_t output_tensor_index; // atomic??
};

}  // namespace tfnodejs

#endif  // TF_NODEJS_TFJS_BACKEND_H_
