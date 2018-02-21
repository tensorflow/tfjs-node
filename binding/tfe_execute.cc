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

#include "tfe_execute.h"
#include <set>
#include <string>
#include <vector>
#include "../deps/tensorflow/include/tensorflow/c/c_api.h"
#include "../deps/tensorflow/include/tensorflow/c/eager/c_api.h"
#include "tensor_handle.h"
#include "tf_auto_status.h"
#include "tfe_context_env.h"
#include "utils.h"

namespace tfnodejs {

// Used to hold strings beyond the lifetime of a JS call.
std::set<std::string> ATTR_NAME_SET;

void AssignOpAttr(napi_env env, TFE_Op* tfe_op, napi_value attr_value) {
  napi_status nstatus;

  napi_value attr_name_value;
  nstatus = napi_get_named_property(env, attr_value, "name", &attr_name_value);
  ENSURE_NAPI_OK(nstatus);

  char attr_name_string[NAPI_STRING_SIZE];
  nstatus = napi_get_value_string_utf8(env, attr_name_value, attr_name_string,
                                       NAPI_STRING_SIZE, nullptr);
  ENSURE_NAPI_OK(nstatus);

  // OpAttr will be used beyond the scope of this function call. Stash ops in a
  // set for re-use instead of dynamically reallocating strings for operations.
  const char* attr_name;
  auto result = ATTR_NAME_SET.find(attr_name_string);
  if (result == ATTR_NAME_SET.end()) {
    auto insert_result = ATTR_NAME_SET.insert(std::string(attr_name_string));
    // TODO assert success?
    result = insert_result.first;
  }
  attr_name = (*result).c_str();
  fprintf(stderr, "attr_name: %s\n", attr_name);

  napi_value attr_type_value;
  nstatus = napi_get_named_property(env, attr_value, "type", &attr_type_value);
  ENSURE_NAPI_OK(nstatus);

  TF_AttrType tf_attr_type;
  nstatus = napi_get_value_int32(env, attr_type_value,
                                 reinterpret_cast<int32_t*>(&tf_attr_type));
  ENSURE_NAPI_OK(nstatus);

  napi_value type_input_value;
  nstatus =
      napi_get_named_property(env, attr_value, "value", &type_input_value);
  ENSURE_NAPI_OK(nstatus);

  switch (tf_attr_type) {
    case TF_ATTR_STRING:
      fprintf(stderr, "Implement TF_ATTR_STRING!\n");
      exit(1);

    case TF_ATTR_INT: {
      int64_t value;
      nstatus = napi_get_value_int64(env, type_input_value, &value);
      ENSURE_NAPI_OK(nstatus);

      TFE_OpSetAttrInt(tfe_op, attr_name, value);
      break;
    }

    case TF_ATTR_BOOL: {
      bool value;
      nstatus = napi_get_value_bool(env, type_input_value, &value);
      ENSURE_NAPI_OK(nstatus);

      TFE_OpSetAttrBool(tfe_op, attr_name, value);
      break;
    }

    case TF_ATTR_TYPE: {
      TF_DataType tf_data_type;
      nstatus = napi_get_value_int32(env, type_input_value,
                                     reinterpret_cast<int32_t*>(&tf_data_type));
      ENSURE_NAPI_OK(nstatus);

      TFE_OpSetAttrType(tfe_op, attr_name, tf_data_type);
      break;
    }

    case TF_ATTR_SHAPE:
      fprintf(stderr, "Implement TF_ATTR_SHAPE!\n");
      exit(1);
    case TF_ATTR_TENSOR:
      fprintf(stderr, "Implement TF_ATTR_TENSOR!\n");
      exit(1);
    case TF_ATTR_PLACEHOLDER:
      fprintf(stderr, "Implement TF_ATTR_PLACEHOLDER!\n");
      exit(1);
    case TF_ATTR_FUNC:
      fprintf(stderr, "Implement TF_ATTR_FUNC!\n");
      exit(1);
    default:
      fprintf(stderr, "Implement TYPE!\n");
      exit(1);
      break;
  }
}

void ExecuteOp(napi_env env, napi_value context, const char* opName,
               napi_value op_attr_inputs, napi_value inputs,
               napi_ref tensor_handle_class_ref, napi_value* result) {
  napi_status nstatus;

  // TODO - unwrap in the binding class.
  TFEContextEnv* context_env;
  nstatus = napi_unwrap(env, context, reinterpret_cast<void**>(&context_env));
  ENSURE_NAPI_OK(nstatus);

  TF_AutoStatus tf_status;
  TFE_Op* tfe_op = TFE_NewOp(context_env->context, opName, tf_status.status);
  ENSURE_TF_OK(tf_status);

  // Assign input (unwrap in binding?)
  uint32_t inputs_length;
  nstatus = napi_get_array_length(env, inputs, &inputs_length);
  ENSURE_NAPI_OK(nstatus);

  for (uint32_t i = 0; i < inputs_length; i++) {
    napi_value cur_input;
    nstatus = napi_get_element(env, inputs, i, &cur_input);
    ENSURE_NAPI_OK(nstatus);

    TensorHandle* handle;
    nstatus = napi_unwrap(env, cur_input, reinterpret_cast<void**>(&handle));
    ENSURE_NAPI_OK(nstatus);

    TFE_OpAddInput(tfe_op, handle->handle, tf_status.status);
    ENSURE_TF_OK(tf_status);
  }

  uint32_t op_attrs_length;
  nstatus = napi_get_array_length(env, op_attr_inputs, &op_attrs_length);
  ENSURE_NAPI_OK(nstatus);

  for (uint32_t i = 0; i < op_attrs_length; i++) {
    napi_value cur_op_attr;
    nstatus = napi_get_element(env, op_attr_inputs, i, &cur_op_attr);
    ENSURE_NAPI_OK(nstatus);

    AssignOpAttr(env, tfe_op, cur_op_attr);
  }

  int num_retvals = 1;
  std::vector<TFE_TensorHandle*> result_handles;
  result_handles.push_back(nullptr);

  TFE_Execute(tfe_op, result_handles.data(), &num_retvals, tf_status.status);
  ENSURE_TF_OK(tf_status);

  // Wrap result in new handle
  // TODO: Pass this instead:
  napi_value tensor_handle_value;
  nstatus = napi_get_reference_value(env, tensor_handle_class_ref,
                                     &tensor_handle_value);
  ENSURE_NAPI_OK(nstatus);

  nstatus = napi_new_instance(env, tensor_handle_value, 0, NULL, result);
  ENSURE_NAPI_OK(nstatus);

  // Unwrap and assign
  TensorHandle* handle;
  nstatus = napi_unwrap(env, *result, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(nstatus);

  handle->handle = result_handles[0];
  handle->tensor = TFE_TensorHandleResolve(result_handles[0], tf_status.status);
  ENSURE_TF_OK(tf_status);
}

}  // namespace tfnodejs
