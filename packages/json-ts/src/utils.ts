import { readdir, realpath, stat } from 'node:fs/promises';
import { dirname, basename, resolve } from 'node:path';

const JSON_REGEX = /\.json$/i;

export const isJsonFile = (filename: string) => JSON_REGEX.test(filename);

export const convertFilename = (filename: string) =>
  filename.replace(JSON_REGEX, '.ts');

export const randomIdentifier = () =>
  `default_${Math.random().toString(16).slice(2, 6)}`;

export const splitDeclaration = (esmCode: string, identifier: string) => {
  const definition = esmCode.split(/^export default\s*/g)[1];
  return `const ${identifier} = ${definition}export default ${identifier};\n`;
};

const findFile = async (
  filename: string,
  preserveSymlinks = false,
): Promise<string | undefined> => {
  try {
    const stats = await stat(filename);
    if (!preserveSymlinks && stats.isSymbolicLink())
      return await findFile(await realpath(filename), preserveSymlinks);
    if ((preserveSymlinks && stats.isSymbolicLink()) || stats.isFile()) {
      const files = await readdir(dirname(filename));
      if (files.includes(basename(filename))) return filename;
    }
  } catch {
    // do nothing
  }
  return undefined;
};

export const resolveId = async (
  source: string,
  importer: string | undefined,
) => {
  if (importer && !/^[\/\.]/.test(source)) return require.resolve(source);
  const fileName = importer ? resolve(dirname(importer), source) : source;
  return findFile(fileName);
};

export const typeAliasRegex = (newIdentifier: string, oldIdentifier: string) =>
  new RegExp(`type (${newIdentifier}) = (${oldIdentifier})`, 'g');
