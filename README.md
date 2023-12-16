# sptr

> Warn 此包目前正在开发中，请不要使用。

esm 模块打包器。

基于 rollup 实现，零配置或少配置打包成库。

使用 `esbuild` 解析 `typescript`。

`include/exclude` 模式

`{src,.}/{index,main,app}.{ts,js}`

string | string[] | {[key:string]: string}

src/index.ts

[src/index.ts,src/index.ts]

```ts
import { defineConfig } from '@sptr-design/cli'

export default defineConfig({
  input: '', // {} []
  write: true,
  output: {
    outDir: 'dist',
  },
  esbuild: {}, // esbuild
  define: {}, // define
  resolve: {
    alias: {},
  },
})
```

## 配置

### input

- 默认："index.js" | "src/index.js" | "index.ts" | "src/index.ts"

### write

- 默认：`true`

设置为 `false` 来禁用将构建后的文件写入磁盘。

### output.outDir

- 默认：`dist`

指定输出路径。

### esbuild

- 类型： `ESBuildOptions | false`

默认情况下，`esbuild` 会被应用在 `ts`、`jsx`、`tsx` 文件。你可以通过 `esbuild.include` 和 `esbuild.exclude` 对要处理的文件类型进行配置，这两个配置的值可以是一个正则表达式、一个 `picomatch` 模式，或是一个值为这两种类型的数组。

`esbuild` 配置。详情请见 。

### resolve.alias

将会被传递到 `@rollup/plugin-alias` 作为 `entries` 的选项。也可以是一个对象，或一个 `{ find, replacement, customResolver }` 的数组。

当使用文件系统路径的别名时，请始终使用绝对路径。相对路径的别名值会原封不动地被使用，因此无法被正常解析。

### resolve.dedupe

如果你在你的应用程序中有相同依赖的副本（比如 monorepos），请使用此选项强制 Vite 始终将列出的依赖项解析为同一副本（从项目根目录）。

### resolve.mainFields

`package.json` 中，在解析包的入口点时尝试的字段列表。注意：这比从 `exports` 字段解析的情景导出优先级低：如果一个入口起点从 `exports` 成功解析，`resolve.mainFields` 将被忽略。

### resolve.extensions

- 默认：`['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']`

导入时想要省略的扩展名列表。注意，不 建议忽略自定义导入类型的扩展名（例如：.vue），因为它会影响 IDE 和类型支持。

### logLevel

- 类型：`'info' | 'warn' | 'error' | 'silent'`
- 默认：`'info'`

### customLogger

使用自定义 `logger` 记录消息。可以使用 `sptr` 的 `createLogger` API 获取默认的 `logger` 并对其进行自定义，例如，更改消息或过滤掉某些警告。

### clearScreen

- 类型：`boolean`
- 默认：`true`

设为 `false` 可以避免 `Vite` 清屏而错过在终端中打印某些关键信息。命令行模式下可以通过 `--clearScreen false` 设置。

### envDir

- 类型： `string`
- 默认： `root`

用于加载 `.env` 文件的目录。可以是一个绝对路径，也可以是相对于项目根的路径。

关于环境文件的更多信息，请参见 这里。

### envPrefix

- 类型： `string | string[]`
- 默认： `VITE\_`

以 `envPrefix` 开头的环境变量会通过 `import.meta.env` 暴露在你的客户端源码中。
