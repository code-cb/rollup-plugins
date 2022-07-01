/**
 * Reference: https://github.com/se-panfilov/rollup-plugin-strip-code
 */

import { createFilter, FilterPattern } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import { Plugin } from 'rollup';

export type StripCodeOptions = {
  exclude?: FilterPattern;
  include?: FilterPattern;
} & (
  | { pattern: string | RegExp }
  | { endComment: string; startComment: string }
);

export const stripCode = (
  options: StripCodeOptions = {
    endComment: '#stripCodeEnd',
    startComment: '#stripCodeStart',
  },
): Plugin => {
  const { exclude, include } = options;
  const filter = createFilter(include, exclude);
  const replacePattern =
    'pattern' in options
      ? options.pattern
      : new RegExp(
          `[ \\t]*\\/\\*+\\s*${options.startComment}\\s*\\*\\/([\\s\\S]*?)[ \\t]*\\/\\*+\\s*${options.endComment}\\s*\\*\\/[ \\t]*`,
          'gi',
        );

  return {
    name: 'strip-code',
    transform(code, id) {
      if (!filter(id)) return null;
      const ms = new MagicString(code);
      ms.replace(replacePattern, '');
      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true }),
      };
    },
  };
};

export default stripCode;
