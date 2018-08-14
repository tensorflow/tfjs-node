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

#ifndef TF_NODEJS_TF_SCOPED_STRINGS_H_
#define TF_NODEJS_TF_SCOPED_STRINGS_H_

#include "utils.h"

#include <memory>
#include <node_api.h>
#include <string>
#include <vector>

namespace tfnodejs {

class TF_ScopedStrings {
 public:
  std::string* GetString2(napi_env env, napi_value js_value) {
    char buffer[NAPI_STRING_SIZE];
    napi_status nstatus = napi_get_value_string_utf8(env, js_value, buffer,
                                                     NAPI_STRING_SIZE, nullptr);
    if (nstatus != napi_ok) {
      fprintf(stderr, "Something bad...\n");
    }

    std::auto_ptr<std::string> str(new std::string(buffer));
    string_refs_.push_back(str);
    return str.get();
  }

 private:
  std::vector<std::auto_ptr<std::string>> string_refs_;
};

}  // namespace tfnodejs

#endif  // TF_NODEJS_TF_SCOPED_STRINGS_H_
