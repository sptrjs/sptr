import type { Plugin } from 'rollup'
import aliasPlugin from '@rollup/plugin-alias'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import type { FullConfig } from '../config'
import { esbuildPlugin } from './esbuild'

export function fullPlugins(
  config: FullConfig,
  plugins: readonly Plugin[],
): Plugin[] {
  const { dedupe, extensions, mainFields } = config.resolve

  return [
    nodeResolvePlugin({
      dedupe,
      extensions,
      mainFields,
    }),

    aliasPlugin({
      entries: config.resolve.alias,
    }),

    esbuildPlugin({
      define: {}, // config.define
    }),

    jsonPlugin(),

    commonjsPlugin({
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
    }),

    ...plugins,
  ]
}
