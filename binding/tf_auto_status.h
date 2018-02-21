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

#ifndef TF_NODEJS_TF_AUTO_STATUS_H_
#define TF_NODEJS_TF_AUTO_STATUS_H_

#include <node_api.h>
#include "../deps/tensorflow/include/tensorflow/c/eager/c_api.h"

namespace tfnodejs {

//
// Automatically cleans up a TF_Status instance.
//
class TF_AutoStatus {
 public:
  TF_AutoStatus() : status(TF_NewStatus()) {}
  virtual ~TF_AutoStatus() { TF_DeleteStatus(status); }

  TF_Status* status;
};

}  // namespace tfnodejs

#endif  // TF_NODEJS_TF_AUTO_STATUS_H_
