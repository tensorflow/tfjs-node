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

#include "tfjs_backend.h"
#include "utils.h"

namespace tfnodejs {

TFJSBackend::TFJSBackend() : tfe_context(nullptr), tfe_handle_map(nullptr) {}

TFJSBackend::~TFJSBackend() {
  if (tfe_context != nullptr) {
    TF_AutoStatus tf_status;
    TFE_DeleteContext(tfe_context, tf_status.status);
  }
  if (tfe_handle_map != nullptr) {
    // TODO(kreeger): Loop and cleanup all items.
    delete tfe_handle_map;
  }
}

void TFJSBackend::Init(napi_env env) {
  TF_AutoStatus tf_status;
  TFE_ContextOptions* tfe_options = TFE_NewContextOptions();
  tfe_context = TFE_NewContext(tfe_options, tf_status.status);
  ENSURE_TF_OK(env, tf_status);
  TFE_DeleteContextOptions(tfe_options);

  tfe_handle_map = new std::map<int32_t, TFE_TensorHandle*>();
}

void TFJSBackend::CreateTensor(napi_env env, int32_t tensor_id, int64_t* shape,
                               uint32_t shape_length, TF_DataType dtype,
                               napi_value typed_array_value) {
  /* if (tfe_handle_map.get(j */
  // TODO(kreeger): write me.
}

void TFJSBackend::GetTensorData(napi_env env, int32_t tensor_id,
                                napi_value* result) {
  // TODO(kreeger): write me.
}

void TFJSBackend::ExecuteOp(napi_env env, const char* opName,
                            napi_value op_attr_inputs,
                            napi_value input_tensor_ids,
                            napi_value* output_tensor_ids) {
  // TODO(kreeger): write me.
}

}  // namespace tfnodejs
