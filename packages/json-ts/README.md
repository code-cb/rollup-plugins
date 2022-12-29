# @codecb/rollup-plugin-json-ts

An alternative of [@rollup/plugin-json](https://github.com/rollup/plugins/tree/master/packages/json) that works better with [rollup-plugin-ts](https://github.com/wessberg/rollup-plugin-ts)

## Usage

```ts
import { json } from '@codecb/rollup-plugin-json-ts';
import { defineConfig } from 'rollup';
import ts from 'rollup-plugin-ts';

const config = defineConfig({
  input: './src/index.ts',
  output: {
    dir: './dist',
    format: 'esm',
  },
  plugins: [json({}), ts({})],
});

export default config;
```
