import * as tfc from '@tensorflow/tfjs-core';

import {createTypeOpAttr, getTFDTypeForInputs, nodeBackend} from './op_utils';

// Actual generated Op!
export function Concat(values: tfc.Tensor[], axis: tfc.Tensor): tfc.Tensor {
  const opAttrs = [
    // N | int
    {name: 'N', type: nodeBackend().binding.TF_ATTR_INT, value: values.length},
    // T | type
    createTypeOpAttr('T', getTFDTypeForInputs(values)),
    // Tidx | type
    createTypeOpAttr('Tidx', getTFDTypeForInputs(axis))
  ];
  const inputTensors = [] as tfc.Tensor[];
  values.forEach((t) => inputTensors.push(t));
  inputTensors.push(axis);
  return nodeBackend().executeSingleOutput('ConcatV2', opAttrs, inputTensors);
}
