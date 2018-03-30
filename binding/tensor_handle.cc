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

#include "tensor_handle.h"
#include <algorithm>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <string>
#include "../deps/tensorflow/include/tensorflow/c/eager/c_api.h"
#include "tensor_handle.h"
#include "tensor_util.h"
#include "tf_auto_status.h"
#include "tf_auto_tensor.h"
#include "tfe_context_env.h"
#include "utils.h"

namespace tfnodejs {

void Cleanup(napi_env env, void* data, void* hint) {
  WrappedTensorHandle* handle = static_cast<WrappedTensorHandle*>(data);
  if (handle->handle != nullptr) {
    TFE_DeleteTensorHandle(handle->handle);
    handle->handle = nullptr;
  }
  delete handle;
}

void InitTensorHandle(napi_env env, napi_value wrapped_value) {
  WrappedTensorHandle* handle = new WrappedTensorHandle();
  handle->handle = nullptr;
  handle->env = env;

  napi_status nstatus =
      napi_wrap(env, wrapped_value, handle, Cleanup, nullptr, nullptr);
  ENSURE_NAPI_OK(env, nstatus);
}

void CopyTensorJSBuffer(napi_env env, napi_value wrapped_value, int64_t* shape,
                        uint32_t shape_length, TF_DataType dtype,
                        napi_value typed_array_value) {
  WrappedTensorHandle* handle;
  napi_status nstatus =
      napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  TCopyJSBuffer(env, handle, shape, shape_length, dtype, typed_array_value);
}

void GetTensorData(napi_env env, napi_value context_value,
                   napi_value wrapped_value, napi_value* result) {
  WrappedTensorHandle* handle;
  napi_status nstatus =
      napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  TensorData(env, context_value, handle, result);
}

void GetTensorShape(napi_env env, napi_value wrapped_value,
                    napi_value* result) {
  WrappedTensorHandle* handle;
  napi_status nstatus =
      napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  TensorShape(env, handle, result);
}

void GetTensorDtype(napi_env env, napi_value wrapped_value,
                    napi_value* result) {
  WrappedTensorHandle* handle;
  napi_status nstatus =
      napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  TensorDtype(env, handle, result);
}

}  // namespace tfnodejs
