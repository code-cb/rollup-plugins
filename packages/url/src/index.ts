/**
 * Reference: https://github.com/rollup/plugins/tree/master/packages/url
 */

import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { readFile, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Plugin } from 'rollup';
import { AssetCopy, inlineAsset } from './utils';

export interface UrlOptions {
  destDir?: string;
  emitFiles?: boolean;
  exclude?: FilterPattern;
  filename?: string;
  include?: FilterPattern;
  limit?: number;
  publicPath?: string;
  sourceDir?: string;
}
const defaultExtensions = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

export const url = ({
  destDir,
  emitFiles = true,
  exclude,
  filename = '[hash][extname]',
  include = defaultExtensions.map(ext => `**/*.${ext}`),
  limit = 14 * 1024,
  publicPath = '',
  sourceDir,
}: UrlOptions = {}): Plugin => {
  const filter = createFilter(include, exclude);
  const assetCopy = new AssetCopy({ filename, publicPath, sourceDir });

  return {
    name: 'url',
    async load(id) {
      if (!filter(id)) return null;
      const [stats, buffer] = await Promise.all([stat(id), readFile(id)]);
      const shouldInline = limit !== 0 && stats.size <= limit;
      return shouldInline
        ? inlineAsset(id, buffer)
        : assetCopy.addCopy(id, buffer);
    },
    async generateBundle({ dir, file }) {
      if (!emitFiles) return;
      const baseDir = destDir || dir || dirname(file!);
      await assetCopy.copyAll(baseDir);
    },
  };
};

export default url;
