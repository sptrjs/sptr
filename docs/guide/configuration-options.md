# 配置选项

## root

- **类型：** `string`
- **默认：** `process.cwd()`

项目根目录，可以是一个绝对路径，或者一个相对于该配置文件本身的相对路径。

## input

- **类型：** `string | string[] | Record<string, string>`
- **默认：** `['{index,main,app}.{js,mjs,cjs,ts,mts,cts}', 'src/{index,main,app}.{js,mjs,cjs,ts,mts,cts}']`

输入文件。

## define

- **类型：** `Record<string, any>`

定义全局常量替换方式。其中每项在开发环境下会被定义在全局，而在构建时被静态替换。

Sptr 使用 esbuild define 来进行替换，因此值的表达式必须是一个包含 JSON 可序列化值（null、boolean、number、string、array 或 object）或单一标识符的字符串。对于非字符串值，Sptr 将自动使用 JSON.stringify 将其转换为字符串。

## outDir

- **类型：** `string`
- **默认：** `dist`

输出目录。

## external

DEBUG

## cjs

- **类型：** `{} | false`
- **默认：** `{}`

设为 `false` 可以禁用 `CommonJS` 模块。此选项可以通过命令行 `--noCjs` 使用。

## resolve.alias

- **类型：** `Record<string, string> | Array<{ find: string | RegExp, replacement: string, customResolver?: ResolverFunction | ResolverObject }>`

将会被传递到 `@rollup/plugin-alias` 作为 entries 的选项。也可以是一个对象，或一个 `{ find, replacement, customResolver }` 的数组。

## resolve.dedupe

- **类型：** `string[]`

如果你在你的应用程序中有相同依赖的副本（比如 monorepos），请使用此选项强制 Vite 始终将列出的依赖项解析为同一副本（从项目根目录）。

## resolve.mainFields

- **类型：** `string[]`
- **默认：** `['browser', 'module', 'jsnext:main', 'jsnext']`

package.json 中，在解析包的入口点时尝试的字段列表。注意：这比从 `exports` 字段解析的情景导出优先级低：如果一个入口起点从 `exports` 成功解析，`resolve.mainFields` 将被忽略。

## resolve.extensions

- **类型：** `string[]`
- **默认：** `['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']`

导入时想要省略的扩展名列表。注意，不 建议忽略自定义导入类型的扩展名（例如：.vue），因为它会影响 IDE 和类型支持。

## sourcemap

source map

## plugins

## emptyOutDir

## write

## logLevel

## customLogger

## clearScreen
