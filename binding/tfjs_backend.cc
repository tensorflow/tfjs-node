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
#include "tfe_auto_op.h"
#include "tfe_execute_utils.h"
#include "tfe_tensor_utils.h"
#include "utils.h"

namespace tfnodejs {

TFJSBackend::TFJSBackend()
    : tfe_context(nullptr), tfe_handle_map(nullptr), output_tensor_index(-1) {}

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
  if (tfe_handle_map->find(tensor_id) != tfe_handle_map->end()) {
    // TODO(kreeger): write me.
    return;
  }

  TFE_TensorHandle* tfe_handle;
  CreateTFE_TensorHandleFromTypedArray(env, shape, shape_length, dtype,
                                       typed_array_value, &tfe_handle);
  // TODO - typedef this.
  tfe_handle_map->insert(
      std::pair<int32_t, TFE_TensorHandle*>(tensor_id, tfe_handle));
}

void TFJSBackend::GetTensorData(napi_env env, int32_t tensor_id,
                                napi_value* result) {
  auto tensor_entry = tfe_handle_map->find(tensor_id);
  if (tensor_entry == tfe_handle_map->end()) {
    // TODO(kreeger): write me.
  }

  CopyTFE_TensorHandleDataToTypedArray(env, tfe_context, tensor_entry->second,
                                       result);
}

void TFJSBackend::ExecuteOp(napi_env env, const char* opName,
                            napi_value op_attr_inputs,
                            napi_value input_tensor_ids,
                            napi_value num_output_values,
                            napi_value* output_tensor_ids) {
  napi_status nstatus;

  TF_AutoStatus tf_status;
  TFE_AutoOp tfe_op(TFE_NewOp(tfe_context, opName, tf_status.status));
  ENSURE_TF_OK(env, tf_status);

  uint32_t num_input_ids;
  nstatus = napi_get_array_length(env, input_tensor_ids, &num_input_ids);
  ENSURE_NAPI_OK(env, nstatus);

  for (uint32_t i = 0; i < num_input_ids; i++) {
    napi_value cur_input_id;
    nstatus = napi_get_element(env, input_tensor_ids, i, &cur_input_id);
    ENSURE_NAPI_OK(env, nstatus);

    int32_t cur_input_tensor_id;
    nstatus = napi_get_value_int32(env, cur_input_id, &cur_input_tensor_id);
    ENSURE_NAPI_OK(env, nstatus);

    auto input_tensor_entry = tfe_handle_map->find(cur_input_tensor_id);
    if (input_tensor_entry == tfe_handle_map->end()) {
      // TODO - throw
    }

    TFE_OpAddInput(tfe_op.op, input_tensor_entry->second, tf_status.status);
    ENSURE_TF_OK(env, tf_status);
  }

  uint32_t op_attrs_length;
  nstatus = napi_get_array_length(env, op_attr_inputs, &op_attrs_length);
  ENSURE_NAPI_OK(env, nstatus);

  for (uint32_t i = 0; i < op_attrs_length; i++) {
    napi_value cur_op_attr;
    nstatus = napi_get_element(env, op_attr_inputs, i, &cur_op_attr);
    ENSURE_NAPI_OK(env, nstatus);

    AssignOpAttr(env, tfe_op.op, cur_op_attr);

    // Check to see if an exception exists, if so return a failure.
    bool has_exception = false;
    nstatus = napi_is_exception_pending(env, &has_exception);
    ENSURE_NAPI_OK(env, nstatus);
    if (has_exception) {
      return;
    }
  }

  int32_t num_outputs;
  nstatus = napi_get_value_int32(env, num_output_values, &num_outputs);
  ENSURE_NAPI_OK(env, nstatus);

  // Push `nullptr` to get a valid pointer in the call to `TFE_Execute()` below.
  std::vector<TFE_TensorHandle*> result_handles;
  for (int32_t i = 0; i < num_outputs; i++) {
    result_handles.push_back(nullptr);
  }

  int size = result_handles.size();
  TFE_Execute(tfe_op.op, result_handles.data(), &size, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  nstatus = napi_create_array_with_length(env, size, output_tensor_ids);
  ENSURE_NAPI_OK(env, nstatus);

  for (int32_t i = 0; i < num_outputs; i++) {
    // TODO - typedef.
    tfe_handle_map->insert(std::pair<int32_t, TFE_TensorHandle*>(
        output_tensor_index, result_handles[i]));

    napi_value output_tensor_id_value;
    nstatus =
        napi_create_int32(env, output_tensor_index, &output_tensor_id_value);

    output_tensor_index++;
  }
}

}  // namespace tfnodejs
