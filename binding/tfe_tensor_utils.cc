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

#include "tfe_tensor_utils.h"
#include <algorithm>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <string>
#include "../deps/tensorflow/include/tensorflow/c/eager/c_api.h"
#include "tf_auto_status.h"
#include "tf_auto_tensor.h"
#include "utils.h"

namespace tfnodejs {

static const std::string CPU_DEVICE_0("cpu:0");

bool IsCPUDevice(std::string& device_name) {
  if (CPU_DEVICE_0.size() > device_name.size()) {
    return false;
  }
  std::transform(device_name.begin(), device_name.end(), device_name.begin(),
                 ::tolower);
  return std::equal(CPU_DEVICE_0.rbegin(), CPU_DEVICE_0.rend(),
                    device_name.rbegin());
}

void CreateTFE_TensorHandleFromTypedArray(
    napi_env env, int64_t* shape, uint32_t shape_length, TF_DataType dtype,
    napi_value typed_array_value, TFE_TensorHandle** tfe_tensor_handle) {
  napi_status nstatus;

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

  // Double check that width matches TF data type size:
  if (width != TF_DataTypeSize(dtype)) {
    NAPI_THROW_ERROR(env, "Byte size of elements differs between JS VM and TF");
    return;
  }

  // Determine the size of the buffer based on the dimensions.
  size_t num_elements = 1;
  for (size_t i = 0; i < shape_length; i++) {
    num_elements *= shape[i];
  }

  // Ensure the shape matches the length of the passed in typed-array.
  if (num_elements != array_length) {
    NAPI_THROW_ERROR(env, "Shape does not match typed-array in bindData()");
    return;
  }

  // Allocate and memcpy JS data to Tensor.
  const size_t byte_size = num_elements * width;
  TF_AutoTensor tensor(
      TF_AllocateTensor(dtype, shape, shape_length, byte_size));
  memcpy(TF_TensorData(tensor.tensor), array_data, byte_size);

  TF_AutoStatus tf_status;
  *tfe_tensor_handle = TFE_NewTensorHandle(tensor.tensor, tf_status.status);
  ENSURE_TF_OK(env, tf_status);
}

void CopyTFE_TensorHandleDataToTypedArray(napi_env env,
                                          TFE_Context* tfe_context,
                                          TFE_TensorHandle* tfe_tensor_handle,
                                          napi_value* result) {
  napi_status nstatus;

  if (tfe_context == nullptr) {
    NAPI_THROW_ERROR(env, "Invalid TFE_Context");
    return;
  }
  if (tfe_tensor_handle == nullptr) {
    NAPI_THROW_ERROR(env, "Invalid TFE_TensorHandle");
    return;
  }

  // Determine the type of the array
  napi_typedarray_type array_type;
  switch (TFE_TensorHandleDataType(tfe_tensor_handle)) {
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
      REPORT_UNKNOWN_TF_DATA_TYPE(env,
                                  TFE_TensorHandleDataType(tfe_tensor_handle));
      return;
  }

  TF_AutoStatus tf_status;

  std::string device_name = std::string(
      TFE_TensorHandleDeviceName(tfe_tensor_handle, tf_status.status));
  ENSURE_TF_OK(env, tf_status);

  // If the handle is running on a non-CPU device, copy the handle to the device
  // before attempting to read from the tensor buffer.
  bool cleanup_handle = false;
  TFE_TensorHandle* target_handle;
  if (IsCPUDevice(device_name)) {
    target_handle = tfe_tensor_handle;
  } else {
    target_handle = TFE_TensorHandleCopyToDevice(tfe_tensor_handle, tfe_context,
                                                 nullptr, tf_status.status);
    ENSURE_TF_OK(env, tf_status);
    cleanup_handle = true;
  }

  TF_Tensor* tensor = TFE_TensorHandleResolve(target_handle, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  // Determine the length of the array based on the shape of the tensor.
  size_t length = 0;
  uint32_t num_dims = TF_NumDims(tensor);
  if (num_dims == 0) {
    length = 1;
  } else {
    for (uint32_t i = 0; i < num_dims; i++) {
      if (i == 0) {
        length = TF_Dim(tensor, i);
      } else {
        length *= TF_Dim(tensor, i);
      }
    }
  }

  void* data = TF_TensorData(tensor);
  size_t byte_length = TF_TensorByteSize(tensor);

  napi_value array_buffer_value;
  nstatus = napi_create_external_arraybuffer(env, data, byte_length, nullptr,
                                             nullptr, &array_buffer_value);
  ENSURE_NAPI_OK(env, nstatus);

  nstatus = napi_create_typedarray(env, array_type, length, array_buffer_value,
                                   0, result);
  ENSURE_NAPI_OK(env, nstatus);

  TF_DeleteTensor(tensor);

  if (cleanup_handle) {
    TFE_DeleteTensorHandle(target_handle);
  }
}

// void GetTensorShape(napi_env env, napi_value wrapped_value,
//                     napi_value* result) {
//   napi_status nstatus;

//   WrappedTensorHandle* handle;
//   nstatus = napi_unwrap(env, wrapped_value,
//   reinterpret_cast<void**>(&handle)); ENSURE_NAPI_OK(env, nstatus);

//   if (handle->handle == nullptr) {
//     NAPI_THROW_ERROR(env, "Invalid TFE_TensorHandle used in shape");
//     return;
//   }

//   TF_AutoStatus tf_status;
//   uint32_t num_dims = TFE_TensorHandleNumDims(handle->handle,
//   tf_status.status); ENSURE_TF_OK(env, tf_status);

//   if (num_dims == 0) {
//     nstatus = napi_create_array_with_length(env, 0, result);
//     ENSURE_NAPI_OK(env, nstatus);
//   } else {
//     nstatus = napi_create_array_with_length(env, num_dims, result);
//     ENSURE_NAPI_OK(env, nstatus);

//     for (uint32_t i = 0; i < num_dims; i++) {
//       napi_value cur_dim;
//       nstatus = napi_create_int64(
//           env, TFE_TensorHandleDim(handle->handle, i, tf_status.status),
//           &cur_dim);
//       ENSURE_TF_OK(env, tf_status);
//       ENSURE_NAPI_OK(env, nstatus);

//       nstatus = napi_set_element(env, *result, i, cur_dim);
//       ENSURE_NAPI_OK(env, nstatus);
//     }
//   }
// }

// void GetTensorDtype(napi_env env, napi_value wrapped_value,
//                     napi_value* result) {
//   napi_status nstatus;

//   WrappedTensorHandle* handle;
//   nstatus = napi_unwrap(env, wrapped_value,
//   reinterpret_cast<void**>(&handle)); ENSURE_NAPI_OK(env, nstatus);

//   if (handle->handle == nullptr) {
//     NAPI_THROW_ERROR(env, "Invalid TFE_TensorHandle used in dtype");
//     return;
//   }

//   TF_DataType dtype = TFE_TensorHandleDataType(handle->handle);
//   nstatus = napi_create_int32(env, dtype, result);
//   ENSURE_NAPI_OK(env, nstatus);
// }

}  // namespace tfnodejs
