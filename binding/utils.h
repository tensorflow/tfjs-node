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

// TODO Make this a macro
/* #define ENSURE_NAPI_OK(status) (status == napi_ok); */
static inline void ENSURE_NAPI_OK(napi_status status) {
  if (status != napi_ok) {
    printf(">>> INVALID napi_status: %d\n", status);
    std::exit(1);
  }
}

// TODO Make this a macro
static inline void ENSURE_TF_OK(TF_AutoStatus& status) {
  /* ENSURE_TF_OK(status.status); */
}
static inline void ENSURE_TF_OK(TF_Status* status) {
  if (TF_GetCode(status) != TF_OK) {
    printf(">>> INVALID TF_Status: %d\n", TF_GetCode(status));
    printf("%s\n", TF_Message(status));
    std::exit(1);
  }
}

static inline void AssertConstructorCall(napi_env env,
                                         napi_callback_info info) {
  napi_value js_target;
  napi_status nstatus = napi_get_new_target(env, info, &js_target);
  ENSURE_NAPI_OK(nstatus);
  if (js_target == nullptr) {
    printf(">>> Function not used as a constructor\n");
    std::exit(1);
  }
}

static inline void AssertValueIsArray(napi_env env, napi_value value) {
  bool is_array;
  ENSURE_NAPI_OK(napi_is_array(env, value, &is_array));
  if (!is_array) {
    printf(">>> Argument is not an array!\n");
    std::exit(1);
  }
}

static inline void AssertValueIsTypedArray(napi_env env, napi_value value) {
  bool is_array;
  ENSURE_NAPI_OK(napi_is_typedarray(env, value, &is_array));
  if (!is_array) {
    printf(">>> Argument is not a typed-array!\n");
    std::exit(1);
  }
}

static inline void AssertValueIsLessThan(uint32_t value, uint32_t max) {
  if (value > max) {
    printf(">>> Argument is greater than max: %d > %d!\n", value, max);
    std::exit(1);
  }
}

}  // namespace tfnodejs

#endif  // TF_NODEJS_UTILS_H_
