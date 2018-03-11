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
  delete handle;
}

size_t CalcTensorLength(uint32_t& shape_length, int64_t* shape) {
  size_t num_elements = 1;
  for (size_t i = 0; i < shape_length; i++) {
    num_elements *= shape[i];
  }
  return num_elements;
}

void InitTensorHandle(napi_env env, napi_value wrapped_value) {
  TensorHandle* handle = new TensorHandle();
  handle->handle = nullptr;
  handle->env = env;

  napi_status nstatus =
      napi_wrap(env, wrapped_value, handle, Cleanup, nullptr, nullptr);
  ENSURE_NAPI_OK(env, nstatus);
}

void CopyTensorJSBuffer(napi_env env, napi_value wrapped_value, int64_t* shape,
                        uint32_t shape_length, TF_DataType dtype,
                        napi_value typed_array_value) {
  napi_status nstatus;

  TensorHandle* handle;
  nstatus = napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  if (handle->handle != nullptr) {
    // TODO(kreeger): Check to see if the handle can be reused if shape and
    // dtype match.
    TFE_DeleteTensorHandle(handle->handle);
    handle->handle = nullptr;
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

  // Double check that width matches TF data type size:
  if (width != TF_DataTypeSize(dtype)) {
    NAPI_THROW_ERROR(env, "Byte size of elements differs between JS VM and TF");
    return;
  }

  // Determine the size of the buffer based on the dimensions.
  size_t num_elements = CalcTensorLength(shape_length, shape);

  // Ensure the shape matches the length of the passed in typed-array.
  if (num_elements != array_length) {
    NAPI_THROW_ERROR(env, "Shape does not match typed-array in bindData()");
    return;
  }

  // Allocate and memcpy JS data to Tensor.
  // TODO(kreeger): Check to see if the Deallocator param can be used to
  // automatically cleanup with JS runtime.
  const size_t byte_size = num_elements * width;
  TF_Tensor* tensor = TF_AllocateTensor(dtype, shape, shape_length, byte_size);
  memcpy(TF_TensorData(tensor), array_data, byte_size);

  TF_AutoStatus tf_status;
  TFE_TensorHandle* tfe_handle = TFE_NewTensorHandle(tensor, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  // Reference the new TFE_TensorHandle to the wrapped object.
  handle->handle = tfe_handle;

  TF_DeleteTensor(tensor);
}

void GetTensorData(napi_env env, napi_value wrapped_value, napi_value* result) {
  napi_status nstatus;

  TensorHandle* handle;
  nstatus = napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  if (handle->handle == nullptr) {
    NAPI_THROW_ERROR(env, "Invalid TFE_TensorHandle in dataSync()");
    return;
  }

  // Determine the type of the array
  napi_typedarray_type array_type;
  switch (TFE_TensorHandleDataType(handle->handle)) {
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
                                  TFE_TensorHandleDataType(handle->handle));
      return;
  }

  // TODO(kreeger): This will only work for CPU device. Use
  // TFE_TensorHandleCopyToDevice() to work for non-CPU only platforms:
  // https://github.com/tensorflow/tfjs-node/issues/25
  TF_AutoStatus tf_status;
  TF_Tensor* tensor = TFE_TensorHandleResolve(handle->handle, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  // Determine the length of the array based on the shape of the tensor.
  size_t length = 0;
  uint32_t num_dims = TF_NumDims(tensor);
  for (uint32_t i = 0; i < num_dims; i++) {
    if (i == 0) {
      length = TF_Dim(tensor, i);
    } else {
      length *= TF_Dim(tensor, i);
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
}

void UpcastTempHandleData(napi_env env, napi_value wrapped_value,
                          TF_DataType data_type) {
  napi_status nstatus;

  TensorHandle* handle;
  nstatus = napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  if (handle->handle == nullptr) {
    NAPI_THROW_ERROR(env, "Invalid TFE_TensorHandle in dataSync()");
    return;
  }
  // Double check that tempHandle is nullptr
  if (handle->tempHandle != nullptr) {
    NAPI_THROW_ERROR(env, "Temp handle is not nullptr");
    return;
  }

  TF_AutoStatus tf_status;
  TF_DataType oldType = TFE_TensorHandleDataType(handle->handle);
  if (oldType == TF_FLOAT) {
    // TF_FLOAT is not uptyped in the binding.
    return;
  }

  uint32_t shape_length =
      TFE_TensorHandleNumDims(handle->handle, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  int64_t shape[shape_length];
  for (uint32_t i = 0; i < shape_length; i++) {
    shape[i] = TFE_TensorHandleDim(handle->handle, i, tf_status.status);
    ENSURE_TF_OK(env, tf_status);
  }

  size_t num_elements = CalcTensorLength(shape_length, shape);

  // TODO - this will need the new device finder thing...
  TF_Tensor* tensor = TFE_TensorHandleResolve(handle->handle, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  void* uptyped_data;
  size_t width;

  switch (oldType) {
    case TF_INT32: {
      if (data_type != TF_FLOAT) {
        NAPI_THROW_ERROR(env, "TF_INT32 can only be uptyped to TF_FLOAT");
        return;
      }
      std::vector<float> float_values;
      int32_t* buffer = static_cast<int32_t*>(TF_TensorData(tensor));
      for (size_t i = 0; i < num_elements; i++) {
        float_values.push_back(static_cast<float>(buffer[i]));
      }
      width = sizeof(float);
      uptyped_data = float_values.data();
      break;
    }
    case TF_BOOL: {
      uint8_t* buffer = static_cast<uint8_t*>(TF_TensorData(tensor));
      if (data_type == TF_INT32) {
        std::vector<int32_t> int32_values;
        for (size_t i = 0; i < num_elements; i++) {
          int32_values.push_back(static_cast<int32_t>(buffer[i]));
        }
        width = sizeof(int32_t);
        uptyped_data = int32_values.data();
      } else if (data_type == TF_FLOAT) {
        std::vector<float> float_values;
        for (size_t i = 0; i < num_elements; i++) {
          float_values.push_back(static_cast<float>(buffer[i]));
        }
        width = sizeof(float);
        uptyped_data = float_values.data();
      } else {
        NAPI_THROW_ERROR(
            env, "TF_BOOL can only be uptyped to TF_INT32 and TF_FLOAT");
        return;
      }
      break;
    }
    default:
      REPORT_UNKNOWN_TF_DATA_TYPE(env, oldType);
      return;
  }

  const size_t byte_size = num_elements * width;

  TF_Tensor* newTensor =
      TF_AllocateTensor(data_type, shape, shape_length, byte_size);
  memcpy(TF_TensorData(newTensor), uptyped_data, byte_size);

  TFE_TensorHandle* tfe_handle =
      TFE_NewTensorHandle(newTensor, tf_status.status);
  ENSURE_TF_OK(env, tf_status);

  // Mark the temp handle - this handle will be cleaned up in an execute() call.
  handle->tempHandle = tfe_handle;

  TF_DeleteTensor(newTensor);
}

void GetTensorShape(napi_env env, napi_value wrapped_value,
                    napi_value* result) {
  napi_status nstatus;

  TensorHandle* handle;
  nstatus = napi_unwrap(env, wrapped_value, reinterpret_cast<void**>(&handle));
  ENSURE_NAPI_OK(env, nstatus);

  if (handle->handle == nullptr) {
    NAPI_THROW_ERROR(env, "Invalid TFE_TensorHandle used in shape");
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
    NAPI_THROW_ERROR(env, "Invalid TFE_TensorHandle used in dtype");
    return;
  }

  TF_DataType dtype = TFE_TensorHandleDataType(handle->handle);
  nstatus = napi_create_int32(env, dtype, result);
  ENSURE_NAPI_OK(env, nstatus);
}

}  // namespace tfnodejs
