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

#ifndef TF_NODEJS_UTILS_H_
#define TF_NODEJS_UTILS_H_

#include <stdio.h>
#include <cstdlib>
#include "../deps/tensorflow/include/tensorflow/c/c_api.h"
#include "tf_auto_status.h"

#define NAPI_STRING_SIZE 512

#define MAX_TENSOR_SHAPE 4

#define ARRAY_SIZE(array) (sizeof(array) / sizeof(array[0]))

namespace tfnodejs {

#define ENSURE_NAPI_OK(env, status) \
  EnsureNapiOK(env, status, __FILE__, __LINE__)

inline void EnsureNapiOK(napi_env env, napi_status status, const char* file,
                         const size_t lineNumber) {
  if (status != napi_ok) {
    const napi_extended_error_info* error_info = 0;
    napi_get_last_error_info(env, &error_info);

    fprintf(stderr, "** INVALID napi_status: %d\n", status);
    fprintf(stderr, "- %s\n", error_info->error_message);
    fprintf(stderr, "- %s:%lu\n", file, lineNumber);
    std::exit(1);
  }
}

#define ENSURE_TF_OK(status) EnsureTFOK(status, __FILE__, __LINE__)

inline void EnsureTFOK(TF_AutoStatus& status, const char* file,
                       const size_t lineNumber) {
  if (TF_GetCode(status.status) != TF_OK) {
    printf("** INVALID TF_Status: %d\n", TF_GetCode(status.status));
    printf("- %s\n", TF_Message(status.status));
    printf("- %s:%lu\n", file, lineNumber);
    std::exit(1);
  }
}

inline void AssertConstructorCall(napi_env env, napi_callback_info info) {
  napi_value js_target;
  napi_status nstatus = napi_get_new_target(env, info, &js_target);
  ENSURE_NAPI_OK(env, nstatus);
  if (js_target == nullptr) {
    printf(">>> Function not used as a constructor\n");
    std::exit(1);
  }
}

inline void AssertValueIsArray(napi_env env, napi_value value) {
  bool is_array;
  ENSURE_NAPI_OK(env, napi_is_array(env, value, &is_array));
  if (!is_array) {
    printf(">>> Argument is not an array!\n");
    std::exit(1);
  }
}

inline void AssertValueIsTypedArray(napi_env env, napi_value value) {
  bool is_array;
  ENSURE_NAPI_OK(env, napi_is_typedarray(env, value, &is_array));
  if (!is_array) {
    printf(">>> Argument is not a typed-array!\n");
    std::exit(1);
  }
}

inline void AssertValueIsLessThan(uint32_t value, uint32_t max) {
  if (value > max) {
    printf(">>> Argument is greater than max: %d > %d!\n", value, max);
    std::exit(1);
  }
}

}  // namespace tfnodejs

#endif  // TF_NODEJS_UTILS_H_
