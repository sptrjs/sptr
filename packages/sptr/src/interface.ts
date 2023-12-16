import type { OutputAsset, OutputChunk as RollupOutputChunk } from 'rollup'

export { OutputAsset }

export interface OutputChunk extends RollupOutputChunk {
  dts?: string
}

export interface SptrOutput {
  output: Array<OutputChunk | OutputAsset>
}
