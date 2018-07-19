import * as tfc from '@tensorflow/tfjs-core';

import {createTypeOpAttr, getTFDTypeForInputs, nodeBackend} from './op_utils';

/**
 * Concatenates tensors along one dimension.
 *
 * @param values List of `N` Tensors to concatenate. Their ranks and types must
 *   match, and their sizes must match in all dimensions except `concat_dim`.
 * @param axis 0-D.  The dimension along which to concatenate.  Must be in the
 *   range [-rank(values), rank(values)).
 */
export function Concat(values: tfc.Tensor[], axis: tfc.Tensor): tfc.Tensor {
  const opAttrs = [
    {name: 'N', type: nodeBackend().binding.TF_ATTR_INT, value: values.length},
    createTypeOpAttr('Tidx', getTFDTypeForInputs(axis)),
    createTypeOpAttr('T', getTFDTypeForInputs(values))
  ];
  const inputs = [] as tfc.Tensor[];
  values.forEach((input) => inputs.push(input));
  inputs.push(axis);
  return nodeBackend().executeSingleOutput('ConcatV2', opAttrs, inputs);
}
