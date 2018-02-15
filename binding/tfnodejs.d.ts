
declare class Context {
    constructor();
}

declare class TensorHandle {
  constructor(shape: number[], dtype: number);
  constructor(shape: number[], dtype: number);
  bindBuffer(buffer: Float32Array|Int32Array|Uint8Array): void;
  data(): Float32Array|Int32Array|Uint8Array;

  shape: number[];
  dtype: number;
}

export const TF_FLOAT: number;
export const TF_INT32: number;
export const TF_BOOL: number;

export const TF_Version: string;

export interface tfnodejs {
    Context: typeof Context;
    TensorHandle: typeof TensorHandle;

    TF_FLOAT: typeof TF_FLOAT;
    TF_INT32: typeof TF_INT32;
    TF_BOOL: typeof TF_BOOL;

    TF_Version: typeof TF_Version;
}
