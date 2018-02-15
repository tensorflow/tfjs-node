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

#ifndef TF_NODEJS_AUTO_NAPI_REF_H_
#define TF_NODEJS_AUTO_NAPI_REF_H_

#include <node_api.h>
#include "utils.h"

namespace tfnodejs {

class AutoNapiRef {
 public:
  AutoNapiRef(napi_env env, napi_value value) : env(env) {
    ENSURE_NAPI_OK(napi_create_reference(env, value, 1, &ref));
  }

  virtual ~AutoNapiRef() { ENSURE_NAPI_OK(napi_delete_reference(env, ref)); }

 private:
  napi_env env;
  napi_ref ref;
};

}  // namespace tfnodejs

#endif  // TF_NODEJS_AUTO_NAPI_REF_H_