/**
 * Reference: https://github.com/se-panfilov/rollup-plugin-strip-code
 */

import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import { Plugin } from 'rollup';
import { CommentBoundary, StripCodeOptions } from './types';
import { buildCommentPattern } from './utils';

export type { CommentBoundary, StripCodeOptions } from './types';

const defaultCommentBoundary: CommentBoundary = {
  end: '#stripCodeEnd',
  start: '#stripCodeStart',
};

export const stripCode = (
  options: StripCodeOptions = { comments: [defaultCommentBoundary] },
): Plugin => {
  const { exclude, include, sourcemap } = options;
  const filter = createFilter(include, exclude);
  const replacePattern =
    'pattern' in options
      ? options.pattern
      : buildCommentPattern(options.comments);

  return {
    name: 'strip-code',
    transform(code, id) {
      if (!filter(id)) return null;
      const ms = new MagicString(code);
      ms.replace(replacePattern, '');

      return {
        code: ms.toString(),
        map: sourcemap ? ms.generateMap({ hires: true }) : null,
      };
    },
  };
};

export default stripCode;
