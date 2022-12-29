import {
  createFilter,
  dataToEsm,
  DataToEsmOptions,
  FilterPattern,
} from '@rollup/pluginutils';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Plugin } from 'rollup';
import {
  convertFilename,
  isJsonFile,
  randomIdentifier,
  resolveId,
  splitDeclaration,
  typeAliasRegex,
} from './utils';

export interface JsonPluginConfig
  extends Pick<DataToEsmOptions, 'compact' | 'indent' | 'preferConst'> {
  exclude?: FilterPattern;
  include?: FilterPattern;
}

export const json = ({
  compact = false,
  exclude,
  include,
  indent = '  ',
}: JsonPluginConfig): Plugin => {
  const jsonCache = new Map<string, string>();
  const identifiers = new Array<string>();
  const filter = createFilter(include, exclude);

  return {
    name: 'json',

    async resolveId(source, importer) {
      if (!isJsonFile(source) || !filter(source)) return undefined;

      const originalId = await resolveId(source, importer);
      if (!originalId) return undefined;

      const virtualId = convertFilename(originalId);
      if (jsonCache.has(virtualId)) return virtualId;

      const code = await readFile(originalId, 'utf-8');
      const data = JSON.parse(code);
      const identifier = randomIdentifier();
      const esmCode = splitDeclaration(
        dataToEsm(data, {
          compact,
          indent,
          namedExports: false,
          preferConst: true,
        }),
        identifier,
      );
      jsonCache.set(virtualId, esmCode);
      identifiers.push(identifier);
      return virtualId;
    },

    async load(id) {
      return jsonCache.get(id);
    },

    async writeBundle(options, bundle) {
      if (!identifiers.length) return;

      await Promise.all(
        Object.values(bundle).map(async output => {
          if (output.type === 'chunk') return;

          const { fileName, source } = output;
          if (!fileName.endsWith('.d.ts')) return;

          const sourceString =
            typeof source === 'string'
              ? source
              : new TextDecoder().decode(source);

          const transformedSource = sourceString.replaceAll(
            typeAliasRegex('\\w+', `(${identifiers.join('|')})`),
            s =>
              s.replace(
                typeAliasRegex('\\w+', '\\w+'),
                (_, s1, s2) => `declare const ${s1}: typeof ${s2}`,
              ),
          );
          const resolvedFilename = resolve(options.dir || '.', fileName);
          await writeFile(resolvedFilename, transformedSource, 'utf-8');
        }),
      );
    },
  };
};

export default json;
