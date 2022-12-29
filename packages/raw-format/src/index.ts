import MagicString from 'magic-string';
import { Plugin } from 'rollup';

const IIFE_REGEX = /\(function \(\) \{([\s\S]+)\}\)\(\);?/gm;

interface RawFormatOptions {
  sourcemap?: boolean;
}

export const rawFormat = ({ sourcemap }: RawFormatOptions): Plugin => ({
  name: 'raw-format',
  outputOptions(outputOptions) {
    return { ...outputOptions, format: 'iife' };
  },
  renderChunk(code) {
    const ms = new MagicString(code);
    ms.replaceAll(IIFE_REGEX, (_, iifeBody: string) =>
      iifeBody
        .trim()
        .split('\n')
        .map(line => (line.startsWith('  ') ? line.slice(2) : line))
        .join('\n'),
    );
    return {
      code: ms.toString(),
      map: sourcemap ? ms.generateMap({ hires: true }) : null,
    };
  },
});

export default rawFormat;
