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
#include <vector>
#include "tf_auto_status.h"
#include "tensor_handle.h"
#include "tfe_context_env.h"
#include "utils.h"
#include "../deps/tensorflow/include/tensorflow/c/c_api.h"
#include "../deps/tensorflow/include/tensorflow/c/eager/c_api.h"

namespace tfnodejs {

void ExecuteOp(napi_env env, napi_value context, const char* opName,
               napi_value inputs, napi_ref tensor_handle_class_ref, napi_value* result) {
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

  // For demo, hard code to 'Equal' op.
  TFE_OpSetAttrType(tfe_op, "T", TF_FLOAT);

  int num_retvals = 1;
  std::vector<TFE_TensorHandle*> result_handles;
  result_handles.push_back(nullptr);

  TFE_Execute(tfe_op, result_handles.data(), &num_retvals, tf_status.status);
  ENSURE_TF_OK(tf_status);

  // Wrap result in new handle
  // TODO: Pass this instead:
  napi_value tensor_handle_value;
  nstatus = napi_get_reference_value(env, tensor_handle_class_ref, &tensor_handle_value);
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