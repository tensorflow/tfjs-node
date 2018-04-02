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
    : tfe_context(nullptr), tfe_handle_map(nullptr), tensor_index(0) {}

TFJSBackend::~TFJSBackend() {
  if (tfe_context != nullptr) {
    TF_AutoStatus tf_status;
    TFE_DeleteContext(tfe_context, tf_status.status);
  }
  if (tfe_handle_map != nullptr) {
    for (auto iter = tfe_handle_map->begin(); iter != tfe_handle_map->end();
         ++iter) {
      TFE_DeleteTensorHandle(iter->second);
    }
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

int32_t TFJSBackend::InsertHandle(TFE_TensorHandle* tfe_handle) {
  auto pair = std::pair<int32_t, TFE_TensorHandle*>(tensor_index++, tfe_handle);
  tfe_handle_map->insert(pair);
  return pair.first;
}

napi_value TFJSBackend::CreateTensor(napi_env env, napi_value shape_value,
                                     napi_value dtype_value,
                                     napi_value typed_array_value) {
  napi_status nstatus;

  std::vector<int64_t> shape_vector;
  ExtractArrayShape(env, shape_value, &shape_vector);

  int32_t dtype_int32;
  nstatus = napi_get_value_int32(env, dtype_value, &dtype_int32);
  ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

  TFE_TensorHandle* tfe_handle;
  CreateTFE_TensorHandleFromTypedArray(
      env, shape_vector.data(), shape_vector.size(),
      static_cast<TF_DataType>(dtype_int32), typed_array_value, &tfe_handle);

  napi_value output_tensor_id;
  nstatus = napi_create_int32(env, InsertHandle(tfe_handle), &output_tensor_id);
  ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);
  return output_tensor_id;
}

void TFJSBackend::DeleteTensor(napi_env env, napi_value tensor_id_value) {
  int32_t tensor_id;
  ENSURE_NAPI_OK(env, napi_get_value_int32(env, tensor_id_value, &tensor_id));

  auto tensor_entry = tfe_handle_map->find(tensor_id);
  if (tensor_entry == tfe_handle_map->end()) {
    // TODO(kreeger): Print out the tensor ID?
    NAPI_THROW_ERROR(env, "Delete called on a Tensor not referenced");
    return;
  }

  TFE_DeleteTensorHandle(tensor_entry->second);
  tfe_handle_map->erase(tensor_id);
}

napi_value TFJSBackend::GetTensorData(napi_env env,
                                      napi_value tensor_id_value) {
  int32_t tensor_id;
  ENSURE_NAPI_OK_RETVAL(
      env, napi_get_value_int32(env, tensor_id_value, &tensor_id), nullptr);

  auto tensor_entry = tfe_handle_map->find(tensor_id);
  if (tensor_entry == tfe_handle_map->end()) {
    // TODO(kreeger): Print out the tensor ID?
    NAPI_THROW_ERROR(env, "Get data called on a Tensor not referenced");
    return nullptr;
  }

  napi_value typed_array_value;
  CopyTFE_TensorHandleDataToTypedArray(env, tfe_context, tensor_entry->second,
                                       &typed_array_value);
  return typed_array_value;
}

napi_value TFJSBackend::ExecuteOp(napi_env env, napi_value op_name_value,
                                  napi_value op_attr_inputs,
                                  napi_value input_tensor_ids,
                                  napi_value num_output_values) {
  napi_status nstatus;

  char op_name[NAPI_STRING_SIZE];
  nstatus = napi_get_value_string_utf8(env, op_name_value, op_name,
                                       NAPI_STRING_SIZE, nullptr);
  ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

  TF_AutoStatus tf_status;
  TFE_AutoOp tfe_op(TFE_NewOp(tfe_context, op_name, tf_status.status));
  ENSURE_TF_OK_RETVAL(env, tf_status, nullptr);

  uint32_t num_input_ids;
  nstatus = napi_get_array_length(env, input_tensor_ids, &num_input_ids);
  ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

  for (uint32_t i = 0; i < num_input_ids; i++) {
    napi_value cur_input_id;
    nstatus = napi_get_element(env, input_tensor_ids, i, &cur_input_id);
    ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

    int32_t cur_input_tensor_id;
    nstatus = napi_get_value_int32(env, cur_input_id, &cur_input_tensor_id);
    ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

    auto input_tensor_entry = tfe_handle_map->find(cur_input_tensor_id);
    if (input_tensor_entry == tfe_handle_map->end()) {
      // TODO(kreeger): Print out the tensor ID?
      NAPI_THROW_ERROR(env, "Input Tensor ID not referenced");
      return nullptr;
    }

    TFE_OpAddInput(tfe_op.op, input_tensor_entry->second, tf_status.status);
    ENSURE_TF_OK_RETVAL(env, tf_status, nullptr);
  }

  uint32_t op_attrs_length;
  nstatus = napi_get_array_length(env, op_attr_inputs, &op_attrs_length);
  ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

  for (uint32_t i = 0; i < op_attrs_length; i++) {
    napi_value cur_op_attr;
    nstatus = napi_get_element(env, op_attr_inputs, i, &cur_op_attr);
    ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

    AssignOpAttr(env, tfe_op.op, cur_op_attr);

    // Check to see if an exception exists, if so return a failure.
    bool has_exception = false;
    nstatus = napi_is_exception_pending(env, &has_exception);
    ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);
    if (has_exception) {
      return nullptr;
    }
  }

  int32_t num_outputs;
  nstatus = napi_get_value_int32(env, num_output_values, &num_outputs);
  ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

  // Push `nullptr` to get a valid pointer in the call to `TFE_Execute()` below.
  std::vector<TFE_TensorHandle*> result_handles;
  for (int32_t i = 0; i < num_outputs; i++) {
    result_handles.push_back(nullptr);
  }

  int size = result_handles.size();
  TFE_Execute(tfe_op.op, result_handles.data(), &size, tf_status.status);
  ENSURE_TF_OK_RETVAL(env, tf_status, nullptr);

  napi_value output_tensor_ids;
  nstatus = napi_create_array_with_length(env, size, &output_tensor_ids);
  ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

  for (int32_t i = 0; i < num_outputs; i++) {
    napi_value output_tensor_id_value;
    nstatus = napi_create_int32(env, InsertHandle(result_handles[i]),
                                &output_tensor_id_value);
    ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);

    nstatus =
        napi_set_element(env, output_tensor_ids, i, output_tensor_id_value);
    ENSURE_NAPI_OK_RETVAL(env, nstatus, nullptr);
  }

  return output_tensor_ids;
}

}  // namespace tfnodejs
