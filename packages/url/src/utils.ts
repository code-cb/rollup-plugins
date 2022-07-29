import { createHash } from 'node:crypto';
import { getType } from 'mime';
import { copyFile, mkdir } from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  join,
  posix,
  relative,
  sep,
} from 'node:path';

const svgMime = 'image/svg+xml';

const encodeGeneric = (buffer: Buffer, mimetype: string) => {
  const data = buffer.toString('base64');
  return `data:${mimetype};base64,${data}`;
};

// https://github.com/filamentgroup/directory-encoder/blob/master/lib/svg-uri-encoder.js
const encodeSvg = (buffer: Buffer) => {
  const data = encodeURIComponent(
    buffer
      .toString('utf-8')
      // strip newlines
      .replace(/[\n\r]/gim, '')
      // strip tabs
      .replace(/\t/gim, ' ')
      // strip comments
      .replace(/<!--[\s\S]*?-->/gim, '')
      // replace `'` with `\\i` ???
      .replace(/'/gim, '\\i'),
  )
    // encode brackets
    .replace(/\(/gim, '%28')
    .replace(/\)/gim, '%29');
  return `data:${svgMime},${data}`;
};

export const inlineAsset = (id: string, buffer: Buffer) => {
  const mimetype = getType(id)!;
  const data =
    mimetype === svgMime ? encodeSvg(buffer) : encodeGeneric(buffer, mimetype);
  return `export default ${JSON.stringify(data)};`;
};

const generateHash = (buffer: Buffer) =>
  createHash('sha1').update(buffer).digest('hex').substring(0, 16);

interface AssetCopyOptions {
  filename: string;
  publicPath: string;
  sourceDir: string | undefined;
}

export class AssetCopy {
  private copiesMap = new Map<string, string>();

  constructor(private options: AssetCopyOptions) {}

  addCopy(id: string, buffer: Buffer) {
    const hash = generateHash(buffer);
    const ext = extname(id);
    const name = basename(id, ext);
    const srcDir = dirname(id);
    const { filename, publicPath, sourceDir } = this.options;
    const relativeDir = sourceDir
      ? relative(sourceDir, srcDir)
      : srcDir.split(sep).at(-1);
    const dir = relativeDir ? `${relativeDir}${sep}` : '';
    const outputFileName = filename
      .replace(/\[hash\]/g, hash)
      .replace(/\[extname\]/g, ext)
      .replace(/\[dirname\]/g, dir)
      .replace(/\[name\]/g, name);
    this.copiesMap.set(id, outputFileName);
    return `export default ${JSON.stringify(
      `${publicPath}${outputFileName.split(sep).join(posix.sep)}`,
    )};`;
  }

  async copyAll(baseDir: string) {
    await mkdir(baseDir, { recursive: true });
    await Promise.all(
      Array.from(this.copiesMap.entries()).map(async ([id, outputFileName]) => {
        await mkdir(join(baseDir, dirname(outputFileName)), {
          recursive: true,
        });
        await copyFile(id, join(baseDir, outputFileName));
      }),
    );
  }
}
