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
#include <cstdlib>
#include <cstring>
#include <iostream>
#include "../deps/tensorflow/include/tensorflow/c/eager/c_api.h"
#include "tf_auto_status.h"
#include "utils.h"

namespace tfnodejs {

void Cleanup(napi_env env, void* data, void* hint) {
  TensorHandle* handle = static_cast<TensorHandle*>(data);
  if (handle->handle != nullptr) {
    TFE_DeleteTensorHandle(handle->handle);
    handle->handle = nullptr;
  }
  if (handle->tensor != nullptr) {
    TF_DeleteTensor(handle->tensor);
    handle->tensor = nullptr;
  }
  delete handle;
}

void InitTensorHandle(napi_env env, napi_value wrapped_value) {
  TensorHandle* handle = new TensorHandle();
  handle->tensor = nullptr;
  handle->handle = nullptr;
  handle->env = env;

  napi_status nstatus =
      napi_wrap(env, wrapped_value, handle, Cleanup, nullptr, nullptr);
  ENSURE_NAPI_OK(env, nstatus);
}

void BindTensorJSBuffer(napi_env env, napi_value wrapped_value, int64_t* shape,
                        uint32_t shape_length, TF_DataType dtype,
                        napi_value typed_array_value) {
  napi_status nstatus;

  TensorHandle* handle;
  nstatus = napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  if (handle->tensor != nullptr) {
    // TODO - delete this Tensor before use.
  }
  if (handle->handle != nullptr) {
    // TODO - delete this before use?
  }

  napi_typedarray_type array_type;
  size_t array_length;
  void* array_data;
  nstatus =
      napi_get_typedarray_info(env, typed_array_value, &array_type,
                               &array_length, &array_data, nullptr, nullptr);
  ENSURE_NAPI_OK(env, nstatus);

  // Double check the underlying TF_Tensor type matches the supplied
  // typed-array.
  size_t width = 0;
  switch (array_type) {
    case napi_float32_array:
      if (dtype != TF_FLOAT) {
        NAPI_THROW_ERROR(env, "Tensor type does not match Float32Array");
        return;
      }
      width = sizeof(float);
      break;
    case napi_int32_array:
      if (dtype != TF_INT32) {
        NAPI_THROW_ERROR(env, "Tensor type does not match Int32Array");
        return;
      }
      width = sizeof(int32_t);
      break;
    case napi_uint8_array:
      if (dtype != TF_BOOL) {
        NAPI_THROW_ERROR(env, "Tensor type does not match Uint8Array");
        return;
      }
      width = sizeof(uint8_t);
      break;
    default:
      REPORT_UNKNOWN_TYPED_ARRAY_TYPE(env, array_type);
      return;
  }

  // Determine the size of the buffer based on the dimensions.
  uint32_t buffer_length = 1;
  for (uint32_t i = 0; i < shape_length; i++) {
    buffer_length *= shape[i];
  }

  // Allocate a place holder Tensor. Data will be bound to this later.
  TF_Tensor* tensor =
      TF_AllocateTensor(dtype, shape, shape_length, buffer_length * width);

  TF_AutoStatus tf_status;
  TFE_TensorHandle* tfe_handle = TFE_NewTensorHandle(tensor, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  memcpy(TF_TensorData(tensor), array_data, array_length * width);

  // TODO - delete the TF_Tensor here - only get it back on dataSync()!
  // Set new TF/TFE pointers on the handle.
  handle->tensor = tensor;
  handle->handle = tfe_handle;
}

void GetTensorData(napi_env env, napi_value wrapped_value, napi_value* result) {
  napi_status nstatus;

  TensorHandle* handle;
  nstatus = napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  // TODO - get the TF_Tensor pointer here form the TFE_TensorHandle pointer
  if (handle->tensor == nullptr) {
    NAPI_THROW_ERROR(env, "Uninitialized TensorHandle used in dataSync()");
    return;
  }

  // Determine the type of the array
  napi_typedarray_type array_type;
  switch (TF_TensorType(handle->tensor)) {
    case TF_FLOAT:
      array_type = napi_float32_array;
      break;
    case TF_INT32:
      array_type = napi_int32_array;
      break;
    case TF_BOOL:
      array_type = napi_uint8_array;
      break;
    default:
      REPORT_UNKNOWN_TF_DATA_TYPE(env, TF_TensorType(handle->tensor));
      return;
  }

  // Determine the length of the array based on the shape of the tensor.
  size_t length = 0;
  uint32_t num_dims = TF_NumDims(handle->tensor);
  for (uint32_t i = 0; i < num_dims; i++) {
    if (i == 0) {
      length = TF_Dim(handle->tensor, i);
    } else {
      length *= TF_Dim(handle->tensor, i);
    }
  }

  void* data = TF_TensorData(handle->tensor);
  size_t byte_length = TF_TensorByteSize(handle->tensor);

  napi_value array_buffer_value;
  nstatus = napi_create_external_arraybuffer(env, data, byte_length, nullptr,
                                             nullptr, &array_buffer_value);
  ENSURE_NAPI_OK(env, nstatus);

  nstatus = napi_create_typedarray(env, array_type, length, array_buffer_value,
                                   0, result);
  ENSURE_NAPI_OK(env, nstatus);
}

void GetTensorShape(napi_env env, napi_value wrapped_value,
                    napi_value* result) {
  napi_status nstatus;

  TensorHandle* handle;
  nstatus = napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  if (handle->handle == nullptr) {
    NAPI_THROW_ERROR(env, "Uninitialized TensorHandle used in shape");
    return;
  }

  TF_AutoStatus tf_status;
  uint32_t num_dims = TFE_TensorHandleNumDims(handle->handle, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  nstatus = napi_create_array_with_length(env, num_dims, result);
  ENSURE_NAPI_OK(env, nstatus);

  for (uint32_t i = 0; i < num_dims; i++) {
    napi_value cur_dim;
    nstatus = napi_create_int64(
        env, TFE_TensorHandleDim(handle->handle, i, tf_status.status),
        &cur_dim);
    ENSURE_TF_OK(env, tf_status);
    ENSURE_NAPI_OK(env, nstatus);

    nstatus = napi_set_element(env, *result, i, cur_dim);
    ENSURE_NAPI_OK(env, nstatus);
  }
}

void GetTensorDtype(napi_env env, napi_value wrapped_value,
                    napi_value* result) {
  napi_status nstatus;

  TensorHandle* handle;
  nstatus = napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  if (handle->handle == nullptr) {
    NAPI_THROW_ERROR(env, "Uninitialized TensorHandle used in dtype");
    return;
  }

  TF_DataType dtype = TFE_TensorHandleDataType(handle->handle);
  nstatus = napi_create_int32(env, dtype, result);
  ENSURE_NAPI_OK(env, nstatus);
}

}  // namespace tfnodejs
