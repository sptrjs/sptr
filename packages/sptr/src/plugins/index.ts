import type { Plugin } from 'rollup'
import aliasPlugin from '@rollup/plugin-alias'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import type { ResolvedConfig } from '../config'
import type { SptrScope } from '../utils'
import { esbuildPlugin } from './esbuild'
import { reporterPlugin } from './reporter'

export interface InsidePlugin<A = any> extends Plugin<A> {
  name: SptrScope
}

export async function fullPlugins(
  config: ResolvedConfig,
  plugins: readonly Plugin[] = [],
): Promise<Plugin[]> {
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

    reporterPlugin(config),

    ...plugins,

  ]
}
